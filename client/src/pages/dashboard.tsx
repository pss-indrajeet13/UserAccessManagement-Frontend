// src/pages/dashboard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "@fontsource/poppins";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import YogaIcon from "../Assets/Dashboard-screen/yoga.png";
import SmileIcon from "../Assets/Dashboard-screen/smile.png";
// FireIcon and BookIcon removed as their associated cards were removed
import profilyellow from "@/Assets/Dashboard-screen/pro.png";
import redheart from "@/Assets/Dashboard-screen/red.png";
import greenlabel from "@/Assets/Dashboard-screen/gre.png";
import folderG from "@/Assets/Dashboard-screen/foldergrey.png";
import Header from "@/components/layout/header";

// ⚠️ NEW IMPORTS FOR FIREBASE ⚠️
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, type Firestore, collection, collectionGroup, query, where, orderBy, limit as fblimit, onSnapshot, updateDoc, Timestamp, getDocs, writeBatch, enableNetwork, disableNetwork, QueryDocumentSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore'; // Added specific types for correctness
import { app as sharedApp, db as sharedDb, auth as sharedAuth } from "@/firebase";
import { Link } from "wouter";

interface DashboardStats {
  totalUsers: number;
  totalActiveUsers: number;
  averageMoodScore: string;
  overallProgress: number;
  inactiveForDays: number; // Users inactive for 7+ days (status: 'inactive')
  deactivatedCount: number; // Users pending activation (userStatus: false)
  milestones: number;
  meditationVideoUsers: number;
  incompleteSessions: number;
  journalsSubmitted: number;
  milestoneCountToday: number;
}

type RecentJournal = {
  id: string;
  uid: string;
  userName: string;
  chapterName?: string | null;
  journalDate?: Date | null;
  excerpt?: string | null;
  avatarUrl?: string | null;
};

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalActiveUsers: 0,
  averageMoodScore: "0/5",
  overallProgress: 0,
  inactiveForDays: 0,
  deactivatedCount: 0,
  milestones: 0,
  meditationVideoUsers: 0,
  incompleteSessions: 0,
  journalsSubmitted: 0,
  milestoneCountToday: 0,
};

/**
 * 🎯 UPDATED FUNCTION: Determines if a user should be marked 'inactive' based on 7-day rule.
 * The logic is moved here for clarity but is designed to be executed regularly (e.g., via a Cloud Function
 * or triggered on a dashboard load if no backend process exists) to keep the 'status' field accurate.
 * It will now look for a combination of timestamps.
 */
async function updateUserStatusesBasedOnActivity(database: Firestore) {
  try {
    const usersCol = collection(database, 'users');
    // Fetch all users
    const querySnapshot = await getDocs(query(usersCol));
    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    // Collect all updates first
    const updates: Array<{ id: string; data: { status: string } }> = [];
    
    for (const docSnap of querySnapshot.docs) {
      const data: any = docSnap.data();
      const userId = docSnap.id;

      // Skip admin users and users explicitly set to userStatus: false (Pending)
      if (data?.role === 'admin' || data?.userStatus === false) continue;

      // Prioritize most reliable activity timestamps
      const lastActiveTimestamp = data?.lastActive || data?.lastSignIn || data?.lastLogin || data?.lastSeen;

      let shouldBeInactive = true;
      if (lastActiveTimestamp) {
        // Convert Firestore Timestamp to Date object if needed
        const lastActiveDate = typeof lastActiveTimestamp.toDate === 'function'
          ? lastActiveTimestamp.toDate()
          : new Date(lastActiveTimestamp);

        const diff = now.getTime() - lastActiveDate.getTime();
        // 🎯 The core logic: user is NOT inactive if they logged in/active in the last 7 days.
        shouldBeInactive = diff >= sevenDaysInMs;
      } // else: no timestamp, treat as inactive

      const currentStatus = String(data?.status || '').toLowerCase();

      // Only queue update if status needs to change
      if (shouldBeInactive && currentStatus !== 'inactive') {
        updates.push({ id: userId, data: { status: 'inactive' } });
      } else if (!shouldBeInactive && currentStatus !== 'active') {
        updates.push({ id: userId, data: { status: 'active' } });
      }
    }

    if (updates.length === 0) {
      return true;
    }

    // Chunk into batches of 499 (safe under 500 limit)
    const BATCH_SIZE = 499;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const chunk = updates.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(database);

      chunk.forEach(({ id, data }) => {
        batch.update(doc(database, 'users', id), data);
      });

      await batch.commit();
    }

    console.log(`Successfully updated statuses for ${updates.length} users.`);
    return true;
  } catch (error) {
    console.error('Error updating user statuses:', error);
    return false;
  }
}


export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [inactiveForDaysCount, setInactiveForDaysCount] = useState(0); // Kept for consistency, but less needed now
  const [deactivatedCount, setDeactivatedCount] = useState(0); // Kept for consistency, but less needed now
  const [recentJournals, setRecentJournals] = useState<RecentJournal[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Run the status update function regularly (e.g., every time the component loads)
  useEffect(() => {
    const dbInstance = sharedDb || getFirestore(sharedApp);
    // ⚠️ IMPORTANT: In a real app, this should be run by a Cloud Function/Cron job,
    // not every time an admin loads the dashboard, to avoid large writes.
    // However, for a simple client-side solution, this ensures data freshness.
    updateUserStatusesBasedOnActivity(dbInstance);
  }, []); // Run only once on component mount

  // 🔑 FIX 1: Initial load. Only fetches admin info and sets up listeners by setting loading=false.
  useEffect(() => {
    const dbInstance = sharedDb || getFirestore(sharedApp);

    const fetchAdminData = async (userId: string) => {
      try {
        const userDocRef = doc(dbInstance, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.name) {
            setAdminName(userData.name);
          }
          setIsAdmin(userData.role === 'admin');
        }
      } catch (e: any) {
        console.error("Error fetching admin data:", e);
        setError("Failed to load admin profile.");
      } finally {
        // Set loading to false here. The onSnapshot listeners will now handle populating the stats.
        setLoading(false);
      }
    };

    const authInstance = sharedAuth || getAuth(sharedApp);
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (user) {
        // Start admin data fetch immediately
        fetchAdminData(user.uid);
      } else {
        // User is signed out
        setLoading(false);
        setError("User not authenticated.");
      }
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  // 🚀 START OF REAL-TIME STATUS UPDATES (The core counting logic is here) 🚀
  useEffect(() => {
    const dbInstance = sharedDb || getFirestore(sharedApp);
    const usersCol = collection(dbInstance, "users");

    const unsubscribeUsers = onSnapshot(usersCol, (snap) => {
      try {
        let activeCount = 0;
        let inactiveCount = 0; // Inactive users (7+ days, status: 'inactive')
        let pendingActivationCount = 0; // Pending users (userStatus: false)
        let totalParticipants = 0;

        snap.docs.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const data: any = docSnap.data();
          if ((data?.role ?? "") === "admin") return; // skip admin users

          totalParticipants++;

          // 1. Identify Pending Users based on 'userStatus' boolean
          const userStatusBoolean = data?.userStatus;
          if (userStatusBoolean === false) {
            pendingActivationCount++;
            return; // Pending users are not counted as active/inactive
          }

          const status = String(data?.status ?? 'active').toLowerCase();
          
          if (status === "inactive") {
            inactiveCount++;
          } else {
            activeCount++;
          }
        });

        // 🎯 CALCULATIONS FOR DASHBOARD 🎯
        const totalUsers = totalParticipants; // Total Participants = Active + Inactive + Pending
        const actualActiveCount = totalUsers - inactiveCount - pendingActivationCount;


        // Update states for top stats and alerts
        setStats((prev) => ({
          ...(prev || defaultStats),
          totalUsers: totalUsers,
          totalActiveUsers: actualActiveCount, // 🎯 Use the refined calculation
          inactiveForDays: inactiveCount, // 🎯 Only the 7+ days inactive count
          deactivatedCount: pendingActivationCount,
          // Preserve other stats like mood/progress until their listeners update
        }));

      } catch (err) {
        console.warn("❌ Dashboard snapshot error:", err);
      }
    });

    return () => unsubscribeUsers();
  }, []);
  // 🚀 END OF REAL-TIME STATUS UPDATES 🚀

  // ⚠️ NEW useEffect hook to count 28-day milestones achieved today
  useEffect(() => {
    const dbInstance = sharedDb || getFirestore(sharedApp);
    const today = new Date();

    const isSameDay = (d: Date | null, ref: Date) => {
      if (!d || Number.isNaN(d.getTime())) return false;
      return d.toDateString() === ref.toDateString();
    };

    // Helper to get a completion date from a progress entry
    const getCompletionDate = (entry: any): Date | null => {
      if (!entry) return null;
      const dateLike = entry.completedAt || entry.date || entry.timestamp || entry.updatedAt || entry.createdAt;
      if (!dateLike) return null;
      try {
        if (typeof dateLike?.toDate === 'function') return dateLike.toDate();
        if (dateLike instanceof Date) return dateLike;
        if (typeof dateLike === 'number') return new Date(dateLike);
        if (typeof dateLike === 'string') return new Date(dateLike);
      } catch { /* ignore */ }
      return null;
    };

    const isCompleted = (status: any): boolean => {
      const s = String(status ?? '').toLowerCase();
      return s === 'completed' || s === 'complete' || s === 'done' || s === 'success' || s === 'finished' || s === 'true';
    };

    // FIX: Added explicit type annotation for 'docs'
    const handleSnapshot = (docs: QueryDocumentSnapshot<DocumentData>[]) => {
      const todayMilestones = new Set<string>();
      try {
        docs.forEach((docSnap: any) => {
          const uid = docSnap.ref?.parent?.parent?.id || docSnap.id;
          const data: any = docSnap.data();
          const progress = data?.progress && typeof data.progress === 'object' ? data.progress : data;
          const keys = Object.keys(progress || {});

          for (const k of keys) {
            if (/^day[ _-]?28$/i.test(k)) {
              const entry = (progress as any)[k];
              if (isCompleted(entry?.status) || entry === true) {
                const completionDate = getCompletionDate(entry);
                if (completionDate && isSameDay(completionDate, today)) {
                  todayMilestones.add(uid);
                }
              }
            }
          }
        });
      } catch (err) {
        console.warn('Failed to compute today\'s milestone count:', err);
      }

      setStats((prev) => {
        const next = prev ? { ...prev } : { ...defaultStats };
        next.milestoneCountToday = todayMilestones.size;
        return next;
      });
    };

    const unsubRoot = onSnapshot(collection(dbInstance, 'userActivity'), (snap) => handleSnapshot(snap.docs));
    const unsubReport = onSnapshot(collectionGroup(dbInstance, 'report'), (snap) => handleSnapshot(snap.docs));

    // Clean up both listeners
    return () => { unsubRoot(); unsubReport(); };
  }, []);

  // 🚀 START OF DAILY DIGEST FIX (This is the primary source for daily activity metrics) 🚀
  // 🔑 FIX 2: Removed totalActiveUsers from dependency array to prevent unnecessary re-runs
  // We fetch roles inside the listener setup now.
  useEffect(() => {
    const dbInstance = sharedDb || getFirestore(sharedApp);

    const normalizeDate = (value: any): Date | null => {
      try {
        if (!value) return null;
        if (typeof value?.toDate === 'function') return value.toDate();
        if (typeof value?.toMillis === 'function') return new Date(value.toMillis());
        if (value instanceof Date) return value;
        if (typeof value === 'number') return new Date(value);
        if (typeof value === 'string') return new Date(value);
      } catch {
        return null;
      }
      return null;
    };

    const isSameDay = (d: Date | null, ref: Date) => {
      if (!d || Number.isNaN(d.getTime())) return false;
      return d.toDateString() === ref.toDateString();
    };

    const processProgressEntries = (
      uid: string,
      data: any,
      completedSet: Set<string>,
      pendingSet: Set<string>,
      feedbackSet: Set<string>,
      today: Date,
      rolesMap: Map<string, boolean> | null
    ) => {
      // Skip if admin 
      if (rolesMap && rolesMap.get(uid)) return;

      if (!data) return;
      const maybeProgress = data.progress && typeof data.progress === 'object' ? data.progress : undefined;
      const entriesSource = maybeProgress ? maybeProgress : Object.keys(data)
        .filter((k) => /^day\d+/i.test(k))
        .reduce((acc: Record<string, any>, k) => { acc[k] = (data as any)[k]; return acc; }, {});

      const values = Object.values(entriesSource || {}) as any[];
      for (const entry of values) {
        const dayDate = normalizeDate(entry?.date || entry?.createdAt || entry?.timestamp);
        if (!isSameDay(dayDate, today)) continue;

        const statusRaw = String(entry?.status || '').toLowerCase();
        if (statusRaw.includes('complete')) {
          completedSet.add(uid);
        } else if (statusRaw.includes('progress') || statusRaw.includes('pending')) {
          pendingSet.add(uid);
        }

        const feedback = entry?.feedback || entry?.Feedback || entry?.journal || entry?.note;
        if (typeof feedback === 'string' ? feedback.trim().length > 0 : Boolean(feedback)) {
          feedbackSet.add(uid);
        }
      }
    };

    // Fetch roles map once for efficiency
    const fetchRolesMap = async () => {
      try {
        const snaps = await getDocs(collection(dbInstance, 'users'));
        const map = new Map<string, boolean>();
        snaps.docs.forEach((d) => {
          const data: any = d.data();
          map.set(d.id, data?.role === 'admin');
        });
        return map;
      } catch (err) {
        console.warn('Failed to fetch roles map for Daily Digest:', err);
        return null;
      }
    };

    const setupListeners = async () => {
      const rolesMap = await fetchRolesMap();

      const unsubscribeRoot = onSnapshot(collection(dbInstance, 'userActivity'), (snap) => {
        try {
          const today = new Date();
          const completedUsers = new Set<string>();
          const pendingUsers = new Set<string>();
          const feedbackUsers = new Set<string>();

          snap.docs.forEach((docSnap) => {
            const uid = docSnap.id;
            processProgressEntries(uid, docSnap.data(), completedUsers, pendingUsers, feedbackUsers, today, rolesMap);
          });

          // ⚠️ MERGE: Update only daily digest fields, preserve other data ⚠️
          setStats((prev) => {
            const next = prev ? { ...prev } : { ...defaultStats };
            next.meditationVideoUsers = completedUsers.size;
            next.incompleteSessions = pendingUsers.size;
            next.journalsSubmitted = feedbackUsers.size;
            return next;
          });
        } catch (err) {
          console.warn('Failed to compute Daily Digest from userActivity root docs:', err);
        }
      });

      // This collectionGroup listener captures alternate structures.
      const unsubscribeGroup = onSnapshot(collectionGroup(dbInstance, 'userActivity'), (snap) => {
        try {
          const today = new Date();
          const completedUsers = new Set<string>();
          const pendingUsers = new Set<string>();
          const feedbackUsers = new Set<string>();

          snap.docs.forEach((docSnap) => {
            const uid = docSnap.ref.parent.parent?.id || docSnap.id;
            processProgressEntries(uid, docSnap.data(), completedUsers, pendingUsers, feedbackUsers, today, rolesMap);
          });

          if (completedUsers.size || pendingUsers.size || feedbackUsers.size) {
            setStats((prev) => {
              const next = prev ? { ...prev } : { ...defaultStats };
              // Merge with existing counts ensuring uniqueness across sources by taking max
              next.meditationVideoUsers = Math.max(next.meditationVideoUsers || 0, completedUsers.size);
              next.incompleteSessions = Math.max(next.incompleteSessions || 0, pendingUsers.size);
              next.journalsSubmitted = Math.max(next.journalsSubmitted || 0, feedbackUsers.size);
              return next;
            });
          }
        } catch (err) {
          console.warn('Failed to compute Daily Digest from collection group:', err);
        }
      });

      return () => {
        unsubscribeRoot();
        unsubscribeGroup();
      };
    };

    const cleanup = setupListeners();
    // Since setupListeners returns a promise of the cleanup function, 
    // we use .then to ensure cleanup runs correctly.
    return () => { cleanup.then(unsub => unsub()); };
  }, [isAdmin]); // 🔑 FIX: Removed stats?.totalActiveUsers from dependency array


  // Populate recent journals submitted today
  useEffect(() => {
    const dbInstance = sharedDb || getFirestore(sharedApp);
    let mounted = true;

    const normalizeDate = (value: any): Date | null => {
      try {
        if (!value) return null;
        if (typeof value?.toDate === 'function') return value.toDate();
        if (typeof value?.toMillis === 'function') return new Date(value.toMillis());
        if (value instanceof Date) return value;
        if (typeof value === 'number') return new Date(value);
        if (typeof value === 'string') return new Date(value);
      } catch {
        return null;
      }
      return null;
    };

    const isSameDay = (d: Date | null, ref: Date) => {
      if (!d || Number.isNaN(d.getTime())) return false;
      return d.toDateString() === ref.toDateString();
    };

    const fetchUsersAndRoles = async () => {
      try {
        const snaps = await getDocs(collection(dbInstance, 'users'));
        const usersMap = new Map<string, string>();
        const rolesMap = new Map<string, boolean>();
        snaps.docs.forEach((d) => {
          const data: any = d.data();
          rolesMap.set(d.id, data?.role === 'admin');
          const name = data?.fullName || data?.name || data?.displayName || data?.email || 'Unknown User';
          usersMap.set(d.id, name);
        });
        return { usersMap, rolesMap };
      } catch (err) {
        console.warn('Failed to fetch user and role maps:', err);
        return { usersMap: new Map<string, string>(), rolesMap: new Map<string, boolean>() };
      }
    };

    (async () => {
      const { usersMap, rolesMap } = await fetchUsersAndRoles();
      const today = new Date();

      const processDoc = (docSnap: any) => {
        const uid = docSnap.id;
        const data: any = docSnap.data();
        const progressObj = data?.progress || {};
        const results: RecentJournal[] = [];

        Object.entries(progressObj).forEach(([key, entry]: any) => {
          const entryDate = normalizeDate(entry?.date || entry?.createdAt || entry?.completedAt || entry?.timestamp || entry?.updatedAt);
          if (!isSameDay(entryDate, today)) return;

          // collect feedback text using same heuristics as JournalsContent
          const feedKeys = ['feedback', 'Feedback', 'coachFeedback', 'CoachFeedback', 'writtenFeedback', 'notes', 'Notes', 'comment', 'Comment', 'journalFeedback', 'JournalFeedback'];
          let feedbackText = '';
          for (const k of feedKeys) {
            if (entry && typeof entry[k] === 'string' && entry[k].trim()) { feedbackText = entry[k].trim(); break; }
          }
          if (!feedbackText) {
            // fallback: any field that looks like a note
            for (const [k, v] of Object.entries(entry || {})) {
              if (/feedback|note|comment|reflection|summary/i.test(k) && typeof v === 'string' && v.trim()) { feedbackText = v.trim(); break; }
            }
          }

          if (!feedbackText) return;

          // chapter/day label
          const chapterLabelCandidates = ['dayLabel', 'title', 'dayName', 'day', 'label', 'name'];
          let chapterName: string | null = null;
          for (const c of chapterLabelCandidates) {
            if (entry && typeof entry[c] === 'string' && entry[c].trim()) { chapterName = entry[c].trim(); break; }
          }
          if (!chapterName) {
            const match = key.match(/\d+/);
            chapterName = match ? `Day ${match[0]}` : key;
          }

          results.push({
            id: `${uid}-${key}`,
            uid,
            userName: usersMap.get(uid) || data?.fullName || 'Unknown User',
            chapterName,
            journalDate: entryDate,
            excerpt: feedbackText,
            avatarUrl: null,
          });
        });

        return results;
      };

      const unsubscribe = onSnapshot(collection(dbInstance, 'userActivity'), (snap) => {
        try {
          const entries: RecentJournal[] = [];
          snap.docs.forEach((d) => {
            const res = processDoc(d);
            if (res && res.length) entries.push(...res);
          });
          // Filter out admin entries if current is admin
          const filteredEntries = isAdmin ? entries.filter(e => !rolesMap.get(e.uid)) : entries;
          // sort newest first
          filteredEntries.sort((a, b) => (b.journalDate?.getTime() || 0) - (a.journalDate?.getTime() || 0));
          if (mounted) setRecentJournals(filteredEntries.slice(0, 10));
        } catch (err) {
          console.warn('Failed to build recent journals list:', err);
        }
      });

      return () => {
        mounted = false;
        try { unsubscribe(); } catch { /* ignore */ }
      };
    })();
  }, [isAdmin]);

  const progress = clampPercent(stats?.overallProgress ?? 0);
  const circumference = 283;
  const progressLength = (progress / 100) * circumference;

  // Use totalUsers for Daily Digest denominator
  const totalParticipants = stats?.totalUsers || 0;
  const safeTotalParticipants = totalParticipants > 0 ? totalParticipants : 1;

  // 🎯 Total Active Users Card Value - Now uses the correct count
  const cardStats = [
    {
      title: "Total Active Users",
      value: `${stats?.totalActiveUsers ?? 0}/${stats?.totalUsers ?? 0}`,
      img: YogaIcon,
    },
    {
      title: "Average Mood Score",
      value: stats?.averageMoodScore ?? "0/5",
      img: SmileIcon,
    },
  ];

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="font-poppins bg-gray-100 min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Overview of key metrics"
        onAddUser={() => { /* Handle add user action */ }}
      />
      <main className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#125566" }}>
            Welcome, {adminName}
          </h1>
          <p className="text-base text-black mt-1">
            Let’s View Today's Statistics
          </p>
        </div>

        {/* Updated grid layout: Overall Progress takes 3/5, Stats take 2/5 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          {/* Overall Program Progress Card: Now spans 3 columns on medium screens and up */}
          <Card className="md:col-span-3 bg-white rounded-2xl shadow-md">
            <CardHeader
              className="pb-2 border-b"
              style={{ borderColor: "#125566" }}
            >
              <CardTitle className="text-lg font-semibold text-[#125566]">
                Overall Program Progress
              </CardTitle>
              <p className="text-sm text-gray-500">
                Completion percentage across all participants
              </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative w-52 h-28 mt-6">
                {/* SVG for progress arc */}
                <svg className="w-full h-full">
                  <path
                    d="M10,100 A90,90 0 0,1 190,100"
                    fill="none"
                    stroke="#E5EBED"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10,100 A90,90 0 0,1 190,100"
                    fill="none"
                    stroke="#125566"
                    strokeWidth="20"
                    strokeDasharray={`${progressLength} ${circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-[#125566]">
                    {progress.toString().padStart(2, "0")}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {stats?.totalActiveUsers ?? 0} Active Participants
              </p>
              <p className="text-sm text-gray-500">
                28 Days Habit Formation Program
              </p>
            </CardContent>
          </Card>

          {/* Key Stats Cards: Now spans 2 columns and stacks vertically */}
          <div className="md:col-span-2 grid grid-cols-1 gap-6">
            {cardStats.map((stat, index) => (
              <Card
                key={index}
                className="relative bg-[#256B78] text-white rounded-2xl shadow-md overflow-hidden p-6 h-full"
              >
                <div>
                  <p className="text-sm uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#50C8E5] rounded-tl-full" />
                <img
                  src={stat.img}
                  alt={stat.title}
                  className="absolute bottom-0 right-2 w-20 h-20 object-contain"
                />
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ⚠️ Daily Digest Card (FIXED denominator) ⚠️ */}
          <Card className="bg-white rounded-2xl shadow-md border border-gray-200">
            <CardHeader className="pb-2 border-b border-[#125566]">
              <div className="flex justify-between items-start w-full">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#125566]">
                    Daily Digest
                  </CardTitle>
                  <p className="text-sm text-gray-500">Today's activity summary</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Meditation Videos Completed Today */}
              <div>
                <div className="flex justify-between items-center text-sm pb-1">
                  <span>Users who complete meditations videos</span>
                  <span className="font-semibold text-[#125566]">
                    {`${stats?.meditationVideoUsers ?? 0}/${stats?.totalUsers ?? 0}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-[#5FB3B3] h-2 rounded-full"
                    style={{
                      width: `${stats?.totalUsers && stats.totalUsers > 0
                        ? (stats.meditationVideoUsers / stats.totalUsers) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Incomplete/Pending Today */}
              <div>
                <div className="flex justify-between items-center text-sm pb-1">
                  <span>Users who Pending/incomplete sessions</span>
                  <span className="font-semibold text-[#125566]">
                    {`${stats?.incompleteSessions ?? 0}/${stats?.totalUsers ?? 0}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-[#C4B5FD] h-2 rounded-full"
                    style={{
                      width: `${stats?.totalUsers && stats.totalUsers > 0
                        ? (stats.incompleteSessions / stats.totalUsers) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Journals Submitted Today */}
              <div>
                <div className="flex justify-between items-center text-sm pb-1">
                  <span>Users who Journals Submitted</span>
                  <span className="font-semibold text-[#125566]">
                    {`${stats?.journalsSubmitted ?? 0}/${stats?.totalUsers ?? 0}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-[#FF8B6A] h-2 rounded-full"
                    style={{
                      width: `${stats?.totalUsers && stats.totalUsers > 0
                        ? (stats.journalsSubmitted / stats.totalUsers) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-md border border-gray-200">
            <CardHeader className="pb-2 border-b border-[#125566]">
              <div className="flex justify-between items-start w-full">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#125566]">
                    Alerts and Notifications
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Important updates requiring attention
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Inactive Users Alert - Now reflects updated statuses (7-day rule) */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-yellow-300 bg-yellow-50 text-sm">
                <img src={profilyellow} alt="Inactive icon" className="w-5 h-5" />
                <p>{stats?.inactiveForDays ?? 0} Inactive Participants (7+ days)</p>
              </div>
              {/* Pending Participants (userStatus === false) */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-red-300 bg-red-50 text-sm">
                <img src={redheart} alt="Pending icon" className="w-5 h-5" />
                <p>{stats?.deactivatedCount ?? 0} Pending Participants (Manual Activation Required)</p>
              </div>
              {/* Milestone Alert */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-300 bg-green-50 text-sm">
                <img src={greenlabel} alt="Milestone icon" className="w-5 h-5" />
                <p>
                  {stats?.milestoneCountToday ?? 0} users achieved 28-days milestone today
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Journals Card remains */}
          <Card className="bg-white rounded-2xl shadow-md border border-gray-200 col-span-full mt-6">
            <CardHeader className="pb-2 border-b border-[#125566]">
              <div className="flex justify-between items-start w-full">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#125566]">
                    Recent Journals Entries
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Last participations reactions and insights
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {recentJournals.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <img src={folderG} alt="Folder icon" className="w-12 h-12 mb-4" />
                  <p className="text-lg text-red-500 font-semibold">Currently, you don’t have any journals</p>
                  <p className="text-sm text-gray-500 mt-2">Once added, all journals will be found here...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentJournals.map((j) => (
                    <div key={j.id} className="p-4 bg-white rounded-lg shadow-sm border flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">{(j.userName || 'U').split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                        <div>
                          <div className="text-sm font-semibold text-[#125566]">{j.userName}</div>
                          <div className="text-xs text-gray-500">{j.chapterName} • {j.journalDate ? new Date(j.journalDate).toLocaleTimeString() : ''}</div>
                          <div className="text-sm text-gray-700 mt-2">{j.excerpt}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Link href={`/participants/${j.uid}`} className="text-sm px-3 py-1 bg-[#125566] text-white rounded-md">View Profile</Link>
                        <div className="text-xs text-gray-400">{j.journalDate ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(j.journalDate)) : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main >
    </div >
  );
}
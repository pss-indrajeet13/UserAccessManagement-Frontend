// src/pages/participants.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";

import PurpleIcon from '../Assets/Participants/purple.png';
import GreenIcon from '../Assets/Participants/green.png';
import RedIcon from '../Assets/Participants/red.png';
import OrangeIcon from '../Assets/Participants/orange.png';

import { db } from "@/firebase";
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { fetchPendingActivationUsers, type PendingActivationResult } from "@/lib/pendingActivation";
import { normalizeUserStatus } from "@/lib/utils";

const baseStats = [
  {
    label: "All Participants",
    value: 0,
    icon: PurpleIcon,
    color: "bg-white",
    text: "text-purple-300",
  },
  {
    label: "Active Participants",
    value: 0,
    icon: GreenIcon,
    color: "bg-white",
    text: "text-green-300",
  },
  {
    label: "Pending Activation",
    value: 0,
    icon: OrangeIcon,
    color: "bg-white",
    text: "text-orange-300",
  },
  {
    label: "Inactive Participants",
    value: 0,
    icon: RedIcon,
    color: "bg-white",
    text: "text-red-400",
  },
];

const statusOptions = [
  "All Status",
  "Active Status",
  "Inactive Status",
  "Pending Activation",
];

interface SectionProfile {
  age?: string;
  participantId?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

interface DerivedActivity {
    chapter: number;
    progress: number;
    // 🆕 New field to store the specific progress score
    segmentProgressScore?: number;
}

interface UserType {
  uid: string;
  email: string | null;
  createdAt: string | undefined;
  lastSignIn: string | undefined;
  profile?: SectionProfile;
  fullName?: string;
  displayName?: string;
  streak: number;
  chapterNo: number;
  progress: number;
  userStatus?: boolean;
  IsSeg0Approved?: boolean;
  IsSeg1Approved?: boolean;
  IsSeg2Approved?: boolean;
  IsSeg3Approved?: boolean;
  role?: string;
}

const Participants: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [cards, setCards] = useState(baseStats);
  const [deactivatedSet, setDeactivatedSet] = useState<Set<string>>(new Set());
  // 🔄 Updated derivedMap type
  const [derivedMap, setDerivedMap] = useState<Record<string, DerivedActivity>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50; // Max participants per page

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let participantData: UserType[] | null = null;
        try {
          const res = await fetch(`/api/list-users?t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const data: UserType[] = await res.json();
            participantData = data.filter(u => u.role !== 'admin');
          }
        } catch (err) {
          // ignore, will fallback to Firestore below
        }

        if (!participantData) {
          const snaps = await getDocs(collection(db, 'users'));
          participantData = snaps.docs.map((d) => {
            const v: any = d.data();
            const createdAt = v?.created || v?.createdAt || v?.joinedAt || undefined;
            const lastSignIn = v?.lastSignIn || v?.lastLogin || v?.lastActive || undefined;
            return {
              uid: d.id,
              email: v?.email ?? null,
              createdAt: createdAt ? (createdAt?.toDate ? createdAt.toDate().toISOString() : new Date(createdAt).toISOString()) : undefined,
              lastSignIn: lastSignIn ? (lastSignIn?.toDate ? lastSignIn.toDate().toISOString() : new Date(lastSignIn).toISOString()) : undefined,
              profile: v?.profile || undefined,
              fullName: v?.fullName || v?.name || undefined,
              displayName: v?.displayName || undefined,
              streak: Number(v?.streak ?? 0),
              chapterNo: Number(v?.chapterNo ?? 0),
              progress: Number(v?.progress ?? 0),
              userStatus: normalizeUserStatus(v?.userStatus ?? v?.status),
              IsSeg0Approved: Boolean(v?.IsSeg0Approved ?? true),
              IsSeg1Approved: Boolean(v?.IsSeg1Approved ?? false),
              IsSeg2Approved: Boolean(v?.IsSeg2Approved ?? false),
              IsSeg3Approved: Boolean(v?.IsSeg3Approved ?? false),
              role: v?.role || undefined,
            } as UserType;
          }).filter(u => u.role !== 'admin');
        }

        const normalizedData = (participantData ?? []).map((user) => {
          const raw: any = user;
          const resolvedStatus = normalizeUserStatus(raw?.userStatus ?? raw?.status);
          return {
            ...user,
            userStatus: typeof resolvedStatus === "boolean" ? resolvedStatus : undefined,
          } as UserType;
        });

        const sortedData = [...normalizedData].sort((a: UserType, b: UserType) => {
          const dateA = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
          const dateB = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
          return dateB - dateA;
        });
        setUsers(sortedData);

        // Fetch deactivated users from Firestore (status === false)
        let pendingActivations: PendingActivationResult;
        try {
          pendingActivations = await fetchPendingActivationUsers(db);
        } catch (pendingError) {
          console.error('Failed to load pending activations:', pendingError);
          pendingActivations = { ids: new Set<string>(), count: 0 };
        }
        const { ids, count } = pendingActivations;
        setDeactivatedSet(ids);

        // Update cards using both sources
        const all = sortedData.length;
        const activeParticipants = sortedData.filter((u) => getStatus(u, ids) === "Active");
        const inactiveParticipants = sortedData.filter((u) => getStatus(u, ids) === "Inactive");
        const pendingParticipants = sortedData.filter((u) => getStatus(u, ids) === "Pending");
        const active = activeParticipants.length;
        const inactive = inactiveParticipants.length;
        const pending = pendingParticipants.length;

        // Print console logs to verify counts
        console.log("Participants Page Counts:");
        console.log("All Participants:", all);
        console.log("Active Participants:", active);
        console.log("Inactive Participants:", inactive);
        console.log("Pending Activation:", pending);

        // Log the names of each group
        console.log("Active Participant Names:");
        activeParticipants.forEach(u => console.log(getName(u)));

        console.log("Inactive Participant Names:");
        inactiveParticipants.forEach(u => console.log(getName(u)));

        console.log("Pending Activation Names:");
        pendingParticipants.forEach(u => console.log(getName(u)));

        setCards([
          { ...baseStats[0], value: all },
          { ...baseStats[1], value: active },
          { ...baseStats[2], value: pending },
          { ...baseStats[3], value: inactive },
        ]);

        setCurrentPage(1);
      } catch (e) {
        console.error('Failed to load participants:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  function formatLastSignIn(dateString: string | undefined): string {
    if (!dateString) {
      return "Never";
    }

    const lastSignInDate = new Date(dateString);
    const now = new Date();

    // Calculate the difference in full days
    const oneDay = 1000 * 60 * 60 * 24;

    // Set time of both dates to midnight (00:00:00) for accurate day difference
    const dateOnlyLast = new Date(lastSignInDate.getFullYear(), lastSignInDate.getMonth(), lastSignInDate.getDate()).getTime();
    const dateOnlyNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const diffDays = Math.round(Math.abs((dateOnlyNow - dateOnlyLast) / oneDay));

    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    } as const;

    const timePart = lastSignInDate.toLocaleTimeString('en-US', timeOptions);

    if (diffDays === 0) {
      return `Today, ${timePart}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${timePart}`;
    } else {
      // Return full date and time for older events
      return lastSignInDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + `, ${timePart}`;
    }
  }

  function getStatus(user: UserType, deactivated: Set<string> = deactivatedSet) {
    const explicitStatus = normalizeUserStatus(user.userStatus ?? (user as any)?.status);
    if (explicitStatus === false) return "Pending";

    if (user.uid && deactivated.has(user.uid)) return "Pending";
    if (!user.lastSignIn) return "Inactive";

    const last = new Date(user.lastSignIn);
    const lastTime = last.getTime();
    if (!Number.isFinite(lastTime)) return "Inactive";

    const now = Date.now();
    const diff = (now - lastTime) / (1000 * 3600 * 24);
    if (diff < 7) return "Active";
    return "Inactive";
  }

  function getName(u: UserType) {
    return (
      u.profile?.name ||
      u.profile?.fullName ||
      (u.profile?.firstName && u.profile?.lastName
        ? `${u.profile.firstName} ${u.profile.lastName}`
        : u.profile?.firstName || u.profile?.lastName) ||
      u.fullName ||
      u.displayName ||
      u.profile?.participantId ||
      u.email ||
      ""
    );
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const name = getName(u);
      const matchName = name.toLowerCase().includes(search.toLowerCase());

      const status = getStatus(u);
      const matchStatus =
        statusFilter === "All Status" ||
        (statusFilter === "Active Status" && status === "Active") ||
        (statusFilter === "Inactive Status" && status === "Inactive") ||
        (statusFilter === "Pending Activation" && status === "Pending");

      return matchName && matchStatus;
    });
  }, [users, search, statusFilter, deactivatedSet]);

  const totalParticipants = filtered.length;
  const totalPages = Math.ceil(totalParticipants / pageSize);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalParticipants);
  const paginatedUsers = filtered.slice(start, end);

  // Fetch userActivity for currently displayed users to derive current chapter and progress
  useEffect(() => {
    let cancelled = false;
    const fetchActivities = async () => {
      // 🔄 Update the tuple type to include the new data structure
      const entries: [string, DerivedActivity][] = await Promise.all(
        paginatedUsers.map(async (u) => {
          try {
            const uaRef = doc(db, 'userActivity', u.uid);
            const snap = await getDoc(uaRef);
            // 🆕 Initialize with default values, including null for the new score
            const defaultDerived: DerivedActivity = { chapter: 0, progress: u.progress ?? 0, segmentProgressScore: undefined };

            if (!snap.exists()) return [u.uid, defaultDerived];
            
            const data: any = snap.data();
            
            // 1. Fetch the requested segment progress score
            const rawSegmentScore = data?.segment0?.sectionProfile?.progressScore;
            let segmentProgressScore: number | undefined = undefined;
            if (typeof rawSegmentScore === 'number' && !isNaN(rawSegmentScore)) {
                segmentProgressScore = Math.max(0, Math.min(100, Math.round(rawSegmentScore)));
            }

            const progressData = data?.progress || {};
            const days = Object.entries(progressData) as [string, { status?: string }][];
            const parsed = days
              .map(([k, v]) => ({ day: parseInt(String(k).replace('day', '')), status: String(v?.status || '').toLowerCase() }))
              .filter((d) => Number.isFinite(d.day))
              .sort((a, b) => a.day - b.day);

            const completedCount = parsed.filter((d) => d.status === 'completed' && d.day >= 1 && d.day <= 28).length;
            const firstInProgress = parsed.find((d) => d.status === 'inprogress');
            let currentChapter = 0;
            if (firstInProgress && firstInProgress.day >= 1 && firstInProgress.day <= 28) {
              currentChapter = firstInProgress.day;
            } else if (completedCount > 0) {
              const lastCompleted = [...parsed].filter((d) => d.status === 'completed').pop();
              currentChapter = Math.min(28, (lastCompleted?.day ?? 0) + 1);
            } else {
              currentChapter = 0;
            }
            
            // 2. Determine the program completion percentage
            let progressPct = Math.round((completedCount / 28) * 100);
            try {
              const reportSnaps = await getDocs(collection(db, 'userActivity', u.uid, 'report'));
              if (!reportSnaps.empty) {
                let best = reportSnaps.docs[0];
                for (const d of reportSnaps.docs) {
                  const ca = (d.data() as any)?.createdAt ?? null;
                  const bestCa = (best.data() as any)?.createdAt ?? null;
                  if (ca && (!bestCa || (ca?.toMillis ? ca.toMillis() : new Date(ca).getTime()) > (bestCa?.toMillis ? bestCa.toMillis() : new Date(bestCa).getTime()))) {
                    best = d;
                  }
                }
                const dta = (best.data() as any);
                const rp = typeof dta?.progress === 'number' ? dta.progress : (typeof dta?.Progress === 'number' ? dta.Progress : undefined);
                if (typeof rp === 'number') progressPct = Math.max(0, Math.min(100, Math.round(rp)));
              }
            } catch { /* ignore report subcollection error */ }

            // 3. Return the full derived object
            const result: DerivedActivity = { 
                chapter: currentChapter, 
                progress: progressPct, 
                segmentProgressScore: segmentProgressScore 
            };
            
            return [u.uid, result] as [string, DerivedActivity];

          } catch (e) {
             console.error(`Error fetching activity for ${u.uid}:`, e);
             return [u.uid, { chapter: 0, progress: u.progress ?? 0, segmentProgressScore: undefined }];
          }
        })
      );
      if (!cancelled) {
        // 🔄 Update the map with the new DerivedActivity structure
        const next: Record<string, DerivedActivity> = {};
        for (const [uid, val] of entries) next[uid] = val;
        setDerivedMap(next);
      }
    };
    if (paginatedUsers.length > 0) fetchActivities();
    return () => {
      cancelled = true;
    };
  }, [db, start, end, filtered, currentPage, paginatedUsers.length]);

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="font-poppins bg-gray-100 min-h-screen">
      <Header title="Participants" subtitle="Manage participants and access individual insights" />

      <main className="p-6 mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#125566]">Participants</h1>
          <p className="text-base text-black mt-1">
            Manage participants and access individual insights
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {cards.map((stat) => (
            <div
              key={stat.label}
              className={`relative flex flex-col ${stat.color} rounded-xl shadow-md p-4`}
            >
              <div className="flex flex-col mb-10">
                <h3 className="text-lg font-semibold text-gray-800 leading-tight">
                  {stat.label.split(' ')[0]}<br />{stat.label.split(' ')[1]}
                </h3>
                <p className={`text-3xl font-bold ${stat.text} mt-1`}>
                  {stat.value}
                </p>
              </div>
              <div className="absolute bottom-4 right-4">
                <img
                  src={stat.icon}
                  alt={stat.label}
                  className="w-16 h-16"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search participant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg shadow-sm border focus:outline-none"
          />
          <select
            className="md:w-48 px-3 py-2 rounded-lg shadow-sm border"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {/* <button className="ml-auto bg-teal-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-teal-700 transition">
            Export
          </button> */}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold" style={{ color: '#125566' }}>Participants List</h2>
              <p className="text-gray-500 text-sm">
                Overview of all Participants.
              </p>
            </div>

            {!loading && totalParticipants > 0 && (
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg shadow-sm">
                  {start + 1}–{end} of {totalParticipants}
                </div>

                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full transition ${currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  aria-label="Previous Page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full transition ${currentPage === totalPages || totalPages === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  aria-label="Next Page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: '#125566', color: 'white' }}>
                <th className="py-3 px-6 text-left">Participant Name</th>
                <th className="py-3 px-6 text-left">Chapter No.</th>
                <th className="py-3 px-6 text-left">Progress</th>
                <th className="py-3 px-6 text-left">Last Active</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Profile</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && paginatedUsers.length > 0 &&
                paginatedUsers.map((u) => {
                  const derived = derivedMap[u.uid];
                  const currentChapter = derived?.chapter ?? 0;
                  // 🆕 Get the new progress score, falling back to other progress values
                  const displayProgress = derived?.segmentProgressScore ?? derived?.progress ?? u.progress ?? 0;

                  let permitted = true;
                  if (currentChapter >= 1 && currentChapter <= 13) permitted = Boolean(u.IsSeg1Approved);
                  if (currentChapter >= 14) permitted = Boolean(u.IsSeg2Approved || u.IsSeg3Approved);
                  const explicitStatus = normalizeUserStatus(u.userStatus ?? (u as any)?.status);
                  const status = (explicitStatus === false || deactivatedSet.has(u.uid))
                    ? 'Pending'
                    : (permitted ? 'Active' : 'Inactive');

                  return (
                    <tr key={u.uid} className="border-t hover:bg-gray-50 transition">
                      <td className="py-2 px-6">{getName(u) || "Unknown"}</td>
                      <td className="py-2 px-6">
                        <div className="flex flex-col items-start">
                          <span>{currentChapter}</span>
                        </div>
                      </td>
                      {/* 🔄 Updated to display the new progress score */}
                      <td className="py-2 px-6">{displayProgress}%</td>
                      <td className="py-2 px-6">
                        {formatLastSignIn(u.lastSignIn)}
                      </td>
                      <td className="py-2 px-6">
                        <span className={`px-3 py-1 rounded-lg font-semibold text-xs ${status === 'Active' ? 'bg-green-100 text-green-700' : status === 'Inactive' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-2 px-6">
                        <Link href={`/participants/${u.uid}`}>
                          <button className="text-blue-600 hover:underline">
                            View Profile
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                }
                )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No participants found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Participants;
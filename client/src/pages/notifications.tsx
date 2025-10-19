import { useState, useEffect, useRef, useMemo } from "react";
import Header from "@/components/layout/header";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// --- Global Variable Declarations to satisfy TypeScript ---
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;

// --- Firebase Imports and Setup ---
import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getFirestore,
    collection,
    onSnapshot,
    QuerySnapshot,
    QueryDocumentSnapshot,
    DocumentData,
    FirestoreError,
    Timestamp,
    updateDoc,
    deleteDoc,
    addDoc,
    doc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { app as sharedApp, db as sharedDb } from "@/firebase";

// Mandatory global variables for Canvas environment
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

let db: any = null;

try {
    const firebaseConfig = JSON.parse(typeof __firebase_config !== "undefined" ? __firebase_config : "{}");
    if (Object.keys(firebaseConfig).length > 0) {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
} catch (e) {
    console.warn("Canvas firebase config not available, falling back to shared app.");
}

if (!db) {
    try {
        db = sharedDb || getFirestore(sharedApp);
    } catch (e) {
        console.error("Failed to obtain Firestore instance:", e);
    }
}

// --- Data Type & Utility Functions ---

interface Activity {
    id: string;
    targetUserId: string;
    type: "registration" | "session_completed" | "access_request" | "access_approved" | "streak_interrupted" | "inactivity" | "access_denied";
    message: string;
    userName: string;
    sentAt: string;
    segmentKey?: string | null;
}

interface UserProgress {
    [key: string]: {
        date?: string;
        status: "completed" | "inProgress";
    };
}

interface User {
    uid: string;
    fullName: string;
    createdAt: string | null;
    userActivity?: {
        progress?: UserProgress;
    };
}

interface UserNameRecord {
    uid: string;
    fullName: string;
    createdAt: string | null;
}

const resolveFullName = (data: DocumentData, fallback?: string): string => {
    const trimmed = (value: unknown): string | null => {
        if (typeof value === "string") {
            const result = value.trim();
            if (result.length > 0) {
                return result;
            }
        }
        return null;
    };

    const firstName = trimmed(data.firstName);
    const lastName = trimmed(data.lastName);
    const compositeName = firstName || lastName ? [firstName, lastName].filter(Boolean).join(" ") : null;

    const potentialValues: Array<unknown> = [
        data.fullName,
        data.userName,
        data.name,
        data.displayName,
        data.username,
        compositeName,
        data.profile?.fullName,
        data.profile?.name,
        data.profile?.displayName,
        data.profile?.username,
        fallback,
    ];

    for (const value of potentialValues) {
        const candidate = trimmed(value);
        if (candidate) {
            return candidate;
        }
    }

    if (Array.isArray(data.names)) {
        for (const value of data.names) {
            const candidate = trimmed(value);
            if (candidate) {
                return candidate;
            }
        }
    }

    if (data.profile && typeof data.profile === "object" && data.profile !== data) {
        const nested = resolveFullName(data.profile as DocumentData, fallback);
        if (nested && nested !== "Unknown User") {
            return nested;
        }
    }

    return "Unknown User";
};

const normalizeTimestamp = (value: unknown): string | null => {
    if (!value) {
        return null;
    }
    if (value instanceof Timestamp) {
        return value.toDate().toISOString();
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        const multiplier = value < 1e12 ? 1000 : 1;
        const date = new Date(value * multiplier);
        if (!Number.isNaN(date.getTime())) {
            return date.toISOString();
        }
        return null;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }
        const date = new Date(trimmed);
        if (!Number.isNaN(date.getTime())) {
            return date.toISOString();
        }
        return null;
    }
    if (typeof value === "object" && value !== null) {
        const candidate = value as { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number };
        const seconds = typeof candidate.seconds === "number" ? candidate.seconds : candidate._seconds;
        if (typeof seconds === "number") {
            const nanos = typeof candidate.nanoseconds === "number" ? candidate.nanoseconds : candidate._nanoseconds;
            const date = new Date(seconds * 1000 + (typeof nanos === "number" ? Math.floor(nanos / 1e6) : 0));
            if (!Number.isNaN(date.getTime())) {
                return date.toISOString();
            }
        }
        if ("toDate" in candidate && typeof candidate.toDate === "function") {
            const date = candidate.toDate();
            if (date instanceof Date && !Number.isNaN(date.getTime())) {
                return date.toISOString();
            }
        }
    }
    return null;
};

const extractCreatedAt = (data: DocumentData, ...fallbacks: unknown[]): string | null => {
    const candidates: unknown[] = [
        data.createdAt,
        data.created_at,
        data.created,
        data.createdDate,
        data.created_on,
        data.createdOn,
        data.registrationDate,
        data.registeredAt,
        data.registered_at,
        data.joinedAt,
        data.joined_at,
        data.signupDate,
        data.signup_at,
        data.signedUpAt,
        data.timestamp,
        data.sentAt,
        data.meta?.createdAt,
        data.meta?.created_at,
        data.metadata?.createdAt,
        data.metadata?.created_at,
        data.profile?.createdAt,
        data.profile?.created_at,
        data.profile?.joinedAt,
        data.profile?.joined_at,
    ];

    candidates.push(...fallbacks);

    for (const candidate of candidates) {
        const normalized = normalizeTimestamp(candidate);
        if (normalized) {
            return normalized;
        }
    }

    if (data.profile && typeof data.profile === "object" && data.profile !== data) {
        const nested = extractCreatedAt(data.profile as DocumentData, ...fallbacks);
        if (nested) {
            return nested;
        }
    }

    return null;
};

type FilterOption = "All Notifications" | "New Registration" | "Session Completed" | "Access Request" | "User Alerts";

const FILTER_OPTIONS: FilterOption[] = [
    "All Notifications",
    "New Registration",
    "Session Completed",
    "Access Request",
    "User Alerts",
];

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

const getActivityDetails = (activity: Activity) => {
    switch (activity.type) {
        case "registration":
            return {
                icon: "person_add_alt_1",
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                title: "New Registration",
                subtitle: `${activity.userName} joined the platform.`,
            };
        case "session_completed":
            return {
                icon: "check_circle",
                color: "text-green-600",
                bgColor: "bg-green-50",
                title: "Session Completed",
                subtitle: `${activity.userName} ${activity.message}`,
            };
        case "access_request":
            return {
                icon: "warning",
                color: "text-yellow-600",
                bgColor: "bg-yellow-50",
                title: "Access Request",
                subtitle: `${activity.userName} has requested access.`,
            };
        case "access_approved":
            return {
                icon: "verified",
                color: "text-teal-600",
                bgColor: "bg-teal-50",
                title: "Access Approved",
                subtitle: `Access for ${activity.userName} has been approved.`,
            };
        case "streak_interrupted":
            return {
                icon: "sync_disabled",
                color: "text-red-600",
                bgColor: "bg-red-50",
                title: "Login Streak Interrupted",
                subtitle: `${activity.userName} missed their daily login.`,
            };
        case "inactivity":
            return {
                icon: "sentiment_dissatisfied",
                color: "text-red-600",
                bgColor: "bg-red-50",
                title: "Inactivity Alert",
                subtitle: `${activity.userName} has not been active for a while.`,
            };
        default:
            return {
                icon: "info",
                color: "text-gray-600",
                bgColor: "bg-gray-50",
                title: "General Alert",
                subtitle: activity.message,
            };
    }
};

// --- Component ---

export default function Notifications() {
    const [, navigate] = useLocation();
    const [selectedFilter, setSelectedFilter] = useState<FilterOption>("All Notifications");
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split("T")[0]);

    // When the notifications page is opened, mark notifications as seen by storing timestamp
    useEffect(() => {
        try {
            localStorage.setItem('lastSeenNotificationsAt', new Date().toISOString());
        } catch (e) {
            console.warn('Unable to persist last seen notifications timestamp', e);
        }
    }, []);

    const fetchedDataRef = useRef<{
        activityUsers: User[];
        userProfiles: UserNameRecord[];
        platformUsers: UserNameRecord[];
        activities: Activity[];
    }>({
        activityUsers: [],
        userProfiles: [],
        platformUsers: [],
        activities: [],
    });

    useEffect(() => {
        if (!db) {
            console.error("Firestore database is not initialized.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const processAndSetActivities = () => {
            const { activityUsers, userProfiles, platformUsers, activities } = fetchedDataRef.current;
            let combinedFeed: Activity[] = [];
            const filterDay = new Date(filterDate);

            const generatedNotifs = new Map<string, Activity>();

            const activityUserMap = new Map<string, User>(activityUsers.map(user => [user.uid, user]));
            const nameMap = new Map<string, string>();
            const mergeName = (uid: string | undefined, name?: string) => {
                if (!uid || uid === "unknown-uid") {
                    return;
                }
                if (nameMap.has(uid)) {
                    return;
                }
                if (typeof name === "string") {
                    const trimmed = name.trim();
                    if (trimmed.length > 0 && trimmed.toLowerCase() !== "unknown user") {
                        nameMap.set(uid, trimmed);
                    }
                }
            };

            const creationMap = new Map<string, string>();
            const mergeCreation = (uid: string | undefined, value?: unknown) => {
                if (!uid || uid === "unknown-uid") {
                    return;
                }
                const normalized = normalizeTimestamp(value);
                if (!normalized) {
                    return;
                }
                if (!creationMap.has(uid)) {
                    creationMap.set(uid, normalized);
                    return;
                }
                const existing = creationMap.get(uid)!;
                if (new Date(normalized).getTime() < new Date(existing).getTime()) {
                    creationMap.set(uid, normalized);
                }
            };

            activityUsers.forEach(user => {
                mergeName(user.uid, user.fullName);
                mergeCreation(user.uid, user.createdAt);
            });
            userProfiles.forEach(profile => {
                mergeName(profile.uid, profile.fullName);
                mergeCreation(profile.uid, profile.createdAt);
            });
            platformUsers.forEach(profile => {
                mergeName(profile.uid, profile.fullName);
                mergeCreation(profile.uid, profile.createdAt);
            });
            const explicitRegistrationUsers = new Set<string>();
            activities.forEach(activity => {
                mergeName(activity.targetUserId, activity.userName);
                if (activity.type === "registration" && activity.targetUserId && activity.targetUserId !== "unknown-uid") {
                    explicitRegistrationUsers.add(activity.targetUserId);
                    mergeCreation(activity.targetUserId, activity.sentAt);
                }
            });

            const getNameForUser = (userId: string, fallback?: string): string => {
                if (nameMap.has(userId)) {
                    const stored = nameMap.get(userId);
                    if (stored) {
                        return stored;
                    }
                }
                const fromActivityUsers = activityUserMap.get(userId)?.fullName;
                if (fromActivityUsers && fromActivityUsers.trim().length > 0) {
                    return fromActivityUsers.trim();
                }
                if (typeof fallback === "string") {
                    const trimmed = fallback.trim();
                    if (trimmed.length > 0 && trimmed.toLowerCase() !== "unknown user") {
                        return trimmed;
                    }
                }
                return "Unknown User";
            };

            activities.forEach(activity => {
                const userName = getNameForUser(activity.targetUserId, activity.userName);
                const updatedActivity = { ...activity, userName };
                combinedFeed.push(updatedActivity);
            });

            activityUsers.forEach(user => {
                if (user.userActivity?.progress) {
                    let latestActivityDate: Date | null = null;

                    for (const day in user.userActivity.progress) {
                        const progress = user.userActivity.progress[day];
                        if (progress.status === "completed" && progress.date) {
                            const completedDate = new Date(progress.date);
                            if (completedDate.toLocaleDateString() === filterDay.toLocaleDateString()) {
                                const id = `complete-${user.uid}-${day}`;
                                if (!generatedNotifs.has(id)) {
                                    generatedNotifs.set(id, {
                                        id,
                                        targetUserId: user.uid,
                                        type: "session_completed",
                                        userName: getNameForUser(user.uid, user.fullName),
                                        message: `completed ${day.replace("day", "Day ")}`,
                                        sentAt: completedDate.toISOString(),
                                    });
                                }
                            }
                            if (!latestActivityDate || completedDate > latestActivityDate) {
                                latestActivityDate = completedDate;
                            }
                        }
                    }

                    if (latestActivityDate) {
                        const today = new Date();
                        const diffInDays = Math.floor((today.getTime() - latestActivityDate.getTime()) / (1000 * 60 * 60 * 24));

                        if (diffInDays >= 7) {
                            if (latestActivityDate.toLocaleDateString() === filterDay.toLocaleDateString()) {
                                const id = `inactivity-${user.uid}`;
                                if (!generatedNotifs.has(id)) {
                                    generatedNotifs.set(id, {
                                        id,
                                        targetUserId: user.uid,
                                        type: "inactivity",
                                        userName: getNameForUser(user.uid, user.fullName),
                                        message: `has been inactive for ${diffInDays} days`,
                                        sentAt: latestActivityDate.toISOString(),
                                    });
                                }
                            }
                        }
                    }
                }
            });

            creationMap.forEach((createdIso, uid) => {
                if (!uid || explicitRegistrationUsers.has(uid)) {
                    return;
                }
                const createdDate = new Date(createdIso);
                if (Number.isNaN(createdDate.getTime())) {
                    return;
                }
                if (createdDate.toLocaleDateString() === filterDay.toLocaleDateString()) {
                    const id = `reg-${uid}`;
                    if (!generatedNotifs.has(id)) {
                        generatedNotifs.set(id, {
                            id,
                            targetUserId: uid,
                            type: "registration",
                            userName: getNameForUser(uid),
                            message: "joined the platform",
                            sentAt: createdDate.toISOString(),
                        });
                    }
                }
            });

            combinedFeed = [...combinedFeed, ...Array.from(generatedNotifs.values())];

            combinedFeed.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
            setActivities(combinedFeed);
            setIsLoading(false);
        };

        const usersRef = collection(db, "userActivity");
        const activitiesRef = collection(db, "activities");
        const userProfilesRef = collection(db, "userProfiles");
        const platformUsersRef = collection(db, "users");

        const unsubscribeUsers = onSnapshot(
            usersRef,
            (usersSnapshot: QuerySnapshot<DocumentData>) => {
                const fetchedUsers: User[] = [];
                usersSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                    const data = doc.data() as DocumentData;
                    const createdAt = extractCreatedAt(data);
                    fetchedUsers.push({
                        uid: doc.id,
                        fullName: resolveFullName(data),
                        createdAt,
                        userActivity: { progress: data.progress },
                    });
                });
                fetchedDataRef.current.activityUsers = fetchedUsers;
                processAndSetActivities();
            },
            (error: FirestoreError) => {
                console.error("Error fetching users:", error);
            }
        );

        const unsubscribeUserProfiles = onSnapshot(
            userProfilesRef,
            (profilesSnapshot: QuerySnapshot<DocumentData>) => {
                const fetchedProfiles: UserNameRecord[] = [];
                profilesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                    const data = doc.data() as DocumentData;
                    const createdAt = extractCreatedAt(data);
                    fetchedProfiles.push({
                        uid: doc.id,
                        fullName: resolveFullName(data),
                        createdAt,
                    });
                });
                fetchedDataRef.current.userProfiles = fetchedProfiles;
                processAndSetActivities();
            },
            (error: FirestoreError) => {
                console.error("Error fetching user profiles:", error);
            }
        );

        const unsubscribePlatformUsers = onSnapshot(
            platformUsersRef,
            (platformSnapshot: QuerySnapshot<DocumentData>) => {
                const fetchedPlatformUsers: UserNameRecord[] = [];
                platformSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                    const data = doc.data() as DocumentData;
                    const createdAt = extractCreatedAt(data);
                    fetchedPlatformUsers.push({
                        uid: doc.id,
                        fullName: resolveFullName(data),
                        createdAt,
                    });
                });
                fetchedDataRef.current.platformUsers = fetchedPlatformUsers;
                processAndSetActivities();
            },
            (error: FirestoreError) => {
                console.error("Error fetching users collection:", error);
            }
        );

        const unsubscribeActivities = onSnapshot(
            activitiesRef,
            (activitiesSnapshot: QuerySnapshot<DocumentData>) => {
                const fetchedActivities: Activity[] = [];
                activitiesSnapshot.forEach(doc => {
                    const data = doc.data() as DocumentData;
                    const ts = data.timestamp || data.sentAt;
                    const when = ts instanceof Timestamp ? ts.toDate() : new Date(ts);

                    const rawType = (data.type || "").toString();
                    let normType: Activity["type"];
                    if (["registration", "signup", "login", "new_user"].includes(rawType)) normType = "registration";
                    else if (["session_completed", "completed", "stage_complete", "chapter_completed"].includes(rawType)) normType = "session_completed";
                    else if (["access_request", "pending_access", "request_access"].includes(rawType)) normType = "access_request";
                    else if (["access_approved"].includes(rawType)) normType = "access_approved";
                    else if (["access_denied", "denied"].includes(rawType)) normType = "access_denied";
                    else if (["streak_interrupted", "streak_break"].includes(rawType)) normType = "streak_interrupted";
                    else if (["inactivity", "inactive"].includes(rawType)) normType = "inactivity";
                    else normType = "registration";

                    const activity: Activity = {
                        id: doc.id,
                        targetUserId: data.userId || data.uid || "unknown-uid",
                        type: normType,
                        userName: resolveFullName(data, data.userName || data.name),
                        message: data.message || data.description || "",
                        sentAt: when.toISOString(),
                        segmentKey: typeof data.segmentKey === 'string' ? data.segmentKey : null,
                    };
                    fetchedActivities.push(activity);
                });
                fetchedDataRef.current.activities = fetchedActivities;
                processAndSetActivities();
            },
            (error: FirestoreError) => {
                console.error("Error fetching activities from Firestore:", error);
            }
        );

        return () => {
            unsubscribeUsers();
            unsubscribeUserProfiles();
            unsubscribePlatformUsers();
            unsubscribeActivities();
        };
    }, [filterDate]);

    const filteredActivities = useMemo(() => {
        const selectedDateString = new Date(filterDate).toLocaleDateString();
        return activities.filter(activity => {
            const activityDate = new Date(activity.sentAt);
            if (activityDate.toLocaleDateString() !== selectedDateString) {
                return false;
            }

            switch (selectedFilter) {
                case "New Registration":
                    return activity.type === "registration";
                case "Session Completed":
                    return activity.type === "session_completed";
                case "Access Request":
                    return activity.type === "access_request" || activity.type === "access_approved";
                case "User Alerts":
                    return activity.type === "streak_interrupted" || activity.type === "inactivity";
                default:
                    return true;
            }
        });
    }, [activities, filterDate, selectedFilter]);

    const ActivityCard = ({ activity }: { activity: Activity }) => {
        const { icon, color, bgColor, title, subtitle } = getActivityDetails(activity);

        const handleViewProfile = () => {
            if (activity.targetUserId && activity.targetUserId !== "unknown-uid") {
                navigate(`/participants/${activity.targetUserId}`);
            } else {
                console.warn("Cannot navigate: User UID is missing.");
            }
        };

        const handleChat = () => {
            if (activity.targetUserId && activity.targetUserId !== "unknown-uid") {
                console.log(`Initiating chat for UID: ${activity.targetUserId}`);
            } else {
                console.warn("Cannot chat: User UID is missing.");
            }
        };

        return (
            <div className={`flex items-start p-4 rounded-xl shadow-sm ${bgColor} border-l-4 ${color.replace("text", "border")}`}>
                <span className={`material-icons text-xl ${color} mr-3 mt-1`}>{icon}</span>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p className={`text-sm font-semibold ${color} mb-1`}>{title}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatRelativeTime(new Date(activity.sentAt))}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700">{subtitle}</p>

                    <div className="mt-3 flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-gray-100 text-teal-600 border-teal-600"
                            onClick={handleViewProfile}
                            disabled={activity.targetUserId === "unknown-uid"}
                        >
                            View Profile
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-gray-100 text-green-600 border-green-600"
                            onClick={handleChat}
                            disabled={activity.targetUserId === "unknown-uid"}
                        >
                            Chat
                        </Button>

                        {activity.type === 'access_request' && (
                            <>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-teal-600 text-white"
                                    onClick={async () => {
                                        if (!db) return console.error('Firestore not initialized');
                                        if (!activity.segmentKey) return console.warn('Missing segmentKey for access request');
                                        try {
                                            const userDocRef = doc(db, 'users', activity.targetUserId);
                                            const userActivityRef = doc(db, 'userActivity', activity.targetUserId);
                                            const updateData: any = {};
                                            if (activity.segmentKey === 'day1_13') {
                                                updateData.IsSeg1Approved = true;
                                            } else if (activity.segmentKey === 'day14_28') {
                                                updateData.IsSeg2Approved = true;
                                                updateData.IsSeg3Approved = true;
                                            }
                                            // Update users collection
                                            await updateDoc(userDocRef, updateData);
                                            // Update userActivity nested fields
                                            try {
                                                if (activity.segmentKey === 'day1_13') {
                                                    await updateDoc(userActivityRef, { 'segment1.IsSeg1Approved': true });
                                                } else if (activity.segmentKey === 'day14_28') {
                                                    await updateDoc(userActivityRef, { 'segment2.IsSeg2Approved': true });
                                                }
                                            } catch (e: any) {
                                                if (e?.code === 'not-found') {
                                                    // create doc with merge
                                                    const base: any = {};
                                                    if (activity.segmentKey === 'day1_13') base.segment1 = { IsSeg1Approved: true };
                                                    else if (activity.segmentKey === 'day14_28') base.segment2 = { IsSeg2Approved: true };
                                                    await setDoc(userActivityRef, base, { merge: true });
                                                } else {
                                                    throw e;
                                                }
                                            }
                                            // add an approved activity
                                            const activitiesRef = collection(db, 'activities');
                                            await addDoc(activitiesRef, {
                                                userId: activity.targetUserId,
                                                type: 'access_approved',
                                                segmentKey: activity.segmentKey,
                                                message: `Access approved for ${activity.segmentKey}`,
                                                userName: activity.userName,
                                                timestamp: serverTimestamp(),
                                            });
                                            // remove the original request
                                            await deleteDoc(doc(db, 'activities', activity.id));
                                        } catch (err) {
                                            console.error('Failed to approve access request', err);
                                        }
                                    }}
                                >
                                    Approve
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 border-red-600"
                                    onClick={async () => {
                                        if (!db) return console.error('Firestore not initialized');
                                        try {
                                            const activitiesRef = collection(db, 'activities');
                                            await addDoc(activitiesRef, {
                                                userId: activity.targetUserId,
                                                type: 'access_denied',
                                                segmentKey: activity.segmentKey || null,
                                                message: `Access denied for ${activity.segmentKey || 'segment'}`,
                                                userName: activity.userName,
                                                timestamp: serverTimestamp(),
                                            });
                                            await deleteDoc(doc(db, 'activities', activity.id));
                                        } catch (err) {
                                            console.error('Failed to deny access request', err);
                                        }
                                    }}
                                >
                                    Deny
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="font-poppins bg-gray-50 min-h-screen">
            <Header title="Notifications" subtitle="Manage and view all Notifications" />

            <div className="flex justify-end p-6 pt-0 max-w-7xl mx-auto md:justify-start lg:justify-end">
                <div className="flex space-x-3 items-center">
                    <div className="relative">
                        <select
                            value={selectedFilter}
                            onChange={event => setSelectedFilter(event.target.value as FilterOption)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
                        >
                            {FILTER_OPTIONS.map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 text-lg">
                            arrow_drop_down
                        </span>
                    </div>

                    <div className="relative">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={event => setFilterDate(event.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-6 pt-0 max-w-7xl mx-auto">
                <Card className="shadow-lg">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-800">Activity Log for {new Date(filterDate).toLocaleDateString()}</h3>
                            <span className="text-sm text-gray-500">{filteredActivities.length} total</span>
                        </div>

                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex items-start p-4 rounded-xl bg-white shadow-sm border border-gray-200">
                                    <Skeleton className="w-6 h-6 rounded-full mr-3 mt-1" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                        <Skeleton className="h-4 w-full mb-2" />
                                        <div className="flex space-x-2 mt-3">
                                            <Skeleton className="h-8 w-24 rounded-lg" />
                                            <Skeleton className="h-8 w-20 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : filteredActivities.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <span className="material-icons text-6xl text-gray-300 mb-4">task_alt</span>
                                <p className="text-gray-600 font-semibold text-lg">No Activities Found</p>
                                <p className="text-sm text-gray-400">No notifications match the selected filters for this date.</p>
                            </div>
                        ) : (
                            filteredActivities.map(activity => <ActivityCard key={activity.id} activity={activity} />)
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

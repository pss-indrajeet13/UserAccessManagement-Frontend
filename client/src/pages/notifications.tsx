// src/pages/Notifications.tsx
import { useState, useEffect } from "react"; 
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// --- Global Variable Declarations to satisfy TypeScript ---
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;

// --- Firebase Imports and Setup ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot 
} from "firebase/firestore";
import { app as sharedApp, db as sharedDb } from "@/firebase";

// Mandatory global variables for Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let db: any = null;

try {
  const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
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

// Simplified Activity/Notification interface
interface Activity {
    id: string; // Firestore Document ID
    targetUserId: string; // The UID of the participant this activity is about
    type: 'registration' | 'session_completed' | 'access_request' | 'pending_access' | 'streak_interrupted' | 'inactivity';
    message: string;
    userName: string;
    sentAt: string; // ISO date string
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

const getActivityDetails = (activity: Activity) => {
    switch (activity.type) {
        case 'registration':
            return {
                icon: 'person_add_alt_1',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                title: 'New Registration',
                subtitle: `${activity.userName} ${activity.message}`,
            };
        case 'session_completed':
            return {
                icon: 'check_circle',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                title: 'Session Completed',
                subtitle: `${activity.userName} ${activity.message}`,
            };
        case 'access_request': 
        case 'pending_access':
            return {
                icon: 'warning',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                title: 'Pending Access Request',
                subtitle: `${activity.userName} ${activity.message}`,
            };
        case 'streak_interrupted':
            return {
                icon: 'sync_disabled',
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                title: 'Streak Interrupted - Login Missed',
                subtitle: `${activity.userName} ${activity.message}`,
            };
        case 'inactivity':
            return {
                icon: 'sentiment_dissatisfied',
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                title: 'Inactivity Alert',
                subtitle: `${activity.userName} ${activity.message}`,
            };
        default:
            return {
                icon: 'info',
                color: 'text-gray-600',
                bgColor: 'bg-gray-50',
                title: 'General Alert',
                subtitle: activity.message,
            };
    }
};

// --- DUMMY NAVIGATION HOOK (Replace with your actual router hook) ---
const useNavigation = () => {
    const navigate = (path: string) => {
        console.log(`[ROUTER] Navigating to: ${path}`);
    };
    return navigate;
}

// --- Component ---

export default function Notifications() {
    const navigate = useNavigation();
    const queryClient = useQueryClient();
    const [selectedFilter, setSelectedFilter] = useState("All Notifications");

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!db) {
            console.error("Firestore database is not initialized.");
            setIsLoading(false);
            return;
        }

        // Prefer main 'activities' collection. If it fails, fall back to canvas path.
        const activitiesRef = collection(db, 'activities');
        let qRef: any;
        try {
            qRef = query(activitiesRef, orderBy('timestamp', 'desc'), limit(50));
        } catch {
            qRef = query(collection(db, `/artifacts/${appId}/public/data/activities`), orderBy('sentAt', 'desc'), limit(50));
        }

        const unsubscribe = onSnapshot(qRef, (snapshot) => {
            const fetchedActivities: Activity[] = [];
            snapshot.forEach(doc => {
                const data: any = doc.data();
                const ts = data.timestamp || data.sentAt;
                const when = ts?.toDate ? ts.toDate() : (typeof ts === 'number' ? new Date(ts) : new Date());

                // Normalize types from different producers
                const rawType = (data.type || '').toString();
                let normType: Activity['type'];
                if (['registration', 'signup', 'login', 'new_user'].includes(rawType)) normType = 'registration';
                else if (['session_completed', 'completed', 'stage_complete', 'chapter_completed'].includes(rawType)) normType = 'session_completed';
                else if (['access_request', 'pending_access', 'request_access'].includes(rawType)) normType = 'access_request';
                else if (['streak_interrupted', 'streak_break'].includes(rawType)) normType = 'streak_interrupted';
                else if (['inactivity', 'inactive'].includes(rawType)) normType = 'inactivity';
                else normType = 'registration';

                const activity: Activity = {
                    id: doc.id,
                    targetUserId: data.userId || data.uid || 'unknown-uid',
                    type: normType,
                    userName: data.userName || data.name || 'Unknown User',
                    message: data.message || data.description || '',
                    sentAt: when.toISOString(),
                };
                fetchedActivities.push(activity);
            });
            setActivities(fetchedActivities);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching activities from Firestore:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    
    const filterOptions = [
        "All Notifications",
        "New Registration",
        "Session Completed",
        "Access Request",
        "User Alerts",
    ];

    const filteredActivities = activities.filter(activity => {
        if (selectedFilter === "All Notifications") return true;
        if (selectedFilter === "New Registration") return activity.type === 'registration';
        if (selectedFilter === "Session Completed") return activity.type === 'session_completed';
        if (selectedFilter === "Access Request") return activity.type === 'access_request' || activity.type === 'pending_access';
        if (selectedFilter === "User Alerts") return activity.type === 'streak_interrupted' || activity.type === 'inactivity';
        return false;
    });

    // --- Activity Feed Card Component ---
    const ActivityCard = ({ activity }: { activity: Activity }) => {
        const { icon, color, bgColor, title, subtitle } = getActivityDetails(activity);

        const handleViewProfile = () => {
            if (activity.targetUserId && activity.targetUserId !== 'unknown-uid') {
                // Navigate to the user profile page using their UID
                navigate(`/participants/${activity.targetUserId}`); 
            } else {
                console.warn("Cannot navigate: User UID is missing.");
            }
        };

        const handleChat = () => {
            if (activity.targetUserId && activity.targetUserId !== 'unknown-uid') {
                console.log(`Initiating chat for UID: ${activity.targetUserId}`);
            } else {
                console.warn("Cannot chat: User UID is missing.");
            }
        };

        return (
            <div className={`flex items-start p-4 rounded-xl shadow-sm ${bgColor} border-l-4 ${color.replace('text', 'border')}`}>
                <span className={`material-icons text-xl ${color} mr-3 mt-1`}>{icon}</span>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p className={`text-sm font-semibold ${color} mb-1`}>{title}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatRelativeTime(new Date(activity.sentAt))}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700">{subtitle}</p>
                    
                    {/* Action Buttons */}
                    <div className="mt-3 flex space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white hover:bg-gray-100 text-teal-600 border-teal-600"
                            onClick={handleViewProfile}
                            disabled={activity.targetUserId === 'unknown-uid'}
                        >
                            View Profile
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white hover:bg-gray-100 text-green-600 border-green-600"
                            onClick={handleChat}
                            disabled={activity.targetUserId === 'unknown-uid'}
                        >
                            Chat
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="font-poppins bg-gray-50 min-h-screen">
            <Header 
                title="Notifications" 
                subtitle="Manage and view overall all Notifications"
            />
            
            <div className="flex justify-end p-6 pt-0 max-w-7xl mx-auto md:justify-start lg:justify-end">
                 <div className="relative">
                    <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
                    >
                        {filterOptions.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <span className="material-icons absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 text-lg">
                        arrow_drop_down
                    </span>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-6 pt-0 max-w-7xl mx-auto">
                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Activity Log</h3>
                        
                        <div className="space-y-4">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex items-start p-4 rounded-xl bg-white shadow-sm border-l-4 border-gray-200">
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
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <span className="material-icons text-6xl text-gray-300 mb-4">task_alt</span>
                                    <p className="text-gray-600 font-semibold text-lg">No New Activities</p>
                                    <p className="text-sm text-gray-400">All alerts in this category have been processed or none have occurred yet.</p>
                                </div>
                            ) : (
                                filteredActivities.map((activity) => (
                                    <ActivityCard key={activity.id} activity={activity} />
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

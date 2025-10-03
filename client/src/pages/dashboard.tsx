// src/pages/dashboard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "@fontsource/poppins";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import YogaIcon from "../Assets/Dashboard-screen/yoga.png";
import FireIcon from "../Assets/Dashboard-screen/fire.png";
import SmileIcon from "../Assets/Dashboard-screen/smile.png";
import BookIcon from "../Assets/Dashboard-screen/book.png";
import profilyellow from "@/Assets/Dashboard-screen/pro.png";
import redheart from "@/Assets/Dashboard-screen/red.png";
import greenlabel from "@/Assets/Dashboard-screen/gre.png";
import folderG from "@/Assets/Dashboard-screen/foldergrey.png";
import Header from "@/components/layout/header";

// ⚠️ NEW IMPORTS FOR FIREBASE ⚠️
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app as sharedApp, db as sharedDb, auth as sharedAuth } from "@/firebase";

interface DashboardStats {
  totalUsers: number;
  totalActiveUsers: number;
  averageStreakLength: string;
  averageMoodScore: string;
  chaptersUnlockedToday: number;
  overallProgress: number;
  inactiveForDays: number;
  streakBreaks: number;
  milestones: number;
  meditationVideoUsers: number;
  incompleteSessions: number;
  journalsSubmitted: number;
}

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ⚠️ NEW STATE FOR ADMIN NAME, using 'name' from your image ⚠️
  const [adminName, setAdminName] = useState("Admin"); 

  useEffect(() => {
    const fetchDashboardData = async (userId: string) => {
      try {
        // Fetch the current admin user's details
        const dbInstance = sharedDb || getFirestore(sharedApp);
        const userDocRef = doc(dbInstance, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // ⚠️ FETCHING 'name' INSTEAD OF 'fullname' ⚠️
          if (userData.name) {
            setAdminName(userData.name);
          }
        }
        
        // Fetch dashboard stats from your API
        const response = await fetch("/api/dashboard-stats", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        const data: DashboardStats = await response.json();
        setStats(data);
        setError(null);
      } catch (e: any) {
        console.error("Error fetching dashboard data:", e);
        setStats(null);
        setError("Failed to load live data. Please check your network or server.");
      } finally {
        setLoading(false);
      }
    };
    
    // ⚠️ FETCHING ADMIN NAME AND DASHBOARD STATS ⚠️
    const authInstance = sharedAuth || getAuth(sharedApp);
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (user) {
        // User is signed in, fetch data
        fetchDashboardData(user.uid);
      } else {
        // User is signed out
        setLoading(false);
        setError("User not authenticated.");
      }
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  const progress = clampPercent(stats?.overallProgress ?? 0);
  const circumference = 283;
  const progressLength = (progress / 100) * circumference;

  const cardStats = [
    {
      title: "Total Active Users",
      value: `${stats?.totalActiveUsers ?? 0}/${stats?.totalUsers ?? 0}`,
      img: YogaIcon,
    },
    {
      title: "Average Streak Length",
      value: stats?.averageStreakLength ?? "0 Days",
      img: FireIcon,
    },
    {
      title: "Average Mood Score",
      value: stats?.averageMoodScore ?? "0/5",
      img: SmileIcon,
    },
    {
      title: "Chapters Unlocked Today",
      value: stats?.chaptersUnlockedToday?.toString() ?? "0",
      img: BookIcon,
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          <Card className="md:col-span-2 bg-white rounded-2xl shadow-md">
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
                <svg className="w-full h-full">
                  <path
                    d="M10,100 A90,90 0 0,1 190,100"
                    fill="none"
                    stroke="#E5EBED"
                    strokeWidth="20"
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

          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cardStats.map((stat, index) => (
              <Card
                key={index}
                className="relative bg-[#256B78] text-white rounded-2xl shadow-md overflow-hidden p-6"
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
          <Card className="bg-white rounded-2xl shadow-md border border-gray-200">
            <CardHeader className="pb-2 border-b border-[#125566]">
              <div className="flex justify-between items-start w-full">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#125566]">
                    Daily Digest
                  </CardTitle>
                  <p className="text-sm text-gray-500">Today's activity summary</p>
                </div>
                <button className="px-6 py-2 bg-gray-100 text-sm rounded-lg font-medium text-[#125566] hover:bg-gray-200">
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              <div>
                <div className="flex justify-between items-center text-sm pb-1">
                  <span>Users who complete meditations videos</span>
                  <span className="font-semibold text-[#125566]">{stats?.meditationVideoUsers ?? 0}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-[#5FB3B3] h-2 rounded-full"
                    style={{ width: `${(stats?.totalActiveUsers ?? 0) > 0 ? ((stats?.meditationVideoUsers ?? 0) / (stats?.totalActiveUsers ?? 1)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-sm pb-1">
                  <span>Users who Pending/incomplete sessions</span>
                  <span className="font-semibold text-[#125566]">{stats?.incompleteSessions ?? 0}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-[#C4B5FD] h-2 rounded-full"
                    style={{ width: `${(stats?.totalActiveUsers ?? 0) > 0 ? ((stats?.incompleteSessions ?? 0) / (stats?.totalActiveUsers ?? 1)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-sm pb-1">
                  <span>Users who Journals Submitted</span>
                  <span className="font-semibold text-[#125566]">{stats?.journalsSubmitted ?? 0}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-[#FF8B6A] h-2 rounded-full"
                    style={{ width: `${(stats?.totalActiveUsers ?? 0) > 0 ? ((stats?.journalsSubmitted ?? 0) / (stats?.totalActiveUsers ?? 1)) * 100 : 0}%` }}
                  ></div>
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
                <button className="px-6 py-2 bg-gray-100 text-sm rounded-lg font-medium text-[#125566] hover:bg-gray-200">
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-yellow-300 bg-yellow-50 text-sm">
                <img src={profilyellow} alt="Inactive icon" className="w-5 h-5" />
                <p>{stats?.inactiveForDays ?? 0} participations inactive for 7+ days</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-red-300 bg-red-50 text-sm">
                <img src={redheart} alt="Streak break icon" className="w-5 h-5" />
                <p>{stats?.streakBreaks ?? 0} users experiencing streak breaks this week</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-300 bg-green-50 text-sm">
                <img src={greenlabel} alt="Milestone icon" className="w-5 h-5" />
                <p>{stats?.milestones ?? 0} users achieved 28-days milestone today</p>
              </div>
            </CardContent>
          </Card>

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
                <button className="px-6 py-2 bg-gray-100 text-sm rounded-lg font-medium text-[#125566] hover:bg-gray-200">
                  View All Journals
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <img src={folderG} alt="Folder icon" className="w-12 h-12 mb-4" />
              <p className="text-lg text-red-500 font-semibold">
                Currently, you don’t have any journals
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Once added, all journals will be found here...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
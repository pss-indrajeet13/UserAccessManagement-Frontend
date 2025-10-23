import React, { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import GaugeChart from "react-gauge-chart";
import { db } from "@/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import fertiwellLogo from "@/Assets/Sidebar-screen/Fertiliwell-Logo-1.svg";

interface ChapterData {
  id: string;
  name: string;
  dayKey: string;
  completedCount: number;
  totalParticipants: number;
  completionRate: number;
}

interface StatsData {
  completed: number;
  active: number;
  upcoming: number;
  overallProgress: string;
  avgCompletionRate: number;
  highestDropOff: number;
  highestDropOffChapter: string;
}

// Calculate stats from chapters data
const calculateStats = (chaptersData: ChapterData[]): StatsData => {
  const totalChapters = 29; // Chapters 0-28
  const completionRates = chaptersData.map(c => c.completionRate);
  const avgRate = completionRates.length > 0 ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length : 0;

  // Categorize chapters based on completion rate
  const completed = chaptersData.filter((c) => c.completionRate === 100).length;
  const active = chaptersData.filter((c) => c.completionRate > 0 && c.completionRate < 100).length;
  const upcoming = chaptersData.filter((c) => c.completionRate === 0).length;
  const overallProgress = ((completed / totalChapters) * 100).toFixed(0);

  return {
    completed,
    active,
    upcoming,
    overallProgress,
    avgCompletionRate: avgRate,
    highestDropOff: 0,
    highestDropOffChapter: "",
  };
};

const Chapters: React.FC = () => {
  const [chaptersData, setChaptersData] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    completed: 0,
    active: 0,
    upcoming: 0,
    overallProgress: "0",
    avgCompletionRate: 0,
    highestDropOff: 0,
    highestDropOffChapter: "",
  });

  useEffect(() => {
    const fetchChaptersData = async () => {
      try {
        const userActivityCollection = collection(db, "userActivity");
        const snapshot = await getDocs(userActivityCollection);

        // Initialize chapter counts for days 0-28
        const chapterCounts: Record<string, { completed: number; total: number }> = {};
        for (let i = 0; i <= 28; i++) {
          chapterCounts[`day${i}`] = { completed: 0, total: 0 };
        }

        // Count participants and completed chapters
        let totalParticipants = 0;

        for (const userDoc of snapshot.docs) {
          const userActivity = userDoc.data();
          const progress = userActivity.progress || {};

          totalParticipants++;

          // Count completed days for this user
          for (let i = 0; i <= 28; i++) {
            const dayKey = `day${i}`;
            if (dayKey in chapterCounts) {
              chapterCounts[dayKey].total++;
              if (progress[dayKey] && progress[dayKey].status?.toLowerCase() === "completed") {
                chapterCounts[dayKey].completed++;
              }
            }
          }
        }

        // Build chapters data
        const chapters: ChapterData[] = [];
        for (let i = 0; i <= 28; i++) {
          const dayKey = `day${i}`;
          const counts = chapterCounts[dayKey];
          const completionRate = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;

          chapters.push({
            id: `chapter-${i}`,
            name: `Chapter ${i}`,
            dayKey,
            completedCount: counts.completed,
            totalParticipants: counts.total,
            completionRate: Math.round(completionRate),
          });
        }

        setChaptersData(chapters);
        const calculatedStats = calculateStats(chapters);
        setStats(calculatedStats);
      } catch (error) {
        console.error("Error fetching chapters data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChaptersData();
  }, []);

  const data = [
    { name: "Completed", value: stats.completed, color: "#4CAF50" },
    { name: "Active", value: stats.active, color: "#9C27B0" },
    { name: "Upcoming", value: stats.upcoming, color: "#FFCA28" },
  ];

  return (
    <div className="font-poppins bg-gray-100 min-h-screen">
      <Header title="Chapters" subtitle="Monitor 28 days program" />

      <main className="p-6 mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#125566" }}>
            Chapters
          </h1>
          <p className="text-base text-black mt-1">Monitor 28 days program</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* ✅ Card 1: Overall Chapters Progress */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <CardHeader
              className="pb-2 border-b"
              style={{ borderColor: "#125566" }}
            >
              <CardTitle className="text-lg font-semibold text-[#125566]">
                Overall Chapters Progress
              </CardTitle>
              <p className="text-sm text-gray-500">
                Overall chapters completion percentage
              </p>
            </CardHeader>

            <div className="flex items-center gap-6 p-6">
              <div className="space-y-3">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.value}
                    </div>
                    <span className="text-gray-700 text-sm">{item.name}</span>
                  </div>
                ))}
              </div>

              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-[#1E4A5A]">
                    {stats.overallProgress}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Card 2: Avg Completion Rate */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <CardHeader
              className="pb-2 border-b"
              style={{ borderColor: "#125566" }}
            >
              <CardTitle className="text-lg font-semibold text-[#125566]">
                Avg Completion Rate
              </CardTitle>
              <p className="text-sm text-gray-500">Across all active chapters</p>
            </CardHeader>
            <div className="p-6">
              <GaugeChart
                id="avg-completion-rate"
                nrOfLevels={20}
                percent={stats.avgCompletionRate / 100}
                colors={["#4CAF50", "#e0e0e0"]}
                arcWidth={0.3}
                textColor="#000"
              />
            </div>
          </div>

          {/* ✅ Card 3: Highest Drop-Off Point */}
          {/* <div className="bg-white rounded-lg shadow border border-gray-200">
            <CardHeader
              className="pb-2 border-b"
              style={{ borderColor: "#125566" }}
            >
              <CardTitle className="text-lg font-semibold text-[#125566]">
                Highest Drop-Off Point
              </CardTitle>
              <p className="text-sm text-gray-500">{highestDropOffChapter}</p>
            </CardHeader>
            <div className="p-6">
              <GaugeChart
                id="highest-drop-off"
                nrOfLevels={20}
                percent={highestDropOff / 100}
                colors={["#F44336", "#e0e0e0"]}
                arcWidth={0.3}
                textColor="#000"
              />
            </div>
          </div> */}
        </div>

        {/* Chapters Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1E4A5A]">
              Chapters List
            </h3>
            {/* <div className="space-x-2">
              <button className="px-4 py-2 bg-[#1E4A5A] text-white rounded">
                All Sections
              </button>
              <button className="px-4 py-2 bg-gray-200 text-[#1E4A5A] rounded">
                Section-A
              </button>
              <button className="px-4 py-2 bg-gray-200 text-[#1E4A5A] rounded">
                Section-B
              </button>
            </div> */}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-[#1E4A5A]">
                <th className="p-2 text-left">Chapters</th>
                <th className="p-2 text-left">Completion Rate</th>
                <th className="p-2 text-left">Participants</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    <div className="flex justify-center items-center">
                      <img
                        src={fertiwellLogo}
                        alt="Loading"
                        className="loading-spinner"
                        style={{ width: "80px", height: "80px" }}
                      />
                    </div>
                  </td>
                </tr>
              ) : chaptersData.length > 0 ? (
                chaptersData.map((chapter) => (
                  <tr key={chapter.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{chapter.name}</td>
                    <td className="p-2">{chapter.completionRate}%</td>
                    <td className="p-2">{chapter.completedCount}/{chapter.totalParticipants}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    No data available
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

export default Chapters;

import React from "react";
import Header from "@/components/layout/header";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import GaugeChart from "react-gauge-chart";

// Dummy data for chapters
const chaptersData = [
  { id: "123456", name: "Chapter 1: Calming the Mind...", status: "Completed", completionRate: "95%", participants: 148, avgTime: "20min", dropOff: "5%" },
  { id: "123457", name: "Chapter 2: Observing Progre...", status: "Active", completionRate: "70%", participants: 70, avgTime: "20min", dropOff: "13%" },
  { id: "123458", name: "Chapter 3: Calming the Mind...", status: "Active", completionRate: "95%", participants: 148, avgTime: "20min", dropOff: "13%" },
  { id: "123459", name: "Chapter 4: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123460", name: "Chapter 5: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123461", name: "Chapter 6: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123462", name: "Chapter 7: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123463", name: "Chapter 8: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123464", name: "Chapter 9: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123465", name: "Chapter 10: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123466", name: "Chapter 11: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123467", name: "Chapter 12: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123468", name: "Chapter 13: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123469", name: "Chapter 14: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123470", name: "Chapter 15: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123471", name: "Chapter 16: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123472", name: "Chapter 17: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123473", name: "Chapter 18: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123474", name: "Chapter 19: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123475", name: "Chapter 20: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123476", name: "Chapter 21: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123477", name: "Chapter 22: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123478", name: "Chapter 23: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123479", name: "Chapter 24: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123480", name: "Chapter 25: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123481", name: "Chapter 26: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123482", name: "Chapter 27: Calming the Mind...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
  { id: "123483", name: "Chapter 28: Observing Progre...", status: "Upcoming", completionRate: "0%", participants: 0, avgTime: "0min", dropOff: "0%" },
];

// Calculate stats
const calculateStats = () => {
  const totalChapters = chaptersData.length;
  const completed = chaptersData.filter((c) => c.status === "Completed").length;
  const active = chaptersData.filter((c) => c.status === "Active").length;
  const upcoming = totalChapters - completed - active;
  const overallProgress = ((completed / totalChapters) * 100).toFixed(0);
  const avgCompletionRate =
    chaptersData
      .filter((c) => c.status === "Active")
      .reduce((sum, c) => sum + parseInt(c.completionRate), 0) / active || 0;
  const highestDropOff = Math.max(
    ...chaptersData.map((c) => parseInt(c.dropOff) || 0)
  );
  const highestDropOffChapter =
    chaptersData.find((c) => parseInt(c.dropOff) === highestDropOff)?.name ||
    "";

  return {
    completed,
    active,
    upcoming,
    overallProgress,
    avgCompletionRate,
    highestDropOff,
    highestDropOffChapter,
  };
};

const Chapters: React.FC = () => {
  const {
    completed,
    active,
    upcoming,
    overallProgress,
    avgCompletionRate,
    highestDropOff,
    highestDropOffChapter,
  } = calculateStats();

  const data = [
    { name: "Completed", value: completed, color: "#4CAF50" },
    { name: "Active", value: active, color: "#9C27B0" },
    { name: "Upcoming", value: upcoming, color: "#FFCA28" },
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
                    {overallProgress}%
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
                percent={Math.round(avgCompletionRate) / 100}
                colors={["#4CAF50", "#e0e0e0"]}
                arcWidth={0.3}
                textColor="#000"
              />
            </div>
          </div>

          {/* ✅ Card 3: Highest Drop-Off Point */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
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
          </div>
        </div>

        {/* Chapters Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1E4A5A]">
              Chapters List
            </h3>
            <div className="space-x-2">
              <button className="px-4 py-2 bg-[#1E4A5A] text-white rounded">
                All Sections
              </button>
              <button className="px-4 py-2 bg-gray-200 text-[#1E4A5A] rounded">
                Section-A
              </button>
              <button className="px-4 py-2 bg-gray-200 text-[#1E4A5A] rounded">
                Section-B
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-[#1E4A5A]">
                <th className="p-2 text-left">Chapters</th>
                <th className="p-2 text-left">Password</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Completion Rate</th>
                <th className="p-2 text-left">Participants</th>
                <th className="p-2 text-left">Avg Time</th>
                <th className="p-2 text-left">Drop-off</th>
              </tr>
            </thead>
            <tbody>
              {chaptersData.map((chapter) => (
                <tr key={chapter.id} className="border-b">
                  <td className="p-2">{chapter.name}</td>
                  <td className="p-2">{chapter.id}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded ${
                        chapter.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : chapter.status === "Active"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {chapter.status}
                    </span>
                  </td>
                  <td className="p-2">{chapter.completionRate}</td>
                  <td className="p-2">{chapter.participants}</td>
                  <td className="p-2">{chapter.avgTime}</td>
                  <td className="p-2 text-red-500">{chapter.dropOff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Chapters;

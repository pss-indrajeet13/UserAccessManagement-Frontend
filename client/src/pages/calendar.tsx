// client/src/pages/calendar.tsx

import React from "react";
import Header from "@/components/layout/header"; // adjust if path differs

const Calendar: React.FC = () => {
  return (
    <div className="font-poppins bg-gray-100 min-h-screen">
      {/* Top Header */}
      <Header title="Calendar" subtitle="Manage your schedule and events" />

      {/* Main Content */}
      <main className="p-6 mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#125566]">Calendar</h1>
          <p className="text-base text-black mt-1">
            Manage your schedule and events
          </p>
        </div>

        {/* TODO: Add calendar UI or components here */}
      </main>
    </div>
  );
};

export default Calendar;

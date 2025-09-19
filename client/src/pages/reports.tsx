// client/src/pages/reports.tsx

import React from "react";
import Header from "@/components/layout/header"; // adjust path if necessary

const Reports: React.FC = () => {
  return (
    <div className="font-poppins bg-gray-100 min-h-screen">
      {/* Top Header */}
      <Header title="Reports & Analytics" subtitle="View program performance and participant insights" />

      {/* Main Content */}
      <main className="p-6 mx-auto max-w-7xl">
        {/* Page Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#125566]">Reports & Analytics</h1>
          <p className="text-base text-black mt-1">
            Track user trends and behaviors
          </p>
        </div>

        {/* TODO: Add charts, tables, or other analytics components here */}
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-600">Analytics and reporting tools coming soon...</p>
        </div>
      </main>
    </div>
  );
};

export default Reports;

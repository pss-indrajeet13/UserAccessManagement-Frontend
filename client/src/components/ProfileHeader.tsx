// // C:\PSS\UserAccessManager\client\src\components\ProfileHeader.tsx
// import React from "react";

// export default function ProfileHeader({
//   user,
//   onDeactivate,
//   onDelete,
//   onChat,
// }: {
//   user: any;
//   onDeactivate?: () => void;
//   onDelete?: () => void;
//   onChat?: () => void;
// }) {
//   return (
//     <>
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold">
//             {user?.fullName || user?.profile?.fullName || "Unknown User"}
//           </h1>
//           <p className="text-gray-500">
//             View Personal Information, Track History, Monitor Progress & Access Insights
//           </p>
//         </div>
//         <button className="bg-teal-600 text-white px-4 py-2 rounded-lg">Export</button>
//       </div>

//       <div className="bg-white rounded-xl shadow-md p-5 mb-6 flex justify-between items-center">
//         <div>
//           <h2 className="text-xl font-semibold" style={{ color: "#125566" }}>Admin Control</h2>
//           <p className="text-gray-500">Manage participant and control access</p>
//         </div>
//         <div className="flex gap-3">
//           <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg" onClick={onDeactivate}>Deactivate</button>
//           <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={onDelete}>Delete</button>
//           <button className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={onChat}>Chat</button>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
//           <div className="text-gray-500 text-sm">Current streaks</div>
//           <div className="text-2xl font-bold">{user?.streak || 0}</div>
//         </div>
//         <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
//           <div className="text-gray-500 text-sm">Program progress</div>
//           <div className="text-2xl font-bold">{`${user?.progress || 0}%`}</div>
//         </div>
//         <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
//           <div className="text-gray-500 text-sm">Avg Stress level</div>
//           <div className="text-2xl font-bold">3.2/5</div>
//         </div>
//         <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
//           <div className="text-gray-500 text-sm">Total listening</div>
//           <div className="text-2xl font-bold">8.5 hrs</div>
//         </div>
//       </div>
//     </>
//   );
// }


import React from "react";

export default function ProfileHeader({
  user,
  onDeactivate,
  onDelete,
  onChat,
}: {
  user: any;
  onDeactivate?: () => void;
  onDelete?: () => void;
  onChat?: () => void;
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {/* The backend now provides a fullName field directly.
                We check for it first, then fall back to other options. */}
            {user?.fullName || user?.userName || user?.profile?.fullName || "Unknown User"}
          </h1>
          <p className="text-gray-500">
            View Personal Information, Track History, Monitor Progress & Access Insights
          </p>
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg">Export</button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "#125566" }}>Admin Control</h2>
          <p className="text-gray-500">Manage participant and control access</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg" onClick={onDeactivate}>Deactivate</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={onDelete}>Delete</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={onChat}>Chat</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="text-gray-500 text-sm">Current streaks</div>
          <div className="text-2xl font-bold">{user?.streak || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="text-gray-500 text-sm">Program progress</div>
          <div className="text-2xl font-bold">{`${user?.progress || 0}%`}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="text-gray-500 text-sm">Avg Stress level</div>
          <div className="text-2xl font-bold">3.2/5</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="text-gray-500 text-sm">Total listening</div>
          <div className="text-2xl font-bold">8.5 hrs</div>
        </div>
      </div>
    </>
  );
}

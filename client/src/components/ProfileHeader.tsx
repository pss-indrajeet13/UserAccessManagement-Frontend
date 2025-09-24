// C:\PSS\UserAccessManager\client\src\components\ProfileHeader.tsx
import React from "react";

// Import the images
import ProgressIcon from '../Assets/Participant-header/progress.png';
import HeartIcon from '../Assets/Participant-header/heart.png';
import PlayIcon from '../Assets/Participant-header/play.png';
import YogaIcon from '../Assets/Participant-header/yoga.png'; // Import the new yoga icon

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
  const handleChatClick = () => {
    if (onChat) {
      onChat(); // Call the original onChat callback if provided
    }

    // Check multiple possible field names for phone number
    const phoneNumber = user?.sectionProfile?.phoneNumber || user?.phoneNumber || user?.contactNumber || user?.phone;
    if (phoneNumber) {
      // Ensure phone number is in international format, prepend + if not present
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const message = "Hello! I need to discuss your profile details.";
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      console.warn("Phone number not found in user object:", user);
      alert("Phone number not available for this user. Please check the user data or contact admin.");
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[#125566] text-2xl font-bold">
            {user?.fullName || user?.userName || user?.sectionProfile?.fullName || "Unknown User"}
          </h1>
          <p className="text-gray-500">
            View Personal Information, Track History, Monitor Progress & Access Insights
          </p>
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg">Export</button>
      </div>

      {/* Modified Admin Control section */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6 flex items-center justify-between">
        {/* Left side: Yoga Icon in a colored box */}
        <div className="flex items-center">
          <div className="p-3 mr-4 rounded-md" style={{ backgroundColor: "#125566" }}>
            <img src={YogaIcon} alt="Yoga" className="w-8 h-8" /> {/* Adjust size as needed */}
          </div>
          {/* Admin Control text */}
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "#125566" }}>Admin Control</h2>
            <p className="text-gray-500">Manage participant and control access</p>
          </div>
        </div>
        {/* Right side: Buttons */}
        <div className="flex gap-3">
          <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg" onClick={onDeactivate}>Deactivate</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={onDelete}>Delete</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={handleChatClick}>Chat</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="text-4xl font-bold" style={{ color: '#5FB3B3' }}>
                {`${user?.progress || 0}%`}
              </div>
              <div className="text-gray-500 text-sm mt-2">Program progress</div>
            </div>
            <img src={ProgressIcon} alt="Progress" className="w-10 h-10" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="text-4xl font-bold" style={{ color: '#EB5757' }}>3.2/5</div>
              <div className="text-gray-500 text-sm mt-2">Avg Stress level</div>
            </div>
            <img src={HeartIcon} alt="Stress" className="w-10 h-10" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="text-4xl font-bold" style={{ color: '#4C4CFF' }}>8.5 hrs</div>
              <div className="text-gray-500 text-sm mt-2">Total listening</div>
            </div>
            <img src={PlayIcon} alt="Listening" className="w-10 h-10" />
          </div>
        </div>
      </div>
    </>
  );
}
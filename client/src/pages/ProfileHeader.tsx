// C:\PSS\UserAccessManager\client\src\components\ProfileHeader.tsx
import React, { useState } from "react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useLocation } from "wouter"; // 👈 Use wouter's hook

// Import images
import ProgressIcon from '../Assets/Participant-header/progress.png';
import HeartIcon from '../Assets/Participant-header/heart.png';
import PlayIcon from '../Assets/Participant-header/play.png';
import YogaIcon from '../Assets/Participant-header/yoga.png';
import ConfirmModal from "./ConfirmModal";

export default function ProfileHeader({
  user,
  onDelete,
  onChat,
}: {
  user: any;
  onDelete?: (userId?: string) => void;
  onChat?: () => void;
}) {
  const [location, navigate] = useLocation(); // 👈 Use wouter's hook here
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add a state for user status, default to active
  const [isActive, setIsActive] = useState(user?.status === 'active');

  const handleToggleActive = async () => {
    if (!user?.uid) {
      alert("User UID missing – cannot toggle status.");
      return;
    }
    setLoading(true);
    try {
      const newStatus = isActive ? 'inactive' : 'active';
      await updateDoc(doc(db, "users", user.uid), {
        status: newStatus,
      });
      setIsActive(!isActive);
      alert(`User status updated to ${newStatus}.`);
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Failed to update user status. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = () => {
    if (onChat) onChat();

    const phoneNumber =
      user?.sectionProfile?.phoneNumber ||
      user?.phoneNumber ||
      user?.contactNumber ||
      user?.phone;

    if (phoneNumber) {
      const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
      const message = "Hello! I need to discuss your profile details.";
      window.open(`https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      alert("Phone number not available for this user.");
      console.warn("Phone number not found:", user);
    }
  };

  const handleDeleteClick = () => {
    if (!user?.uid) {
      alert("User UID missing – cannot delete.");
      return;
    }
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid));
      if (onDelete) onDelete(user.uid);
      navigate("/participants");
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setLoading(false);
      setModalOpen(false);
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

      <div className="bg-white rounded-xl shadow-md p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 mr-4 rounded-md" style={{ backgroundColor: "#125566" }}>
            <img src={YogaIcon} alt="Yoga" className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "#125566" }}>
              Admin Control
            </h2>
            <p className="text-gray-500">Manage participant and control access</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isActive ? (
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
              onClick={handleToggleActive}
            >
              Deactivate
            </button>
          ) : (
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
              onClick={handleToggleActive}
            >
              Activate
            </button>
          )}
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
            onClick={handleDeleteClick}
          >
            Delete
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
            onClick={handleChatClick}
          >
            Chat
          </button>
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

      <ConfirmModal
        open={modalOpen}
        title="Delete Participant"
        message="This action cannot be undone. Are you sure you want to delete this participant?"
        confirmLabel="Delete"
        danger={true}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </>
  );
}
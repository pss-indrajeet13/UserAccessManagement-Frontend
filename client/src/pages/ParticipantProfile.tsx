// C:\PSS\UserAccessManager\client\src\pages\ParticipantProfile.tsx
import { useEffect, useState } from "react";
import { FaHeart, FaClock } from "react-icons/fa";
import { useRoute, Switch, Route, Redirect } from "wouter";

// ✅ Import all necessary components
import ParticipantProfileTabs from "./ParticipantProfileTabs";
import OverviewContent from "./OverviewContent";
import JournalsContent from "./JournalsContent";
import PersonalDetailsContent from "./PersonalDetailsContent";
import ProfileHeader from "@/components/ProfileHeader";

// ✅ Reusable Confirmation Modal
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-white ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const ParticipantProfile = () => {
  // Get the uid from the route, and the current path to handle content switching
  const [match, params] = useRoute("/participants/:uid/:tab?");
  const uid = params?.uid;
  const tab = params?.tab;
  const [user, setUser] = useState<any>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"deactivate" | "delete" | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    fetch(`/api/user-profile?uid=${uid}&t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, [uid]);

  const handleConfirm = async () => {
    if (!uid || !modalType) return;
    setLoading(true);

    try {
      const url =
        modalType === "deactivate" ? "/api/deactivate-user" : "/api/delete-user";
      const method = modalType === "deactivate" ? "POST" : "DELETE";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      const data = await res.json();

      alert(data.message || "Action completed");

      if (modalType === "delete") {
        window.location.href = "/participants"; // redirect after delete
      }
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  if (!user || !uid) return <div className="p-8">Loading...</div>;

  return (
    <div className="bg-gray-100 min-h-screen font-poppins">
      <ParticipantProfileTabs />
      <div className="p-6">
        <ProfileHeader
          user={user}
          onDeactivate={() => { setModalType("deactivate"); setModalOpen(true); }}
          onDelete={() => { setModalType("delete"); setModalOpen(true); }}
          onChat={() => {}}
        />
        <Switch location={`/participants/${uid}/${tab || ''}`}>
          <Route path="/participants/:uid">
            <OverviewContent user={user} />
          </Route>
          <Route path="/participants/:uid/journals">
            <JournalsContent />
          </Route>
          <Route path="/participants/:uid/PersonalDetailsContent">
            <PersonalDetailsContent uid={uid} />
          </Route>
          <Route>
            <Redirect to={`/participants/${uid}`} />
          </Route>
        </Switch>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={modalOpen}
        title={
          modalType === "delete"
            ? "Delete Participant"
            : "Deactivate Participant"
        }
        message={
          modalType === "delete"
            ? "This action cannot be undone. Are you sure you want to delete this participant?"
            : "Deactivating will prevent the participant from logging in. Continue?"
        }
        confirmLabel={modalType === "delete" ? "Delete" : "Deactivate"}
        danger={modalType === "delete"}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </div>
  );
};

// Fix the syntax here
const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon?: any;
}) => (
  <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
    <div className="text-gray-500 text-sm">{label}</div>
    <div className="text-2xl font-bold flex items-center gap-2">
      {value} {icon}
    </div>
  </div>
);

export default ParticipantProfile;

// src/pages/OverviewContent.tsx
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { app as sharedApp, db as sharedDb, auth as sharedAuth } from "@/firebase";

// StatCard component with inline SVG icons for heart and clock.
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

// Reusable confirmation modal component.
const ConfirmModal = ({
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
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-gray-500 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-yellow-500 hover:bg-yellow-600"
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
};

// Main OverviewContent component.
const OverviewContent = ({ user, refreshUser }: { user: any, refreshUser?: () => void }) => {
  const [firebase, setFirebase] = useState<{ app: any; auth: any; db: any } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"deactivate" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingAccess, setUpdatingAccess] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);

  // Initialize state with explicit default false for IsSeg0Approved
  const [segmentAccess, setSegmentAccess] = useState({
    day0: Boolean(user?.IsSeg0Approved ?? false),
    day1_13: Boolean(user?.IsSeg1Approved ?? false),
    day14_28: Boolean((user?.IsSeg2Approved ?? false) || (user?.IsSeg3Approved ?? false)),
  });

  // Ensure Firebase app/auth/db are available and set once on mount
  useEffect(() => {
    const init = async () => {
      try {
        const apps = getApps();
        const appInstance = apps.length ? apps[0] : sharedApp;
        const authInstance = sharedAuth || getAuth(appInstance);
        const dbInstance = sharedDb || getFirestore(appInstance);
        setFirebase({ app: appInstance, auth: authInstance, db: dbInstance });
      } catch (error) {
        console.error("Firebase initialization error:", error);
      }
    };
    init();
  }, []);

  // Effect to update segmentAccess state whenever the user prop changes.
  useEffect(() => {
    if (user && user.uid) {
      setSegmentAccess({
        day0: Boolean(user.IsSeg0Approved ?? false),
        day1_13: Boolean(user.IsSeg1Approved ?? false),
        day14_28: Boolean((user.IsSeg2Approved ?? false) || (user.IsSeg3Approved ?? false)),
      });
      setComponentLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchActivityFlags = async () => {
      if (!firebase || !user?.uid) return;
      try {
        const userActivityRef = doc(firebase.db, 'userActivity', user.uid);
        const snap = await getDoc(userActivityRef);
        if (snap.exists()) {
          const data: any = snap.data();
          const seg0 = (data as any).segment0 || {};
          const seg1 = (data as any).segment1 || {};
          setSegmentAccess((prev) => ({
            ...prev,
            day0: typeof seg0.IsSeg0Approved === 'boolean' ? seg0.IsSeg0Approved : prev.day0,
            day1_13: typeof seg1.IsSeg1Approved === 'boolean' ? seg1.IsSeg1Approved : prev.day1_13,
          }));
        }
      } catch (err) {
        console.error('Failed to load userActivity segment approvals', err);
      }
    };
    fetchActivityFlags();
  }, [firebase, user?.uid]);

  // const handleConfirm = async () => {
  //   if (!user?.uid || !modalType) return;
  //   setLoading(true);

  //   try {
  //     const url = modalType === "deactivate" ? "/api/deactivate-user" : "/api/delete-user";
  //     const method = modalType === "deactivate" ? "POST" : "DELETE";

  //     const res = await fetch(url, {
  //       method,
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ uid: user.uid }),
  //     });

  //     const data = await res.json();
  //     console.log(data.message || "Action completed");

  //     if (modalType === "delete") {
  //       window.location.href = "/participants";
  //     }
  //   } catch (error) {
  //     console.error("Something went wrong.", error);
  //   } finally {
  //     setLoading(false);
  //     setModalOpen(false);
  //   }
  // };

  const handleUpdateAccess = async () => {
    if (!user?.uid || !firebase) {
      console.error("User or Firebase not found.");
      return;
    }

    setUpdatingAccess(true);
    try {
      const userDocRef = doc(firebase.db, 'users', user.uid);
      const updateData = {
        IsSeg0Approved: segmentAccess.day0,
        IsSeg1Approved: segmentAccess.day1_13,
        IsSeg2Approved: segmentAccess.day14_28,
        IsSeg3Approved: segmentAccess.day14_28,
      };
      await updateDoc(userDocRef, updateData);
      const userActivityRef = doc(firebase.db, 'userActivity', user.uid);
      try {
        await updateDoc(userActivityRef, {
          "segment0.IsSeg0Approved": Boolean(segmentAccess.day0),
          "segment1.IsSeg1Approved": Boolean(segmentAccess.day1_13),
        });
      } catch (e: any) {
        if (e?.code === 'not-found') {
          await setDoc(
            userActivityRef,
            {
              segment0: { IsSeg0Approved: Boolean(segmentAccess.day0) },
              segment1: { IsSeg1Approved: Boolean(segmentAccess.day1_13) },
            },
            { merge: true }
          );
        } else {
          throw e;
        }
      }
      console.log("Segment access updated successfully!");
      if (typeof refreshUser === 'function') {
        refreshUser();
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    } finally {
      setUpdatingAccess(false);
    }
  };

  const handleSegmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    let newState = { ...segmentAccess, [name]: checked } as typeof segmentAccess;

    if (checked) {
      if (name === 'day1_13' || name === 'day14_28') {
        newState.day0 = true;
      }
      if (name === 'day14_28') {
        newState.day1_13 = true;
      }
    } else {
      if (name === 'day0') {
        newState.day1_13 = false;
        newState.day14_28 = false;
      } else if (name === 'day1_13') {
        newState.day14_28 = false;
      }
    }
    setSegmentAccess(newState);
  };

  // This conditional rendering is the key to preventing the error
  if (!user || !user.uid) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-500">Loading user data...</p>
      </div>
    );
  }
  // Only render the full page if user data is available
  return (
    <>
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
          <h2 className="text-xl font-semibold" style={{ color: '#125566' }}>Segment Access Specefier</h2>
          <p className="text-gray-500 mb-4">Provide or revoke access to video segments.</p>
        </div>
        <div className="p-5 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="day0"
              name="day0"
              checked={segmentAccess.day0}
              onChange={handleSegmentChange}
              className="form-checkbox h-5 w-5 text-teal-600"
            />
            <label htmlFor="day0" className="text-gray-700">Day 0</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="day1_13"
              name="day1_13"
              checked={segmentAccess.day1_13}
              onChange={handleSegmentChange}
              className="form-checkbox h-5 w-5 text-teal-600"
            />
            <label htmlFor="day1_13" className="text-gray-700">Day 1 - 13</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="day14_28"
              name="day14_28"
              checked={segmentAccess.day14_28}
              onChange={handleSegmentChange}
              className="form-checkbox h-5 w-5 text-teal-600"
            />
            <label htmlFor="day14_28" className="text-gray-700">Day 14 - 28</label>
          </div>
          <button
            onClick={handleUpdateAccess}
            disabled={updatingAccess || componentLoading}
            className={`px-4 py-2 rounded-lg text-white ${updatingAccess || componentLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {updatingAccess ? "Updating..." : "Update Access"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
  <div className="bg-white rounded-xl shadow-md">
    <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
      <h2 className="font-semibold" style={{ color: '#125566' }}>Activity Heat-map (28 days)</h2>
      <p className="text-gray-500 mb-3">Daily completion status</p>
    </div>
    <div className="p-5 grid grid-cols-7 gap-2">
      {[...Array(28)].map((_, i) => (
        <div
          key={i}
          className="w-8 h-8 flex items-center justify-center text-xs rounded bg-gray-200"
        >
          {i + 1}
        </div>
      ))}
    </div>

    {/* Color Indicators */}
    <div className="p-5 flex justify-center space-x-4">
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-sm bg-[#125566]"></div>
        <span className="text-xs text-gray-600">Completed</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-sm bg-[#EB5757]"></div>
        <span className="text-xs text-gray-600">In Process</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
        <span className="text-xs text-gray-600">Not Started</span>
      </div>
    </div>
  </div>

  <div className="bg-white rounded-xl shadow-md">
    <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
      <h2 className="font-semibold" style={{ color: '#125566' }}>Stress Level Trends</h2>
      <p className="text-gray-500 mb-3">Weekly stress level progression</p>
    </div>
    <div className="p-5 flex gap-4 items-end h-40">
      {[3, 3.5, 0, 0].map((val, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <div
            className="bg-purple-400 w-8 rounded-t"
            style={{ height: `${val * 20}px` }}
          ></div>
          <span className="text-sm mt-1">Week {i + 1}</span>
        </div>
      ))}
    </div>
  </div>
</div>

      <div className="bg-white rounded-xl shadow-md">
        <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
          <h2 className="font-semibold" style={{ color: '#125566' }}>Program Activity</h2>
          <p className="text-gray-500 mb-3">Daily sessions completion status</p>
        </div>
        <table className="min-w-full text-sm p-5">
          <thead>
            <tr className="text-gray-700">
              <th className="px-3 py-2 text-left">Day</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Chapter</th>
              {/* <th className="px-3 py-2 text-left">Watch Time</th> */}
              <th className="px-3 py-2 text-left">Session Rate</th>
              <th className="px-3 py-2 text-left">Mood Rate</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(user.activities || []).map((act: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-3 py-2">{act.day}</td>
                <td className="px-3 py-2">{act.date}</td>
                <td className="px-3 py-2">{act.chapter}</td>
                {/* <td className="px-3 py-2">{act.watchTime}</td> */}
                <td className="px-3 py-2">{act.sessionRate}/5</td>
                <td className="px-3 py-2">{act.moodRate}/5</td>
                <td className="px-3 py-2">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                    {act.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* <ConfirmModal
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
        // onConfirm={handleConfirm}
        loading={loading}
      /> */}
    </>
  );
};

export default OverviewContent;
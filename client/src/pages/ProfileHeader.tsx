// C:\PSS\UserAccessManager\client\src\components\ProfileHeader.tsx
import React, { useState, useEffect } from "react";
import { doc, deleteDoc, updateDoc, getDoc, setDoc, getDocs, query as firestoreQuery, where, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useLocation } from "wouter";

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
  console.log('ProfileHeader received user prop:', user); // Debug: Check if prop updates
  const [location, navigate] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState<number | null>(null);

  // State to hold the current active status.
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Fetch progress from userActivity/{uid}/report subcollection
  useEffect(() => {
    let mounted = true;
    const loadProgress = async () => {
      try {
        const uid = user?.uid || user?.id;
        if (!uid) { if (mounted) setReportProgress(null); return; }
        const snaps = await getDocs(collection(db, 'userActivity', uid, 'report'));
        if (snaps.empty) { if (mounted) setReportProgress(null); return; }
        let best = snaps.docs[0];
        const toMs = (v: any) => (v?.toMillis ? v.toMillis() : (typeof v === 'string' || v instanceof Date) ? new Date(v).getTime() : 0);
        for (const d of snaps.docs) {
          const ca = (d.data() as any)?.createdAt ?? null;
          const bestCa = (best.data() as any)?.createdAt ?? null;
          if (toMs(ca) > toMs(bestCa)) best = d;
        }
        const dta = (best.data() as any);
        const prog = typeof dta?.progress === 'number' ? dta.progress : (typeof dta?.Progress === 'number' ? dta.Progress : undefined);
        if (mounted) setReportProgress(typeof prog === 'number' ? Math.max(0, Math.min(100, Math.round(prog))) : null);
      } catch {
        if (mounted) setReportProgress(null);
      }
    };
    loadProgress();
    return () => { mounted = false; };
  }, [user?.uid]);

  // Use useEffect to handle changes in the 'user' prop.
  useEffect(() => {
    console.log('useEffect triggered for user change'); // Debug: Confirm effect runs
    console.log('user in useEffect:', user); // Debug: Inspect user in effect
    console.log('user.hasOwnProperty("status"):', user?.hasOwnProperty('status')); // Debug: Check property existence
    console.log('user.status value:', user?.status, 'type:', typeof user?.status); // Debug: Check value and type
    let mounted = true;
    const safeSet = (v: boolean | null) => { if (mounted) setIsActive(v); };

    if (!user) {
      safeSet(null);
      return () => { mounted = false; };
    }

    // If this is the placeholder header object, defer resolving status
    if (user.fullName === 'Loading...') {
      console.log("Received placeholder user; deferring status resolution");
      safeSet(null);
      return () => { mounted = false; };
    }

    // If status exists on the incoming object, use it immediately
    if (typeof user.status !== 'undefined') {
      console.log("user.hasOwnProperty(\"status\"):", user.hasOwnProperty("status"));
      console.log("user.status value:", user.status, "type:", typeof user.status);
      safeSet(Boolean(user.status));
      return () => { mounted = false; };
    }

    // Otherwise try to resolve status from Firestore (uid first, then by email)
    (async () => {
      setLoadingStatus(true);
      try {
        const routeUidMatch = (location || '').match(/^\/?participants\/([^\/]+)/);
        const routeUid = routeUidMatch ? routeUidMatch[1] : undefined;
        const possibleUid = user?.uid || user?.id || routeUid;
        if (possibleUid) {
          const ref = doc(db, "users", possibleUid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            if (typeof data?.status !== "undefined") {
              safeSet(Boolean(data.status));
              return;
            }
          }
        }

        const usersCol = collection(db, "users");
        if (user?.email) {
          const q = firestoreQuery(usersCol, where("email", "==", user.email));
          const snaps = await getDocs(q);
          if (!snaps.empty) {
            const first = snaps.docs[0].data();
            safeSet(typeof first?.status !== "undefined" ? Boolean(first.status) : false);
            return;
          }
        }
        if (user?.fullName) {
          const q2 = firestoreQuery(usersCol, where("fullName", "==", user.fullName));
          const snaps2 = await getDocs(q2);
          if (!snaps2.empty) {
            const first = snaps2.docs[0].data();
            safeSet(typeof first?.status !== "undefined" ? Boolean(first.status) : false);
            return;
          }
        }

        // No status found anywhere -> leave as false (allow toggle to create it)
        safeSet(false);
      } catch (err) {
        console.warn("Failed to resolve status from Firestore:", err);
        // Keep null so UI knows resolution failed (e.g. Firestore not configured)
        safeSet(null);
      } finally {
        if (mounted) setLoadingStatus(false);
      }
    })();

    return () => { mounted = false; };
  }, [user]);

  const handleToggleActive = async () => {
    if (isActive === null) {
      console.warn("Status not ready; cannot toggle yet.");
      return;
    }

    const newStatus = !isActive;
    // optimistic UI
    setLoadingStatus(true);
    setIsActive(newStatus);

    try {
      // Determine uid: prefer explicit uid, else lookup by email
      let uidToUpdate = user?.uid || user?.id;
      if (!uidToUpdate && user?.email) {
        const usersCol = collection(db, "users");
        const q = firestoreQuery(usersCol, where("email", "==", user.email));
        const snaps = await getDocs(q);
        if (!snaps.empty) uidToUpdate = snaps.docs[0].id;
      }

      if (!uidToUpdate) {
        console.warn("Could not determine user UID to update status.");
        setIsActive(prev => !prev); // rollback optimistic change
        return;
      }

      const targetRef = doc(db, "users", uidToUpdate);
      const targetSnap = await getDoc(targetRef);
      if (targetSnap.exists()) {
        await updateDoc(targetRef, { status: newStatus });
      } else {
        await setDoc(targetRef, { status: newStatus, email: user?.email || null, fullName: user?.fullName || null }, { merge: true });
      }
      console.log("User status updated for uid:", uidToUpdate);
    } catch (err) {
      console.error("Error toggling user status:", err);
      // rollback optimistic change
      setIsActive(prev => !prev);
    } finally {
      setLoadingStatus(false);
    }
  };

  console.log('Current isActive state:', isActive); // Debug: Verify state updates

  // const handleToggleActive = async () => {
  //   // Determine uid from common locations in your user object
  //   const uid =
  //     user?.uid ||
  //     user?.sectionProfile?.uid ||
  //     user?.sectionProfile?.userId ||
  //     user?.id;

  //   if (!uid || isActive === null) {
  //     console.error("User UID missing or status is not yet loaded.");
  //     return;
  //   }

  //   const newStatus = !isActive;

  //   // Optimistic UI update
  //   setLoading(true);
  //   setIsActive(newStatus);

  //   try {
  //     // Try to find the user's document in common collections and update the first match.
  //     const collectionsToCheck = ["users", "userProfiles", "userActivity"];
  //     let updated = false;

  //     for (const col of collectionsToCheck) {
  //       const ref = doc(db, col, uid);
  //       const snap = await getDoc(ref);
  //       if (snap.exists()) {
  //         await updateDoc(ref, { status: newStatus });
  //         console.log(`Updated status in collection '${col}' for uid ${uid}`);
  //         updated = true;
  //         break;
  //       }
  //     }

  //     if (!updated) {
  //       // If not found, optionally create/update in the 'users' collection.
  //       const fallbackRef = doc(db, "users", uid);
  //       await updateDoc(fallbackRef, { status: newStatus }).catch(async (err) => {
  //         // If update failed because doc missing, create it
  //         console.warn("Fallback update failed, creating user doc in 'users' collection.", err);
  //         await setDoc(fallbackRef, { uid, status: newStatus }, { merge: true });
  //       });
  //       console.log(`Created/updated fallback 'users' doc for uid ${uid}`);
  //     }
  //   } catch (error) {
  //     console.error("Error toggling user status:", error);
  //     // Rollback optimistic update on error
  //     setIsActive((prev) => !newStatus);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleChatClick = () => {
    if (onChat) onChat();

    // Coalesce phone number sources
    const phoneNumber = user?.sectionProfile?.phoneNumber ||
      user?.phoneNumber ||
      user?.contactNumber ||
      user?.phone;

    if (phoneNumber) {
      const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
      const message = "Hello! I need to discuss your profile details.";
      window.open(`https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      console.warn("Phone number not available for this user.");
    }
  };

  const handleDeleteClick = () => {
    if (!user?.uid) {
      console.error("User UID missing – cannot delete.");
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
            {user?.fullName === "Error loading profile" ? "Participant Not Found" : user?.fullName || "Unknown User"}
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
          {/* Activation Toggle Button */}
          <button
            className={`text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${loading || isActive === null
              ? 'bg-gray-400'
              : isActive
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-green-500 hover:bg-green-600'
              }`}
            onClick={handleToggleActive}
            disabled={loading || isActive === null}
          >
            {loading ? 'Updating...' : isActive === null ? 'Loading...' : isActive ? 'Deactivate' : 'Activate'}
          </button>

          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDeleteClick}
            disabled={loading}
          >
            Delete
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleChatClick}
            disabled={loading}
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
                {`${reportProgress ?? user?.progress ?? 0}%`}
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

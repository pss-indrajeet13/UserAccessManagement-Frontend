// C:\PSS\UserAccessManager\client\src\components\ProfileHeader.tsx
import React, { useState, useEffect } from "react";
import { doc, deleteDoc, updateDoc, getDoc, setDoc, getDocs, query as firestoreQuery, where, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useLocation } from "wouter";
import jsPDF from 'jspdf'; // Add this import for PDF generation

// Import images
import ProgressIcon from '../Assets/Participant-header/progress.png';
import HeartIcon from '../Assets/Participant-header/heart.png';
import PlayIcon from '../Assets/Participant-header/play.png';
import YogaIcon from '../Assets/Participant-header/yoga.png';
import ConfirmModal from "./ConfirmModal";
import { toast } from "@/hooks/use-toast";
import { normalizeUserStatus } from "@/lib/utils";

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
  const [avgStress, setAvgStress] = useState<number | null>(null);
  const [listeningHours, setListeningHours] = useState<number | null>(null);

  // State to hold the current active status.
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // State to hold the fetched phone number from DB.
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

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

  // Derive Avg Stress and Total Listening from userActivity.progress
  useEffect(() => {
    let mounted = true;
    const mapRatingToNumber = (ratingText?: string): number => {
      const r = (ratingText || '').toLowerCase();
      switch (r) {
        case 'very good': return 5;
        case 'good': return 4;
        case 'okay': return 3;
        case 'bad': return 2;
        case 'very bad': return 1;
        default: return 0;
      }
    };
    const load = async () => {
      try {
        const uid = user?.uid || user?.id;
        if (!uid) { if (mounted) { setAvgStress(null); setListeningHours(null); } return; }
        const uaSnap = await getDoc(doc(db, 'userActivity', uid));
        if (!uaSnap.exists()) { if (mounted) { setAvgStress(null); setListeningHours(null); } return; }
        const data: any = uaSnap.data();
        const progress = data?.progress || {};
        const entries = Object.values(progress) as any[];
        const moods: number[] = entries.map(e => mapRatingToNumber(e?.rating2)).filter(n => n > 0);
        const avg = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length) : 0;
        const completed = entries.filter(e => String(e?.status || '').toLowerCase() === 'completed').length;
        const minutes = completed * 45;
        if (mounted) {
          setAvgStress(Number(avg.toFixed(1)));
          setListeningHours(Number((minutes / 60).toFixed(1)));
        }
      } catch {
        if (mounted) { setAvgStress(null); setListeningHours(null); }
      }
    };
    load();
    return () => { mounted = false; };
  }, [user?.uid]);

  // Use useEffect to handle changes in the 'user' prop.
  useEffect(() => {
    console.log('useEffect triggered for user change'); // Debug: Confirm effect runs
    console.log('user in useEffect:', user); // Debug: Inspect user in effect
    console.log('user.hasOwnProperty("userStatus"):', user?.hasOwnProperty('userStatus')); // Debug: Check property existence
    console.log('user.userStatus value:', user?.userStatus, 'type:', typeof user?.userStatus); // Debug: Check value and type
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

    // If userStatus exists on the incoming object, use it immediately
    if (typeof user.userStatus !== 'undefined') {
      console.log("user.hasOwnProperty(\"userStatus\"):", user.hasOwnProperty("userStatus"));
      console.log("user.userStatus value:", user.userStatus, "type:", typeof user.userStatus);
      safeSet(Boolean(user.userStatus));
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
            if (typeof data?.userStatus !== "undefined") {
              safeSet(Boolean(data.userStatus));
            }
            // Fetch and set phoneNumber if available
            if (data?.phoneNumber && mounted) {
              setPhoneNumber(data.phoneNumber);
            }
            return;
          }
        }

        const usersCol = collection(db, "users");
        if (user?.email) {
          const q = firestoreQuery(usersCol, where("email", "==", user.email));
          const snaps = await getDocs(q);
          if (!snaps.empty) {
            const first = snaps.docs[0].data();
            safeSet(typeof first?.userStatus !== "undefined" ? Boolean(first.userStatus) : false);
            // Fetch and set phoneNumber if available
            if (first?.phoneNumber && mounted) {
              setPhoneNumber(first.phoneNumber);
            }
            return;
          }
        }
        if (user?.fullName) {
          const q2 = firestoreQuery(usersCol, where("fullName", "==", user.fullName));
          const snaps2 = await getDocs(q2);
          if (!snaps2.empty) {
            const first = snaps2.docs[0].data();
            safeSet(typeof first?.userStatus !== "undefined" ? Boolean(first.userStatus) : false);
            // Fetch and set phoneNumber if available
            if (first?.phoneNumber && mounted) {
              setPhoneNumber(first.phoneNumber);
            }
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
        await updateDoc(targetRef, { userStatus: newStatus });
      } else {
        await setDoc(targetRef, { userStatus: newStatus, email: user?.email || null, fullName: user?.fullName || null }, { merge: true });
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

  const handleChatClick = () => {
    if (onChat) onChat();

    // Collect possible phone sources, now including fetched phoneNumber
    const rawPhone = user?.sectionProfile?.phoneNumber ||
      user?.phoneNumber ||
      phoneNumber ||
      user?.contactNumber ||
      user?.phone;

    if (!rawPhone) {
      toast({ title: "Phone missing", description: "No mobile number saved for this user." });
      return;
    }

    // Remove all non-digits; WhatsApp expects E.164 digits without '+'
    let digits = String(rawPhone).replace(/\D/g, "");

    // If number looks local (e.g., 10 digits) and a default country code is configured, prefix it
    const defaultCC = (import.meta.env.VITE_DEFAULT_WHATSAPP_CC || "").replace(/\D/g, "");
    if (digits.length <= 11 && defaultCC) {
      digits = `${defaultCC}${digits}`;
    }

    // Basic E.164 validation (10-15 digits after applying country code)
    if (digits.length < 10 || digits.length > 15) {
      toast({
        title: "Invalid phone number",
        description: "Save number in international format, e.g. +14155552671, or set VITE_DEFAULT_WHATSAPP_CC.",
      });
      return;
    }

    const message = "Hello! I need to discuss your profile details.";
    const url = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleExportClick = () => {
    if (!user?.fullName) {
      toast({ title: "User info missing", description: "Cannot export without user details." });
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(16);
    doc.text(`Participant Profile: ${user.fullName}`, 20, yPosition);
    yPosition += 15;

    // Basic Info
    doc.setFontSize(12);
    doc.text(`Email: ${user.email || 'N/A'}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Phone: ${phoneNumber || user?.phoneNumber || 'N/A'}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Status: ${isActive === null ? 'Loading...' : isActive ? 'Active' : 'Inactive'}`, 20, yPosition);
    yPosition += 15;

    // Progress Metrics
    doc.text('Progress Summary:', 20, yPosition);
    yPosition += 10;
    doc.text(`Program Progress: ${reportProgress ?? user?.progress ?? 0}%`, 20, yPosition);
    yPosition += 10;
    doc.text(`Average Stress Level: ${avgStress !== null ? `${avgStress}/5` : 'N/A'}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total Listening Hours: ${listeningHours !== null ? `${listeningHours} hrs` : 'N/A'}`, 20, yPosition);
    yPosition += 15;

    // Additional User Fields (if available)
    if (user?.sectionProfile) {
      doc.text('Section Profile Details:', 20, yPosition);
      yPosition += 10;
      // Add more fields as needed, e.g.,
      // doc.text(`Field: ${user.sectionProfile.someField}`, 20, yPosition);
      yPosition += 10;
    }

    // Generated Date
    const now = new Date();
    doc.text(`Generated on: ${now.toLocaleDateString()}`, 20, yPosition);

    // Save the PDF
    doc.save(`${user.fullName.replace(/\s+/g, '_')}_profile.pdf`);
    toast({ title: "Export Successful", description: "PDF downloaded." });
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
      const uid = user.uid;
      // Delete from allocated collections if present
      const maybeDelete = async (path: [string, string]) => {
        const ref = doc(db, path[0], path[1]);
        const snap = await getDoc(ref);
        if (snap.exists()) await deleteDoc(ref);
      };
      // Clean userActivity/report subcollection first
      const reportCol = collection(db, 'userActivity', uid, 'report');
      const reportSnaps = await getDocs(reportCol);
      await Promise.all(reportSnaps.docs.map(d => deleteDoc(d.ref)));
      await maybeDelete(['userActivity', uid]);

      // Other common allocations
      await maybeDelete(['userProfiles', uid]).catch(()=>{});
      await maybeDelete(['mobile_users', uid]).catch(()=>{});
      await maybeDelete(['activities', uid]).catch(()=>{});
      await maybeDelete(['notifications', uid]).catch(()=>{});

      // Finally, delete the primary users doc
      await deleteDoc(doc(db, "users", uid));
      if (onDelete) onDelete(uid);
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
        <button 
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExportClick}
          disabled={loading || !user?.fullName}
        >
          Export
        </button>
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
              <div className="text-4xl font-bold" style={{ color: '#EB5757' }}>{avgStress !== null ? `${avgStress}/5` : '0/5'}</div>
              <div className="text-gray-500 text-sm mt-2">Avg Stress level</div>
            </div>
            <img src={HeartIcon} alt="Stress" className="w-10 h-10" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="text-4xl font-bold" style={{ color: '#4C4CFF' }}>{listeningHours !== null ? `${listeningHours} hrs` : '0 hrs'}</div>
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
// src/pages/OverviewContent.tsx
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { app as sharedApp, db as sharedDb, auth as sharedAuth } from "@/firebase";
import { format } from "date-fns";
import { User } from 'firebase/auth';

// Interface for the progress data
interface ProgressData {
  createdAt: string;
  date: string;
  feedback?: string;
  rating1?: string;
  rating2?: string;
  status: string;
}

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
  const [progressActivities, setProgressActivities] = useState<[string, ProgressData][]>([]);
  const [displayedActivities, setDisplayedActivities] = useState<[string, ProgressData][]>([]);
  const [stressLevels, setStressLevels] = useState<number[]>([]);

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

  // Effect to fetch user activities and progress
  useEffect(() => {
    const fetchUserActivities = async () => {
      if (!firebase || !user?.uid) return;
      try {
        const userActivityRef = doc(firebase.db, 'userActivity', user.uid);
        const snap = await getDoc(userActivityRef);
        if (snap.exists()) {
          const data: any = snap.data();
          
          // Update segment access flags from userActivity
          const seg0 = data.segment0 || {};
          const seg1 = data.segment1 || {};
          setSegmentAccess((prev) => ({
            ...prev,
            day0: typeof seg0.IsSeg0Approved === 'boolean' ? seg0.IsSeg0Approved : prev.day0,
            day1_13: typeof seg1.IsSeg1Approved === 'boolean' ? seg1.IsSeg1Approved : prev.day1_13,
          }));

          // Fetch and sort progress data
          if (data.progress) {
            const sortedActivities = Object.entries(data.progress as { [key: string]: ProgressData }).sort((a, b) => {
              const dayA = parseInt(a[0].replace('day', ''));
              const dayB = parseInt(b[0].replace('day', ''));
              return dayA - dayB;
            });
            setProgressActivities(sortedActivities);
          }
        }
      } catch (err) {
        console.error('Failed to load userActivity data', err);
      }
    };
    fetchUserActivities();
  }, [firebase, user?.uid]);

// Effect to filter the list for display
useEffect(() => {
  const completedList: [string, ProgressData][] = [];
  let nextInProcess: [string, ProgressData] | null = null;
  let foundInProcess = false;

  progressActivities.forEach(activity => {
    // Add nullish coalescing to safely access 'status'
    const status = activity[1].status ?? ''; 
    
    // Now you can safely call toLowerCase()
    if (status.toLowerCase() === 'completed') {
      completedList.push(activity);
    } else if (status.toLowerCase() === 'inprogress' && !foundInProcess) {
      nextInProcess = activity;
      foundInProcess = true;
    }
  });

  if (nextInProcess) {
    setDisplayedActivities([...completedList, nextInProcess]);
  } else {
    setDisplayedActivities(completedList);
  }
}, [progressActivities]);

  // Helper function to map rating text to a number
  const mapRatingToNumber = (ratingText: string | undefined): number => {
    const lowerCaseRating = ratingText ? ratingText.toLowerCase() : '';
    switch (lowerCaseRating) {
      case 'very good':
        return 5;
      case 'good':
        return 4;
      case 'okay':
        return 3;
      case 'bad':
        return 2;
      case 'very bad':
        return 1;
      default:
        return 0; // Return 0 for 'N/A' or unrated
    }
  };

  // Effect to process stress level data for the chart
  useEffect(() => {
    const weeklyLevels: number[] = [];
    let currentWeekTotal = 0;
    let daysInWeek = 0;
  
    progressActivities.forEach(([, activity], index) => {
      // Use the helper function to get the numerical mood rating
      const moodRating = mapRatingToNumber(activity.rating2);
      currentWeekTotal += moodRating;
      daysInWeek++;
  
      // Check if it's the end of a week (7 days) or the last day
      if (daysInWeek === 7 || index === progressActivities.length - 1) {
        const averageRating = daysInWeek > 0 ? currentWeekTotal / daysInWeek : 0;
        weeklyLevels.push(averageRating);
        // Reset for the next week
        currentWeekTotal = 0;
        daysInWeek = 0;
      }
    });
  
    setStressLevels(weeklyLevels);
  }, [progressActivities]);

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

  const getDayNumber = (dayKey: string): string => {
    return dayKey.replace('day', '');
  };

  const getChapterNumber = (dayKey: string): string => {
    const day = parseInt(dayKey.replace('day', ''));
    return `Chapter ${day}`;
  };

  const getRating = (ratingValue: string | undefined): string => {
    if (!ratingValue) return '-';
    // Return the number from the mapping
    const numericalRating = mapRatingToNumber(ratingValue);
    return `${numericalRating}/5`;
  };

  const getStatusColor = (status: string): string => {
    const statusValue = (status ?? '').toLowerCase();
    switch (statusValue) {
      case 'completed':
        return 'bg-[#125566]';
      case 'inprogress':
        return 'bg-[#EB5757]';
      default:
        return 'bg-gray-200';
    }
  };
  
  const getHeatmapColor = (dayIndex: number): string => {
    const dayKey = `day${dayIndex}`;
    const activity = progressActivities.find(([key]) => key === dayKey);
    if (!activity) return 'bg-gray-200';
    const status = activity[1].status;
    return getStatusColor(status);
  };

  if (!user || !user.uid) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-500">Loading user data...</p>
      </div>
    );
  }

  // Define a color palette for the chart bars
  const barColors = ['bg-[#EB5757]', 'bg-purple-400', 'bg-blue-400', 'bg-teal-400'];

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
            {[...Array(29)].map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 flex items-center justify-center text-xs rounded ${getHeatmapColor(i)} text-white`}
              >
                {i}
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
          <div className="relative p-5 flex gap-4 items-end">
            {/* Y-axis labels and grid lines */}
            <div className="absolute left-0 bottom-0 top-0 text-gray-400 text-xs flex flex-col-reverse justify-between h-40 pb-2">
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="flex-1 flex items-end">
                  {level}
                </div>
              ))}
            </div>
            <div className="absolute left-6 right-0 bottom-0 top-8 border-l border-gray-300">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute w-full border-t border-gray-200" style={{ bottom: `${i * (100 / 5)}%` }}></div>
              ))}
            </div>

            <div className="flex-grow flex justify-around gap-4 z-10">
              {stressLevels.length > 0 ? (
                stressLevels.map((val, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <span className="text-sm font-semibold mb-1">{val.toFixed(1)}/5</span>
                    {/* Outer two-tone bar (full height) */}
                    <div className="w-10 rounded-t h-40 bg-gray-200 flex flex-col-reverse">
                      {/* Inner color bar (dynamic height) */}
                      <div
                        className={`w-full rounded-t ${barColors[i % barColors.length] || 'bg-gray-400'}`}
                        style={{ height: `${(val / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm mt-1">Week {i + 1}</span>
                  </div>
                ))
              ) : (
                <p className="absolute text-gray-500 text-center w-full top-1/2 -translate-y-1/2">No stress data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
          <h2 className="font-semibold" style={{ color: '#125566' }}>Program Activity</h2>
          <p className="text-gray-500 mb-3">Daily sessions completion status</p>
        </div>
        {displayedActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-700">
                  <th className="px-3 py-2 text-left">Day</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Chapter</th>
                  <th className="px-3 py-2 text-left">Session Rate</th>
                  <th className="px-3 py-2 text-left">Mood Rate</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedActivities.map(([dayKey, act], idx) => (
                  <tr key={dayKey} className="border-t">
                    <td className="px-3 py-2">{`Day ${getDayNumber(dayKey)}`}</td>
                    <td className="px-3 py-2">
                      {act.date ? format(new Date(act.date), 'MMM do, yyyy') : '-'}
                    </td>
                    <td className="px-3 py-2">{getChapterNumber(dayKey)}</td>
                    <td className="px-3 py-2">{getRating(act.rating1)}</td>
                    <td className="px-3 py-2">{getRating(act.rating2)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                          act.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 text-center text-gray-500">No activities found.</div>
        )}
      </div>
    </>
  );
};

export default OverviewContent;
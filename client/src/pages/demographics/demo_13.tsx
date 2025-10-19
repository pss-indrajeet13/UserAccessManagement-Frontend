// client/src/pages/demographics/demo_13.tsx
import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
// Assuming these component imports are available in your project structure
import ParticipantProfileTabs from '../ParticipantProfileTabs';
import ProfileHeader from '../ProfileHeader';

interface UserProfileData {
    fullName: string;
    progress: number;
}

// Define the type for a single question response, matching the data returned by the API
interface QuestionResponse {
    question: string;
    answer: string;
    questionNumber: number;
    timestamp: string;
}

// --- Reusable Section Component ---
// This component now only renders data if available, or renders nothing if data is empty,
// allowing the main component to handle the "all empty" case.
const QuestionnaireSection = ({ title, data }: { title: string, data: QuestionResponse[] | null }) => {
    // If data is null or empty array, return null so it doesn't render.
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold text-teal-600 mb-4 border-b pb-2">{title}</h3>
            <div className="space-y-6">
                {data
                    .sort((a, b) => a.questionNumber - b.questionNumber) // Sorts by question number
                    .map((item) => (
                        <div key={item.questionNumber} className="border-l-4 border-teal-200 pl-4 py-2 bg-gray-50 rounded-md">
                            <p className="text-gray-900 font-semibold mb-1">
                                <span className="text-teal-700 mr-2">Q{item.questionNumber}:</span> {item.question}
                            </p>
                            <p className="text-gray-700 ml-6">
                                <span className="font-bold text-gray-600">Answer:</span> {item.answer}
                            </p>
                        </div>
                    ))}
            </div>
        </div>
    );
};
// ---------------------------------

// --- Custom No Data Note Component ---
const NoDataNote = () => (
    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mt-8 rounded-lg shadow-md" role="alert">
        <div className="flex items-start">
            <svg className="h-5 w-5 mr-3 mt-1 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.321a.75.75 0 01.942 0l7.5 7.5a.75.75 0 01-1.06 1.06L10 5.811 3.864 12.381a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">Participant data has not been filled out.</p>
        </div>
    </div>
);
// ---------------------------------


const Day13Demographics: React.FC<{ uid?: string }> = ({ uid: propUid }) => {
    // Extracts the UID based on the '/participants/:uid/demographics/day-13' route
    const [, params] = useRoute("/participants/:uid/demographics/day-13");
    const routeUid = params?.uid;
    const uid = propUid ?? routeUid;

    const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
    const [sectionAData, setSectionAData] = useState<QuestionResponse[] | null>(null);
    const [sectionBData, setSectionBData] = useState<QuestionResponse[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Derived state to check if EITHER section has data
    const hasData = (sectionAData?.length || 0) > 0 || (sectionBData?.length || 0) > 0;

    // Determine the user's name for the header immediately
    const headerUser = userProfile
        ? userProfile
        : { fullName: loading ? "Loading..." : "Participant", progress: 0 };


    useEffect(() => {
        const fetchData = async () => {
            if (!uid) {
                setLoading(false);
                setError("User ID is not available.");
                return;
            }

            try {
                // Fetch user profile and questionnaire data in parallel
                const [profileRes, questionnaireRes] = await Promise.all([
                    fetch(`/api/user-profile/${uid}`),
                    fetch(`/api/user-profile/${uid}/day-13/questionnaire`),
                ]);

                // Handle profile response immediately
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData?.sectionProfile) {
                        setUserProfile({
                            fullName: profileData.sectionProfile.fullName || "N/A",
                            progress: 0,
                        });
                    }
                } else {
                    console.error("Failed to fetch user profile data.");
                    setUserProfile({ fullName: "Error loading profile", progress: 0 });
                }

                // Handle questionnaire response
                if (questionnaireRes.ok) {
                    const questionnaireData = await questionnaireRes.json();
                    setSectionAData(questionnaireData.sectionA || []);
                    setSectionBData(questionnaireData.sectionB || []);
                } else {
                    const errorBody = await questionnaireRes.json();

                    // Check for the specific error message from the backend when data is missing
                    const errorMessage = errorBody.error || "Failed to fetch questionnaire data.";

                    // **IMPROVED LOGIC:** If we get the "missing data" error from backend, set a specific state.
                    if (errorMessage.includes("Segment 2 questionnaire data is missing")) {
                        setError("DATA_NOT_FILLED");
                        setSectionAData([]);
                        setSectionBData([]);
                    } else {
                        // For all other errors (e.g., 500 server error), set the original error message
                        throw new Error(errorMessage);
                    }
                }


            } catch (e) {
                console.error("Error fetching data: ", e);
                setError(e instanceof Error ? e.message : "An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [uid]);

    return (
        <>
            <ParticipantProfileTabs />
            <div className="max-w-7xl mx-auto px-6 p-6">
                {/* Fix 2: Use the headerUser object to show name immediately */}
                <ProfileHeader user={{ ...headerUser, uid }} />

                <div className="mt-8">
                    {loading ? (
                        <div className="text-center text-xl text-gray-500 mt-8 animate-pulse">Loading Day 13 questionnaire data...</div>
                    ) : error && error === "DATA_NOT_FILLED" ? (
                        // SCENARIO 1: Back-end explicitly told us data is missing (replaces "Error Loading Data..." box)
                        <NoDataNote />
                    ) : error ? (
                        // SCENARIO 2: Genuine server error (e.g., 500 status or network failure)
                        <div className="text-red-600 p-4 bg-red-100 rounded-lg border border-red-300">
                            <p className="font-bold">Error Loading Data:</p>
                            <p>{error}</p>
                        </div>
                    ) : !hasData ? (
                        // SCENARIO 3: Back-end returned 200 OK with empty arrays ({sectionA: [], sectionB: []})
                        // This is also treated as "No Data Filled".
                        <NoDataNote />
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Section A Display - Only renders if data exists */}
                            <QuestionnaireSection
                                title="Compilation Scale (Section - A) - Day 13"
                                data={sectionAData}
                            />

                            {/* Section B Display - Only renders if data exists */}
                            <QuestionnaireSection
                                title="Compilation Scale (Section - B) - Day 13"
                                data={sectionBData}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Day13Demographics;

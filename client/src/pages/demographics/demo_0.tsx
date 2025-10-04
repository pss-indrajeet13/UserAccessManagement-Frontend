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

// --- Reusable Section Component ---
const QuestionnaireSection = ({ title, data }: { title: string, data: QuestionResponse[] | null }) => {
    // If data is null or empty array, return null to skip rendering the box.
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-teal-600 mb-4 border-b pb-2">{title}</h3>
            <div className="space-y-6">
                {data
                    .sort((a, b) => a.questionNumber - b.questionNumber)
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

const Day0Demographics: React.FC<{ uid?: string }> = ({ uid: propUid }) => {
    const [, params] = useRoute("/participants/:uid/demographics/day-0");
    const routeUid = params?.uid;
    const uid = propUid ?? routeUid;
    const SEGMENT_NAME = "Segment 1"; // Used for error checking

    const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
    const [sectionAData, setSectionAData] = useState<QuestionResponse[] | null>(null);
    const [sectionBData, setSectionBData] = useState<QuestionResponse[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Derived state to check if EITHER section has data
    const hasData = (sectionAData?.length || 0) > 0 || (sectionBData?.length || 0) > 0;

    // Object used for ProfileHeader to show the name immediately
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
                    fetch(`/api/user-profile/${uid}/day-0/questionnaire`),
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
                    // We set a temporary user profile so the header doesn't stay "Loading..." forever
                    setUserProfile({ fullName: "Error loading profile", progress: 0 });
                }

                // --- 2. Handle Questionnaire Response ---
                let questionnaireBody;
                try {
                    // Attempt to read body as JSON (our server always returns JSON)
                    questionnaireBody = await questionnaireRes.json();
                } catch (e) {
                    // If JSON parsing fails (e.g., empty 404 response), throw a generic error
                    throw new Error(`Invalid JSON response for questionnaire data (Status: ${questionnaireRes.status}).`);
                }
                
                if (questionnaireRes.ok) {
                    // SCENARIO 1: Success (200 OK): Data is present or we received empty arrays
                    setSectionAData(questionnaireBody.sectionA || []);
                    setSectionBData(questionnaireBody.sectionB || []);
                } else {
                    // SCENARIO 2: Failure (Non-200 Status, e.g., 404): Check if it's the specific "missing data" case
                    const errorMessage = questionnaireBody.error || `Server responded with status ${questionnaireRes.status}.`;
                    
                    // Check for the specific error string sent by the backend for missing data
                    if (errorMessage.includes(SEGMENT_NAME.replace(" ", " "))) { 
                        // If the backend confirmed the segment data is missing, set special state
                        setError("DATA_NOT_FILLED");
                        setSectionAData([]);
                        setSectionBData([]);
                    } else {
                        // For all other errors (true server errors or unexpected failures), throw the error
                        throw new Error(errorMessage);
                    }
                }

            } catch (e) {
                console.error("Error fetching data: ", e);
                // Set the error message unless we already decided it was a friendly "DATA_NOT_FILLED" state
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
                {/* Use the headerUser object and include uid for status resolution */}
                <ProfileHeader user={{ ...headerUser, uid }} />

                <div className="mt-8">
                    {loading ? (
                        <div className="text-center text-xl text-gray-500 mt-8 animate-pulse">Loading Day 0 questionnaire data...</div>
                    ) : error && error === "DATA_NOT_FILLED" || !hasData ? (
                        // If EITHER the explicit error state is set OR there is no data found after loading
                        <NoDataNote />
                    ) : error ? (
                        // SCENARIO: A genuine server error (e.g., 500 status or network failure)
                        <div className="text-red-600 p-4 bg-red-100 rounded-lg border border-red-300">
                            <p className="font-bold">Critical Error Loading Data:</p>
                            <p>{error}</p>
                        </div>
                    ) : (
                        // SCENARIO: Data is present and ready to display
                        <div className="grid md:grid-cols-2 gap-8">
                            <QuestionnaireSection
                                title="Compilation Scale (Section - A)"
                                data={sectionAData}
                            />
                            <QuestionnaireSection
                                title="Compilation Scale (Section - B)"
                                data={sectionBData}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Day0Demographics;

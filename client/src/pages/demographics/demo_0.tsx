// import React, { useState, useEffect } from 'react';
// import { useRoute } from 'wouter';
// import ParticipantProfileTabs from '../ParticipantProfileTabs';
// import ProfileHeader from '../ProfileHeader';

// interface QuestionAndAnswerProps {
//   question: string;
//   answer: string;
// }
// const QuestionAndAnswer: React.FC<QuestionAndAnswerProps> = ({ question, answer }) => (
//   <div className="py-4">
//     <div className="text-lg font-semibold text-gray-800 mb-2">{question}</div>
//     <div className="mt-1 text-gray-900 font-semibold">{answer}</div>
//     <div className="w-full h-px bg-gray-200 mt-4" />
//   </div>
// );

// interface QuestionData {
//   question: string;
//   answer: string;
//   questionNumber: number;
// }
// interface UserProfileData {
//   fullName: string;
//   progress: number;
// }

// const Day0Demographics = () => {
//   const [, params] = useRoute("/participants/:uid/demographics/day-0");
//   const uid = params?.uid;

//   const [sectionAData, setSectionAData] = useState<QuestionData[]>([]);
//   const [sectionBData, setSectionBData] = useState<QuestionData[]>([]);
//   const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!uid) {
//         setLoading(false);
//         setError("User ID is not available.");
//         return;
//       }
//       try {
//         const [profileRes, activityRes] = await Promise.all([
//           fetch(`/api/user-profile/${uid}`),
//           fetch(`/api/user-activity/${uid}`)
//         ]);
//         if (!profileRes.ok || !activityRes.ok) {
//           throw new Error("Failed to fetch data from one or more endpoints.");
//         }
//         const profileData = await profileRes.json();
//         const activityData = await activityRes.json();

//         if (profileData?.sectionProfile) {
//           setUserProfile({
//             fullName: profileData.sectionProfile.fullName || "N/A",
//             progress: 75 // Or use a real value if available
//           });
//         }
//         if (activityData?.segment1?.sectionA && Array.isArray(activityData.segment1.sectionA)) {
//           setSectionAData(activityData.segment1.sectionA.sort((a: any, b: any) => a.questionNumber - b.questionNumber));
//         }
//         if (activityData?.segment1?.sectionB && Array.isArray(activityData.segment1.sectionB)) {
//           setSectionBData(activityData.segment1.sectionB.sort((a: any, b: any) => a.questionNumber - b.questionNumber));
//         }
//       } catch (e) {
//         setError("Failed to load user and questionnaire data.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [uid]);

//   const renderSectionContent = (sectionData: QuestionData[]) => {
//     if (loading) return <p className="text-gray-700 text-center">Loading...</p>;
//     if (error) return <p className="text-red-500 text-center">{error}</p>;
//     if (sectionData.length === 0) return <p className="text-gray-500 text-center">No data available for this section.</p>;
//     return sectionData.map((item, index) => (
//       <QuestionAndAnswer key={index} question={item.question} answer={item.answer} />
//     ));
//   };

//   return (
//     <>
//       <ParticipantProfileTabs />
//       <div className="max-w-7xl mx-auto px-6 p-6">
//         <ProfileHeader user={userProfile || { fullName: "Loading...", progress: 0 }} />

//         {/* Section A */}
//         <div className="bg-white rounded-xl shadow-md mt-6">
//           <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
//             <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>
//               Compilation Scale (Section - A)
//             </h2>
//             <p className="text-gray-500">Baseline questionnaire response</p>
//           </div>
//           <div className="p-5">
//             {renderSectionContent(sectionAData)}
//           </div>
//         </div>

//         {/* Section B */}
//         <div className="bg-white rounded-xl shadow-md mt-6">
//           <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
//             <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>
//               Compilation Scale (Section - B)
//             </h2>
//             <p className="text-gray-500">Baseline questionnaire response</p>
//           </div>
//           <div className="p-5">
//             {renderSectionContent(sectionBData)}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Day0Demographics;


// src/pages/demographics/demo_0.tsx
import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter'; // Import useRoute
import ParticipantProfileTabs from '../ParticipantProfileTabs';
import ProfileHeader from '../ProfileHeader';

interface UserProfileData {
  fullName: string;
  progress: number;
}

const Day0Demographics = () => {
  const [, params] = useRoute("/participants/:uid/demographics/day-0");
  const uid = params?.uid;

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!uid) {
        setLoading(false);
        setError("User ID is not available.");
        return;
      }

      try {
        const [profileRes] = await Promise.all([
          fetch(`/api/user-profile/${uid}`)
        ]);
        
        if (!profileRes.ok) {
          throw new Error("Failed to fetch data from one or more endpoints.");
        }

        const profileData = await profileRes.json();
        
        // Set user profile data
        if (profileData?.sectionProfile) {
          setUserProfile({
            fullName: profileData.sectionProfile.fullName || "N/A",
            progress: 0 // This is still a fixed value.
          });
        }
      } catch (e) {
        console.error("Error fetching data: ", e);
        setError("Failed to load user and questionnaire data.");
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
        <ProfileHeader user={userProfile || { fullName: "Loading...", progress: 0 }} />
      </div>
    </>
  );
};

export default Day0Demographics;

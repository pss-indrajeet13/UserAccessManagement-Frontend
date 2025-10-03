import React, { useEffect, useState, useCallback } from 'react';
// FIX: Replaced file import with a placeholder image URL to resolve the build error.
import image1 from '../Assets/Personal-Details-Content/image1.png';

// Define a type for the dynamic keys in medical/lifestyle for better TypeScript safety
interface SectionData {
    [key: string]: any;
}

const PersonalDetailsContent = ({ uid }: { uid: string }) => {
  const [personalData, setPersonalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Removed error state as per request

  // Use useCallback to memoize the fetch function, preventing unnecessary re-creations
  const fetchPersonalData = useCallback(async () => {
    setLoading(true);

    if (!uid) {
      setLoading(false);
      // Even for UID error, we set personalData to null to display the unified message
      setPersonalData(null); 
      return;
    }

    try {
      const res = await fetch(`/api/user-profile/${uid}?t=${Date.now()}`, { cache: 'no-store' });
      
      if (!res.ok) {
        // If the server responds with an error (404, 500, etc.), treat it as missing data
        throw new Error(`Server status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Robust check for truly empty or missing profile data.
      const isDataEmpty = 
        !data || 
        (typeof data === 'object' && Object.keys(data).length === 0) || 
        !data.sectionProfile || 
        (typeof data.sectionProfile === 'object' && Object.keys(data.sectionProfile).length === 0);
      
      if (isDataEmpty) {
        setPersonalData(null);
      } else {
        setPersonalData(data);
      }

    } catch (e) {
      // If network fails or server error occurs, we still don't show an "error" message.
      // We just ensure personalData is null so the unified orange alert is shown.
      console.error("Fetch attempt failed or data missing: ", e);
      setPersonalData(null); 
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchPersonalData();
  }, [fetchPersonalData]);

  if (loading) {
    return <div className="p-8">Loading personal details...</div>;
  }

  // --- SINGLE MESSAGE BLOCK: Handles both missing user data AND API failures ---
  if (!personalData) { 
    return (
      <div className="p-0">
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md shadow-lg" role="alert">
          <div className="flex items-start">
            <svg className="h-5 w-5 mr-3 mt-1 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.321a.75.75 0 01.942 0l7.5 7.5a.75.75 0 01-1.06 1.06L10 5.811 3.864 12.381a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">Participant data has not been filled out.</p>
          </div>
        </div>
      </div>
    );
  }

  // Defined after the unified error check:
  const profile = personalData?.sectionProfile;
  const medicalHistory = personalData?.medicalHistory;
  const lifestylePsychosocialFactors = personalData?.lifestylePsychosocialFactors;

  // Define data arrays after ensuring personalData is available
  const personalInfoItems = [
    { label: "Full Name", value: profile?.fullName || "N/A" },
    { label: "Marital Status", value: profile?.maritalStatus || "N/A" },
    { label: "Contact Number", value: profile?.phoneNumber || "N/A", isLink: true, linkType: "tel" },
    
    // FIX: Updated to correctly pull 'duration' from Firebase and label it 'Duration Of Marriage'.
    { label: "Duration Of Marriage", value: profile?.duration ? `${profile.duration} Years` : 'N/A' },

    { label: "Email ID", value: profile?.email || "N/A", isLink: true, linkType: "mailto" },
    { label: "Education", value: profile?.education || "N/A" },
    { label: "Participant ID", value: profile?.participantId || "N/A" },
    { label: "Occupation", value: profile?.designation || "N/A" },
    { label: "Participant Age", value: profile?.age ? `${profile.age} Year Old` : 'N/A' },
    { label: "Family Type", value: profile?.familyType || "N/A" },
    { label: "Date Of Birth", value: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
    { label: "Monthly Family Income", value: profile?.incomeRange || "N/A" },
    { label: "Date Of Joining", value: profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
    { label: "Type of Residence", value: profile?.familyLocation || "N/A" },
  ];

  const medicalFields = [
    { key: 'typeOfInfertility', label: '• Type of Infertility' },
    { key: 'durationOfInfertility', label: '• Duration of Infertility (in years)' },
    { key: 'knownCauseOfInfertility', label: '• Known Cause of Infertility' },
    { key: 'ageAtMenarche', label: '• Age of Menarche' },
    { key: 'cycleRegularity', label: '• Cycle Regularity' },
    { key: 'averageCycleLength', label: '• Average Cycle Length' },
    { key: 'diagnosedDisorder', label: '• Diagnosed Disorder' },
    { key: 'diabetesShots', label: '• Diabetes Shots' },
    { key: 'hasSurgeries', label: '• Has Surgeries' },
    { key: 'iuiCycles', label: '• IUI Cycles' },
    { key: 'ivfCycles', label: '• IVF Cycles' },
    { key: 'pregnancyHistory', label: '• Pregnancy History' },
    { key: 'currentFertilityTreatments', label: '• Current Fertility Treatments' },
    { key: 'chronicIllnesses', label: '• Chronic Illnesses' },
    { key: 'otherIllnessDetails', label: '• Other Illness Details' },
    { key: 'otherTreatmentDetails', label: '• Other Treatment Details' },
    { key: 'surgeryDetails', label: '• Surgery Details' },
  ];

  const lifestyleFields = [
    { key: 'dietaryPreference', label: '• Dietary Preferences' },
    { key: 'bmi', label: '• Body Mass Index (BMI) if Known' },
    { key: 'exerciseRoutine', label: '• Exercise Routine' },
    { key: 'sleepHours', label: '• Sleep Duration (Avg) / Hours/Night' },
    { key: 'sleepQuality', label: '• Sleep Quality' },
    { key: 'tobaccoUse', label: '• Substance Use (Tobacco)' },
    { key: 'alcoholUse', label: '• Substance Use (Alcohol)' },
    { key: 'caffeineIntake', label: '• Caffeine Intake' },
    { key: 'selfRatedStressLevel', label: '• Self-Rated Stress Level' },
    { key: 'majorSourcesOfStress', label: '• Major Sources of Stress' },
    { key: 'supportSystem', label: '• Support System' },
    { key: 'psychologicalCounseling', label: '• Previous Psychological Counseling or Therapy (if Yes)' },
    { key: 'copingMechanisms', label: '• Coping Mechanisms' },
  ];

  const renderValue = (key: string, value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || 'N/A';
  };

  return (
    <>
      {/* Personal Information Card */}
      <div className="bg-white rounded-xl shadow-md mt-6">
        <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
          <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Personal Information</h2>
          <p className="text-gray-500 mb-4">Participants account identity record</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {personalInfoItems.map((item, index) => (
            <div key={index} className="flex flex-col">
              <div className="flex items-center text-gray-500 text-sm font-medium">
                <span className="mr-2">•</span>{item.label}
              </div>
              <div className="mt-1 text-gray-900 font-semibold">
                {item.isLink ? (
                  <a href={`${item.linkType}:${item.value}`} className="text-blue-600 hover:underline">
                    {item.value}
                  </a>
                ) : (
                  item.value
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Reproductive & Medical History Card */}
        <div className="bg-white rounded-xl shadow-md w-full md:w-1/2">
          <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
            <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Reproductive & Medical History</h2>
            <p className="text-gray-500 mb-4">Baseline questionnaire</p>
          </div>
          <div className="p-5 grid grid-cols-1 gap-2">
            {medicalFields.map((field) => (
              <div key={field.key} className="flex flex-col">
                <label className="text-gray-500 text-sm font-medium">{field.label}</label>
                <p className="mt-1 text-gray-900 font-semibold">
                  {renderValue(field.key, (medicalHistory as SectionData)?.[field.key])}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Lifestyle & Psychosocial Factors Card */}
        <div className="bg-white rounded-xl shadow-md w-full md:w-1/2">
          <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
            <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Lifestyle & Psychosocial Factors</h2>
            <p className="text-gray-500 mb-4">Baseline questionnaire</p>
          </div>
          <div className="p-5 grid grid-cols-1 gap-2">
            {lifestyleFields.map((field) => (
              <div key={field.key} className="flex flex-col">
                <label className="text-gray-500 text-sm font-medium">{field.label}</label>
                <p className="mt-1 text-gray-900 font-semibold">
                  {renderValue(field.key, (lifestylePsychosocialFactors as SectionData)?.[field.key])}
                </p>
              </div>
            ))}
          </div>
          {/* Static informational box */}
          <div className="bg-blue-100 rounded-md p-4 mt-4 mx-5 mb-5 flex items-center gap-4">
            <img src={image1} alt="Mindful" className="w-16 h-16" />
            <p className="text-sm text-blue-800">Bring a gentle of mindful to your day with 10 minutes gentle yoga to your day. Small steps can make a big difference.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonalDetailsContent;
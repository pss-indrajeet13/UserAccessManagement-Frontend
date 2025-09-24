// C:\PSS\UserAccessManager\client\src\components\PersonalDetailsContent.tsx
import React, { useEffect, useState } from 'react';
import image1 from '../Assets/Personal-Details-Content/image1.png';

const PersonalDetailsContent = ({ uid }: { uid: string }) => {
  const [personalData, setPersonalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonalData = async () => {
      if (!uid) {
        setLoading(false);
        setError("User ID is not available.");
        return;
      }

      try {
        let res = await fetch(`/api/user-profile/${uid}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.status === 304) {
          res = await fetch(`/api/user-profile/${uid}?t=${Date.now()}`, { cache: 'no-store' });
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPersonalData(data);
      } catch (e) {
        console.error("Error fetching document: ", e);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalData();
  }, [uid]);

  if (loading) {
    return <div className="p-8">Loading personal details...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  const profile = personalData?.sectionProfile;
  const medicalHistory = personalData?.medicalHistory;
  const lifestylePsychosocialFactors = personalData?.lifestylePsychosocialFactors;

  if (!personalData) {
    return <div className="p-8 text-gray-500">No data available.</div>;
  }

  // This array will hold the structured data for easy rendering
  const personalInfoItems = [
    { label: "Full Name", value: profile?.fullName || "N/A" },
    { label: "Marital Status", value: profile?.maritalStatus || "N/A" },
    { label: "Contact Number", value: profile?.phoneNumber || "N/A", isLink: true, linkType: "tel" },
    { label: "Duration Of Marriage", value: profile?.durationOfMarriage || "N/A" },
    { label: "Email ID", value: profile?.email || "N/A", isLink: true, linkType: "mailto" },
    { label: "Education", value: profile?.education || "N/A" },
    { label: "Participant ID", value: profile?.participantId || "N/A" },
    { label: "Occupation", value: profile?.designation || "N/A" },
    { label: "Participant Age", value: profile?.age ? `${profile.age} Year Old` : 'N/A' },
    { label: "Family Type", value: profile?.familyType || "N/A" },
    { label: "Date Of Birth", value: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
    { label: "Monthly Family Income", value: profile?.incomeRange || "N/A" },
    { label: "Date Of Joining", value: profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
    { label: "Type of Residence", value: profile?.residenceType || "N/A" },
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
      <div className="bg-white rounded-xl shadow-md mt-6">
        <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
          <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Personal Information</h2>
          <p className="text-gray-500 mb-4">Participants account identity record</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4">
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
                  {renderValue(field.key, medicalHistory?.[field.key])}
                </p>
              </div>
            ))}
          </div>
        </div>
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
                  {renderValue(field.key, lifestylePsychosocialFactors?.[field.key])}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-blue-100 rounded-md p-4 mt-4 flex items-center gap-4">
            <img src={image1} alt="Mindful" className="w-16 h-16" />
            <p>Bring a gentle of mindful to your day with 10 minutes gentle yoga to your day. Small steps can make a big difference.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonalDetailsContent;
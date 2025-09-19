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

  const medicalFields = [
    { key: 'typeOfInfertility', label: 'Type of Infertility' },
    { key: 'durationOfInfertility', label: 'Duration of Infertility (in years)' },
    { key: 'knownCauseOfInfertility', label: 'Known Cause of Infertility' },
    { key: 'ageAtMenarche', label: 'Age of Menarche' },
    { key: 'cycleRegularity', label: 'Cycle Regularity' },
    { key: 'averageCycleLength', label: 'Average Cycle Length' },
    { key: 'diagnosedDisorder', label: 'Diagnosed Disorder' },
    { key: 'diabetesShots', label: 'Diabetes Shots' },
    { key: 'hasSurgeries', label: 'Has Surgeries' },
    { key: 'iuiCycles', label: 'IUI Cycles' },
    { key: 'ivfCycles', label: 'IVF Cycles' },
    { key: 'pregnancyHistory', label: 'Pregnancy History' },
    { key: 'currentFertilityTreatments', label: 'Current Fertility Treatments' },
    { key: 'chronicIllnesses', label: 'Chronic Illnesses' },
    { key: 'otherIllnessDetails', label: 'Other Illness Details' },
    { key: 'otherTreatmentDetails', label: 'Other Treatment Details' },
    { key: 'surgeryDetails', label: 'Surgery Details' },
  ];

  const lifestyleFields = [
    { key: 'dietaryPreference', label: 'Dietary Preferences' },
    { key: 'bmi', label: 'Body Mass Index (BMI) if Known' },
    { key: 'exerciseRoutine', label: 'Exercise Routine' },
    { key: 'sleepHours', label: 'Sleep Duration (Avg) / Hours/Night' },
    { key: 'sleepQuality', label: 'Sleep Quality' },
    { key: 'tobaccoUse', label: 'Substance Use (Tobacco)' },
    { key: 'alcoholUse', label: 'Substance Use (Alcohol)' },
    { key: 'caffeineIntake', label: 'Caffeine Intake' },
    { key: 'selfRatedStressLevel', label: 'Self-Rated Stress Level' },
    { key: 'majorSourcesOfStress', label: 'Major Sources of Stress' },
    { key: 'supportSystem', label: 'Support System' },
    { key: 'psychologicalCounseling', label: 'Previous Psychological Counseling or Therapy (if Yes)' },
    { key: 'copingMechanisms', label: 'Coping Mechanisms' },
  ];

  const renderValue = (key: string, value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || 'N/A';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-5 mt-6">
        <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Personal Details</h2>
        <p className="text-gray-500 mb-4">View and edit personal and contact information.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Full Name</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.fullName}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Email Address</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.email}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Contact Number</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.phoneNumber}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Participant ID</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.participantId}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Date of Birth</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.dateOfBirth?.split('T')[0]}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Date of Joining</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.dateOfJoining?.split('T')[0]}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Age</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.age}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Education</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.education}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Marital Status</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.maritalStatus}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Family Type</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.familyType}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Monthly Family Income</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.incomeRange}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 text-sm font-medium">Designation</label>
            <p className="mt-1 text-gray-900 font-semibold">{profile?.designation}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-md p-5 w-full md:w-1/2">
          <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Reproductive & Medical History</h2>
          <p className="text-gray-500 mb-4">Baseline questionnaire</p>
          <div className="grid grid-cols-1 gap-2">
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
        <div className="bg-white rounded-xl shadow-md p-5 w-full md:w-1/2">
          <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Lifestyle & Psychosocial Factors</h2>
          <p className="text-gray-500 mb-4">Baseline questionnaire</p>
          <div className="grid grid-cols-1 gap-2">
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
// C:\PSS\UserAccessManager\client\src\pages\PersonalDetailsContent.tsx

import React, { useEffect, useState } from 'react';

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
        // Prefer the userActivity route
        let res = await fetch(`/api/user-profile/${uid}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.status === 304) {
          res = await fetch(`/api/user-profile/${uid}?t=${Date.now()}`, { cache: 'no-store' });
        }
        if (res.status === 404) {
          // Fallback to the other route returning combined user
          res = await fetch(`/api/user-profile?uid=${uid}&t=${Date.now()}`, { cache: 'no-store' });
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
  
  // Prefer nested sectionProfile under segment0, fallback to top-level
  const profile = personalData?.segment0?.sectionProfile || personalData?.sectionProfile;

  if (!personalData) {
    return <div className="p-8 text-gray-500">No data available.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-5 mt-6">
      <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Personal Details</h2>
      <p className="text-gray-500 mb-4">View and edit personal and contact information.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Full Name</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.name || personalData?.name || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Email Address</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.email || personalData?.email || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Contact Number</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.contactNumber || personalData?.contactNumber || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Participant ID</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.participantId || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Date of Birth</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.dateOfBirth?.split('T')[0] || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Date of Joining</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.dateOfJoining?.split('T')[0] || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Age</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.age || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Education</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.education || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Marital Status</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.maritalStatus || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Family Type</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.familyType || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Monthly Family Income</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.incomeRange || 'N/A'}</p>
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm font-medium">Designation</label>
          <p className="mt-1 text-gray-900 font-semibold">{profile?.designation || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsContent;

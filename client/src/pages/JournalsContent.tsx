import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ParticipantProfileTabs from './ParticipantProfileTabs';
import ProfileHeader from './ProfileHeader';

const mockJournals = [
  {
    id: 1,
    date: "2025-08-25",
    title: "Chapter 1",
    entry: "Feeling much more centered after today’s meditation. The breathing exercises really helped.",
    rating: 3,
    isPlaying: true,
  },
  {
    id: 2,
    date: "2025-08-25",
    title: "Chapter 2",
    entry: "Feeling much more centered after today’s meditation. The breathing exercises really helped.",
    rating: 3,
    isPlaying: false,
  },
  {
    id: 3,
    date: "2025-08-25",
    title: "Chapter 3",
    entry: "Feeling much more centered after today’s meditation. The breathing exercises really helped.",
    rating: 3,
    isPlaying: false,
  },
];

type Participant = {
  fullName: string;
  progress?: number;
  // Add other fields as needed
};

const JournalsContent = () => {
  const [, params] = useRoute("/participants/:uid/journals");
  const uid = params?.uid;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getDoc(doc(db, "users", uid))
      .then((docSnap) => {
        if (docSnap.exists()) {
          setParticipant(docSnap.data() as Participant);
        }
      })
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) return <div>Loading...</div>;
  if (!participant) return <div>User not found.</div>;

  return (
    <>
      <ParticipantProfileTabs />
      <div className="max-w-7xl mx-auto px-6 p-6">
        <ProfileHeader user={participant} />
        <div className="bg-white rounded-xl shadow-md p-5 mt-6">
          <div className="p-5 pb-2 border-b" style={{ borderColor: "#125566" }}>
            <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Journal Entries</h2>
            <p className="text-gray-500 mb-4">Daily reflections with AI powered insights</p>
          </div>
          <div className="space-y-8">
            {mockJournals.map((journal) => (
              <div key={journal.id} className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-lg text-[#125566]">{journal.title} <span className="font-normal text-gray-500 text-base">– {new Date(journal.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <svg key={i} className={`w-5 h-5 ${i <= journal.rating ? 'text-[#125566]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <polygon points="10,1 12.59,7.36 19.51,7.36 13.97,11.63 16.56,17.99 10,13.72 3.44,17.99 6.03,11.63 0.49,7.36 7.41,7.36" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="text-gray-700 mb-3">{journal.entry}</div>
                <div className="bg-gray-100 rounded-lg p-3 flex items-center">
                  <button className="mr-3 text-[#125566] focus:outline-none">
                    {journal.isPlaying ? (
                      // Pause icon
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" fill="#125566" />
                        <rect x="14" y="5" width="4" height="14" rx="1" fill="#125566" />
                      </svg>
                    ) : (
                      // Play icon
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <polygon points="6,4 20,12 6,20" fill="#125566" />
                      </svg>
                    )}
                  </button>
                  {/* Placeholder for waveform */}
                  <div className="flex-1 h-10 bg-gray-200 rounded overflow-hidden flex items-center">
                    <svg height="40" width="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke={journal.isPlaying ? "#E57373" : "#B0BEC5"}
                        strokeWidth="3"
                        points="0,20 10,10 20,30 30,15 40,25 50,10 60,30 70,15 80,25 90,10 100,30 110,15 120,25 130,10 140,30 150,15 160,25 170,10 180,30 190,15 200,25"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default JournalsContent;
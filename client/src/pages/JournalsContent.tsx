import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import ParticipantProfileTabs from './ParticipantProfileTabs';
import ProfileHeader from './ProfileHeader';

// The type for a single journal entry, including the audio URL
interface Journal {
  id: string; // Document ID
  date: string; // ISO date string or similar
  title: string;
  entry: string;
  rating: number;
  audioUrl?: string; // Add a field for the audio URL
  audioFileName?: string; // The file name in Storage
}

// A more complete Participant type
type Participant = {
  fullName: string;
  // ... other fields
};

const JournalsContent = () => {
  const [, params] = useRoute("/participants/:uid/journals");
  const uid = params?.uid;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null); // Use a ref to control the audio element

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const fetchJournals = async () => {
      setLoading(true);
      try {
        // 1. Fetch participant data
        const participantDocRef = doc(db, "users", uid);
        const participantDoc = await getDoc(participantDocRef);
        if (participantDoc.exists()) {
          setParticipant(participantDoc.data() as Participant);
        } else {
          setParticipant(null);
          setLoading(false);
          return;
        }

        // 2. Fetch journal entries for the user from Firestore
        const journalsRef = collection(db, `users/${uid}/journals`);
        const q = query(journalsRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);

        const fetchedJournals: Journal[] = [];
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const journalData: Journal = {
            id: doc.id,
            date: data.date,
            title: data.title,
            entry: data.entry,
            rating: data.rating,
            audioFileName: data.audioFileName, // Assuming this field exists in your Firestore documents
          };

          // 3. Get the audio download URL from Firebase Storage
           if (journalData.audioFileName) {
            // Try common storage paths (with uid folder first, then root folder)
            const possiblePaths = [
              `audio_feedback/${uid}/${journalData.audioFileName}`,
              `audio_feedback/${journalData.audioFileName}`,
            ];

            let resolvedUrl: string | undefined;
            for (const p of possiblePaths) {
              const audioStorageRef = ref(storage, p);
              try {
                const url = await getDownloadURL(audioStorageRef);
                resolvedUrl = url;
                console.log(`Found audio at storage path: ${p}`);
                break;
              } catch (err) {
                // Not found at this path - continue to next
                console.warn(`Audio not found at storage path: ${p}`, err);
              }
            }

            if (resolvedUrl) {
              journalData.audioUrl = resolvedUrl;
            } else {
              console.warn(`Audio file "${journalData.audioFileName}" not found in storage (checked ${possiblePaths.length} paths).`);
            }
          }

          fetchedJournals.push(journalData);
        }
        setJournals(fetchedJournals);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, [uid]);

  const handlePlayPause = (journalId: string, audioUrl?: string) => {
    if (!audioUrl) {
      console.warn("No audio file found for this journal entry.");
      return;
    }
    if (audioRef.current && playingAudio === journalId) {
      audioRef.current.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause(); // Stop any currently playing audio
      }
      setPlayingAudio(journalId);
    }
  };

  // Effect to handle audio playback
  useEffect(() => {
    if (playingAudio && audioRef.current) {
      const selectedJournal = journals.find(j => j.id === playingAudio);
      if (selectedJournal?.audioUrl) {
        audioRef.current.src = selectedJournal.audioUrl;
        audioRef.current.play();
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [playingAudio, journals]);

  if (loading) return <div>Loading...</div>;
  if (!participant) return <div>User not found.</div>;

  return (
    <>
      <ParticipantProfileTabs />
      <div className="max-w-7xl mx-auto px-6 p-6">
        <ProfileHeader user={participant} />
        <div className="bg-white rounded-xl shadow-md p-5 mt-6">
          <div className="pb-2 border-b" style={{ borderColor: "#125566" }}>
            <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Journal Entries</h2>
            <p className="text-gray-500 mb-4">Daily reflections with AI powered insights</p>
          </div>
          <div className="space-y-8">
            {journals.length > 0 ? (
              journals.map((journal) => (
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
                    <button
                      className="mr-3 text-[#125566] focus:outline-none"
                      onClick={() => handlePlayPause(journal.id, journal.audioUrl)}
                      disabled={!journal.audioUrl}
                    >
                      {playingAudio === journal.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="6" y="5" width="4" height="14" rx="1" fill="#125566" />
                          <rect x="14" y="5" width="4" height="14" rx="1" fill="#125566" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polygon points="6,4 20,12 6,20" fill="#125566" />
                        </svg>
                      )}
                    </button>
                    {/* Placeholder for waveform */}
                    <div className="flex-1 h-10 rounded overflow-hidden flex items-center">
                      {journal.audioUrl ? (
                        <audio
                          src={journal.audioUrl}
                          controls
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="flex-1 h-10 bg-gray-200 rounded overflow-hidden flex items-center">
                          <p className="text-gray-500 text-sm p-2">
                            No audio feedback found
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">No journal entries found for this user.</div>
            )}
          </div>
        </div>
      </div>
      {/* Hidden audio element to control playback */}
      <audio ref={audioRef} onPause={() => setPlayingAudio(null)} onEnded={() => setPlayingAudio(null)} />
    </>
  );
};

export default JournalsContent;
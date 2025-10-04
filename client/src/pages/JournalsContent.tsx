import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
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
  const [audioFiles, setAudioFiles] = useState<{ name: string; url: string; path: string }[]>([]);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);

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

  // Auto-link audio files to journals by filename or day number
  useEffect(() => {
    if (!journals.length || !audioFiles.length) return;
    setJournals((prev) =>
      prev.map((j) => {
        if (j.audioUrl) return j;
        const byName = j.audioFileName
          ? audioFiles.find((f) => f.name.toLowerCase() === j.audioFileName!.toLowerCase() || f.path.toLowerCase().endsWith(`/${j.audioFileName!.toLowerCase()}`))
          : undefined;
        if (byName) return { ...j, audioUrl: byName.url };
        const m = (j.title || '').match(/(day\s*)?(\d+)/i);
        if (m) {
          const day = parseInt(m[2], 10);
          const rx = new RegExp(`day\s*${day}[_\-]`, 'i');
          const byDay = audioFiles.find((f) => rx.test(f.name) || rx.test(f.path));
          if (byDay) return { ...j, audioUrl: byDay.url };
        }
        return j;
      })
    );
  }, [audioFiles, journals.length]);

  // Fetch audio feedback files for this user
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!uid) {
        setAudioFiles([]);
        return;
      }
      setAudioLoading(true);
      try {
        // First try 'audio_feedback/{uid}/'
        const userFolderRef = ref(storage, `audio_feedback/${uid}`);
        let items: any[] = [];
        try {
          const res = await listAll(userFolderRef);
          items = res.items;
        } catch (e) {
          console.warn("Error listing user audio folder:", e);
        }

        if (!items || items.length === 0) {
          const rootRef = ref(storage, "audio_feedback");
          try {
            const res = await listAll(rootRef);
            items = res.items;
          } catch (e) {
            console.warn("Error listing root audio_feedback:", e);
          }
        }

        const fetched = await Promise.all(
          (items || []).map(async (itemRef: any) => ({
            name: itemRef.name,
            path: itemRef.fullPath,
            url: await getDownloadURL(itemRef),
          }))
        );
        const files = fetched
          .filter((f) => /\.(m4a|mp3|wav|aac|ogg)$/i.test(f.name))
          .sort((a, b) => b.name.localeCompare(a.name));
        if (!cancelled) setAudioFiles(files);
      } catch (err) {
        console.error("Failed to load audio feedback:", err);
        if (!cancelled) setAudioFiles([]);
      } finally {
        if (!cancelled) setAudioLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (loading) return <div>Loading...</div>;
  if (!participant) return <div>User not found.</div>;

  return (
    <>
      <ParticipantProfileTabs />
      <div className="max-w-7xl mx-auto px-6 p-6">
        <ProfileHeader user={participant} />
        <div className="bg-white rounded-xl shadow-md p-5 mt-6">
          <div className="pb-2 border-b" style={{ borderColor: "#125566" }}>
            <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Audio Feedback</h2>
            <p className="text-gray-500 mb-4">Voice notes and feedback stored in Firebase Storage</p>
          </div>
          <div className="space-y-4">
            {audioLoading ? (
              <div className="text-gray-500">Loading audio...</div>
            ) : audioFiles.length > 0 ? (
              audioFiles.map((file) => (
                <div key={file.path} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 mr-4">
                    <div className="text-sm text-gray-700 truncate">{file.name}</div>
                    <audio src={file.url} controls className="w-full mt-2" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No audio feedback files found.</div>
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

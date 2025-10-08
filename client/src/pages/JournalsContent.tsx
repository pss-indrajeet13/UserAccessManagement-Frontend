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

// Participant details passed to ProfileHeader
interface Participant {
  uid: string;
  id?: string;
  fullName?: string | null;
  email?: string | null;
  progress?: number | null;
  status?: boolean | null;
  sectionProfile?: {
    phoneNumber?: string | null;
    [key: string]: unknown;
  } | null;
  phoneNumber?: string | null;
  contactNumber?: string | null;
  phone?: string | null;
  [key: string]: unknown;
}

interface ProgressFeedbackEntry {
  id: string;
  label: string;
  feedbackText: string;
  secondaryTexts: string[];
  updatedAtLabel: string | null;
}

type ProgressCollectionItem = {
  entry: ProgressFeedbackEntry;
  order: number;
};

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!Number.isNaN(num)) {
        return num;
      }
    }
  }
  return null;
};

const getSortOrder = (identifier: string, data: Record<string, any>): number => {
  const candidateKeys = ['dayNumber', 'dayIndex', 'day', 'step', 'sequence', 'order', 'position', 'index'];
  for (const key of candidateKeys) {
    const parsed = parseNumeric(data?.[key]);
    if (parsed !== null) {
      return parsed;
    }
  }
  const fromLabel = parseNumeric(data?.label);
  if (fromLabel !== null) {
    return fromLabel;
  }
  const fromId = parseNumeric(identifier);
  return fromId !== null ? fromId : Number.MAX_SAFE_INTEGER;
};

const formatProgressLabel = (identifier: string, data: Record<string, any>): string => {
  const candidateKeys = ['dayLabel', 'title', 'dayName', 'day', 'label', 'name'];
  for (const key of candidateKeys) {
    const raw = data?.[key];
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  const match = identifier.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (!Number.isNaN(num)) {
      return `Day ${num}`;
    }
  }
  const cleaned = identifier.replace(/[-_]+/g, ' ').trim();
  if (cleaned) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return identifier;
};

const collectFeedbackTexts = (data: Record<string, any>): { primary: string; secondary: string[] } => {
  const prioritizedKeys = [
    'feedback',
    'Feedback',
    'coachFeedback',
    'CoachFeedback',
    'writtenFeedback',
    'notes',
    'Notes',
    'comment',
    'Comment',
    'journalFeedback',
    'JournalFeedback',
  ];
  const texts: string[] = [];
  const pushText = (value: unknown) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        texts.push(trimmed);
      }
    }
  };
  prioritizedKeys.forEach((key) => pushText(data?.[key]));
  Object.entries(data).forEach(([key, value]) => {
    if (/feedback|note|comment|reflection|summary/i.test(key)) {
      pushText(value);
    }
  });
  const unique = Array.from(new Set(texts));
  return {
    primary: unique[0] ?? '',
    secondary: unique.slice(1),
  };
};

const toDateFromValue = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }
  if (typeof value === 'string') {
    const fromString = new Date(value);
    return Number.isNaN(fromString.getTime()) ? null : fromString;
  }
  if (typeof value === 'object') {
    const maybe = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
    if (typeof maybe.toDate === 'function') {
      const asDate = maybe.toDate();
      return Number.isNaN(asDate.getTime()) ? null : asDate;
    }
    if (typeof maybe.seconds === 'number') {
      const millis = maybe.seconds * 1000 + (typeof maybe.nanoseconds === 'number' ? maybe.nanoseconds / 1e6 : 0);
      const fromSeconds = new Date(millis);
      return Number.isNaN(fromSeconds.getTime()) ? null : fromSeconds;
    }
  }
  return null;
};

const formatTimestampLabel = (value: unknown): string | null => {
  const date = toDateFromValue(value);
  if (!date) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const appendProgressEntries = (collector: ProgressCollectionItem[], identifier: string, raw: any): void => {
  if (raw == null) {
    return;
  }
  if (Array.isArray(raw)) {
    raw.forEach((item, index) => {
      appendProgressEntries(collector, `${identifier}-${index + 1}`, item);
    });
    return;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    collector.push({
      entry: {
        id: identifier,
        label: formatProgressLabel(identifier, {}),
        feedbackText: trimmed,
        secondaryTexts: [],
        updatedAtLabel: null,
      },
      order: getSortOrder(identifier, {}),
    });
    return;
  }
  if (typeof raw === 'object') {
    const data = raw as Record<string, any>;
    const { primary, secondary } = collectFeedbackTexts(data);
    if (!primary) {
      return;
    }
    const timestamp =
      data.updatedAt ??
      data.updated_at ??
      data.modifiedAt ??
      data.modified_at ??
      data.completedAt ??
      data.completed_at ??
      data.createdAt ??
      data.created_at ??
      data.timestamp;
    collector.push({
      entry: {
        id: identifier,
        label: formatProgressLabel(identifier, data),
        feedbackText: primary,
        secondaryTexts: secondary,
        updatedAtLabel: formatTimestampLabel(timestamp),
      },
      order: getSortOrder(identifier, data),
    });
  }
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
  const [writtenFeedback, setWrittenFeedback] = useState<ProgressFeedbackEntry[]>([]);
  const [writtenFeedbackLoading, setWrittenFeedbackLoading] = useState<boolean>(false);

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
          const participantData = participantDoc.data() as Record<string, unknown>;
          setParticipant({ uid, id: uid, ...participantData } as Participant);
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

  useEffect(() => {
    let cancelled = false;
    const loadWrittenFeedback = async () => {
      if (!uid) {
        if (!cancelled) {
          setWrittenFeedback([]);
          setWrittenFeedbackLoading(false);
        }
        return;
      }
      setWrittenFeedbackLoading(true);
      try {
        const collected: ProgressCollectionItem[] = [];
        try {
          const progressCollection = collection(db, 'userActivity', uid, 'progress');
          const progressSnap = await getDocs(progressCollection);
          if (!progressSnap.empty) {
            progressSnap.forEach((docSnap) => {
              appendProgressEntries(collected, docSnap.id, docSnap.data());
            });
          }
        } catch (error) {
          console.warn('Failed to fetch progress subcollection:', error);
        }
        if (!collected.length) {
          try {
            const activityDoc = await getDoc(doc(db, 'userActivity', uid));
            if (activityDoc.exists()) {
              const data = activityDoc.data() as Record<string, any> | undefined;
              const progress = data?.progress;
              if (progress && typeof progress === 'object') {
                Object.entries(progress).forEach(([key, value]) => {
                  appendProgressEntries(collected, key, value);
                });
              }
            }
          } catch (activityError) {
            console.warn('Failed to fetch userActivity document for feedback:', activityError);
          }
        }
        collected.sort((a, b) => a.order - b.order);
        if (!cancelled) {
          setWrittenFeedback(collected.map((item) => item.entry));
        }
      } catch (error) {
        console.error('Failed to load written feedback:', error);
        if (!cancelled) {
          setWrittenFeedback([]);
        }
      } finally {
        if (!cancelled) {
          setWrittenFeedbackLoading(false);
        }
      }
    };
    loadWrittenFeedback();
    return () => {
      cancelled = true;
    };
  }, [uid]);

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
        <div className="space-y-6 mt-6">
          <div className="bg-white rounded-xl shadow-md p-5">
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
          <div className="bg-white rounded-xl shadow-md p-5">
            <div className="pb-2 border-b" style={{ borderColor: "#125566" }}>
              <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Written Feedback</h2>
              <p className="text-gray-500 mb-4">Feedback captured within the progress tracker</p>
            </div>
            <div className="space-y-4">
              {writtenFeedbackLoading ? (
                <div className="text-gray-500">Loading feedback...</div>
              ) : writtenFeedback.length > 0 ? (
                writtenFeedback.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-700">{entry.label}</div>
                        {entry.updatedAtLabel && (
                          <div className="text-xs text-gray-500 mt-1">{entry.updatedAtLabel}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{entry.feedbackText}</p>
                    {entry.secondaryTexts.map((text, index) => (
                      <p key={`${entry.id}-extra-${index}`} className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {text}
                      </p>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No written feedback available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Hidden audio element to control playback */}
      <audio ref={audioRef} onPause={() => setPlayingAudio(null)} onEnded={() => setPlayingAudio(null)} />
    </>
  );
};

export default JournalsContent;

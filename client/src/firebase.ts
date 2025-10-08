// Firebase configuration for Fertiwell Admin Dashboard
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage';

// const firebaseConfig = {
//   apiKey: "AIzaSyDeJeMBYwxAshzPSj7gaLwqGk6fc2Vd_7o",
//   authDomain: "fertiwell-72814.firebaseapp.com",
//   projectId: "fertiwell-72814",
//   storageBucket: "fertiwell-72814.firebasestorage.app",
//   messagingSenderId: "103581622326",
//   appId: "1:103581622326:android:a5f3a9f2f1a24dd117f897"
// };

const firebaseConfig = {
  apiKey: "AIzaSyAHnY_DkFNlW-Tf5s3-7gm4CiRmTZFeOxc",
  authDomain: "fertiwell-ba75e.firebaseapp.com",
  projectId: "fertiwell-ba75e",
  storageBucket: "fertiwell-ba75e.firebasestorage.app",
  messagingSenderId: "246698056314",
  appId: "1:246698056314:android:e8b8c8f8f8f8f8f8f8f8f8", // You need to replace this with your actual app ID
  measurementId: "G-1234567890" // Optional, only if you're using Analytics
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Storage
export const storage = getStorage(app);

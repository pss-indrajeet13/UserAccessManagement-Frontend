// Firebase configuration for Fertiwell Admin Dashboard
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeJeMBYwxAshzPSj7gaLwqGk6fc2Vd_7o",
  authDomain: "fertiwell-72814.firebaseapp.com",
  projectId: "fertiwell-72814",
  storageBucket: "fertiwell-72814.firebasestorage.app",
  messagingSenderId: "103581622326",
  appId: "1:103581622326:web:your-app-id-here"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

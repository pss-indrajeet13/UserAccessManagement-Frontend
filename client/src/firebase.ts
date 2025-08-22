// shared/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Read values from .env
// const firebaseConfig = {
//   apiKey: "AIzaSyDuxoMYPGkFqPgmwUEGQhYjXkwHOV18snM",
//   authDomain: "fertiwell-admin.firebaseapp.com",
//   projectId: "fertiwell-admin",
//   storageBucket: "fertiwell-admin.firebasestorage.app",
//   messagingSenderId: "183341330258",
//   appId: "1:183341330258:web:e2a9271bb19f5e25d6548b",
//   measurementId: "G-XPTW7QF3Q2"
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

// Only use analytics in browser (prevents errors in SSR or Node)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

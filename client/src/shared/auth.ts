// import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
// import { auth, db } from "@/shared/firebase"; // Update path if needed
// import { doc, getDoc, setDoc } from "firebase/firestore";

// export async function registerAdmin(email: string, password: string, profile: any = {}) {
//   // Create a new admin user in Firebase Auth
//   const { user } = await createUserWithEmailAndPassword(auth, email, password);

//   // Save additional admin profile data into Firestore (e.g., role: admin)
//   await setDoc(doc(db, "admins", user.uid), {
//     email: user.email,
//     role: "admin",
//     ...profile,
//     createdAt: Date.now(),
//   });

//   return user;
// }

// export async function loginAdmin(email: string, password: string) {
//   // Sign in the user with Firebase Auth
//   const { user } = await signInWithEmailAndPassword(auth, email, password);

//   // Check if user is an admin by querying Firestore
//   const adminDoc = await getDoc(doc(db, "admins", user.uid));
//   if (!adminDoc.exists()) {
//     throw new Error("Access denied: User is not an admin");
//   }

//   // Return user info if admin
//   return user;
// }

// auth.ts (no firebase check, just static login)
// auth.ts


// C:\PSS\UserAccessManager\shared\auth.ts
export async function loginAdmin(email: string, password: string) {
  const ADMIN_EMAIL = "admin@gmail.com";
  const ADMIN_PASS = "admin123";

  return new Promise((resolve, reject) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      console.log("Login successful with static credentials");
      resolve({ email: ADMIN_EMAIL });
    } else {
      console.log("Login failed, invalid credentials");
      reject(new Error("Invalid email or password"));
    }
  });
}

import { useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<any>(null);

  const login = async (email: string, password: string) => {
    try {
      const userData = await loginAdmin(email, password);
      setUser(userData);
      console.log("User set in state:", userData);
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    console.log("User logged out");
  };

  return { user, login, logout };
}
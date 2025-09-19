import { getAuth, signInWithEmailAndPassword, User } from "firebase/auth";
import { app } from "@/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

export interface AdminUser {
  uid: string;
  email: string | null;
  token: string;
  claims?: Record<string, any>;
}

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // Fetch the user's document from Firestore to check their role.
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  // Check if the document exists and the user has the 'admin' role.
  if (!userDocSnap.exists() || userDocSnap.data()?.role !== 'admin') {
    // If the user is not an admin, sign them out.
    await auth.signOut();
    throw new Error("Access denied: You do not have administrator privileges.");
  }

  const token = await user.getIdToken(true);
  return { uid: user.uid, email: user.email, token, claims: {} };
}
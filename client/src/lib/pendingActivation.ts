import type { Firestore } from "firebase/firestore";
import { collection, getDocs, query, where } from "firebase/firestore";

export type PendingActivationResult = {
  ids: Set<string>;
  count: number;
};

export async function fetchPendingActivationUsers(db: Firestore): Promise<PendingActivationResult> {
  const usersCollection = collection(db, "users");
  const pendingQuery = query(usersCollection, where("status", "==", false));
  const snapshot = await getDocs(pendingQuery);
  const ids = new Set<string>();

  snapshot.forEach((docSnap) => {
    ids.add(docSnap.id);
  });

  return { ids, count: ids.size };
}

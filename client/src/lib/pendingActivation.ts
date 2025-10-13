import type { Firestore } from "firebase/firestore";
import { collection, getDocs, query, where } from "firebase/firestore";
import { normalizeUserStatus } from "./utils";

export type PendingActivationResult = {
  ids: Set<string>;
  count: number;
};

export async function fetchPendingActivationUsers(db: Firestore): Promise<PendingActivationResult> {
  const usersCollection = collection(db, "users");
  const ids = new Set<string>();

  const queries = [
    query(usersCollection, where("userStatus", "==", false)),
    query(usersCollection, where("userStatus", "==", "false")),
    query(usersCollection, where("userStatus", "==", 0)),
    query(usersCollection, where("status", "==", false)),
    query(usersCollection, where("status", "==", "pending")),
  ];

  const snapshots = await Promise.all(
    queries.map(async (pendingQuery) => {
      try {
        return await getDocs(pendingQuery);
      } catch (error) {
        console.warn("fetchPendingActivationUsers query failed:", error);
        return null;
      }
    })
  );

  snapshots.forEach((snapshot) => {
    if (!snapshot) return;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const status = normalizeUserStatus(data?.userStatus ?? data?.status);
      if (status === false) {
        ids.add(docSnap.id);
      }
    });
  });

  return { ids, count: ids.size };
}

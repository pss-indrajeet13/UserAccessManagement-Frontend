// // storage.ts
// import { db } from "../db";
// import {
//   mobileUsers,
//   sessions,
//   notifications,
//   activities,
//   users,
//   InsertUser,
//   InsertMobileUser,
//   InsertSession,
//   InsertNotification,
//   InsertActivity
// } from "../shared/schema";
// import { eq, like, count, desc } from "drizzle-orm";

// // User functions
// async function getUserByUsername(username: string) {
//   const [user] = await db.select().from(users).where(eq(users.username, username));
//   return user;
// }

// async function createUser(data: InsertUser) {
//   const [user] = await db.insert(users).values(data).returning();
//   return user;
// }

// // Mobile User functions
// async function getMobileUsers(limit = 50, offset = 0) {
//   return await db.select().from(mobileUsers).limit(limit).offset(offset);
// }

// async function searchMobileUsers(search: string) {
//   return await db
//     .select()
//     .from(mobileUsers)
//     .where(like(mobileUsers.name, `%${search}%`));
// }

// async function getMobileUser(id: string) {
//   const [user] = await db.select().from(mobileUsers).where(eq(mobileUsers.id, id));
//   return user;
// }

// async function createMobileUser(data: InsertMobileUser) {
//   const [user] = await db.insert(mobileUsers).values(data).returning();
//   return user;
// }

// async function updateMobileUser(id: string, data: Partial<InsertMobileUser>) {
//   const [user] = await db.update(mobileUsers).set(data).where(eq(mobileUsers.id, id)).returning();
//   return user;
// }

// async function deleteMobileUser(id: string) {
//   const [deleted] = await db.delete(mobileUsers).where(eq(mobileUsers.id, id)).returning();
//   return !!deleted;
// }

// // Mobile User Stats
// async function getMobileUserStats() {
//   const [total] = await db.select({ count: count() }).from(mobileUsers);
//   const [active] = await db
//     .select({ count: count() })
//     .from(mobileUsers)
//     .where(eq(mobileUsers.status, "active"));

//   return {
//     totalUsers: total.count,
//     activeUsers: active.count,
//   };
// }

// // Session functions
// async function getSessions(userId?: string) {
//   if (userId) {
//     return await db.select().from(sessions).where(eq(sessions.userId, userId));
//   }
//   return await db.select().from(sessions);
// }

// async function createSession(data: InsertSession) {
//   const [session] = await db.insert(sessions).values(data).returning();
//   return session;
// }

// async function getSessionStats() {
//   const [total] = await db.select({ count: count() }).from(sessions);
//   const [completed] = await db
//     .select({ count: count() })
//     .from(sessions)
//     .where(eq(sessions.completed, true));

//   return {
//     totalSessions: total.count,
//     completedSessions: completed.count,
//   };
// }

// // Notification functions
// async function getNotifications(limit = 50) {
//   return await db.select().from(notifications).orderBy(desc(notifications.sentAt)).limit(limit);
// }

// async function createNotification(data: InsertNotification) {
//   const [notification] = await db.insert(notifications).values(data).returning();
//   return notification;
// }

// // Activity functions
// async function getActivities(limit = 10) {
//   return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
// }

// async function createActivity(data: InsertActivity) {
//   const [activity] = await db.insert(activities).values(data).returning();
//   return activity;
// }

// // Export storage object
// export const storage = {
//   // Users
//   getUserByUsername,
//   createUser,

//   // Mobile Users
//   getMobileUsers,
//   searchMobileUsers,
//   getMobileUser,
//   createMobileUser,
//   updateMobileUser,
//   deleteMobileUser,
//   getMobileUserStats,

//   // Sessions
//   getSessions,
//   createSession,
//   getSessionStats,

//   // Notifications
//   getNotifications,
//   createNotification,

//   // Activities
//   getActivities,
//   createActivity,
// };

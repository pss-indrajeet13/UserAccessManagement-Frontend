// import { Router } from "express";
// import { storage } from "./storage";
// import {
//   insertMobileUserSchema,
//   insertSessionSchema,
//   insertNotificationSchema,
// } from "../shared/schema";
// import { z } from "zod";

// const router = Router();

// // GET /api/mobile-users
// router.get("/mobile-users", async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit as string) || 50;
//     const offset = parseInt(req.query.offset as string) || 0;
//     const search = req.query.search as string;

//     let users;
//     if (search) {
//       users = await storage.searchMobileUsers(search);
//     } else {
//       users = await storage.getMobileUsers(limit, offset);
//     }

//     res.json(users);
//   } catch (error) {
//     console.error("❌ Error fetching mobile users:", error);
//     res.status(500).json({ message: "Failed to fetch users" });
//   }
// });

// // GET /api/mobile-users/:id
// router.get("/mobile-users/:id", async (req, res) => {
//   try {
//     const user = await storage.getMobileUser(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user);
//   } catch (error) {
//     console.error("❌ Error fetching mobile user:", error);
//     res.status(500).json({ message: "Failed to fetch user" });
//   }
// });

// // POST /api/mobile-users
// router.post("/mobile-users", async (req, res) => {
//   try {
//     const data = insertMobileUserSchema.parse(req.body);
//     const newUser = await storage.createMobileUser(data);
//     res.status(201).json(newUser);
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({ message: "Invalid user data", errors: error.errors });
//     }
//     console.error("❌ Error creating mobile user:", error);
//     res.status(500).json({ message: "Failed to create user" });
//   }
// });

// // PUT /api/mobile-users/:id
// router.put("/mobile-users/:id", async (req, res) => {
//   try {
//     const updateData = req.body;
//     const user = await storage.updateMobileUser(req.params.id, updateData);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user);
//   } catch (error) {
//     console.error("❌ Error updating mobile user:", error);
//     res.status(500).json({ message: "Failed to update user" });
//   }
// });

// // DELETE /api/mobile-users/:id
// router.delete("/mobile-users/:id", async (req, res) => {
//   try {
//     const success = await storage.deleteMobileUser(req.params.id);
//     if (!success) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.status(204).send();
//   } catch (error) {
//     console.error("❌ Error deleting mobile user:", error);
//     res.status(500).json({ message: "Failed to delete user" });
//   }
// });

// // GET /api/stats
// router.get("/stats", async (req, res) => {
//   try {
//     const userStats = await storage.getMobileUserStats();
//     const sessionStats = await storage.getSessionStats();
//     res.json({
//       ...userStats,
//       ...sessionStats,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching stats:", error);
//     res.status(500).json({ message: "Failed to fetch stats" });
//   }
// });

// // GET /api/sessions
// router.get("/sessions", async (req, res) => {
//   try {
//     const userId = req.query.userId as string;
//     const sessions = await storage.getSessions(userId);
//     res.json(sessions);
//   } catch (error) {
//     console.error("❌ Error fetching sessions:", error);
//     res.status(500).json({ message: "Failed to fetch sessions" });
//   }
// });

// // POST /api/sessions
// router.post("/sessions", async (req, res) => {
//   try {
//     const sessionData = insertSessionSchema.parse(req.body);
//     const session = await storage.createSession(sessionData);
//     res.status(201).json(session);
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({ message: "Invalid session data", errors: error.errors });
//     }
//     console.error("❌ Error creating session:", error);
//     res.status(500).json({ message: "Failed to create session" });
//   }
// });

// // GET /api/notifications
// router.get("/notifications", async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit as string) || 50;
//     const notifications = await storage.getNotifications(limit);
//     res.json(notifications);
//   } catch (error) {
//     console.error("❌ Error fetching notifications:", error);
//     res.status(500).json({ message: "Failed to fetch notifications" });
//   }
// });

// // POST /api/notifications
// router.post("/notifications", async (req, res) => {
//   try {
//     const { message, target } = req.body;

//     // Validate only message + target (exclude sentBy)
//     if (!message || !target) {
//       return res.status(400).json({ message: "Message and target are required" });
//     }

//     // Ensure admin user exists
//     const adminUser = await storage.getUserByUsername("admin");
//     if (!adminUser) {
//       return res.status(400).json({ message: "Admin user not found" });
//     }

//     // Create notification with admin as sender
//     const notification = await storage.createNotification({
//       message,
//       target,
//       sentBy: adminUser.id,
//     });

//     res.status(201).json(notification);
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
//     }
//     console.error("❌ Error creating notification:", error);
//     res.status(500).json({ message: "Failed to create notification" });
//   }
// });



// // GET /api/activities
// router.get("/activities", async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit as string) || 10;
//     const activities = await storage.getActivities(limit);
//     res.json(activities);
//   } catch (error) {
//     console.error("❌ Error fetching activities:", error);
//     res.status(500).json({ message: "Failed to fetch activities" });
//   }
// });

// export default router;
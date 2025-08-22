// C:\PSS\UserAccessManager\shared\schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const mobileUsers = pgTable("mobile_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"), // active, inactive
  accessLevel: text("access_level").notNull().default("standard"), // standard, premium, admin
  currentStage: integer("current_stage").notNull().default(1),
  score: integer("score").notNull().default(0),
  lastActive: timestamp("last_active").notNull().defaultNow(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => mobileUsers.id, { onDelete: "cascade" }),
  stage: integer("stage").notNull(),
  duration: integer("duration").notNull(), // in minutes
  completed: boolean("completed").notNull().default(false),
  score: integer("score").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  target: text("target").notNull(), // all_active, specific_group, inactive
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  sentBy: varchar("sent_by").notNull().references(() => users.id),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  type: text("type").notNull(), // user_action, notification, admin_action
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMobileUserSchema = createInsertSchema(mobileUsers).pick({
  name: true,
  email: true,
  status: true,
  accessLevel: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  stage: true,
  duration: true,
  completed: true,
  score: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  message: true,
  target: true
  // sentBy: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  description: true,
  type: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MobileUser = typeof mobileUsers.$inferSelect;
export type InsertMobileUser = z.infer<typeof insertMobileUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

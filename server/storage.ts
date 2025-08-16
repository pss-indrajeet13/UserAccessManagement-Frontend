import { 
  type User, 
  type InsertUser, 
  type MobileUser, 
  type InsertMobileUser,
  type Session,
  type InsertSession,
  type Notification,
  type InsertNotification,
  type Activity,
  type InsertActivity
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Mobile User methods
  getMobileUsers(limit?: number, offset?: number): Promise<MobileUser[]>;
  getMobileUser(id: string): Promise<MobileUser | undefined>;
  createMobileUser(user: InsertMobileUser): Promise<MobileUser>;
  updateMobileUser(id: string, user: Partial<MobileUser>): Promise<MobileUser | undefined>;
  deleteMobileUser(id: string): Promise<boolean>;
  searchMobileUsers(query: string): Promise<MobileUser[]>;
  getMobileUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    avgScore: number;
  }>;

  // Session methods
  getSessions(userId?: string): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  getSessionStats(): Promise<{
    dailySessions: number;
    avgSessionTime: number;
    completionRate: number;
    returnRate: number;
  }>;

  // Notification methods
  getNotifications(limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;

  // Activity methods
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private mobileUsers: Map<string, MobileUser>;
  private sessions: Map<string, Session>;
  private notifications: Map<string, Notification>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.mobileUsers = new Map();
    this.sessions = new Map();
    this.notifications = new Map();
    this.activities = new Map();
    
    // Initialize with some data
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "admin123", // In production, this would be hashed
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample mobile users
    const sampleUsers: MobileUser[] = [
      {
        id: randomUUID(),
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        status: "active",
        accessLevel: "premium",
        currentStage: 5,
        score: 92,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        id: randomUUID(),
        name: "Michael Chen",
        email: "m.chen@email.com",
        status: "inactive",
        accessLevel: "standard",
        currentStage: 3,
        score: 76,
        lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      },
      {
        id: randomUUID(),
        name: "Emily Rodriguez",
        email: "emily.r@email.com",
        status: "active",
        accessLevel: "standard",
        currentStage: 4,
        score: 88,
        lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
    ];

    sampleUsers.forEach(user => this.mobileUsers.set(user.id, user));

    // Create sample sessions
    sampleUsers.forEach(user => {
      for (let i = 1; i <= user.currentStage; i++) {
        const session: Session = {
          id: randomUUID(),
          userId: user.id,
          stage: i,
          duration: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
          completed: true,
          score: Math.floor(Math.random() * 30) + 70, // 70-100
          startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        };
        this.sessions.set(session.id, session);
      }
    });

    // Create sample activities
    const sampleActivities: Activity[] = [
      {
        id: randomUUID(),
        description: "User John Doe completed Stage 3",
        type: "user_action",
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: randomUUID(),
        description: "Push notification sent to 1,247 users",
        type: "notification",
        createdAt: new Date(Date.now() - 12 * 60 * 1000),
      },
      {
        id: randomUUID(),
        description: "New user registration: Alice Smith",
        type: "user_action",
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        description: "User access revoked: Mike Johnson",
        type: "admin_action",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    sampleActivities.forEach(activity => this.activities.set(activity.id, activity));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Mobile User methods
  async getMobileUsers(limit = 50, offset = 0): Promise<MobileUser[]> {
    const users = Array.from(this.mobileUsers.values())
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
      .slice(offset, offset + limit);
    return users;
  }

  async getMobileUser(id: string): Promise<MobileUser | undefined> {
    return this.mobileUsers.get(id);
  }

  async createMobileUser(insertUser: InsertMobileUser): Promise<MobileUser> {
    const id = randomUUID();
    const user: MobileUser = {
      ...insertUser,
      id,
      currentStage: 1,
      score: 0,
      lastActive: new Date(),
      joinedAt: new Date(),
    };
    this.mobileUsers.set(id, user);

    // Create activity
    await this.createActivity({
      description: `New user registration: ${user.name}`,
      type: "user_action",
    });

    return user;
  }

  async updateMobileUser(id: string, updateData: Partial<MobileUser>): Promise<MobileUser | undefined> {
    const user = this.mobileUsers.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData };
    this.mobileUsers.set(id, updatedUser);

    // Create activity for status changes
    if (updateData.status && updateData.status !== user.status) {
      await this.createActivity({
        description: `User ${updateData.status === "active" ? "activated" : "deactivated"}: ${user.name}`,
        type: "admin_action",
      });
    }

    return updatedUser;
  }

  async deleteMobileUser(id: string): Promise<boolean> {
    const user = this.mobileUsers.get(id);
    if (!user) return false;

    this.mobileUsers.delete(id);
    
    // Remove user sessions
    Array.from(this.sessions.entries()).forEach(([sessionId, session]) => {
      if (session.userId === id) {
        this.sessions.delete(sessionId);
      }
    });

    // Create activity
    await this.createActivity({
      description: `User deleted: ${user.name}`,
      type: "admin_action",
    });

    return true;
  }

  async searchMobileUsers(query: string): Promise<MobileUser[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.mobileUsers.values()).filter(user =>
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getMobileUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    avgScore: number;
  }> {
    const users = Array.from(this.mobileUsers.values());
    const activeUsers = users.filter(user => user.status === "active");
    const inactiveUsers = users.filter(user => user.status === "inactive");
    const avgScore = users.length > 0 ? users.reduce((sum, user) => sum + user.score, 0) / users.length : 0;

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      inactiveUsers: inactiveUsers.length,
      avgScore: Math.round(avgScore * 10) / 10,
    };
  }

  // Session methods
  async getSessions(userId?: string): Promise<Session[]> {
    let sessions = Array.from(this.sessions.values());
    if (userId) {
      sessions = sessions.filter(session => session.userId === userId);
    }
    return sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      ...insertSession,
      id,
      startedAt: new Date(),
      completedAt: insertSession.completed ? new Date() : null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSessionStats(): Promise<{
    dailySessions: number;
    avgSessionTime: number;
    completionRate: number;
    returnRate: number;
  }> {
    const sessions = Array.from(this.sessions.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailySessions = sessions.filter(session => session.startedAt >= today).length;
    const completedSessions = sessions.filter(session => session.completed);
    const avgSessionTime = sessions.length > 0 ? 
      sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length : 0;
    const completionRate = sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;
    
    // Mock return rate calculation
    const returnRate = 42;

    return {
      dailySessions,
      avgSessionTime: Math.round(avgSessionTime),
      completionRate: Math.round(completionRate),
      returnRate,
    };
  }

  // Notification methods
  async getNotifications(limit = 50): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      sentAt: new Date(),
    };
    this.notifications.set(id, notification);

    // Create activity
    await this.createActivity({
      description: `Push notification sent to ${notification.target.replace('_', ' ')} users`,
      type: "notification",
    });

    return notification;
  }

  // Activity methods
  async getActivities(limit = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();

// Emergency fallback data when Firebase is not accessible

export type FallbackUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "suspended";
  accessLevel: "standard" | "premium" | "admin";
  currentStage: number;
  totalStages: number;
  progress: number;
  createdAt: Date;
  lastActive: Date;
  location?: string;
  deviceInfo?: string;
  score: number;
};

const CLIENT_USERS_KEY = "clientAddedUsers";
const CLIENT_NOTIFICATIONS_KEY = "clientNotifications";

function reviveDates<T extends Record<string, any>>(obj: T): T {
  const out: any = { ...obj };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v === "string" && /\d{4}-\d{2}-\d{2}T/.test(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) out[k] = d;
    }
  }
  return out;
}

function loadClientArray<T>(key: string): T[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw) as any[];
    return arr.map((x) => reviveDates(x));
  } catch {
    return [];
  }
}

function saveClientArray<T>(key: string, arr: T[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(arr));
}

let clientAddedUsers: FallbackUser[] = loadClientArray<FallbackUser>(CLIENT_USERS_KEY);

export const fallbackUsers = [
  {
    id: "fallback-1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890", 
    status: "active" as const,
    accessLevel: "standard" as const,
    currentStage: 3,
    totalStages: 10,
    progress: 30,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    location: "New York, USA",
    deviceInfo: "iPhone 12 Pro",
    score: 85
  },
  {
    id: "fallback-2", 
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+0987654321",
    status: "active" as const,
    accessLevel: "premium" as const,
    currentStage: 7,
    totalStages: 10,
    progress: 70,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    lastActive: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    location: "London, UK", 
    deviceInfo: "Samsung Galaxy S21",
    score: 92
  },
  {
    id: "fallback-3",
    name: "Mike Johnson", 
    email: "mike.johnson@example.com",
    phone: "+1122334455",
    status: "active" as const,
    accessLevel: "admin" as const,
    currentStage: 10,
    totalStages: 10,
    progress: 100,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    location: "Tokyo, Japan",
    deviceInfo: "iPhone 13 Pro Max",
    score: 98
  },
  {
    id: "fallback-4",
    name: "Emily Davis",
    email: "emily.davis@example.com", 
    phone: "+5566778899",
    status: "inactive" as const,
    accessLevel: "standard" as const,
    currentStage: 2,
    totalStages: 10,
    progress: 20,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    location: "Sydney, Australia",
    deviceInfo: "Google Pixel 6",
    score: 67
  },
  {
    id: "fallback-5",
    name: "Alex Rodriguez",
    email: "alex.rodriguez@example.com",
    phone: "+9988776655", 
    status: "active" as const,
    accessLevel: "premium" as const,
    currentStage: 5,
    totalStages: 10,
    progress: 50,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    lastActive: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    location: "Toronto, Canada",
    deviceInfo: "iPhone 14",
    score: 78
  },
  {
    id: "fallback-6",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+4433221100",
    status: "active" as const,
    accessLevel: "standard" as const,
    currentStage: 4,
    totalStages: 10,
    progress: 40,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    location: "Berlin, Germany",
    deviceInfo: "Samsung Galaxy Note 20",
    score: 81
  },
  {
    id: "fallback-7",
    name: "David Chen",
    email: "david.chen@example.com",
    phone: "+1357924680",
    status: "active" as const,
    accessLevel: "premium" as const,
    currentStage: 6,
    totalStages: 10,
    progress: 60,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    lastActive: new Date(Date.now() - 20 * 60 * 1000), // 20 min ago
    location: "Singapore",
    deviceInfo: "iPhone 12",
    score: 89
  },
  {
    id: "fallback-8",
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    phone: "+2468013579",
    status: "suspended" as const,
    accessLevel: "standard" as const,
    currentStage: 1,
    totalStages: 10,
    progress: 10,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    location: "Mumbai, India",
    deviceInfo: "OnePlus 9",
    score: 23
  }
];

export const fallbackActivities = [
  {
    id: "activity-1",
    type: "login",
    description: "John Doe logged in successfully",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    userId: "fallback-1",
    userName: "John Doe",
    icon: "login"
  },
  {
    id: "activity-2", 
    type: "stage_complete",
    description: "Jane Smith completed stage 7", 
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    userId: "fallback-2",
    userName: "Jane Smith",
    icon: "check_circle"
  },
  {
    id: "activity-3",
    type: "upgrade",
    description: "Alex Rodriguez upgraded to premium",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    userId: "fallback-5", 
    userName: "Alex Rodriguez",
    icon: "upgrade"
  },
  {
    id: "activity-4",
    type: "achievement",
    description: "Mike Johnson earned perfect score achievement",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    userId: "fallback-3",
    userName: "Mike Johnson", 
    icon: "emoji_events"
  },
  {
    id: "activity-5",
    type: "login",
    description: "David Chen logged in successfully",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    userId: "fallback-7",
    userName: "David Chen",
    icon: "login"
  },
  {
    id: "activity-6",
    type: "stage_complete", 
    description: "Sarah Wilson completed stage 4",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    userId: "fallback-6",
    userName: "Sarah Wilson",
    icon: "check_circle"
  },
  {
    id: "activity-7",
    type: "session_start",
    description: "Emily Davis started new session",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    userId: "fallback-4",
    userName: "Emily Davis", 
    icon: "play_circle"
  },
  {
    id: "activity-8",
    type: "login",
    description: "Lisa Anderson's account was suspended",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    userId: "fallback-8",
    userName: "Lisa Anderson",
    icon: "block"
  }
];

export function getAllUsers(): FallbackUser[] {
  return [...fallbackUsers, ...clientAddedUsers];
}

export function addClientUser(user: {
  name: string;
  email: string;
  status?: "active" | "inactive" | "suspended";
  accessLevel?: "standard" | "premium" | "admin";
}): FallbackUser {
  const now = new Date();
  const newUser: FallbackUser = {
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: user.name,
    email: user.email,
    status: user.status ?? "active",
    accessLevel: user.accessLevel ?? "standard",
    currentStage: 1,
    totalStages: 10,
    progress: 0,
    createdAt: now,
    lastActive: now,
    score: 0,
  };
  clientAddedUsers = [newUser, ...clientAddedUsers];
  saveClientArray(CLIENT_USERS_KEY, clientAddedUsers);
  return newUser;
}

export type LocalNotification = {
  id: string;
  message: string;
  target: string;
  sentAt: Date;
  sentBy?: string;
};

let clientNotifications: LocalNotification[] = loadClientArray<LocalNotification>(CLIENT_NOTIFICATIONS_KEY);

export function addLocalNotification(message: string, target: string, sentBy = "local-admin") {
  const n: LocalNotification = {
    id: `local-notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    message,
    target,
    sentAt: new Date(),
    sentBy,
  };
  clientNotifications = [n, ...clientNotifications];
  saveClientArray(CLIENT_NOTIFICATIONS_KEY, clientNotifications);
  return n;
}

export function getLocalNotifications(): LocalNotification[] {
  return clientNotifications;
}

export const getFallbackStats = () => {
  const totalUsers = fallbackUsers.length;
  const activeUsers = fallbackUsers.filter(user => user.status === 'active').length;
  const inactiveUsers = fallbackUsers.filter(user => user.status === 'inactive').length;
  const avgScore = Math.round(fallbackUsers.reduce((sum, user) => sum + user.progress, 0) / totalUsers);
  
  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    dailySessions: Math.floor(activeUsers * 1.5),
    avgScore,
    recentActiveUsers: activeUsers,
    usersByLevel: {
      standard: fallbackUsers.filter(user => user.accessLevel === 'standard').length,
      premium: fallbackUsers.filter(user => user.accessLevel === 'premium').length,
      admin: fallbackUsers.filter(user => user.accessLevel === 'admin').length,
    },
    growth: {
      totalUsers: "+15% from last month",
      activeUsers: "+12% from last month",
      dailySessions: "+18% from yesterday", 
      avgScore: "+5 from last week"
    }
  };
};

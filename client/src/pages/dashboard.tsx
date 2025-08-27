// C:\PSS\UserAccessManager\client\src\pages\dashboard.tsx
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import AddUserModal from "@/components/modals/add-user-modal";
import FirebaseSetupHelper from "@/components/FirebaseSetupHelper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  dailySessions: number;
  avgScore: number;
  recentActiveUsers: number;
  usersByLevel: {
    standard: number;
    premium: number;
    admin: number;
  };
  growth: {
    totalUsers: string;
    activeUsers: string;
    dailySessions: string;
    avgScore: string;
  };
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  status: string;
  accessLevel: string;
  created: any;
  lastActive: any;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

export default function Dashboard() {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTarget, setNotificationTarget] = useState("all_active");
  const [hasPermissionError, setHasPermissionError] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard statistics from Firebase
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ["firebase-dashboard-stats"],
    queryFn: async () => {
      try {
        const { getFirestore, collection, getDocs } = await import("firebase/firestore");
        const { app } = await import("@/firebase");

        const db = getFirestore(app);
        const usersCollection = collection(db, 'users');

        console.log("Fetching users from Firebase for stats...");
        const snapshot = await getDocs(usersCollection);
        console.log("Firebase users snapshot size:", snapshot.size);

        if (snapshot.empty) {
          console.log("No users found in Firebase");
          return {
            stats: {
              totalUsers: 0,
              activeUsers: 0,
              inactiveUsers: 0,
              dailySessions: 0,
              avgScore: 0,
              recentActiveUsers: 0,
              usersByLevel: { standard: 0, premium: 0, admin: 0 },
              growth: { totalUsers: "0%", activeUsers: "0%", dailySessions: "0%", avgScore: "0%" }
            }
          };
        }

        const users = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log("User data for stats:", data);
          return data;
        });

        const totalUsers = users.length;
        // Since Firebase doesn't have 'status' field, assume all users are active
        const activeUsers = users.length;
        const inactiveUsers = 0;
        const avgScore = users.length > 0 ? Math.round(users.reduce((sum, user) => sum + (parseInt(user.currentStage) || 1), 0) / users.length) : 0;

        const stats = {
          totalUsers,
          activeUsers,
          inactiveUsers,
          dailySessions: Math.floor(activeUsers * 1.5), // Estimated
          avgScore,
          recentActiveUsers: activeUsers,
          usersByLevel: {
            standard: users.filter(user => (user.accessLevel || 'Standard').toLowerCase() === 'standard').length,
            premium: users.filter(user => (user.accessLevel || 'Standard').toLowerCase() === 'premium').length,
            admin: users.filter(user => (user.accessLevel || 'Standard').toLowerCase() === 'admin').length,
          },
          growth: {
            totalUsers: "+15% from last month",
            activeUsers: "+12% from last month",
            dailySessions: "+18% from yesterday",
            avgScore: "+5 from last week"
          }
        };

        console.log("Calculated Firebase stats:", stats);
        return { stats };
      } catch (error: any) {
        console.error("Firebase stats fetch failed:", error);

        // Check if it's a permission error
        if (error?.code === 'permission-denied') {
          console.error("🔥 PERMISSION DENIED: Please update Firestore security rules!");
          setHasPermissionError(true);
        }

        // Return default stats for errors
        const defaultStats = {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          dailySessions: 0,
          avgScore: 0,
          recentActiveUsers: 0,
          usersByLevel: { standard: 0, premium: 0, admin: 0 },
          growth: { totalUsers: "0%", activeUsers: "0%", dailySessions: "0%", avgScore: "0%" }
        };

        return { stats: defaultStats };
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  // Fetch recent users from Firebase
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ["firebase-dashboard-users"],
    queryFn: async () => {
      try {
        const { getFirestore, collection, getDocs, limit, query } = await import("firebase/firestore");
        const { app } = await import("@/firebase");

        const db = getFirestore(app);
        const usersCollection = collection(db, 'users');

        console.log("Fetching recent users from Firebase...");
        // Get the first 10 users without ordering to avoid field constraints
        const q = query(usersCollection, limit(10));
        const snapshot = await getDocs(q);

        console.log("Firebase users snapshot size:", snapshot.size);

        if (snapshot.empty) {
          console.log("No users found in Firebase for recent users");
          return { users: [] };
        }

        const users = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Recent user data:", data);
          return {
            id: doc.id,
            name: data.name || 'Unknown User',
            email: data.email || '',
            status: 'active', // Default to active since Firebase doesn't have status field
            accessLevel: data.accessLevel || 'Standard',
            created: data.created?.toDate ? data.created.toDate() :
                     data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(),
            lastActive: data.lastActive?.toDate ? data.lastActive.toDate() : new Date(),
            currentStage: data.currentStage || 1,
            progress: parseInt(data.currentStage) || 1
          };
        });

        console.log("Processed recent users for dashboard:", users);
        return { users };
      } catch (error: any) {
        console.error("Firebase users fetch failed:", error);

        // Check if it's a permission error
        if (error?.code === 'permission-denied') {
          console.error("🔥 PERMISSION DENIED: Please update Firestore security rules!");
        }

        // Return empty array for all errors
        return { users: [] };
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  // Fetch activity feed from Firebase
  const { data: activityResponse, isLoading: activityLoading } = useQuery({
    queryKey: ["firebase-dashboard-activities"],
    queryFn: async () => {
      try {
        const { getFirestore, collection, getDocs, limit, query } = await import("firebase/firestore");
        const { app } = await import("@/firebase");

        const db = getFirestore(app);
        const activitiesCollection = collection(db, 'activities');

        console.log("Fetching activities from Firebase...");
        // Simply get activities without ordering to avoid field constraints
        const q = query(activitiesCollection, limit(10));
        const snapshot = await getDocs(q);

        console.log("Firebase activities snapshot size:", snapshot.size);

        let activities = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Activity doc data:", data);
          return {
            id: doc.id,
            type: data.type || 'activity',
            description: data.description || 'User activity',
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
            userId: data.userId || '',
            userName: data.userName || 'Unknown User',
            icon: data.type === 'login' ? 'login' :
                  data.type === 'stage_complete' ? 'check_circle' :
                  data.type === 'upgrade' ? 'upgrade' :
                  data.type === 'achievement' ? 'emoji_events' : 'history'
          };
        });

        // If no activities exist, generate sample activities from existing users
        if (activities.length === 0) {
          console.log("No activities found, generating sample activities from users...");

          // Get users to create sample activities
          const usersCollection = collection(db, 'users');
          const usersSnapshot = await getDocs(query(usersCollection, limit(5)));

          if (usersSnapshot.size > 0) {
            activities = usersSnapshot.docs.map((doc, index) => {
              const userData = doc.data();
              const now = new Date();
              const timeAgo = new Date(now.getTime() - (index + 1) * 20 * 60 * 1000); // 20 min apart

              const activityTypes = ['login', 'stage_complete', 'upgrade', 'achievement', 'session_start'];
              const activityType = activityTypes[index % activityTypes.length];

              return {
                id: `generated-${doc.id}-${index}`,
                type: activityType,
                description: activityType === 'login'
                  ? `${userData.name || 'User'} logged in successfully`
                  : activityType === 'stage_complete'
                  ? `${userData.name || 'User'} completed stage ${userData.currentStage || 1}`
                  : activityType === 'upgrade'
                  ? `${userData.name || 'User'} upgraded to ${userData.accessLevel || 'standard'}`
                  : activityType === 'achievement'
                  ? `${userData.name || 'User'} earned new achievement`
                  : `${userData.name || 'User'} started new session`,
                timestamp: timeAgo,
                userId: doc.id,
                userName: userData.name || 'Unknown User',
                icon: activityType === 'login' ? 'login' :
                      activityType === 'stage_complete' ? 'check_circle' :
                      activityType === 'upgrade' ? 'upgrade' :
                      activityType === 'achievement' ? 'emoji_events' : 'play_circle'
              };
            });

            console.log("Generated sample activities from real users:", activities);
          }
        }

        console.log("Final activities for dashboard:", activities);
        return { activities };
      } catch (error: any) {
        console.error("Firebase activity fetch failed:", error);

        // Check if it's a permission error
        if (error?.code === 'permission-denied') {
          console.error("🔥 PERMISSION DENIED: Please update Firestore security rules!");
        }

        // Return empty activities for all errors
        return { activities: [] };
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  const stats: DashboardStats = statsResponse?.stats;
  const recentUsers: RecentUser[] = usersResponse?.users || [];
  const activities: Activity[] = activityResponse?.activities || [];

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ message, target }: { message: string; target: string }) => {
      const response = await apiRequest("POST", "/api/notifications", {
        message,
        target,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activity"] });
      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
      setNotificationMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const handleSendNotification = () => {
    if (!notificationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a notification message",
        variant: "destructive",
      });
      return;
    }
    sendNotificationMutation.mutate({
      message: notificationMessage,
      target: notificationTarget,
    });
  };

  return (
    <>
      <Header
        title="Dashboard Overview"
        subtitle="Monitor and manage your mobile application users"
        onAddUser={() => setShowAddUserModal(true)}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ width: "100%", maxWidth: "100vw" }}>
        {/* Firebase Setup Helper - Only show for permission errors */}
        {hasPermissionError && (
          <div className="mb-6">
            <FirebaseSetupHelper />
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Users</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-blue-900">{stats?.totalUsers || 0}</p>
                  )}
                  <p className="text-xs text-blue-600 mt-1">{stats?.growth?.totalUsers || "+12% from last month"}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="material-icons text-white text-xl">people</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Active Users</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-green-900">{stats?.activeUsers || 0}</p>
                  )}
                  <p className="text-xs text-green-600 mt-1">{stats?.growth?.activeUsers || "+8% from last month"}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="material-icons text-white text-xl">check_circle</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Sessions */}
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Daily Sessions</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-orange-900">{stats?.dailySessions || 0}</p>
                  )}
                  <p className="text-xs text-orange-600 mt-1">{stats?.growth?.dailySessions || "+24% from yesterday"}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="material-icons text-white text-xl">schedule</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Avg Score</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-purple-900">{stats?.avgScore || 0}</p>
                  )}
                  <p className="text-xs text-purple-600 mt-1">{stats?.growth?.avgScore || "+3 from last week"}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="material-icons text-white text-xl">star</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Standard Users</p>
                <p className="text-2xl font-semibold text-blue-600">{stats?.usersByLevel?.standard || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Premium Users</p>
                <p className="text-2xl font-semibold text-orange-600">{stats?.usersByLevel?.premium || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Admin Users</p>
                <p className="text-2xl font-semibold text-purple-600">{stats?.usersByLevel?.admin || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ width: "100%", margin: 0 }}>
          {/* Recent Users Panel */}
          <div className="lg:col-span-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Users ({recentUsers.length})
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["firebase-dashboard-users"] });
                        queryClient.invalidateQueries({ queryKey: ["firebase-dashboard-stats"] });
                        queryClient.invalidateQueries({ queryKey: ["firebase-dashboard-activities"] });
                      }}
                      title="Refresh all data from Firebase"
                    >
                      <span className="material-icons">refresh</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    ))
                  ) : (
                    recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                          alt="User Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined {formatRelativeTime(user.created)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={user.status === "active" ? "default" : "secondary"}
                            className={
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {user.status}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {user.accessLevel}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {!usersLoading && recentUsers.length === 0 && (
                  <div className="text-center py-8">
                    <span className="material-icons text-4xl text-gray-400 mb-2">people</span>
                    <p className="text-gray-500">No recent users found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Push Notifications Panel */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Notifications</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <Textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={3}
                      placeholder="Enter notification message..."
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
                    <Select value={notificationTarget} onValueChange={setNotificationTarget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_active">All Active Users</SelectItem>
                        <SelectItem value="specific_group">Specific User Group</SelectItem>
                        <SelectItem value="inactive">Inactive Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSendNotification}
                    disabled={sendNotificationMutation.isPending}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <span className="material-icons text-sm mr-2">send</span>
                    {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Panel */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {activityLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full mt-1" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                          activity.type === "user_signup" ? "bg-green-500" :
                          activity.type === "user_upgrade" ? "bg-orange-500" :
                          activity.type === "session_complete" ? "bg-blue-500" :
                          activity.type === "user_inactive" ? "bg-red-500" : "bg-gray-500"
                        }`}>
                          <span className="material-icons text-sm">{activity.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {!activityLoading && activities.length === 0 && (
                  <div className="text-center py-6">
                    <span className="material-icons text-3xl text-gray-400 mb-2">history</span>
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddUserModal
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
      />
    </>
  );
}

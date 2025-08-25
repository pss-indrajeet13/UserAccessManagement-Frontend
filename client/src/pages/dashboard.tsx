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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard statistics
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-users"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/recent-users");
      if (!response.ok) throw new Error("Failed to fetch recent users");
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch activity feed
  const { data: activityResponse, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/dashboard/activity"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/activity");
      if (!response.ok) throw new Error("Failed to fetch activity feed");
      return response.json();
    },
    refetchInterval: 15000, // Refresh every 15 seconds
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

      <div className="flex-1 overflow-y-auto p-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-users"] })}
                  >
                    <span className="material-icons">refresh</span>
                  </Button>
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
          <div className="space-y-6">
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

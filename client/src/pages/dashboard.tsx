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
import EditUserModal from "@/components/modals/edit-user-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MobileUser, Activity } from "@shared/schema";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

export default function Dashboard() {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTarget, setNotificationTarget] = useState("all_active");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/mobile-users", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/mobile-users?search=${encodeURIComponent(searchQuery)}`
        : "/api/mobile-users?limit=10";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ message, target }: { message: string; target: string }) => {
      const response = await apiRequest("POST", "/api/notifications", {
        message,
        target,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
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

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: "active" | "inactive" }) => {
      const response = await apiRequest("PUT", `/api/mobile-users/${userId}`, {
        status: newStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/mobile-users/${userId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
  });

  const handleEditUser = (user: MobileUser) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleToggleUserStatus = (user: MobileUser) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    toggleUserStatusMutation.mutate({ userId: user.id, newStatus });
  };

  const handleDeleteUser = (user: MobileUser) => {
    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-primary text-xl">people</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalUsers || 0}</p>
                  )}
                  <p className="text-sm text-success">+12% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-success text-xl">check_circle</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats?.activeUsers || 0}</p>
                  )}
                  <p className="text-sm text-success">+8% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-warning text-xl">schedule</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Daily Sessions</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats?.dailySessions || 0}</p>
                  )}
                  <p className="text-sm text-success">+24% from yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-purple-600 text-xl">star</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Score</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats?.avgScore || 0}</p>
                  )}
                  <p className="text-sm text-success">+2.1 from last week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Management Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/mobile-users"] })}
                    >
                      <span className="material-icons">refresh</span>
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Last Active</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {usersLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="ml-3">
                                  <Skeleton className="h-4 w-24 mb-1" />
                                  <Skeleton className="h-3 w-32" />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Skeleton className="h-6 w-16 rounded-full" />
                            </td>
                            <td className="py-4 px-4">
                              <Skeleton className="h-4 w-20" />
                            </td>
                            <td className="py-4 px-4">
                              <Skeleton className="h-4 w-12" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex space-x-2">
                                <Skeleton className="h-6 w-6" />
                                <Skeleton className="h-6 w-6" />
                                <Skeleton className="h-6 w-6" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        users?.slice(0, 5)?.map((user: MobileUser) => (
                          <tr key={user.id}>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <img 
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e5e7eb&color=374151`}
                                  alt="User Avatar" 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge 
                                variant={user.status === "active" ? "default" : "secondary"}
                                className={user.status === "active" 
                                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                  : "bg-red-100 text-red-800 hover:bg-red-100"
                                }
                              >
                                {user.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-500">
                              {formatRelativeTime(new Date(user.lastActive))}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">{user.score}</span>
                                <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-success h-2 rounded-full" 
                                    style={{ width: `${Math.min(user.score, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  className="text-primary hover:text-blue-700 p-1"
                                >
                                  <span className="material-icons text-sm">edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={`p-1 ${user.status === "active" ? "text-warning hover:text-orange-700" : "text-success hover:text-green-700"}`}
                                >
                                  <span className="material-icons text-sm">
                                    {user.status === "active" ? "block" : "check_circle"}
                                  </span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-error hover:text-red-700 p-1"
                                >
                                  <span className="material-icons text-sm">delete</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {users?.length || 0} of {stats?.totalUsers || 0} users
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Panel */}
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
                    className="w-full bg-primary text-white hover:bg-blue-700"
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
                <div className="space-y-3">
                  {activitiesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="w-2 h-2 rounded-full mt-2" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))
                  ) : (
                    activities?.map((activity: Activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === "user_action" ? "bg-success" : 
                          activity.type === "notification" ? "bg-warning" : 
                          activity.type === "admin_action" ? "bg-error" : "bg-primary"
                        }`}></div>
                        <div>
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(new Date(activity.createdAt))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddUserModal 
        open={showAddUserModal} 
        onOpenChange={setShowAddUserModal} 
      />
      
      <EditUserModal 
        open={showEditUserModal} 
        onOpenChange={setShowEditUserModal} 
        user={selectedUser}
      />
    </>
  );
}

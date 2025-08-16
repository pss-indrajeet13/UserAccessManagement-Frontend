import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

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

export default function Notifications() {
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTarget, setNotificationTarget] = useState("all_active");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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

  const getTargetDisplayName = (target: string) => {
    switch (target) {
      case "all_active":
        return "All Active Users";
      case "specific_group":
        return "Specific User Group";
      case "inactive":
        return "Inactive Users";
      default:
        return target;
    }
  };

  const getTargetUserCount = (target: string) => {
    if (!stats) return 0;
    switch (target) {
      case "all_active":
        return stats.activeUsers;
      case "inactive":
        return stats.inactiveUsers;
      case "specific_group":
        return Math.floor(stats.totalUsers * 0.3); // Mock 30% for specific group
      default:
        return stats.totalUsers;
    }
  };

  return (
    <>
      <Header 
        title="Push Notifications" 
        subtitle="Send notifications to your mobile application users"
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-primary text-xl">notifications</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sent</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {notifications?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-success text-xl">people</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Recipients</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.activeUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-warning text-xl">schedule</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {notifications?.filter((n: Notification) => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(n.sentAt) >= weekAgo;
                    }).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Notification Panel */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Send New Notification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <Textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    rows={4}
                    placeholder="Enter your notification message here..."
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {notificationMessage.length}/500 characters
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
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
                  <p className="text-xs text-gray-500 mt-1">
                    This will send to approximately {getTargetUserCount(notificationTarget)} users
                  </p>
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

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <span className="material-icons text-primary mr-2">info</span>
                  <div>
                    <p className="text-sm font-medium text-primary">Notification Tips</p>
                    <ul className="text-xs text-gray-600 mt-2 space-y-1">
                      <li>• Keep messages concise and actionable</li>
                      <li>• Use clear call-to-action phrases</li>
                      <li>• Test with a small group first</li>
                      <li>• Consider user time zones</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification History */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })}
                >
                  <span className="material-icons">refresh</span>
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))
                ) : notifications?.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-icons text-4xl text-gray-400 mb-4">notifications_off</span>
                    <p className="text-gray-500">No notifications sent yet</p>
                    <p className="text-sm text-gray-400">Send your first notification to get started</p>
                  </div>
                ) : (
                  notifications?.map((notification: Notification) => (
                    <div key={notification.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getTargetDisplayName(notification.target)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(new Date(notification.sentAt))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Sent to {getTargetUserCount(notification.target)} users
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span className="text-xs text-green-600">Delivered</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

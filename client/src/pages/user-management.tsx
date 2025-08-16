import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AddUserModal from "@/components/modals/add-user-modal";
import EditUserModal from "@/components/modals/edit-user-modal";
import type { MobileUser } from "@shared/schema";

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

export default function UserManagement() {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/mobile-users", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/mobile-users?search=${encodeURIComponent(searchQuery)}`
        : "/api/mobile-users";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
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

  return (
    <>
      <Header 
        title="User Management" 
        subtitle="Manage mobile application users and their access"
        onAddUser={() => setShowAddUserModal(true)}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
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
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Access Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Current Stage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Last Active</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
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
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-8" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-20" />
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
                    users?.map((user: MobileUser) => (
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
                        <td className="py-4 px-4">
                          <Badge 
                            variant="outline"
                            className={
                              user.accessLevel === "admin" ? "border-purple-200 text-purple-800" :
                              user.accessLevel === "premium" ? "border-orange-200 text-orange-800" :
                              "border-blue-200 text-blue-800"
                            }
                          >
                            {user.accessLevel}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-900">{user.currentStage}</span>
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
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatRelativeTime(new Date(user.lastActive))}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(user.joinedAt).toLocaleDateString()}
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

            {!isLoading && users?.length === 0 && (
              <div className="text-center py-8">
                <span className="material-icons text-4xl text-gray-400 mb-4">people</span>
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
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

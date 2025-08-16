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
import type { MobileUser } from "@shared/schema";

export default function AccessControl() {
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

  const updateUserStageMutation = useMutation({
    mutationFn: async ({ userId, stage }: { userId: string; stage: number }) => {
      const response = await apiRequest("PUT", `/api/mobile-users/${userId}`, {
        currentStage: stage,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "User stage updated successfully",
      });
    },
  });

  const updateAccessLevelMutation = useMutation({
    mutationFn: async ({ userId, accessLevel }: { userId: string; accessLevel: string }) => {
      const response = await apiRequest("PUT", `/api/mobile-users/${userId}`, {
        accessLevel,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "Access level updated successfully",
      });
    },
  });

  const handleStageChange = (user: MobileUser, increment: number) => {
    const newStage = Math.max(1, user.currentStage + increment);
    updateUserStageMutation.mutate({ userId: user.id, stage: newStage });
  };

  const handleAccessLevelChange = (user: MobileUser) => {
    const levels = ["standard", "premium", "admin"];
    const currentIndex = levels.indexOf(user.accessLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    updateAccessLevelMutation.mutate({ userId: user.id, accessLevel: levels[nextIndex] });
  };

  return (
    <>
      <Header 
        title="Access Control" 
        subtitle="Manage user access levels and stage progression"
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-primary text-xl">security</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Standard Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users?.filter((user: MobileUser) => user.accessLevel === "standard").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-warning text-xl">star</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Premium Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users?.filter((user: MobileUser) => user.accessLevel === "premium").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-purple-600 text-xl">admin_panel_settings</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Admin Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users?.filter((user: MobileUser) => user.accessLevel === "admin").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Access Management</h3>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Access Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Current Stage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
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
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-8 w-24" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-8 w-32" />
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccessLevelChange(user)}
                            className={`${
                              user.accessLevel === "admin" ? "border-purple-200 text-purple-800 hover:bg-purple-50" :
                              user.accessLevel === "premium" ? "border-orange-200 text-orange-800 hover:bg-orange-50" :
                              "border-blue-200 text-blue-800 hover:bg-blue-50"
                            }`}
                          >
                            {user.accessLevel}
                          </Button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStageChange(user, -1)}
                              disabled={user.currentStage <= 1}
                            >
                              <span className="material-icons text-sm">remove</span>
                            </Button>
                            <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                              {user.currentStage}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStageChange(user, 1)}
                            >
                              <span className="material-icons text-sm">add</span>
                            </Button>
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
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-primary hover:text-blue-700"
                            >
                              <span className="material-icons text-sm mr-1">visibility</span>
                              View Details
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
                <span className="material-icons text-4xl text-gray-400 mb-4">security</span>
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

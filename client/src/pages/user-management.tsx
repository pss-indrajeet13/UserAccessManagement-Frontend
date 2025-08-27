import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/firebase";
import FirebaseSetupHelper from "@/components/FirebaseSetupHelper";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import AddUserModal from "@/components/modals/add-user-modal";
import EditUserModal from "@/components/modals/edit-user-modal";

interface MobileUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  accessLevel: string; // 'Standard' | 'Premium' | 'Admin' from Firebase
  currentStage: number;
  totalStages: number;
  progress: number;
  createdAt: any;
  lastActive: any;
  location?: string;
  deviceInfo?: string;
  score?: number;
  joinedAt?: any;
}

function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return "Unknown";
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
  const [users, setUsers] = useState<MobileUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const db = getFirestore(app);

  // Fetch users from Firebase in real-time
  useEffect(() => {
    console.log("Setting up User Management Firebase listener...");
    const usersCollection = collection(db, 'users');

    // Use real-time listener without orderBy to avoid field constraints
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      console.log("User Management: Firebase snapshot size =", snapshot.size);

      if (snapshot.empty) {
        console.log("User Management: No users found in Firebase");
        setUsers([]);
        setIsLoading(false);
        return;
      }

      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("User Management: processing user doc =", data);

        return {
          id: doc.id,
          name: data.name || 'Unknown User',
          email: data.email || '',
          phone: data.phone || '',
          status: 'active', // Default to active since Firebase doesn't have status field
          accessLevel: data.accessLevel || 'Standard',
          currentStage: parseInt(data.currentStage) || 1,
          totalStages: data.totalStages || 10,
          progress: (parseInt(data.currentStage) || 1) * 10, // Calculate progress from currentStage
          createdAt: data.created || data.joinedAt, // Use 'created' field from Firebase
          lastActive: data.lastActive,
          location: data.location || '',
          deviceInfo: data.deviceInfo || '',
          score: parseInt(data.currentStage) || 1,
          joinedAt: data.joinedAt || data.created
        };
      }) as MobileUser[];

      console.log("User Management: processed users count =", usersData.length);
      console.log("User Management: users =", usersData);
      setUsers(usersData);
      setIsLoading(false);
      setHasPermissionError(false); // Clear any previous permission errors
    }, (error: any) => {
      console.error("User Management: Error fetching users:", error);
      setIsLoading(false);

      // Check if it's a permission error
      if (error?.code === 'permission-denied') {
        console.error("🔥 PERMISSION DENIED: Please update Firestore security rules!");
        setHasPermissionError(true);

        toast({
          title: "Permission Denied",
          description: "Please update Firestore security rules in Firebase Console",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users from database",
          variant: "destructive",
        });
      }
    });

    return () => {
      console.log("Cleaning up User Management Firebase listener");
      unsubscribe();
    };
  }, [db, toast]);

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditUser = (user: MobileUser) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleToggleUserStatus = async (user: MobileUser) => {
    try {
      const newStatus = user.status === "active" ? "inactive" : "active";
      const userRef = doc(db, 'users', user.id);
      
      await updateDoc(userRef, { 
        status: newStatus,
        lastActive: new Date()
      });

      toast({
        title: "Success",
        description: `User status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: MobileUser) => {
    const confirmMessage = `⚠️ WARNING: This action cannot be undone!\n\nAre you sure you want to permanently delete user "${user.name}" (${user.email})?\n\nThis will remove all their data from the system.`;

    if (confirm(confirmMessage)) {
      try {
        await deleteDoc(doc(db, 'users', user.id));
        
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  const refreshUsers = () => {
    // The real-time listener will automatically refresh the data
    toast({
      title: "Refreshing",
      description: "Users list updated",
    });
  };

  return (
    <>
      <Header 
        title="User Management" 
        subtitle="Manage mobile application users and their access"
        onAddUser={() => setShowAddUserModal(true)}
      />
      
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Firebase Setup Helper */}
        {hasPermissionError && (
          <div className="mb-6">
            <FirebaseSetupHelper />
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                All Users ({users.length})
              </h3>
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
                  onClick={refreshUsers}
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
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Progress</th>
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
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                              alt="User Avatar" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              {user.phone && (
                                <p className="text-xs text-gray-400">{user.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={user.status === "active" ? "default" : "secondary"}
                            className={
                              user.status === "active" ? "bg-green-100 text-green-800" :
                              user.status === "suspended" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant="outline"
                            className={
                              user.accessLevel.toLowerCase() === "admin" ? "border-purple-200 text-purple-800" :
                              user.accessLevel.toLowerCase() === "premium" ? "border-orange-200 text-orange-800" :
                              "border-blue-200 text-blue-800"
                            }
                          >
                            {user.accessLevel}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-900">
                            {user.currentStage}/{user.totalStages}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 mr-2">
                              {user.progress}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(user.progress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatRelativeTime(user.lastActive)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatRelativeTime(user.joinedAt || user.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Edit User"
                            >
                              <span className="material-icons text-sm">edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user)}
                              className={`p-1 ${user.status === "active" ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}`}
                              title={user.status === "active" ? "Deactivate User" : "Activate User"}
                            >
                              <span className="material-icons text-sm">
                                {user.status === "active" ? "block" : "check_circle"}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete User"
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

            {!isLoading && filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <span className="material-icons text-4xl text-gray-400 mb-4">people</span>
                <p className="text-gray-500">
                  {searchQuery ? "No users found matching your search" : "No users found"}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Clear Search
                  </Button>
                )}
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

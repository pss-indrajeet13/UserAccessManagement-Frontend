import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { app } from "@/firebase";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

// Initialize Firestore using shared Firebase app
const db = getFirestore(app);

interface MobileUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  accessLevel: 'standard' | 'premium' | 'admin';
  currentStage: number;
  totalStages: number;
  progress: number; // percentage
  createdAt: any;
  lastActive: any;
  profilePicture?: string;
  location?: string;
  deviceInfo?: string;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  type: 'login' | 'stage_complete' | 'upgrade' | 'achievement' | 'session_start' | 'session_end';
  description: string;
  timestamp: any;
  metadata?: any;
}

export default function AccessControl() {
  const [users, setUsers] = useState<MobileUser[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { toast } = useToast();

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    accessLevel: 'standard' as const,
    location: '',
    deviceInfo: ''
  });

  // New activity form state
  const [newActivity, setNewActivity] = useState({
    type: 'login' as const,
    description: ''
  });

  // Fetch users from Firebase
  useEffect(() => {
    const usersCollection = collection(db, 'users');

    // Remove orderBy to avoid field constraints
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MobileUser[];
      setUsers(usersData);
      setIsLoading(false);
    }, (error: any) => {
      console.error("Access Control: Error fetching users:", error);
      setIsLoading(false);

      // Check if it's a permission error
      if (error?.code === 'permission-denied') {
        console.error("🔥 PERMISSION DENIED: Please update Firestore security rules!");
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

    return () => unsubscribe();
  }, [toast]);

  // Fetch activities from Firebase
  useEffect(() => {
    const activitiesCollection = collection(db, 'activities');

    // Remove orderBy to avoid field constraints
    const unsubscribe = onSnapshot(activitiesCollection, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserActivity[];
      setActivities(activitiesData.slice(0, 20)); // Show last 20 activities
    }, (error: any) => {
      console.error("Access Control: Error fetching activities:", error);

      // Check if it's a permission error
      if (error?.code === 'permission-denied') {
        console.error("🔥 PERMISSION DENIED: Please update Firestore security rules!");
        toast({
          title: "Permission Denied",
          description: "Please update Firestore security rules in Firebase Console",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch activities from database",
          variant: "destructive",
        });
      }
    });

    return () => unsubscribe();
  }, [toast]);

  // Add sample users
  const addSampleUsers = async () => {
    try {
      const sampleUsers = [
        {
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "+1234567890",
          status: "active",
          accessLevel: "standard",
          currentStage: 3,
          totalStages: 10,
          progress: 30,
          location: "New York, USA",
          deviceInfo: "iPhone 12 Pro",
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        },
        {
          name: "Jane Smith",
          email: "jane.smith@example.com",
          phone: "+0987654321",
          status: "active",
          accessLevel: "premium",
          currentStage: 7,
          totalStages: 10,
          progress: 70,
          location: "London, UK",
          deviceInfo: "Samsung Galaxy S21",
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        }
      ];

      for (const user of sampleUsers) {
        await addDoc(collection(db, 'users'), user);
        
        // Add sample activity for each user
        await addDoc(collection(db, 'activities'), {
          userId: 'new-user',
          userName: user.name,
          type: 'login',
          description: `${user.name} signed up and logged in`,
          timestamp: serverTimestamp(),
          metadata: { device: user.deviceInfo, location: user.location }
        });
      }

      toast({
        title: "Success",
        description: "Sample users added successfully!",
      });
    } catch (error) {
      console.error("Error adding sample users:", error);
      toast({
        title: "Error",
        description: "Failed to add sample users",
        variant: "destructive",
      });
    }
  };

  // Add new user
  const handleAddUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.phone) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const userData = {
        ...newUser,
        status: "active",
        currentStage: 1,
        totalStages: 10,
        progress: 10,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'users'), userData);
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        userId: docRef.id,
        userName: newUser.name,
        type: 'login',
        description: `${newUser.name} joined the platform`,
        timestamp: serverTimestamp(),
        metadata: { device: newUser.deviceInfo, location: newUser.location }
      });

      setShowAddUserModal(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        accessLevel: 'standard',
        location: '',
        deviceInfo: ''
      });

      toast({
        title: "Success",
        description: "User added successfully!",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    }
  };

  // Update user status
  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        status: newStatus,
        lastActive: serverTimestamp()
      });

      const user = users.find(u => u.id === userId);
      if (user) {
        await addDoc(collection(db, 'activities'), {
          userId,
          userName: user.name,
          type: 'upgrade',
          description: `${user.name}'s status changed to ${newStatus}`,
          timestamp: serverTimestamp()
        });
      }

      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // Update user stage
  const updateUserStage = async (userId: string, increment: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newStage = Math.max(1, Math.min(user.totalStages, user.currentStage + increment));
      const newProgress = (newStage / user.totalStages) * 100;

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        currentStage: newStage,
        progress: newProgress,
        lastActive: serverTimestamp()
      });

      await addDoc(collection(db, 'activities'), {
        userId,
        userName: user.name,
        type: 'stage_complete',
        description: `${user.name} ${increment > 0 ? 'advanced to' : 'moved back to'} stage ${newStage}`,
        timestamp: serverTimestamp(),
        metadata: { previousStage: user.currentStage, newStage }
      });

      toast({
        title: "Success",
        description: "User stage updated successfully",
      });
    } catch (error) {
      console.error("Error updating stage:", error);
      toast({
        title: "Error",
        description: "Failed to update user stage",
        variant: "destructive",
      });
    }
  };

  // Add custom activity
  const handleAddActivity = async () => {
    try {
      if (!selectedUser || !newActivity.description) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }

      await addDoc(collection(db, 'activities'), {
        userId: selectedUser.id,
        userName: selectedUser.name,
        type: newActivity.type,
        description: newActivity.description,
        timestamp: serverTimestamp()
      });

      setShowActivityModal(false);
      setNewActivity({ type: 'login', description: '' });
      setSelectedUser(null);

      toast({
        title: "Success",
        description: "Activity added successfully!",
      });
    } catch (error) {
      console.error("Error adding activity:", error);
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRelativeTime = (timestamp: any): string => {
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
  };

  return (
    <>
      <Header 
        title="Access Control" 
        subtitle="Manage mobile users, permissions, and track their activities"
      />
      
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-blue-600 text-xl">people</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-green-600 text-xl">check_circle</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users.filter(user => user.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-orange-600 text-xl">star</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Premium Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users.filter(user => user.accessLevel === "premium").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-purple-600 text-xl">timeline</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.progress, 0) / users.length) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Mobile Users Management</CardTitle>
                  <div className="flex space-x-2">
                    <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
                      <DialogTrigger asChild>
                        <Button size="sm">Add User</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Mobile User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                              id="name"
                              value={newUser.name}
                              onChange={(e) => setNewUser(prev => ({...prev, name: e.target.value}))}
                              placeholder="Enter user name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                              placeholder="Enter email address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                              id="phone"
                              value={newUser.phone}
                              onChange={(e) => setNewUser(prev => ({...prev, phone: e.target.value}))}
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="accessLevel">Access Level</Label>
                            <Select value={newUser.accessLevel} onValueChange={(value: any) => setNewUser(prev => ({...prev, accessLevel: value}))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={newUser.location}
                              onChange={(e) => setNewUser(prev => ({...prev, location: e.target.value}))}
                              placeholder="Enter location"
                            />
                          </div>
                          <div>
                            <Label htmlFor="device">Device Info</Label>
                            <Input
                              id="device"
                              value={newUser.deviceInfo}
                              onChange={(e) => setNewUser(prev => ({...prev, deviceInfo: e.target.value}))}
                              placeholder="Enter device information"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddUser}>Add User</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="outline" onClick={addSampleUsers}>
                      Add Sample Users
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                        <img 
                          src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                          alt="User Avatar" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">{user.location}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${user.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              Stage {user.currentStage}/{user.totalStages}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
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
                          <Badge variant="outline" className="block">
                            {user.accessLevel}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserStage(user.id, -1)}
                              disabled={user.currentStage <= 1}
                            >
                              <span className="material-icons text-sm">remove</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserStage(user.id, 1)}
                              disabled={user.currentStage >= user.totalStages}
                            >
                              <span className="material-icons text-sm">add</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowActivityModal(true);
                              }}
                            >
                              <span className="material-icons text-sm">add_task</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {!isLoading && filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <span className="material-icons text-4xl text-gray-400 mb-4">people</span>
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        activity.type === "login" ? "bg-green-500" :
                        activity.type === "stage_complete" ? "bg-blue-500" :
                        activity.type === "upgrade" ? "bg-orange-500" :
                        activity.type === "achievement" ? "bg-purple-500" : "bg-gray-500"
                      }`}>
                        <span className="material-icons text-sm">
                          {activity.type === "login" ? "login" :
                           activity.type === "stage_complete" ? "check_circle" :
                           activity.type === "upgrade" ? "upgrade" :
                           activity.type === "achievement" ? "emoji_events" : "history"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {activities.length === 0 && (
                  <div className="text-center py-6">
                    <span className="material-icons text-3xl text-gray-400 mb-2">history</span>
                    <p className="text-gray-500 text-sm">No recent activities</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Activity for {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="activityType">Activity Type</Label>
              <Select value={newActivity.type} onValueChange={(value: any) => setNewActivity(prev => ({...prev, type: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="stage_complete">Stage Complete</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="session_start">Session Start</SelectItem>
                  <SelectItem value="session_end">Session End</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({...prev, description: e.target.value}))}
                placeholder="Enter activity description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivity}>Add Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

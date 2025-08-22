// // C:\PSS\UserAccessManager\client\src\components\modals\add-user-modal.tsx
// import { useState } from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest } from "@/lib/queryClient";
// import type { InsertMobileUser } from "@shared/schema";

// interface AddUserModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export default function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
//   const [formData, setFormData] = useState<InsertMobileUser>({
//     name: "",
//     email: "",
//     status: "active",
//     accessLevel: "standard",
//   });

//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const createUserMutation = useMutation({
//     mutationFn: async (userData: InsertMobileUser) => {
//       const response = await apiRequest("POST", "/api/mobile-users", userData);
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/mobile-users"] });
//       queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
//       toast({
//         title: "Success",
//         description: "User created successfully",
//       });
//       onOpenChange(false);
//       setFormData({
//         name: "",
//         email: "",
//         status: "active",
//         accessLevel: "standard",
//       });
//     },
//     onError: () => {
//       toast({
//         title: "Error",
//         description: "Failed to create user",
//         variant: "destructive",
//       });
//     },
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData.name || !formData.email) {
//       toast({
//         title: "Error",
//         description: "Please fill in all required fields",
//         variant: "destructive",
//       });
//       return;
//     }
//     createUserMutation.mutate(formData);
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle className="flex items-center">
//             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
//               <span className="material-icons text-primary">person_add</span>
//             </div>
//             Add New User
//           </DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <Label htmlFor="name">Full Name</Label>
//             <Input
//               id="name"
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               placeholder="Enter full name"
//               required
//             />
//           </div>
//           <div>
//             <Label htmlFor="email">Email Address</Label>
//             <Input
//               id="email"
//               type="email"
//               value={formData.email}
//               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//               placeholder="Enter email address"
//               required
//             />
//           </div>
//           <div>
//             <Label htmlFor="status">Initial Status</Label>
//             <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}>
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="active">Active</SelectItem>
//                 <SelectItem value="inactive">Inactive</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <Label htmlFor="accessLevel">Access Level</Label>
//             <Select value={formData.accessLevel} onValueChange={(value: "standard" | "premium" | "admin") => setFormData({ ...formData, accessLevel: value })}>
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="standard">Standard User</SelectItem>
//                 <SelectItem value="premium">Premium User</SelectItem>
//                 <SelectItem value="admin">Admin</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="flex justify-end space-x-2 pt-4">
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={createUserMutation.isPending}>
//               {createUserMutation.isPending ? "Creating..." : "Create User"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }








// C:\PSS\UserAccessManager\client\src\components\modals\add-user-modal.tsx
import { useState } from "react";
import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface InsertMobileUser {
  name: string;
  email: string;
  status: "active" | "inactive";
  accessLevel: "standard" | "premium" | "admin";
}

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
  const [formData, setFormData] = useState<InsertMobileUser>({
    name: "",
    email: "",
    status: "active",
    accessLevel: "standard",
  });

  const queryClient = useQueryClient();

  // React Query mutation
  const createUserMutation: UseMutationResult<any, any, InsertMobileUser, unknown> = useMutation({
    mutationFn: (userData: InsertMobileUser) => apiRequest("POST", "/api/mobile-users", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-users"] });
      onOpenChange(false);
      setFormData({ name: "", email: "", status: "active", accessLevel: "standard" });
      alert("User created successfully!");
    },
    onError: (err: any) => {
      alert("Failed to create user: " + (err.message || ""));
    },
  });

  // Use mutation status
  const isLoading = createUserMutation.status === "pending";

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      return alert("Please fill in all fields");
    }
    createUserMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="accessLevel">Access Level</Label>
            <Select
              value={formData.accessLevel}
              onValueChange={(value: "standard" | "premium" | "admin") =>
                setFormData({ ...formData, accessLevel: value })
              }
            >
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
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isLoading ? "Creating..." : "Create User"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

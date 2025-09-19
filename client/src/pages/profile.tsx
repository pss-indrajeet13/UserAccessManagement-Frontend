import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// Import Poppins font
import "@fontsource/poppins";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";

import ProfileIllustration from "@/Assets/Profile-screen/Illustrate_profile.png";


// Reusable Header
import Header from "@/components/layout/header";

// Define the notification keys type
type NotificationKeys = 'criticalSystem' | 'participantsUpdates' | 'dailyDigest' | 'systemMaintenance' | 'newFeatures';

export default function Profile() {
  const [profile, setProfile] = useState({
    fullName: "Dr. Neelima Researcher",
    email: "neelima@researcher.edu",
    mobileNumber: "+91-000-000-0000",
    institute: "University Research Center",
    currentRole: "Research Administrator",
    lastLogin: "23 Aug 2025 10:55 AM",
  });

  const [notifications, setNotifications] = useState({
    criticalSystem: true,
    participantsUpdates: false,
    dailyDigest: false,
    systemMaintenance: false,
    newFeatures: false,
  });

  const handleSwitchChange = (key: NotificationKeys) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="font-poppins bg-gray-100 min-h-screen">
      {/* Fixed Top Header */}
      <Header
        title="Profile & Settings"
        subtitle="Manage your account and preference settings"
        onAddUser={() => {}}
      />

      {/* Dashboard content */}
      <main className="p-6">
        {/* Profile Settings Card */}
        <Card className="bg-white rounded-2xl shadow-md mb-6">
          <CardHeader className="pb-2 border-b border-[#125566]">
            <CardTitle className="text-lg font-semibold text-[#125566]">
              Profile Settings
            </CardTitle>
            <p className="text-sm text-gray-500">
              Update your personal information and account details
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-3xl text-gray-500">NR</span>
              </div>
              <div>
                <Button variant="outline" size="sm" className="text-[#125566]">
                  <span>Upload Photo</span>
                  <span className="ml-2 text-xs text-gray-500">
                    JPG, PNG up to 2 MB
                  </span>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  className="mt-1 p-2 w-full border border-[#125566] rounded-lg bg-gray-50 text-gray-700"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email ID
                </label>
                <input
                  type="email"
                  value={profile.email}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={profile.mobileNumber}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Institute
                </label>
                <input
                  type="text"
                  value={profile.institute}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Role
                </label>
                <input
                  type="text"
                  value={profile.currentRole}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Login
                </label>
                <input
                  type="text"
                  value={profile.lastLogin}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  readOnly
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 flex justify-end space-x-4">
            <Button variant="outline" className="text-gray-500">
              Cancel
            </Button>
            <Button className="bg-[#125566] text-white hover:bg-[#0e3f4c]">
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Security Card */}
        <Card className="bg-white rounded-2xl shadow-md mb-6">
          <CardHeader className="pb-2 border-b border-[#125566]">
            <CardTitle className="text-lg font-semibold text-[#125566]">
              Security
            </CardTitle>
            <p className="text-sm text-gray-500">
              Manage your accounts security changes
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button className="w-full bg-[#125566] text-white hover:bg-[#0e3f4c]">
              Change Password
            </Button>
            <Button variant="outline" className="w-full text-[#125566] border-[#125566] hover:bg-gray-100">
              Enable 2FA
            </Button>
          </CardContent>
        </Card>

        {/* Active Sessions Card */}
        <Card className="bg-white rounded-2xl shadow-md mb-6">
          <CardHeader className="pb-2 border-b border-[#125566]">
            <CardTitle className="text-lg font-semibold text-[#125566]">
              Active Sessions
            </CardTitle>
            <p className="text-sm text-gray-500">Check your Sessions Activity</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">Current Sessions</p>
              <p className="text-sm text-gray-500">Chrome on windows</p>
              <p className="text-sm text-gray-500">Last Action: Now</p>
            </div>
            <Button className="w-full bg-[#125566] text-white hover:bg-[#0e3f4c]">
              View All Sessions
            </Button>
          </CardContent>
        </Card>

        {/* Notifications & Preferences Card */}
        <Card className="bg-white rounded-2xl shadow-md mb-6">
          <CardHeader className="pb-2 border-b border-[#125566]">
            <CardTitle className="text-lg font-semibold text-[#125566]">
              Notifications & Preference
            </CardTitle>
            <p className="text-sm text-gray-500">
              Configure how you receive updates and alerts
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email Alerts</span>
              <Switch
                checked={notifications.criticalSystem}
                onCheckedChange={() => handleSwitchChange("criticalSystem")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Critical System Notifications</span>
              <Switch
                checked={notifications.criticalSystem}
                onCheckedChange={() => handleSwitchChange("criticalSystem")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Participants Updates</span>
              <Switch
                checked={notifications.participantsUpdates}
                onCheckedChange={() => handleSwitchChange("participantsUpdates")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">New registration and milestones</span>
              <Switch
                checked={notifications.participantsUpdates}
                onCheckedChange={() => handleSwitchChange("participantsUpdates")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Daily Digest</span>
              <Switch
                checked={notifications.dailyDigest}
                onCheckedChange={() => handleSwitchChange("dailyDigest")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Daily summary emails</span>
              <Switch
                checked={notifications.dailyDigest}
                onCheckedChange={() => handleSwitchChange("dailyDigest")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">System Maintenance</span>
              <Switch
                checked={notifications.systemMaintenance}
                onCheckedChange={() => handleSwitchChange("systemMaintenance")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Schedule downtime notice</span>
              <Switch
                checked={notifications.systemMaintenance}
                onCheckedChange={() => handleSwitchChange("systemMaintenance")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">New Features</span>
              <Switch
                checked={notifications.newFeatures}
                onCheckedChange={() => handleSwitchChange("newFeatures")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Product updates and announcements</span>
              <Switch
                checked={notifications.newFeatures}
                onCheckedChange={() => handleSwitchChange("newFeatures")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Card */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="pb-2 border-b border-[#125566]">
            <CardTitle className="text-lg font-semibold text-[#125566]">
              Delete Account
            </CardTitle>
            <p className="text-sm text-gray-500">
              Permanently delete your account & data
            </p>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={ProfileIllustration} alt="Delete account illustration" className="w-32 h-32" />
              <div>
                <p className="text-sm text-gray-500">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account & data</p>
              </div>
            </div>
            <Button variant="destructive" className="bg-red-500 text-white hover:bg-red-600">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
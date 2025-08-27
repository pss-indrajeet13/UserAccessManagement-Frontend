import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/users", label: "User Management", icon: "people" },
  { path: "/access", label: "Access Control", icon: "security" },
  { path: "/notifications", label: "Push Notifications", icon: "notifications" },
  { path: "/reports", label: "Session Reports", icon: "assessment" },
  { path: "/analytics", label: "Analytics", icon: "analytics" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed top-0 left-0 w-64 bg-white shadow-lg h-screen overflow-y-hidden">
      {/* Logo & Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">FW</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Fertiwell</h1>
            <p className="text-sm text-gray-500">User Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span
                  className={cn(
                    "material-icons mr-3",
                    isActive ? "text-blue-600" : "text-gray-400"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
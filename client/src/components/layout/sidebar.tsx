import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    path: "/users",
    label: "User Management",
    icon: "people",
  },
  {
    path: "/access",
    label: "Access Control",
    icon: "security",
  },
  {
    path: "/notifications",
    label: "Push Notifications",
    icon: "notifications",
  },
  {
    path: "/reports",
    label: "Session Reports",
    icon: "assessment",
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: "analytics",
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-surface shadow-lg flex-shrink-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-icons text-white text-xl">apps</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">MobileAdmin</h1>
            <p className="text-sm text-gray-500">User Management</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <a
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <span
                      className={cn(
                        "material-icons mr-3",
                        isActive ? "text-primary" : "text-gray-400"
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}

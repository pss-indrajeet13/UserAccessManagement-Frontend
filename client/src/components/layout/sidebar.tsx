import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/Assets/Sidebar-screen/Fertiliwell-Logo-1.svg";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: "home" },
  { path: "/chapters", label: "Chapters", icon: "menu_book" },
  { path: "/participants", label: "Participants", icon: "group" },
  { path: "/calendar", label: "Calendar", icon: "calendar_today" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-[#125566] text-white flex flex-col justify-between">
      <div className="p-6 flex justify-center items-center">
        <img src={Logo} alt="App Logo" className="h-12 object-contain" />
      </div>

      <nav className="px-2 flex-1">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path || (item.path === '/participants' && location.startsWith('/participants'));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group flex items-center px-4 py-2 text-sm font-poppins rounded-md transition-colors",
                  isActive ? "bg-[#5FB3B3] text-white" : "hover:bg-[#5FB3B34D] hover:text-white"
                )}
              >
                <span className={cn("material-icons mr-3", isActive && "text-white")}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-poppins rounded-md transition-colors hover:bg-[#5FB3B34D] hover:text-white"
          >
            <span className="material-icons mr-3">exit_to_app</span>
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}

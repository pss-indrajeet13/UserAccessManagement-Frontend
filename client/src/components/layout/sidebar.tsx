// src/components/layout/sidebar.tsx
// This React component defines a fixed sidebar for a web application.
// It includes navigation links, a logo, and a logout button.
import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/Assets/Sidebar-screen/Fertiliwell-Logo-1.svg";

// Defines the main navigation links for the sidebar.
// Each object contains a path for routing, a display label, and an icon name.
const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: "home" },
  { path: "/chapters", label: "Chapters", icon: "menu_book" },
  { path: "/participants", label: "Participants", icon: "group" },
  { path: "/calendar", label: "Calendar", icon: "calendar_today" },
];

// The Sidebar functional component.
// It uses Wouter for routing and a custom authentication hook to manage state.
export default function Sidebar() {
  // `useLocation` from Wouter provides the current URL path.
  const [location, setLocation] = useLocation();
  // `useAuth` is a custom hook that provides access to authentication-related functions, like `logout`.
  const { logout } = useAuth();

  // `handleLogout` is an asynchronous function that logs the user out.
  // It calls the `logout` function and then redirects the user to the `/login` page.
  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    // The main `aside` element for the sidebar, styled with Tailwind CSS.
    // It's a fixed-position container with a dark background and a column layout.
    <aside className="fixed top-0 left-0 w-64 h-screen bg-[#125566] text-white flex flex-col justify-between">
      {/* Top section containing the application's logo. */}
      <div className="p-6 flex justify-center items-center">
        <img src={Logo} alt="App Logo" className="h-12 object-contain" />
      </div>

      {/* Main navigation area. */}
      <nav className="px-2 flex-1">
        <div className="space-y-2">
          {/* Dynamically renders navigation links from the `navigationItems` array. */}
          {navigationItems.map((item) => {
            // Checks if a link is active based on the current URL.
            // It also handles a special case for the `/participants` path to match sub-routes.
            const isActive = location === item.path || (item.path === '/participants' && location.startsWith('/participants'));
            return (
              // The `Link` component from Wouter is used for navigation.
              <Link
                key={item.path}
                href={item.path}
                // Applies conditional styling using the `cn` utility function.
                // The active link gets a different background color and text style.
                className={cn(
                  "group flex items-center px-4 py-2 text-sm font-poppins rounded-md transition-colors",
                  isActive ? "bg-[#5FB3B3] text-white" : "hover:bg-[#5FB3B34D] hover:text-white"
                )}
              >
                {/* Icon and label for the navigation item. */}
                <span className={cn("material-icons mr-3", isActive && "text-white")}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          
          {/* A button for logging out, styled similarly to the navigation links. */}
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
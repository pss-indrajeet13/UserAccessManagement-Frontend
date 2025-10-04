// C:\PSS\UserAccessManager\client\src\components\layout\header.tsx
// Header component for the application layout. It includes a search bar, a notifications button, and a user profile image.
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Link } from "wouter"; // `Link` component from Wouter for client-side navigation.

// Defines the props for the Header component.
// `title` and `subtitle` are strings for display.
// `onAddUser` is an optional function to handle adding a new user.
interface HeaderProps {
  title: string;
  subtitle: string;
  onAddUser?: () => void;
}

// The Header component. It receives props to customize its content.
export default function Header({ title, subtitle, onAddUser }: HeaderProps) {
  return (
    // The main header element, styled with a light background and a subtle shadow.
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Container for the search bar. */}
        <div className="flex items-center space-x-4">
          {/* A search input field with a placeholder and specific styling for a modern look. */}
          <input
            type="text"
            placeholder="Search anything here..."
            className="p-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 placeholder-gray-500 w-64 focus:outline-none focus:ring-2 focus:ring-[#5FB3B3]"
          />
        </div>
        {/* Container for the right-side icons (notifications and profile). */}
        <div className="flex items-center space-x-4">
          {/* A `Link` from Wouter that wraps the notifications button. Clicking this will navigate to the `/notifications` route. */}
          <Link href="/notifications">
            <Button className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
              {/* Bell icon from `lucide-react`. */}
              <Bell className="h-5 w-5" />
            </Button>
          </Link>

          {/* A `Link` from Wouter that wraps the user's profile image. Clicking this will navigate to the `/profile` route. */}
          <Link href="/profile">
            <img 
              src="https://plus.unsplash.com/premium_photo-1661378616433-bff991a9a272?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
              alt="Admin Profile" 
              className="w-8 h-8 rounded-full object-cover border-2 border-green-400 cursor-pointer"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
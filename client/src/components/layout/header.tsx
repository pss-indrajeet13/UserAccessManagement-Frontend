// C:\PSS\UserAccessManager\client\src\components\layout\header.tsx
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Link } from "wouter"; // import Link from wouter

interface HeaderProps {
  title: string;
  subtitle: string;
  onAddUser?: () => void;
}

export default function Header({ title, subtitle, onAddUser }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search anything here..."
            className="p-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 placeholder-gray-500 w-64 focus:outline-none focus:ring-2 focus:ring-[#5FB3B3]"
          />
        </div>
        <div className="flex items-center space-x-4">
          <Button className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Wrap profile image in a Link */}
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

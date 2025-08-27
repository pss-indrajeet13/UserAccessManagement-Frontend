// C:\PSS\UserAccessManager\client\src\components\layout\header.tsx
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
  onAddUser?: () => void;
}

export default function Header({ title, subtitle, onAddUser }: HeaderProps) {
  return (
    <header className="bg-surface shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            {onAddUser && (
              <Button onClick={onAddUser} className="bg-primary text-white hover:bg-blue-700">
                <span className="material-icons text-sm mr-2">add</span>
                Add User
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" 
                alt="Admin Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Admin Name</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

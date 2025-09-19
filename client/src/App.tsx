import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Sidebar from "@/components/layout/sidebar";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import UserManagement from "@/pages/user-management";
import AccessControl from "@/pages/access-control";
import Notifications from "@/pages/notifications";
import Reports from "@/pages/reports";
import Chapters from "@/pages/chapters";
import Profile from "@/pages/profile";
import Participants from "@/pages/participants";
import Calendar from "@/pages/calendar";
import NotFound from "@/pages/not-found";
import ParticipantProfile from "@/pages/ParticipantProfile";
import JournalsContent from "@/pages/JournalsContent";
import PersonalDetailsContent from "@/pages/PersonalDetailsContent";
import OverviewContent from "@/pages/OverviewContent";


// Auth context
import { AuthProvider, useAuth } from "./context/AuthContext";

// 🔐 PrivateRoute wrapper
function PrivateRoute({ component: Component }: { component: React.FC }) {
  const { user, isLoading } = useAuth(); // Destructure isLoading from the auth context

  // Check if the auth state is still loading
  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner/loading component
  }

  if (!user) return <Redirect to="/login" />;

  return (
    <div className="h-screen">
      <Sidebar />
      <main className="absolute top-0 left-64 right-0 bottom-0 overflow-auto">
        <Component />
      </main>
    </div>
  );
}

// Main router
function Router() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <Switch>
        {/* Redirect root */}
        <Route path="/">
          {() => (user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />)}
        </Route>

        {/* Public route */}
        <Route path="/login" component={Login} />

        {/* Protected routes */}
        <Route path="/dashboard" component={() => <PrivateRoute component={Dashboard} />} />
        <Route path="/users" component={() => <PrivateRoute component={UserManagement} />} />
        <Route path="/access" component={() => <PrivateRoute component={AccessControl} />} />
        <Route path="/notifications" component={() => <PrivateRoute component={Notifications} />} />
        <Route path="/reports" component={() => <PrivateRoute component={Reports} />} />
        <Route path="/chapters" component={() => <PrivateRoute component={Chapters} />} />
        <Route path="/participants" component={() => <PrivateRoute component={Participants} />} />
        <Route path="/calendar" component={() => <PrivateRoute component={Calendar} />} />
        <Route path="/profile" component={() => <PrivateRoute component={Profile} />} />
        
        {/* Consolidated Participant Profile route with a wildcard */}
        <Route path="/participants/:uid/:page?" component={() => <PrivateRoute component={ParticipantProfile} />} />

        {/* Catch-all */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

// App wrapper
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

// client/src/App.tsx
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
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

// Auth context
import { AuthProvider, useAuth } from "./context/AuthContext";

// 🔐 PrivateRoute wrapper
function PrivateRoute({ component: Component }: { component: React.FC }) {
  const { user } = useAuth();

  if (!user) return <Redirect to="/login" />;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
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
        <Route path="/analytics" component={() => <PrivateRoute component={Analytics} />} />

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

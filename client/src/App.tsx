import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

import Sidebar from "./components/layout/sidebar";

// Pages
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import UserManagement from "./pages/user-management";
import AccessControl from "./pages/access-control";
import Notifications from "./pages/notifications";
import Reports from "./pages/reports";
import Chapters from "./pages/chapters";
import Profile from "./pages/profile";
import Participants from "./pages/participants";
import Calendar from "./pages/calendar";
import NotFound from "./pages/not-found";
import ParticipantProfile from "./pages/ParticipantProfile";
import JournalsContent from "./pages/JournalsContent";
import PersonalDetailsContent from "./pages/PersonalDetailsContent";
import OverviewContent from "./pages/OverviewContent";
import Demo0 from './pages/demographics/demo_0.tsx';
import Demo13 from './pages/demographics/demo_13.tsx';
import Demo28 from './pages/demographics/demo_28.tsx';
import Privacy from './pages/privacy.tsx';

// Auth context
import { AuthProvider, useAuth } from "./context/AuthContext";
import { query } from "firebase/firestore";
import { queryClient } from "./lib/queryClient.ts";

// 🔐 PrivateRoute wrapper
// This component is now modified to correctly accept and pass down any props
// from the wouter Route component.
function PrivateRoute({ component: Component, ...rest }: { component: React.FC<any> }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner/loading component
  }

  if (!user) return <Redirect to="/login" />;

  return (
    <div className="h-screen">
      <Sidebar />
      <main className="absolute top-0 left-64 right-0 bottom-0 overflow-auto">
        {/*
          The component is rendered here, and all the rest of the props
          (including the params from the route) are passed down.
        */}
        <Component {...rest} />
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
        <Route path="/participants/:uid/demographics/day-0" component={() => <PrivateRoute component={Demo0} />} />
        <Route path="/participants/:uid/journals" component={() => <PrivateRoute component={JournalsContent} />} />
        <Route path="/participants/:uid/personal-details" component={() => <PrivateRoute component={PersonalDetailsContent} />} />
        <Route path="/participants/:uid/overview" component={() => <PrivateRoute component={OverviewContent} />} />
        <Route path="/participants/:uid/demographics/day-13" component={() => <PrivateRoute component={Demo13} />} />
        <Route path="/participants/:uid/demographics/day-28" component={() => <PrivateRoute component={Demo28} />} />
        <Route path="/privacy" component={Privacy} />

        {/*
          Consolidated Participant Profile route. This single route handles
          all sub-pages for a participant.
          The `PrivateRoute` now correctly receives and forwards the `params`
          object to the `ParticipantProfile` component.
        */}
        <Route path="/participants/:uid/:page?" component={(params) => <PrivateRoute component={ParticipantProfile} {...params} />} />

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
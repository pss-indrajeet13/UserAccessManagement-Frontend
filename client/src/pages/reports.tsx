import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session, MobileUser } from "@shared/schema";

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterCompleted, setFilterCompleted] = useState("all");

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/mobile-users"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Create a map of user IDs to user objects for quick lookup
  const userMap = users?.reduce((acc: Record<string, MobileUser>, user: MobileUser) => {
    acc[user.id] = user;
    return acc;
  }, {}) || {};

  // Filter sessions based on search and filters
  const filteredSessions = sessions?.filter((session: Session) => {
    const user = userMap[session.userId];
    if (!user) return false;

    // Search filter
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Stage filter
    if (filterStage !== "all" && session.stage !== parseInt(filterStage)) {
      return false;
    }

    // Completion filter
    if (filterCompleted !== "all") {
      const isCompleted = session.completed;
      if (filterCompleted === "completed" && !isCompleted) return false;
      if (filterCompleted === "incomplete" && isCompleted) return false;
    }

    return true;
  }) || [];

  // Calculate session statistics
  const sessionStats = {
    totalSessions: filteredSessions.length,
    completedSessions: filteredSessions.filter((s: Session) => s.completed).length,
    averageDuration: filteredSessions.length > 0 
      ? Math.round(filteredSessions.reduce((sum: number, s: Session) => sum + s.duration, 0) / filteredSessions.length)
      : 0,
    averageScore: filteredSessions.length > 0 
      ? Math.round(filteredSessions.reduce((sum: number, s: Session) => sum + s.score, 0) / filteredSessions.length)
      : 0,
  };

  return (
    <>
      <Header 
        title="Session Reports" 
        subtitle="Detailed reports on user session data and performance"
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-primary text-xl">assignment</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {sessionStats.totalSessions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-success text-xl">check_circle</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {sessionStats.completedSessions}
                  </p>
                  <p className="text-sm text-gray-500">
                    {sessionStats.totalSessions > 0 
                      ? `${Math.round((sessionStats.completedSessions / sessionStats.totalSessions) * 100)}% completion rate`
                      : "No sessions"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-warning text-xl">schedule</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Duration</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatDuration(sessionStats.averageDuration)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-purple-600 text-xl">star</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Score</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {sessionStats.averageScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Session Table */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48"
                />
                
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="1">Stage 1</SelectItem>
                    <SelectItem value="2">Stage 2</SelectItem>
                    <SelectItem value="3">Stage 3</SelectItem>
                    <SelectItem value="4">Stage 4</SelectItem>
                    <SelectItem value="5">Stage 5</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCompleted} onValueChange={setFilterCompleted}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm">
                  <span className="material-icons text-sm mr-2">download</span>
                  Export
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Stage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Started</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessionsLoading || usersLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="ml-3">
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-6 w-16 rounded" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-8" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="py-4 px-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      </tr>
                    ))
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <span className="material-icons text-4xl text-gray-400 mb-4">assessment</span>
                        <p className="text-gray-500">No sessions found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSessions
                      .sort((a: Session, b: Session) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                      .map((session: Session) => {
                        const user = userMap[session.userId];
                        return (
                          <tr key={session.id}>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <img 
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Unknown')}&background=e5e7eb&color=374151&size=32`}
                                  alt="User Avatar" 
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Unknown User'}</p>
                                  <p className="text-sm text-gray-500">{user?.email || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Stage {session.stage}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-900">
                              {formatDuration(session.duration)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">{session.score}</span>
                                <div className="ml-2 w-12 bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full ${
                                      session.score >= 90 ? 'bg-success' :
                                      session.score >= 70 ? 'bg-primary' :
                                      session.score >= 50 ? 'bg-warning' : 'bg-error'
                                    }`}
                                    style={{ width: `${Math.min(session.score, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge 
                                variant={session.completed ? "default" : "secondary"}
                                className={session.completed 
                                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                  : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                                }
                              >
                                {session.completed ? "Completed" : "In Progress"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-500">
                              {formatDate(new Date(session.startedAt))}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-500">
                              {session.completedAt ? formatDate(new Date(session.completedAt)) : "-"}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {filteredSessions.length} of {sessions?.length || 0} sessions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

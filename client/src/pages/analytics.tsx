// C:\PSS\UserAccessManager\client\src\pages\analytics.tsx
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Session, MobileUser } from "@shared/schema";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7");

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/mobile-users"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Calculate score distribution
  const scoreDistribution = users?.reduce((acc: Record<string, number>, user: MobileUser) => {
    if (user.score >= 90) acc.excellent = (acc.excellent || 0) + 1;
    else if (user.score >= 80) acc.good = (acc.good || 0) + 1;
    else if (user.score >= 70) acc.average = (acc.average || 0) + 1;
    else if (user.score >= 60) acc.belowAverage = (acc.belowAverage || 0) + 1;
    else acc.poor = (acc.poor || 0) + 1;
    return acc;
  }, {}) || {};

  const totalUsers = users?.length || 1; // Avoid division by zero

  const scorePercentages = {
    excellent: Math.round(((scoreDistribution.excellent || 0) / totalUsers) * 100),
    good: Math.round(((scoreDistribution.good || 0) / totalUsers) * 100),
    average: Math.round(((scoreDistribution.average || 0) / totalUsers) * 100),
    belowAverage: Math.round(((scoreDistribution.belowAverage || 0) / totalUsers) * 100),
    poor: Math.round(((scoreDistribution.poor || 0) / totalUsers) * 100),
  };

  // Calculate stage progression
  const stageProgression = users?.reduce((acc: Record<number, number>, user: MobileUser) => {
    acc[user.currentStage] = (acc[user.currentStage] || 0) + 1;
    return acc;
  }, {}) || {};

  // Calculate user growth over time (mock data for demonstration)
  const userGrowthData = [
    { period: "Week 1", users: Math.max(0, (totalUsers * 0.7) - 50) },
    { period: "Week 2", users: Math.max(0, (totalUsers * 0.8) - 30) },
    { period: "Week 3", users: Math.max(0, (totalUsers * 0.9) - 15) },
    { period: "Week 4", users: totalUsers },
  ];

  return (
    <>
      <Header 
        title="Analytics Dashboard" 
        subtitle="Comprehensive analytics and insights for your mobile application"
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Time Range Selector */}
        <div className="flex justify-end mb-6">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Session Analytics Chart Placeholder */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Session Analytics</h3>
              </div>
              
              {/* Chart Placeholder */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                <div className="text-center">
                  <span className="material-icons text-4xl text-gray-400 mb-2">bar_chart</span>
                  <p className="text-sm text-gray-500">Session Analytics Chart</p>
                  <p className="text-xs text-gray-400">Integration with charting library needed</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.avgSessionTime || 24}m
                  </p>
                  <p className="text-sm text-gray-500">Avg Session</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.completionRate || 68}%
                  </p>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.returnRate || 42}%
                  </p>
                  <p className="text-sm text-gray-500">Return Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Score Distribution</h3>
              
              {usersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-2 w-32 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">90-100 (Excellent)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full" 
                          style={{ width: `${scorePercentages.excellent}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {scorePercentages.excellent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">80-89 (Good)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${scorePercentages.good}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {scorePercentages.good}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">70-79 (Average)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-warning h-2 rounded-full" 
                          style={{ width: `${scorePercentages.average}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {scorePercentages.average}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">60-69 (Below Average)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${scorePercentages.belowAverage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {scorePercentages.belowAverage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">0-59 (Poor)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-error h-2 rounded-full" 
                          style={{ width: `${scorePercentages.poor}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {scorePercentages.poor}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <span className="material-icons text-primary mr-2">info</span>
                  <div>
                    <p className="text-sm font-medium text-primary">Score Calculation</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Based on completion rate, time efficiency, and user engagement metrics
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stage Progression */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Progression</h3>
              
              {usersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(stage => (
                    <div key={stage} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Stage {stage}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {stageProgression[stage] || 0} users
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Growth */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
              
              <div className="space-y-3">
                {userGrowthData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{data.period}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(data.users)} users
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <span className="material-icons text-success text-sm mr-2">trending_up</span>
                  <span className="text-sm text-success font-medium">
                    {totalUsers > 0 ? '+12% growth' : 'No data yet'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">Daily Active Users</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((stats?.activeUsers || 0) * 0.6)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "60%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">Weekly Active Users</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((stats?.activeUsers || 0) * 0.85)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">Session Length</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats?.avgSessionTime || 24}m avg
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-warning h-2 rounded-full" style={{ width: "70%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-primary text-xl">people</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">User Retention</p>
                  <p className="text-2xl font-semibold text-gray-900">87%</p>
                  <p className="text-sm text-success">+5% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-success text-xl">trending_up</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.completionRate || 68}%
                  </p>
                  <p className="text-sm text-success">+3% from last week</p>
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
                  <p className="text-sm font-medium text-gray-500">Avg Session Time</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.avgSessionTime || 24}m
                  </p>
                  <p className="text-sm text-success">+2m from last week</p>
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
                  <p className="text-sm font-medium text-gray-500">User Satisfaction</p>
                  <p className="text-2xl font-semibold text-gray-900">4.7</p>
                  <p className="text-sm text-success">+0.2 from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

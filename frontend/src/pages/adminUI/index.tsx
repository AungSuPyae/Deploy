// frontend/src/pages/adminUI/index.tsx
import React, { useEffect, useState } from 'react';
import AdminRoute from '../../api/adminAPI/AdminRoute';
import AdminLayout from './components/AdminLayout';
import { getDashboardStats } from '../../api/adminAPI/adminDashboard';
import AdminDashboardCharts from './components/AdminDashboardCharts';

// Import ShadCN UI components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Import icons
import { 
  Users, Activity, Utensils, AlertTriangle, RefreshCw, 
  ChevronUp, Scale, Target, TrendingUp, Heart  
} from 'lucide-react';

// Define types for our data
interface ChartData {
  name: string;
  value: number;
}

interface DashboardStats {
  totalUsers: number;
  genderRatio: ChartData[];
  healthGoals: ChartData[];
  activityLevels: ChartData[];
  topDietaryRestrictions: ChartData[];
  topAllergies: ChartData[];
}

const StatCard: React.FC<{
  title: string;
  value: number | string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}> = ({ title, value, description, trend, icon }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            {trend === 'up' && <ChevronUp className="h-4 w-4 text-green-500 mr-1" />}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const AdminDashboard = ({ serverData }: { serverData: any }) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("📊 [Admin Dashboard] Fetching dashboard statistics");
      const stats = await getDashboardStats();
      setDashboardStats(stats);
      setError('');
      console.log("✅ [Admin Dashboard] Loaded dashboard statistics", stats);
    } catch (err) {
      console.error("❌ [Admin Dashboard] Error fetching dashboard statistics:", err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Calculate some additional metrics for demonstration
  const totalMaleUsers = dashboardStats?.genderRatio?.find(g => g.name === "Male")?.value || 0;
  const totalFemaleUsers = dashboardStats?.genderRatio?.find(g => g.name === "Female")?.value || 0;
  const totalUsers = dashboardStats?.totalUsers || 0;
  const mostPopularGoal = dashboardStats?.healthGoals?.sort((a, b) => b.value - a.value)[0]?.name || "Unknown";
  const mostCommonAllergy = dashboardStats?.topAllergies?.[0]?.name || "None";

  const renderSkeletons = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderError = () => (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  return (
    <AdminRoute>
      <AdminLayout title="Dashboard">
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Monitor and analyze user data and nutrition metrics.</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="md:self-start" 
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>

          {error && renderError()}

          <Tabs 
            defaultValue="overview" 
            className="mb-8"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full md:w-fit grid-cols-2 md:grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Detailed Charts</TabsTrigger>
              <TabsTrigger value="insights">Key Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {loading ? (
                renderSkeletons()
              ) : dashboardStats ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                      title="Total Users" 
                      value={totalUsers} 
                      description="Active user accounts"
                      icon={<Users className="h-4 w-4" />}
                    />
                    <StatCard 
                      title="Male/Female Ratio" 
                      value={`${totalMaleUsers}:${totalFemaleUsers}`}
                      description={`${Math.round((totalMaleUsers / (totalUsers || 1)) * 100)}% male users`}
                      icon={<Users className="h-4 w-4" />}
                    />
                    <StatCard 
                      title="Top Health Goal" 
                      value={mostPopularGoal}
                      description="Most common user objective" 
                      icon={<Target className="h-4 w-4" />}
                    />
                    <StatCard 
                      title="Top Allergy" 
                      value={mostCommonAllergy}
                      description="Most reported allergy"
                      icon={<AlertTriangle className="h-4 w-4" />}
                    />
                  </div>

                  <h2 className="text-xl font-semibold mt-8 mb-4">Distribution Overview</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" /> 
                          Activity Levels
                        </CardTitle>
                        <CardDescription>User activity level distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {dashboardStats.activityLevels.map((level) => (
                          <div key={level.name} className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">{level.name}</Badge>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{level.value}</span>
                              <span className="text-xs text-muted-foreground ml-1">users</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Scale className="h-5 w-5" /> 
                          Health Goals
                        </CardTitle>
                        <CardDescription>User health goal distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {dashboardStats.healthGoals.map((goal) => (
                          <div key={goal.name} className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">{goal.name}</Badge>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{goal.value}</span>
                              <span className="text-xs text-muted-foreground ml-1">users</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Utensils className="h-5 w-5" /> 
                          Dietary Restrictions
                        </CardTitle>
                        <CardDescription>Top dietary restrictions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {dashboardStats.topDietaryRestrictions.map((restriction) => (
                          <div key={restriction.name} className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">{restriction.name}</Badge>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{restriction.value}</span>
                              <span className="text-xs text-muted-foreground ml-1">users</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="charts" className="mt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : dashboardStats ? (
                <div className="bg-card rounded-lg border p-4">
                  <AdminDashboardCharts 
                    genderRatio={dashboardStats.genderRatio}
                    healthGoals={dashboardStats.healthGoals}
                    activityLevels={dashboardStats.activityLevels}
                    topDietaryRestrictions={dashboardStats.topDietaryRestrictions}
                    topAllergies={dashboardStats.topAllergies}
                  />
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              {loading ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ) : dashboardStats ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        User Demographics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        <li className="flex items-start">
                          <div className="mr-2 mt-0.5 bg-primary/10 p-1 rounded-full">
                            <Users className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <strong>Gender Balance:</strong> The system has {totalMaleUsers} male and {totalFemaleUsers} female users, 
                            with a {Math.round((totalMaleUsers / (totalUsers || 1)) * 100)}% to {Math.round((totalFemaleUsers / (totalUsers || 1)) * 100)}% ratio.
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-0.5 bg-primary/10 p-1 rounded-full">
                            <Activity className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <strong>Activity Levels:</strong> Most users identify as "{dashboardStats.activityLevels.sort((a, b) => b.value - a.value)[0]?.name}" 
                            in terms of physical activity.
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Health Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        <li className="flex items-start">
                          <div className="mr-2 mt-0.5 bg-primary/10 p-1 rounded-full">
                            <Target className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <strong>Popular Goals:</strong> "{mostPopularGoal}" is the most common health goal among users, 
                            representing {Math.round((dashboardStats.healthGoals.find(g => g.name === mostPopularGoal)?.value || 0) / (totalUsers || 1) * 100)}% of users.
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-0.5 bg-primary/10 p-1 rounded-full">
                            <AlertTriangle className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <strong>Dietary Restrictions:</strong> The most common dietary restriction is "{dashboardStats.topDietaryRestrictions[0]?.name}", 
                            followed by "{dashboardStats.topDietaryRestrictions[1]?.name}".
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>

          <Separator className="my-8" />

          <div className="text-xs text-muted-foreground text-center">
            <p>Data last updated: {new Date().toLocaleString()}</p>
            <p className="mt-1">NutriGen Admin Panel v1.0</p>
          </div>
        </main>
      </AdminLayout>
    </AdminRoute>
  );
};


export default AdminDashboard;
import React, { useState, useEffect, Suspense, lazy } from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import DashboardGrid from "../dashboard/DashboardGrid";
import RealtimeStatus from "../dashboard/RealtimeStatus";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../../supabase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import HelpChatbot from "../dashboard/HelpChatbot";

// Lazy load heavy components to improve initial load time
const BedManagement = lazy(() => import("../dashboard/BedManagement"));
const PatientQueue = lazy(() => import("../dashboard/PatientQueue"));
const Calendar = lazy(() => import("../dashboard/Calendar"));
const TeamDirectory = lazy(() => import("../dashboard/TeamDirectory"));

const Dashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { user, userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Parse tab from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["overview", "beds", "queue", "calendar", "team"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/dashboard?tab=${value}`, { replace: true });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavigation onSearch={handleSearch} />
        <OfflineIndicator />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">MediLink Dashboard</h1>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className={cn("gap-1", refreshing && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="beds">Bed Management</TabsTrigger>
              <TabsTrigger value="queue">Patient Queue</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <ErrorBoundary>
                <DashboardGrid searchQuery={searchQuery} />
                <RealtimeStatus />
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="beds">
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center h-64">
                      <LoadingSpinner size="lg" />
                    </div>
                  }
                >
                  <BedManagement searchQuery={searchQuery} />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="queue">
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center h-64">
                      <LoadingSpinner size="lg" />
                    </div>
                  }
                >
                  <PatientQueue searchQuery={searchQuery} />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="calendar">
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center h-64">
                      <LoadingSpinner size="lg" />
                    </div>
                  }
                >
                  <Calendar />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="team">
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center h-64">
                      <LoadingSpinner size="lg" />
                    </div>
                  }
                >
                  <TeamDirectory searchQuery={searchQuery} />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <HelpChatbot />
    </div>
  );
};

export default Dashboard;

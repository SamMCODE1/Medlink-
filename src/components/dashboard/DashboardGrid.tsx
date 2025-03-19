import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertCircle,
  Bed,
  Clock,
  Users,
  Stethoscope,
  Wrench,
  Bell,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";

export default function DashboardGrid() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<
    { title: string; description: string; type: string }[]
  >([
    {
      title: "Emergency Department at 90% capacity",
      description: "Consider redirecting non-critical patients",
      type: "warning",
    },
    {
      title: "Scheduled system maintenance",
      description: "Tonight at 2:00 AM - 4:00 AM",
      type: "info",
    },
    {
      title: "New staff onboarding complete",
      description: "5 new staff members added to the system",
      type: "success",
    },
  ]);

  const [stats, setStats] = useState({
    beds: { total: 120, available: 102, departments: 8 },
    patients: { inQueue: 23, avgWait: 35, highPriority: 4 },
    staff: { total: 42, doctors: 15, nurses: 27 },
    equipment: { operational: 95, maintenance: 3 },
  });

  useEffect(() => {
    // Set up realtime subscription for alerts
    const alertsSubscription = supabase
      .channel("alerts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          console.log("Notification received!", payload);
          if (payload.new && payload.eventType === "INSERT") {
            const newAlert = {
              title: payload.new.title,
              description: payload.new.message,
              type: payload.new.type || "info",
            };

            setAlerts((prev) => [newAlert, ...prev.slice(0, 2)]);
          }
        },
      )
      .subscribe();

    // Fetch initial stats
    const fetchStats = async () => {
      try {
        // Fetch bed stats
        const { data: bedData } = await supabase
          .from("beds")
          .select("status, department_id");

        if (bedData) {
          const totalBeds = bedData.length;
          const availableBeds = bedData.filter(
            (b) => b.status === "available",
          ).length;
          const departments = new Set(bedData.map((b) => b.department_id)).size;

          setStats((prev) => ({
            ...prev,
            beds: {
              total: totalBeds,
              available: availableBeds,
              departments,
            },
          }));
        }

        // Fetch patient queue stats
        const { data: queueData } = await supabase
          .from("patient_queue")
          .select("priority, estimated_wait_time");

        if (queueData) {
          const inQueue = queueData.length;
          const highPriority = queueData.filter((q) => q.priority <= 2).length;
          const avgWait =
            queueData.reduce(
              (sum, q) => sum + (q.estimated_wait_time || 0),
              0,
            ) / (queueData.length || 1);

          setStats((prev) => ({
            ...prev,
            patients: {
              inQueue,
              avgWait: Math.round(avgWait),
              highPriority,
            },
          }));
        }

        // Fetch staff stats
        const { data: staffData } = await supabase.from("staff").select("role");

        if (staffData) {
          const total = staffData.length;
          const doctors = staffData.filter((s) => s.role === "doctor").length;
          const nurses = staffData.filter((s) => s.role === "nurse").length;

          setStats((prev) => ({
            ...prev,
            staff: {
              total,
              doctors,
              nurses,
            },
          }));
        }

        // Fetch equipment stats
        const { data: equipmentData } = await supabase
          .from("equipment")
          .select("status");

        if (equipmentData) {
          const total = equipmentData.length;
          const maintenance = equipmentData.filter(
            (e) => e.status === "maintenance" || e.status === "out_of_order",
          ).length;
          const operational = Math.round(((total - maintenance) / total) * 100);

          setStats((prev) => ({
            ...prev,
            equipment: {
              operational,
              maintenance,
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();

    return () => {
      supabase.removeChannel(alertsSubscription);
    };
  }, []);

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-800",
          border: "border-yellow-200",
          iconColor: "text-yellow-600",
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        };
      case "success":
        return {
          bg: "bg-green-50",
          text: "text-green-800",
          border: "border-green-200",
          iconColor: "text-green-600",
          icon: <Stethoscope className="h-5 w-5 text-green-600" />,
        };
      case "error":
        return {
          bg: "bg-red-50",
          text: "text-red-800",
          border: "border-red-200",
          iconColor: "text-red-600",
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        };
      default: // info
        return {
          bg: "bg-blue-50",
          text: "text-blue-800",
          border: "border-blue-200",
          iconColor: "text-blue-600",
          icon: <Activity className="h-5 w-5 text-blue-600" />,
        };
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
          <Bed className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.beds.total}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Across {stats.beds.departments} departments
            </p>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {Math.round((stats.beds.available / stats.beds.total) * 100)}%
              Available
            </Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Patients in Queue
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.patients.inQueue}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Avg. wait: {stats.patients.avgWait} minutes
            </p>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              {stats.patients.highPriority} High Priority
            </Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Staff On Duty</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.staff.total}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {stats.staff.doctors} doctors, {stats.staff.nurses} nurses
            </p>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Full Capacity
            </Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Equipment Status
          </CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.equipment.operational}%
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {stats.equipment.maintenance} items in maintenance
            </p>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Operational
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts.map((alert, index) => {
              const style = getAlertStyle(alert.type);
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-md ${style.bg} ${style.text} border ${style.border}`}
                >
                  {style.icon}
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm">{alert.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

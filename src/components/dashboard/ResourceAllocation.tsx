import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, RefreshCw, Stethoscope, Tool } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Department = {
  id: string;
  name: string;
  floor: number;
};

type StaffRole = "doctor" | "nurse" | "admin" | "other";
type EquipmentStatus = "available" | "in_use" | "maintenance" | "out_of_order";

type Staff = {
  id: string;
  user_id: string | null;
  full_name: string;
  role: StaffRole;
  department_id: string | null;
  contact_number: string | null;
  email: string | null;
};

type Equipment = {
  id: string;
  name: string;
  type: string;
  status: EquipmentStatus;
  department_id: string | null;
  last_maintenance_date: string | null;
  notes: string | null;
};

const roleColors = {
  doctor: "bg-blue-100 text-blue-800 border-blue-300",
  nurse: "bg-green-100 text-green-800 border-green-300",
  admin: "bg-purple-100 text-purple-800 border-purple-300",
  other: "bg-gray-100 text-gray-800 border-gray-300",
};

const equipmentStatusColors = {
  available: "bg-green-100 text-green-800 border-green-300",
  in_use: "bg-blue-100 text-blue-800 border-blue-300",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-300",
  out_of_order: "bg-red-100 text-red-800 border-red-300",
};

export default function ResourceAllocation() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<StaffRole | "all">("all");
  const [selectedEquipmentStatus, setSelectedEquipmentStatus] = useState<EquipmentStatus | "all">("all");
  const [activeTab, setActiveTab] = useState("staff");

  useEffect(() => {
    fetchDepartments();
    fetchStaff();
    fetchEquipment();

    // Set up realtime subscriptions
    const staffSubscription = supabase
      .channel("staff-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff" },
        (payload) => {
          console.log("Staff change received!", payload);
          fetchStaff();
        }
      )
      .subscribe();

    const equipmentSubscription = supabase
      .channel("equipment-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment" },
        (payload) => {
          console.log("Equipment change received!", payload);
          fetchEquipment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(staffSubscription);
      supabase.removeChannel(equipmentSubscription);
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase.from("departments").select("*").order("name");

      if (error) throw error;

      setDepartments(data || []);
      if (data && data.length > 0 && !selectedDepartment) {
        setSelectedDepartment(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("staff").select("*").order("full_name");

      if (error) throw error;

      setStaff(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase.from("equipment").select("*").order("name");

      if (error) throw error;

      setEquipment(data || []);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  const assignStaffToDepartment = async (staffId: string, departmentId: string | null) => {
    try {
      const { error } = await supabase
        .from("staff")
        .update({ department_id: departmentId, updated_at: new Date().toISOString() })
        .eq("id", staffId);

      if (error) throw error;
    } catch (error) {
      console.error("Error assigning staff:", error);
    }
  };

  const assignEquipmentToDepartment = async (equipmentId: string, departmentId: string | null) => {
    try {
      const { error } = await supabase
        .from("equipment")
        .update({ department_id: departmentId, updated_at: new Date().toISOString() })
        .eq("id", equipmentId);

      if (error) throw error;
    } catch (error) {
      console.error("Error assigning equipment:", error);
    }
  };

  const updateEquipmentStatus = async (equipmentId: string, status: EquipmentStatus) => {
    try {
      const { error } = await supabase
        .from("equipment")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", equipmentId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating equipment status:", error);
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesDepartment = !selectedDepartment || s.department_id === selectedDepartment;
    const matchesRole = selectedRole === "all" || s.role === selectedRole;
    return matchesDepartment && matchesRole;
  });

  const filteredEquipment = equipment.filter((e) => {
    const matchesDepartment = !selectedDepartment || e.department_id === selectedDepartment;
    const matchesStatus = selectedEquipmentStatus === "all" || e.status === selectedEquipmentStatus;
    return matchesDepartment && matchesStatus;
  });

  const departmentName = (id: string | null) => {
    if (!id) return "Unassigned";
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : "Unknown Department";
  };

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "doctor", label: "Doctors" },
    { value: "nurse", label: "Nurses" },
    { value: "admin", label: "Administrators" },
    { value: "other", label: "Other Staff" },
  ];

  const equipmentStatusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "available", label: "Available" },
    { value: "in_use", label: "In Use" },
    { value: "maintenance", label: "Maintenance" },
    { value: "out_of_order", label: "Out of Order" },
  ];

  const refreshData = () => {
    fetchDepartments();
    fetchStaff();
    fetchEquipment();
  };

  const handleDragStart = (e: React.DragEvent, id: string, type: "staff" | "equipment") => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, type }));
  };

  const handleDrop = (e: React.DragEvent, departmentId: string | null) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    if (data.type === "staff") {
      assignStaffToDepartment(data.id, departmentId);
    } else if (data.type === "equipment") {
      assignEquipmentToDepartment(data.id, departmentId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Resource Allocation</h2>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff" className="flex items-center">
            <Stethoscope className="h-4 w-4 mr-2" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center">
            <Tool className="h-4 w-4 mr-2" />
            Equipment
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="col-span-2">
          <Select
            value={selectedDepartment || ""}
            onValueChange={(value) => setSelectedDepartment(value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} (Floor {dept.floor})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeTab === "staff" ? (
          <div className="col-span-2">
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as StaffRole | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="col-span-2">
            <Select
              value={selectedEquipmentStatus}
              onValueChange={(value) => setSelectedEquipmentStatus(value as EquipmentStatus | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                {equipmentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Department columns */}
        <div className="col-span-1 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="border rounded-lg p-4 bg-gray-50 h-[500px] flex flex-col"
              onDrop={(e) => handleDrop(e, dept.id)}
              onDragOver={handleDragOver}
            >
              <div className="font-medium text-lg mb-2 pb-2 border-b">{dept.name}</div>
              <div className="text-sm text-gray-500 mb-4">Floor {dept.floor}</div>
              <div className="overflow-y-auto flex-grow">
                {activeTab === "staff" ? (
                  staff.filter((s) => s.department_id === dept.id).length === 0 ? (
                    <div className="text-center text-gray-400 italic mt-8">Drag staff here</div>
                  ) : (
                    <div className="space-y-2">
                      {staff
                        .filter((s) => s.department_id === dept.id)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="bg-white p-3 rounded border shadow-sm cursor-move"
                            draggable
                            onDragStart={(e) => handleDragStart(e, s.id, "staff")}
                          >
                            <div className="font-medium">{s.full_name}</div>
                            <div className="flex justify-between items-center mt-1">
                              <div className="text-xs text-gray-500">
                                {s.email || "No email"}
                              </div>
                              <Badge className={roleColors[s.role]}>
                                {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )
                ) : (
                  equipment.filter((e) => e.department_id === dept.id).length === 0 ? (
                    <div className="text-center text-gray-400 italic mt-8">Drag equipment here</div>
                  ) : (
                    <div className="space-y-2">
                      {equipment
                        .filter((e) => e.department_id === dept.id)
                        .map((e) => (
                          <div
                            key={e.id}
                            className="bg-white p-3 rounded border shadow-sm cursor-move"
                            draggable
                            onDragStart={(e) => handleDragStart(e, e.id, "equipment")}
                          >
                            <div className="font-medium">{e.name}</div>
                            <div className="flex justify-between items-center mt-1">
                              <div className="text-xs text-gray-500">{e.type}</div>
                              <Badge className={equipmentStatusColors[e.status]}>
                                {e.status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Unassigned column */}
        <div
          className="col-span-1 border rounded-lg p-4 bg-gray-100 h-[500px] flex flex-col"
          onDrop={(e) => handleDrop(e, null)}
          onDragOver={handleDragOver}
        >
          <div className="font-medium text-lg mb-2 pb-2 border-b">Unassigned</div>
          <div className="text-sm text-gray-500 mb-4">Drag items here to unassign</div>
          <div className="overflow-y-auto flex-grow">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
              </div>
            ) : activeTab === "staff" ? (
              staff.filter((s) => s.department_id === null).length === 0 ? (
                <div className="text-center text-gray-400 italic mt-8">No unassigned staff</div>
              ) : (
                <div className="space-y-2">
                  {staff
                    .filter((s) => s.department_id === null)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="bg-white p-3 rounded border shadow-sm cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, s.id, "staff")}
                      >
                        <div className="font-medium">{s.full_name}</div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-xs text-gray-500">
                            {s.email || "No email"}
                          </div>
                          <Badge className={roleColors[s.role]}>
                            {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )
            ) : equipment.filter((e) => e.department_id === null).length === 0 ? (
              <div className="text-center text-gray-400 italic mt-8">No unassigned equipment</div>
            ) : (
              <div className="space-y-2">
                {equipment
                  .filter((e) => e.department_id === null)
                  .map((e) => (
                    <div
                      key={e.id}
                      className="bg-white p-3 rounded border shadow-sm cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, e.id, "equipment")}
                    >
                      <div className="font-medium">{e.name}</div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-xs text-gray-500">{e.type}</div>
                        <div className="flex space-x-1">
                          <Badge className={equipmentStatusColors[e.status]}>
                            {e.status.
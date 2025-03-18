import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bed, CircleAlert, Filter, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Department = {
  id: string;
  name: string;
  floor: number;
};

type BedStatus = "available" | "occupied" | "reserved" | "cleaning";

type Bed = {
  id: string;
  department_id: string;
  bed_number: string;
  status: BedStatus;
  patient_id: string | null;
  notes: string | null;
};

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-300",
  occupied: "bg-red-100 text-red-800 border-red-300",
  reserved: "bg-blue-100 text-blue-800 border-blue-300",
  cleaning: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

export default function BedManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<BedStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDepartments();
    fetchBeds();

    // Set up realtime subscription for beds
    const bedsSubscription = supabase
      .channel("beds-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beds" },
        (payload) => {
          console.log("Beds change received!", payload);
          fetchBeds(); // Refresh beds when changes occur
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bedsSubscription);
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;

      setDepartments(data || []);
      if (data && data.length > 0 && !selectedDepartment) {
        setSelectedDepartment(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("beds")
        .select("*")
        .order("bed_number");

      if (error) throw error;

      setBeds(data || []);
    } catch (error) {
      console.error("Error fetching beds:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBedStatus = async (bedId: string, newStatus: BedStatus) => {
    try {
      const { error } = await supabase
        .from("beds")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", bedId);

      if (error) throw error;

      // No need to manually update the state as the realtime subscription will handle it
    } catch (error) {
      console.error("Error updating bed status:", error);
    }
  };

  const filteredBeds = beds.filter((bed) => {
    const matchesDepartment =
      !selectedDepartment || bed.department_id === selectedDepartment;
    const matchesStatus = statusFilter === "all" || bed.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      bed.bed_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDepartment && matchesStatus && matchesSearch;
  });

  const departmentName = (id: string) => {
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : "Unknown Department";
  };

  const bedStatusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "reserved", label: "Reserved" },
    { value: "cleaning", label: "Cleaning" },
  ];

  const refreshData = () => {
    fetchDepartments();
    fetchBeds();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Bed Management</h2>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1">
          <Select
            value={selectedDepartment || undefined}
            onValueChange={(value) => setSelectedDepartment(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} (Floor {dept.floor})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as BedStatus | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              {bedStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search bed number..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : filteredBeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <CircleAlert className="h-12 w-12 mb-4 text-gray-400" />
          <p className="text-lg font-medium">No beds found</p>
          <p className="text-sm">
            Try changing your filters or adding beds to this department
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => (
            <Card
              key={bed.id}
              className="overflow-hidden border-l-4 hover:shadow-md transition-shadow"
              style={{
                borderLeftColor:
                  bed.status === "available"
                    ? "#10b981"
                    : bed.status === "occupied"
                      ? "#ef4444"
                      : bed.status === "reserved"
                        ? "#3b82f6"
                        : "#f59e0b",
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Bed className="h-4 w-4 mr-1" /> Bed {bed.bed_number}
                    </CardTitle>
                    <CardDescription>
                      {departmentName(bed.department_id)}
                    </CardDescription>
                  </div>
                  <Badge className={`${statusColors[bed.status]} border`}>
                    {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm pb-2">
                {bed.notes && (
                  <p className="text-gray-600 italic">"{bed.notes}"</p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex space-x-2 w-full">
                  {bed.status !== "available" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      onClick={() => updateBedStatus(bed.id, "available")}
                    >
                      Mark Available
                    </Button>
                  )}
                  {bed.status !== "occupied" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                      onClick={() => updateBedStatus(bed.id, "occupied")}
                    >
                      Mark Occupied
                    </Button>
                  )}
                  {bed.status !== "reserved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      onClick={() => updateBedStatus(bed.id, "reserved")}
                    >
                      Reserve
                    </Button>
                  )}
                  {bed.status !== "cleaning" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                      onClick={() => updateBedStatus(bed.id, "cleaning")}
                    >
                      Cleaning
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
        <div>
          Showing {filteredBeds.length} of {beds.length} beds
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span>Cleaning</span>
          </div>
        </div>
      </div>
    </div>
  );
}

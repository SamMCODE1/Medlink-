import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  ListOrdered,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Department = {
  id: string;
  name: string;
  floor: number;
};

type Patient = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  contact_number: string | null;
  email: string | null;
};

type QueueStatus = "waiting" | "in_progress" | "completed" | "cancelled";

type QueueItem = {
  id: string;
  department_id: string;
  patient_id: string;
  priority: number;
  estimated_wait_time: number | null;
  status: QueueStatus;
  notes: string | null;
  created_at: string;
  patient: Patient;
};

const statusColors = {
  waiting: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

const priorityLabels = {
  1: { label: "Emergency", color: "bg-red-100 text-red-800 border-red-300" },
  2: {
    label: "Urgent",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  3: { label: "Standard", color: "bg-blue-100 text-blue-800 border-blue-300" },
  4: {
    label: "Non-urgent",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  5: {
    label: "Scheduled",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
};

export default function PatientQueue() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<QueueStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New patient form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientContact, setNewPatientContact] = useState("");
  const [newPatientPriority, setNewPatientPriority] = useState("3");
  const [newPatientNotes, setNewPatientNotes] = useState("");

  useEffect(() => {
    fetchDepartments();
    fetchQueueItems();
    fetchPatients();

    // Set up realtime subscription for queue
    const queueSubscription = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patient_queue" },
        (payload) => {
          console.log("Queue change received!", payload);
          fetchQueueItems(); // Refresh queue when changes occur
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueSubscription);
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

  const fetchQueueItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("patient_queue")
        .select(
          `
          *,
          patient:patients(*)
        `,
        )
        .order("priority")
        .order("created_at");

      if (error) throw error;

      setQueueItems(data || []);
    } catch (error) {
      console.error("Error fetching queue items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("full_name");

      if (error) throw error;

      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const updateQueueItemStatus = async (
    itemId: string,
    newStatus: QueueStatus,
  ) => {
    try {
      const { error } = await supabase
        .from("patient_queue")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) throw error;

      // No need to manually update the state as the realtime subscription will handle it
    } catch (error) {
      console.error("Error updating queue item status:", error);
    }
  };

  const addToQueue = async () => {
    try {
      // First check if patient exists, if not create a new patient
      let patientId;
      const existingPatient = patients.find(
        (p) => p.full_name.toLowerCase() === newPatientName.toLowerCase(),
      );

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        // Create new patient
        const { data: newPatient, error: patientError } = await supabase
          .from("patients")
          .insert({
            full_name: newPatientName,
            contact_number: newPatientContact || null,
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      // Add to queue
      const { error: queueError } = await supabase
        .from("patient_queue")
        .insert({
          department_id: selectedDepartment,
          patient_id: patientId,
          priority: parseInt(newPatientPriority),
          status: "waiting",
          notes: newPatientNotes || null,
          estimated_wait_time: 30, // Default 30 minutes wait time
        });

      if (queueError) throw queueError;

      // Reset form
      setNewPatientName("");
      setNewPatientContact("");
      setNewPatientPriority("3");
      setNewPatientNotes("");
      setIsAddDialogOpen(false);

      // Refresh data
      fetchQueueItems();
      fetchPatients();
    } catch (error) {
      console.error("Error adding to queue:", error);
    }
  };

  const filteredQueueItems = queueItems.filter((item) => {
    const matchesDepartment =
      !selectedDepartment || item.department_id === selectedDepartment;
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      item.patient.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDepartment && matchesStatus && matchesSearch;
  });

  const departmentName = (id: string) => {
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : "Unknown Department";
  };

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "waiting", label: "Waiting" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const priorityOptions = [
    { value: "1", label: "Emergency" },
    { value: "2", label: "Urgent" },
    { value: "3", label: "Standard" },
    { value: "4", label: "Non-urgent" },
    { value: "5", label: "Scheduled" },
  ];

  const refreshData = () => {
    fetchDepartments();
    fetchQueueItems();
    fetchPatients();
  };

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return "Unknown";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Patient Queue</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add to Queue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Patient to Queue</DialogTitle>
                <DialogDescription>
                  Enter patient details to add them to the waiting queue.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Select
                    value={selectedDepartment || undefined}
                    onValueChange={(value) => setSelectedDepartment(value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Patient Name
                  </Label>
                  <Input
                    id="name"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact" className="text-right">
                    Contact
                  </Label>
                  <Input
                    id="contact"
                    value={newPatientContact}
                    onChange={(e) => setNewPatientContact(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select
                    value={newPatientPriority}
                    onValueChange={setNewPatientPriority}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newPatientNotes}
                    onChange={(e) => setNewPatientNotes(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={addToQueue}
                  disabled={!newPatientName || !selectedDepartment}
                >
                  Add to Queue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
              setStatusFilter(value as QueueStatus | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
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
              placeholder="Search patient name..."
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
      ) : filteredQueueItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <ListOrdered className="h-12 w-12 mb-4 text-gray-400" />
          <p className="text-lg font-medium">No patients in queue</p>
          <p className="text-sm">Add patients to the queue to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueueItems.map((item, index) => (
            <Card
              key={item.id}
              className="overflow-hidden border-l-4 hover:shadow-md transition-shadow"
              style={{
                borderLeftColor:
                  item.priority === 1
                    ? "#ef4444"
                    : item.priority === 2
                      ? "#f97316"
                      : item.priority === 3
                        ? "#3b82f6"
                        : item.priority === 4
                          ? "#10b981"
                          : "#8b5cf6",
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center mr-3 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {item.patient.full_name}
                      </CardTitle>
                      <div className="text-sm text-gray-500">
                        {departmentName(item.department_id)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge
                      className={
                        priorityLabels[
                          item.priority as keyof typeof priorityLabels
                        ].color
                      }
                    >
                      {
                        priorityLabels[
                          item.priority as keyof typeof priorityLabels
                        ].label
                      }
                    </Badge>
                    <Badge className={statusColors[item.status]}>
                      {item.status
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Est. wait: {formatTime(item.estimated_wait_time)}</span>
                </div>
                {item.notes && (
                  <p className="text-sm text-gray-600 italic">"{item.notes}"</p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex space-x-2 w-full">
                  {item.status === "waiting" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      onClick={() =>
                        updateQueueItemStatus(item.id, "in_progress")
                      }
                    >
                      Start Service
                    </Button>
                  )}
                  {item.status === "in_progress" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      onClick={() =>
                        updateQueueItemStatus(item.id, "completed")
                      }
                    >
                      Complete
                    </Button>
                  )}
                  {(item.status === "waiting" ||
                    item.status === "in_progress") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                      onClick={() =>
                        updateQueueItemStatus(item.id, "cancelled")
                      }
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
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
          Showing {filteredQueueItems.length} of {queueItems.length} patients in
          queue
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span>Waiting</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

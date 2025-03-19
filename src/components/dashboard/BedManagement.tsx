import { useState, useEffect, useCallback } from "react";
import { debounce } from "@/lib/debounce";
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
import {
  Bed,
  CircleAlert,
  Filter,
  RefreshCw,
  Search,
  Plus,
  User,
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
import { useToast } from "@/components/ui/use-toast";

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
  patient_name?: string;
};

type Patient = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  contact_number: string | null;
  email: string | null;
};

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-300",
  occupied: "bg-red-100 text-red-800 border-red-300",
  reserved: "bg-blue-100 text-blue-800 border-blue-300",
  cleaning: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

// Mock data for beds
const mockBeds: Bed[] = [
  {
    id: "1",
    department_id: "1",
    bed_number: "A101",
    status: "available",
    patient_id: null,
    notes: "Recently cleaned and ready for use",
  },
  {
    id: "2",
    department_id: "1",
    bed_number: "A102",
    status: "occupied",
    patient_id: "1",
    notes: "Patient admitted for observation",
    patient_name: "John Smith",
  },
  {
    id: "3",
    department_id: "1",
    bed_number: "A103",
    status: "reserved",
    patient_id: "2",
    notes: "Reserved for incoming patient from ER",
    patient_name: "Maria Garcia",
  },
  {
    id: "4",
    department_id: "1",
    bed_number: "A104",
    status: "cleaning",
    patient_id: null,
    notes: "Needs deep cleaning after discharge",
  },
  {
    id: "5",
    department_id: "2",
    bed_number: "B201",
    status: "available",
    patient_id: null,
    notes: null,
  },
  {
    id: "6",
    department_id: "2",
    bed_number: "B202",
    status: "occupied",
    patient_id: "3",
    notes: "Patient recovering from surgery",
    patient_name: "Robert Johnson",
  },
  {
    id: "7",
    department_id: "2",
    bed_number: "B203",
    status: "occupied",
    patient_id: "4",
    notes: "Patient under observation",
    patient_name: "Sarah Williams",
  },
  {
    id: "8",
    department_id: "2",
    bed_number: "B204",
    status: "available",
    patient_id: null,
    notes: null,
  },
  {
    id: "9",
    department_id: "3",
    bed_number: "C301",
    status: "occupied",
    patient_id: "5",
    notes: "Critical care patient",
    patient_name: "David Brown",
  },
  {
    id: "10",
    department_id: "3",
    bed_number: "C302",
    status: "occupied",
    patient_id: "6",
    notes: "Patient on ventilator",
    patient_name: "Emily Davis",
  },
  {
    id: "11",
    department_id: "3",
    bed_number: "C303",
    status: "available",
    patient_id: null,
    notes: "Emergency bed ready for use",
  },
  {
    id: "12",
    department_id: "3",
    bed_number: "C304",
    status: "cleaning",
    patient_id: null,
    notes: "Sanitizing after patient discharge",
  },
];

// Mock data for departments
const mockDepartments: Department[] = [
  { id: "1", name: "General Ward", floor: 1 },
  { id: "2", name: "Surgery Recovery", floor: 2 },
  { id: "3", name: "Intensive Care", floor: 3 },
  { id: "4", name: "Pediatrics", floor: 1 },
  { id: "5", name: "Maternity", floor: 2 },
];

// Mock data for patients
const mockPatients: Patient[] = [
  {
    id: "1",
    full_name: "John Smith",
    date_of_birth: "1975-05-15",
    contact_number: "555-123-4567",
    email: "john.smith@example.com",
  },
  {
    id: "2",
    full_name: "Maria Garcia",
    date_of_birth: "1982-09-23",
    contact_number: "555-234-5678",
    email: "maria.garcia@example.com",
  },
  {
    id: "3",
    full_name: "Robert Johnson",
    date_of_birth: "1968-03-12",
    contact_number: "555-345-6789",
    email: "robert.johnson@example.com",
  },
  {
    id: "4",
    full_name: "Sarah Williams",
    date_of_birth: "1990-11-30",
    contact_number: "555-456-7890",
    email: "sarah.williams@example.com",
  },
  {
    id: "5",
    full_name: "David Brown",
    date_of_birth: "1955-07-08",
    contact_number: "555-567-8901",
    email: "david.brown@example.com",
  },
  {
    id: "6",
    full_name: "Emily Davis",
    date_of_birth: "1988-02-17",
    contact_number: "555-678-9012",
    email: "emily.davis@example.com",
  },
];

interface BedManagementProps {
  searchQuery?: string;
}

export default function BedManagement({
  searchQuery = "",
}: BedManagementProps) {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [beds, setBeds] = useState<Bed[]>(mockBeds);
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<BedStatus | "all">("all");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Add bed dialog state
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [newBedNumber, setNewBedNumber] = useState("");
  const [newBedDepartment, setNewBedDepartment] = useState<string | null>(null);
  const [newBedNotes, setNewBedNotes] = useState("");

  // Assign patient dialog state
  const [isAssignPatientOpen, setIsAssignPatientOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  useEffect(() => {
    // Use the search query from props if provided
    if (searchQuery) {
      setLocalSearchQuery(searchQuery);
      setDebouncedSearchQuery(searchQuery);
    }

    // Set initial department selection
    if (departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(departments[0].id);
    }

    // In a real app, we would fetch data from Supabase here
    // For now, we're using mock data
  }, [searchQuery, departments, selectedDepartment]);

  // Use useCallback to memoize the filter function
  const getFilteredBeds = useCallback(() => {
    const effectiveSearchQuery = debouncedSearchQuery || searchQuery;

    return beds.filter((bed) => {
      const matchesDepartment =
        !selectedDepartment || bed.department_id === selectedDepartment;
      const matchesStatus =
        statusFilter === "all" || bed.status === statusFilter;
      const matchesSearch =
        !effectiveSearchQuery ||
        bed.bed_number
          .toLowerCase()
          .includes(effectiveSearchQuery.toLowerCase()) ||
        (bed.patient_name &&
          bed.patient_name
            .toLowerCase()
            .includes(effectiveSearchQuery.toLowerCase()));
      return matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [
    beds,
    selectedDepartment,
    statusFilter,
    debouncedSearchQuery,
    searchQuery,
  ]);

  // Calculate filtered beds
  const filteredBeds = getFilteredBeds();

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
    // In a real app, we would fetch fresh data from Supabase
    toast({
      title: "Data refreshed",
      description: "Bed information has been updated.",
    });
  };

  const updateBedStatus = (bedId: string, newStatus: BedStatus) => {
    // Update the local state immediately for better UX
    setBeds((prevBeds) =>
      prevBeds.map((bed) =>
        bed.id === bedId ? { ...bed, status: newStatus } : bed,
      ),
    );

    // Show success toast
    const bed = beds.find((b) => b.id === bedId);
    toast({
      title: "Bed status updated",
      description: `Bed ${bed?.bed_number} is now ${newStatus}`,
    });
  };

  const handleAddBed = () => {
    if (!newBedNumber || !newBedDepartment) {
      toast({
        title: "Missing information",
        description: "Please provide both bed number and department",
        variant: "destructive",
      });
      return;
    }

    // Create new bed with a unique ID
    const newBed: Bed = {
      id: `new-${Date.now()}`,
      department_id: newBedDepartment,
      bed_number: newBedNumber,
      status: "available",
      patient_id: null,
      notes: newBedNotes || null,
    };

    // Add to beds array
    setBeds([...beds, newBed]);

    // Reset form and close dialog
    setNewBedNumber("");
    setNewBedDepartment(null);
    setNewBedNotes("");
    setIsAddBedOpen(false);

    toast({
      title: "Bed added",
      description: `Bed ${newBedNumber} has been added to ${departmentName(newBedDepartment)}`,
    });
  };

  const handleAssignPatient = () => {
    if (!selectedBed || !selectedPatient) {
      toast({
        title: "Missing information",
        description: "Please select a patient to assign",
        variant: "destructive",
      });
      return;
    }

    // Find the selected patient
    const patient = patients.find((p) => p.id === selectedPatient);

    if (!patient) {
      toast({
        title: "Error",
        description: "Selected patient not found",
        variant: "destructive",
      });
      return;
    }

    // Update the bed with patient information
    setBeds((prevBeds) =>
      prevBeds.map((bed) =>
        bed.id === selectedBed.id
          ? {
              ...bed,
              patient_id: patient.id,
              patient_name: patient.full_name,
              status: "occupied",
            }
          : bed,
      ),
    );

    // Reset form and close dialog
    setSelectedPatient(null);
    setPatientSearchQuery("");
    setIsAssignPatientOpen(false);

    toast({
      title: "Patient assigned",
      description: `${patient.full_name} has been assigned to bed ${selectedBed.bed_number}`,
    });
  };

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(patientSearchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Bed Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddBedOpen} onOpenChange={setIsAddBedOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Bed
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bed</DialogTitle>
                <DialogDescription>
                  Add a new bed to the hospital inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bedNumber" className="text-right">
                    Bed Number
                  </Label>
                  <Input
                    id="bedNumber"
                    value={newBedNumber}
                    onChange={(e) => setNewBedNumber(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., A105"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Select
                    value={newBedDepartment || undefined}
                    onValueChange={setNewBedDepartment}
                  >
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newBedNotes}
                    onChange={(e) => setNewBedNotes(e.target.value)}
                    className="col-span-3"
                    placeholder="Optional notes about this bed"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddBedOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddBed}>Add Bed</Button>
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
              placeholder="Search bed number or patient name..."
              className="pl-8"
              value={localSearchQuery}
              onChange={(e) => {
                setLocalSearchQuery(e.target.value);
                // Debounce the search query to prevent excessive filtering
                debounce((value: string) => {
                  setDebouncedSearchQuery(value);
                }, 300)(e.target.value);
              }}
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
                {bed.patient_name && (
                  <div className="flex items-center mb-2 text-blue-600">
                    <User className="h-3.5 w-3.5 mr-1" />
                    <span>{bed.patient_name}</span>
                  </div>
                )}
                {bed.notes && (
                  <p className="text-gray-600 italic">"{bed.notes}"</p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex space-x-2 w-full">
                  {bed.status === "available" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      onClick={() => {
                        setSelectedBed(bed);
                        setIsAssignPatientOpen(true);
                      }}
                    >
                      Assign Patient
                    </Button>
                  )}
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

      {/* Assign Patient Dialog */}
      <Dialog open={isAssignPatientOpen} onOpenChange={setIsAssignPatientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Patient to Bed</DialogTitle>
            <DialogDescription>
              {selectedBed &&
                `Assign a patient to Bed ${selectedBed.bed_number} in ${departmentName(selectedBed.department_id)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search for a patient..."
                className="pl-8"
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
              />
            </div>

            <div className="border rounded-md max-h-60 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No patients found
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${selectedPatient === patient.id ? "bg-blue-50" : ""}`}
                    onClick={() => setSelectedPatient(patient.id)}
                  >
                    <div className="font-medium">{patient.full_name}</div>
                    <div className="text-sm text-gray-500 flex flex-col gap-1">
                      {patient.date_of_birth && (
                        <span>
                          DOB:{" "}
                          {new Date(patient.date_of_birth).toLocaleDateString()}
                        </span>
                      )}
                      {patient.contact_number && (
                        <span>Contact: {patient.contact_number}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignPatientOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignPatient} disabled={!selectedPatient}>
              Assign Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

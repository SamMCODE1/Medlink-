import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Mail,
  Phone,
  RefreshCw,
  Building,
  User,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { debounce } from "lodash";

type Department = {
  id: string;
  name: string;
  floor: number;
};

type StaffRole = "doctor" | "nurse" | "admin" | "other";

type Staff = {
  id: string;
  user_id: string | null;
  full_name: string;
  role: StaffRole;
  department_id: string | null;
  contact_number: string | null;
  email: string | null;
};

const roleColors = {
  doctor: "bg-blue-100 text-blue-800 border-blue-300",
  nurse: "bg-green-100 text-green-800 border-green-300",
  admin: "bg-purple-100 text-purple-800 border-purple-300",
  other: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function TeamDirectory() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | "all">(
    "all",
  );
  const [selectedRole, setSelectedRole] = useState<StaffRole | "all">("all");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    fetchDepartments();
    fetchStaff();

    // Set up realtime subscription for staff changes
    const staffSubscription = supabase
      .channel("staff-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff" },
        (payload) => {
          console.log("Staff change received!", payload);
          fetchStaff();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(staffSubscription);
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
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("full_name");

      if (error) throw error;

      setStaff(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = debounce((value: string) => {
    setDebouncedSearchQuery(value);
  }, 300);

  const handleSendMessage = async () => {
    if (!selectedStaff || !messageText.trim()) return;

    try {
      // Check if the staff member has a user account
      if (!selectedStaff.user_id) {
        toast({
          title: "Cannot send message",
          description:
            "This staff member doesn't have a user account in the system.",
          variant: "destructive",
        });
        return;
      }

      // Create a notification for the staff member
      const { error } = await supabase.from("notifications").insert({
        user_id: selectedStaff.user_id,
        title: `Message from ${userData?.fullName || user?.email}`,
        message: messageText,
        is_read: false,
        type: "message",
      });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: `Your message has been sent to ${selectedStaff.full_name}`,
      });

      setMessageText("");
      setIsContactDialogOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesDepartment =
      selectedDepartment === "all" || s.department_id === selectedDepartment;
    const matchesRole = selectedRole === "all" || s.role === selectedRole;
    const matchesSearch =
      !debouncedSearchQuery ||
      s.full_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (s.email &&
        s.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
    return matchesDepartment && matchesRole && matchesSearch;
  });

  const departmentName = (id: string | null) => {
    if (!id) return "Unassigned";
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : "Unknown Department";
  };

  const myDepartmentId = userData?.staffId
    ? staff.find((s) => s.id === userData.staffId)?.department_id
    : null;

  const myDepartmentColleagues = staff.filter(
    (s) => s.department_id === myDepartmentId && s.id !== userData?.staffId,
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Team Directory</h2>
        <Button variant="outline" size="sm" onClick={fetchStaff}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="department" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="department" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            My Department
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            All Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="department">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">
              {myDepartmentId
                ? `${departmentName(myDepartmentId)} Team`
                : "You are not assigned to a department"}
            </h3>
            {myDepartmentId && (
              <p className="text-sm text-gray-500">
                {myDepartmentColleagues.length} colleagues in your department
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : !myDepartmentId ? (
            <div className="text-center text-gray-500 py-8">
              You are not assigned to any department. Please contact an
              administrator to update your profile.
            </div>
          ) : myDepartmentColleagues.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No other staff members in your department
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDepartmentColleagues.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  departmentName={departmentName(s.department_id)}
                  onContact={() => {
                    setSelectedStaff(s);
                    setIsContactDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="col-span-1">
              <Tabs
                value={selectedDepartment}
                onValueChange={(value) =>
                  setSelectedDepartment(value as string)
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All Depts</TabsTrigger>
                  <TabsTrigger value={myDepartmentId || "none"}>
                    My Dept
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="col-span-1">
              <Tabs
                value={selectedRole}
                onValueChange={(value) =>
                  setSelectedRole(value as StaffRole | "all")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All Roles</TabsTrigger>
                  <TabsTrigger value="doctor">Doctors</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No staff members found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  departmentName={departmentName(s.department_id)}
                  onContact={() => {
                    setSelectedStaff(s);
                    setIsContactDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          {selectedStaff && (
            <>
              <DialogHeader>
                <DialogTitle>Contact {selectedStaff.full_name}</DialogTitle>
                <DialogDescription>
                  Send a message to {selectedStaff.full_name} via the internal
                  notification system.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStaff.email || selectedStaff.full_name}`}
                    />
                    <AvatarFallback>
                      {selectedStaff.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{selectedStaff.full_name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Badge className={roleColors[selectedStaff.role]}>
                        {selectedStaff.role.charAt(0).toUpperCase() +
                          selectedStaff.role.slice(1)}
                      </Badge>
                      <span>{departmentName(selectedStaff.department_id)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedStaff.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a
                        href={`mailto:${selectedStaff.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedStaff.email}
                      </a>
                    </div>
                  )}
                  {selectedStaff.contact_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a
                        href={`tel:${selectedStaff.contact_number}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedStaff.contact_number}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md h-32"
                    placeholder="Type your message here..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsContactDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StaffCardProps {
  staff: Staff;
  departmentName: string;
  onContact: () => void;
}

function StaffCard({ staff, departmentName, onContact }: StaffCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.email || staff.full_name}`}
              />
              <AvatarFallback>
                {staff.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{staff.full_name}</CardTitle>
              <div className="text-sm text-gray-500">{departmentName}</div>
            </div>
          </div>
          <Badge className={roleColors[staff.role]}>
            {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {staff.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="truncate">{staff.email}</span>
            </div>
          )}
          {staff.contact_number && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{staff.contact_number}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onContact}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

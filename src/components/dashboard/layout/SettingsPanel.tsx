import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "../../../../supabase/auth";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Moon,
  Bell,
  Shield,
  Camera,
  PlusCircle,
  Bed,
  User,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "../../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsPanel({
  open,
  onOpenChange,
}: SettingsPanelProps) {
  const { signOut, user, userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Settings state
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  // Profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBedDialogOpen, setIsBedDialogOpen] = useState(false);
  const [bedNumber, setBedNumber] = useState("");
  const [bedDepartment, setBedDepartment] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setAvatarSeed(user.email || "");
    }

    if (userData) {
      setFullName(userData.fullName || "");
      setIsAdmin(userData.role === "admin");
    }

    // Fetch departments for bed management
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from("departments")
          .select("*")
          .order("name");

        if (error) throw error;
        setDepartments(data || []);
        if (data && data.length > 0) {
          setBedDepartment(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, [user, userData]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
    onOpenChange(false);
  };

  const handleProfileUpdate = async () => {
    try {
      if (!user?.id) return;

      // Update staff record
      const { error } = await supabase
        .from("staff")
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshUserData();

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description:
          error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = () => {
    // Generate a new random seed for the avatar
    const newSeed = Math.random().toString(36).substring(2, 8);
    setAvatarSeed(newSeed);
  };

  const handleAddBed = async () => {
    try {
      if (!bedNumber || !bedDepartment) {
        toast({
          title: "Missing information",
          description: "Please provide both bed number and department.",
          variant: "destructive",
        });
        return;
      }

      // Check if bed already exists
      const { data: existingBed, error: checkError } = await supabase
        .from("beds")
        .select("*")
        .eq("bed_number", bedNumber)
        .eq("department_id", bedDepartment);

      if (checkError) throw checkError;

      if (existingBed && existingBed.length > 0) {
        toast({
          title: "Bed already exists",
          description: `Bed ${bedNumber} already exists in this department.`,
          variant: "destructive",
        });
        return;
      }

      // Add new bed
      const { error } = await supabase.from("beds").insert({
        bed_number: bedNumber,
        department_id: bedDepartment,
        status: "available",
      });

      if (error) throw error;

      toast({
        title: "Bed added",
        description: `Bed ${bedNumber} has been added successfully.`,
      });

      setBedNumber("");
      setIsBedDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error adding bed",
        description: error.message || "An error occurred while adding the bed.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your dashboard experience and account settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-gray-200">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                  />
                  <AvatarFallback>{fullName?.[0] || email?.[0]}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-white"
                  onClick={handleAvatarChange}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-center">
                <div className="font-medium text-lg">{fullName}</div>
                <div className="text-sm text-gray-500">{email}</div>
                <div className="mt-1">
                  <Badge
                    className={
                      userData?.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : userData?.role === "medical_staff"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                    }
                  >
                    {userData?.role === "admin" && (
                      <ShieldCheck className="h-3 w-3 mr-1" />
                    )}
                    {userData?.role === "admin"
                      ? "Administrator"
                      : userData?.role === "medical_staff"
                        ? "Medical Staff"
                        : "Reception"}
                  </Badge>
                </div>
                {userData?.role === "admin" && (
                  <div className="mt-2 text-xs text-blue-600">
                    You have full editing permissions
                  </div>
                )}
                {userData?.role !== "admin" && (
                  <div className="mt-2 text-xs text-gray-500">
                    View-only access (contact admin for changes)
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="col-span-3 bg-gray-50"
                />
              </div>

              {isAdmin && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Admin Controls</h3>
                  <Dialog
                    open={isBedDialogOpen}
                    onOpenChange={setIsBedDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        Add New Bed
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Bed</DialogTitle>
                        <DialogDescription>
                          Add a new bed to a department in the hospital.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="bedNumber" className="text-right">
                            Bed Number
                          </Label>
                          <Input
                            id="bedNumber"
                            value={bedNumber}
                            onChange={(e) => setBedNumber(e.target.value)}
                            placeholder="e.g. A101"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="department" className="text-right">
                            Department
                          </Label>
                          <Select
                            value={bedDepartment}
                            onValueChange={setBedDepartment}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select department" />
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
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsBedDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddBed}>Add Bed</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <Button onClick={handleProfileUpdate} className="w-full">
                Save Profile
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Moon className="h-4 w-4 text-gray-500 justify-self-center" />
                <Label htmlFor="dark-mode" className="col-span-2">
                  Dark Mode
                </Label>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="justify-self-end"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Bell className="h-4 w-4 text-gray-500 justify-self-center" />
                <Label htmlFor="notifications" className="col-span-2">
                  Notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  className="justify-self-end"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Shield className="h-4 w-4 text-gray-500 justify-self-center" />
                <Label htmlFor="security" className="col-span-2">
                  Security Alerts
                </Label>
                <Switch
                  id="security"
                  checked={securityAlerts}
                  onCheckedChange={setSecurityAlerts}
                  className="justify-self-end"
                />
              </div>
            </div>

            <div className="border-t my-2 pt-4">
              <div className="text-sm text-gray-500 mb-2">Account</div>
              <div className="text-sm">
                <div className="font-medium">{user?.email}</div>
                <div className="text-gray-500 text-xs mt-1">
                  Last login: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full gap-2 mt-4"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

function Badge({ children, className }: BadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

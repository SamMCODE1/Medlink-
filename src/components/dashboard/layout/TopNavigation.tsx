import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bell,
  Home,
  Search,
  Settings,
  User,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import RealtimeStatus from "../RealtimeStatus";
import { supabase } from "../../../../supabase/supabase";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from "@/lib/notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
}

const TopNavigation = ({ onSearch = () => {} }: TopNavigationProps) => {
  const { user, userData, signOut } = useAuth();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchValue, setSearchValue] = useState("");

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactView, setCompactView] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial notifications
    const loadNotifications = async () => {
      const notifs = await fetchNotifications(user.id);
      setNotifications(notifs);
    };

    loadNotifications();

    // Set up realtime subscription for notifications
    const notificationSubscription = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Notification change received!", payload);
          loadNotifications(); // Refresh notifications when changes occur
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [user?.id]);

  if (!user) return null;

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "medical_staff":
        return "bg-green-100 text-green-800";
      case "reception":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "medical_staff":
        return "Medical Staff";
      case "reception":
        return "Reception";
      default:
        return "User";
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const handleMarkAsRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif,
        ),
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true })),
      );
    }
  };

  const saveSettings = () => {
    // In a real app, you would save these to user preferences in the database
    // For now, we'll just show a toast notification
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
    setSettingsOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="w-full h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 fixed top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <Link
          to="/"
          className="text-gray-900 hover:text-gray-700 transition-colors"
        >
          <Home className="h-5 w-5" />
        </Link>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search resources..."
            className="pl-9 h-10 rounded-full bg-gray-100 border-0 text-sm focus:ring-2 focus:ring-gray-200 focus-visible:ring-gray-200 focus-visible:ring-offset-0"
            value={searchValue}
            onChange={handleSearch}
          />
        </div>
        <div className="hidden md:block">
          <RealtimeStatus />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full h-9 w-9 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <Bell className="h-4 w-4 text-gray-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium border border-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl overflow-hidden p-2 border border-gray-200 shadow-lg w-80"
                >
                  <div className="flex justify-between items-center px-2">
                    <DropdownMenuLabel className="text-sm font-medium text-gray-900 py-1">
                      Notifications
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-blue-600 hover:text-blue-800"
                        onClick={handleMarkAllAsRead}
                      >
                        <Check className="h-3 w-3 mr-1" /> Mark all as read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator className="my-1 bg-gray-100" />
                  {notifications.length === 0 ? (
                    <div className="py-4 text-center text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`rounded-lg text-sm py-2 px-3 my-1 ${!notification.is_read ? "bg-blue-50" : ""} hover:bg-gray-100`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="w-full">
                            <div className="font-medium">
                              {notification.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <div className="text-xs text-gray-400">
                                {new Date(
                                  notification.created_at,
                                ).toLocaleString()}
                              </div>
                              {!notification.is_read && (
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                              )}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg bg-gray-900 text-white text-xs px-3 py-1.5">
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 hover:cursor-pointer">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt={user.email || ""}
              />
              <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border-none shadow-lg"
          >
            <DropdownMenuLabel className="text-xs text-gray-500">
              {user.email}
              {userData?.role && (
                <div className="mt-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userData.role)}`}
                  >
                    {getRoleDisplay(userData.role)}
                  </span>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setSettingsOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            {userData?.role === "admin" && (
              <DropdownMenuItem className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
                Admin Controls
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => signOut()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Customize your MediLink experience with these settings.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-refresh" className="font-medium">
                    Auto Refresh
                  </Label>
                  <p className="text-sm text-gray-500">
                    Automatically refresh data every 30 seconds
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-view" className="font-medium">
                    Compact View
                  </Label>
                  <p className="text-sm text-gray-500">
                    Use a more compact layout to show more information
                  </p>
                </div>
                <Switch
                  id="compact-view"
                  checked={compactView}
                  onCheckedChange={setCompactView}
                />
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="notifications-enabled"
                    className="font-medium"
                  >
                    Enable Notifications
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications about system updates
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-gray-500">
                    Switch between light and dark theme
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopNavigation;

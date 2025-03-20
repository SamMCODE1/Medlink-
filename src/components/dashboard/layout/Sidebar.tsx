import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  Bed,
  Activity,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SettingsPanel from "./SettingsPanel";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
}

const Sidebar = ({
  activeItem = "Home",
  onItemClick = () => {},
}: SidebarProps) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const defaultNavItems: NavItem[] = [
    { icon: <Home size={20} />, label: "Home", href: "/" },
    {
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <Bed size={20} />,
      label: "Bed Management",
      href: "/dashboard?tab=beds",
    },
    {
      icon: <Activity size={20} />,
      label: "Patient Queue",
      href: "/dashboard?tab=queue",
    },
    {
      icon: <Calendar size={20} />,
      label: "Calendar",
      href: "/dashboard?tab=calendar",
    },
    { icon: <Users size={20} />, label: "Team", href: "/dashboard?tab=team" },
  ];

  const defaultBottomItems: NavItem[] = [
    { icon: <Settings size={20} />, label: "Settings" },
    { icon: <HelpCircle size={20} />, label: "Help" },
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.href) {
      navigate(item.href);
    }
    onItemClick(item.label);
  };

  const handleBottomItemClick = (item: NavItem) => {
    if (item.label === "Settings") {
      setIsSettingsOpen(true);
    } else {
      onItemClick(item.label);
    }
  };

  return (
    <div className="w-[280px] h-full bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">MediLink</h2>
        <p className="text-sm text-gray-500">Hospital Resource Management</p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5">
          {defaultNavItems.map((item) => (
            <Button
              key={item.label}
              variant={"ghost"}
              className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${item.label === activeItem ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "text-gray-700 hover:bg-gray-100"}`}
              onClick={() => handleItemClick(item)}
            >
              <span
                className={`${item.label === activeItem ? "text-blue-600" : "text-gray-500"}`}
              >
                {item.icon}
              </span>
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-4 bg-gray-100" />

        <div className="space-y-3">
          <h3 className="text-xs font-medium px-4 py-1 text-gray-500 uppercase tracking-wider">
            Status
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Available Beds
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            High Priority Patients
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            Equipment Maintenance
          </Button>
        </div>

        {userData?.role === "admin" && (
          <div className="mt-6">
            <h3 className="text-xs font-medium px-4 py-1 text-gray-500 uppercase tracking-wider">
              Admin
            </h3>
            <div className="mt-2 space-y-1.5">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => navigate("/dashboard?tab=resources")}
              >
                <span className="text-gray-500">
                  <Stethoscope size={20} />
                </span>
                Resource Allocation
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 mt-auto border-t border-gray-200">
        {defaultBottomItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 mb-1.5"
            onClick={() => handleBottomItemClick(item)}
          >
            <span className="text-gray-500">{item.icon}</span>
            {item.label}
          </Button>
        ))}
      </div>

      <SettingsPanel open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
};

export default Sidebar;

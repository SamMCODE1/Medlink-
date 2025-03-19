import { useAuth } from "../../../../supabase/auth";
import { Badge } from "@/components/ui/badge";
import { UserCircle } from "lucide-react";

export default function UserProfileDisplay() {
  const { userData } = useAuth();

  if (!userData) return null;

  const roleDisplay = {
    admin: "Administrator",
    medical_staff: "Medical Staff",
    reception: "Reception",
    patient: "Patient",
  };

  const roleColors = {
    admin: "bg-purple-100 text-purple-800 border-purple-300",
    medical_staff: "bg-blue-100 text-blue-800 border-blue-300",
    reception: "bg-green-100 text-green-800 border-green-300",
    patient: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const role = userData.role || "patient";

  return (
    <div className="flex items-center gap-2">
      <UserCircle className="h-5 w-5 text-gray-500" />
      <span className="text-sm font-medium">
        {userData.full_name || userData.email}
      </span>
      <Badge className={roleColors[role]}>{roleDisplay[role]}</Badge>
    </div>
  );
}

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type RoleBasedRouteProps = {
  children: ReactNode;
  allowedRoles: Array<"admin" | "medical_staff" | "reception">;
};

export default function RoleBasedRoute({
  children,
  allowedRoles,
}: RoleBasedRouteProps) {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userData?.role || !allowedRoles.includes(userData.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

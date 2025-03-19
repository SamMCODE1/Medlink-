import { Button } from "@/components/ui/button";
import { useAuth } from "../../../supabase/auth";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  const { signOut, userData } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mx-auto text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          {userData?.role ? (
            <>
              Your current role ({userData.role}) does not have permission to
              access this page.
            </>
          ) : (
            <>You don't have the necessary permissions to access this page.</>
          )}
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

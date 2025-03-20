import { useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "../../../supabase/supabase";

type UserRole = "admin" | "medical_staff" | "reception";

export default function SignUpForm() {
  const appName = "MediLink";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("medical_staff");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // First sign up the user with Supabase Auth
      const { data: authData, error: authError } = await signUp(
        email,
        password,
        fullName,
      );

      if (authError) throw authError;

      if (!authData?.user?.id) {
        throw new Error("User creation failed. Please try again.");
      }

      // Make sure the user exists in the public.users table before creating staff record
      // First check if user already exists in the public.users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", authData.user.id)
        .single();

      // If user doesn't exist in public.users table, create it
      if (!existingUser && !userCheckError) {
        const { error: createUserError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          token_identifier: authData.user.id, // Using user ID as token identifier
        });

        if (createUserError) {
          console.error("Error creating user record:", createUserError);
          throw new Error("Failed to create user record. Please try again.");
        }
      }

      // Get admin department ID or create it if it doesn't exist
      let adminDepartmentId = null;

      // Check if admin department exists
      const { data: adminDept, error: adminDeptError } = await supabase
        .from("departments")
        .select("id")
        .eq("name", "Administration")
        .single();

      if (adminDeptError && adminDeptError.code !== "PGRST116") {
        console.error("Error checking admin department:", adminDeptError);
      }

      if (adminDept) {
        adminDepartmentId = adminDept.id;
      } else {
        // Create admin department if it doesn't exist
        const { data: newDept, error: deptError } = await supabase
          .from("departments")
          .insert({
            name: "Administration",
            floor: 1,
          })
          .select("id")
          .single();

        if (deptError) {
          console.error("Error creating admin department:", deptError);
        } else if (newDept) {
          adminDepartmentId = newDept.id;
        }
      }

      // Ensure we have a department ID for admin users
      if (role === "admin" && !adminDepartmentId) {
        // If we couldn't get or create the admin department, create a fallback
        const { data: fallbackDept, error: fallbackError } = await supabase
          .from("departments")
          .insert({
            name: "Administration",
            floor: 1,
          })
          .select("id")
          .single();

        if (!fallbackError && fallbackDept) {
          adminDepartmentId = fallbackDept.id;
        } else {
          // Last resort - get any department
          const { data: anyDept } = await supabase
            .from("departments")
            .select("id")
            .limit(1)
            .single();

          if (anyDept) {
            adminDepartmentId = anyDept.id;
          }
        }
      }

      // Then create a staff record with the selected role
      const { error: staffError } = await supabase.from("staff").insert({
        user_id: authData.user.id,
        full_name: fullName,
        role:
          role === "admin"
            ? "admin"
            : role === "reception"
              ? "admin"
              : "doctor",
        email: email,
        department_id:
          role === "admin" || role === "reception" ? adminDepartmentId : null,
      });

      // If this is an admin user, ensure they're assigned to the admin department
      if ((role === "admin" || role === "reception") && adminDepartmentId) {
        // Create a notification about the assignment
        await supabase.from("notifications").insert({
          user_id: authData.user.id,
          title: "Department Assignment",
          message: `You have been assigned to the Administration department`,
          is_read: false,
          type: "info",
        });
      }

      if (staffError) throw staffError;

      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
        duration: 5000,
      });
      navigate("/login");
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Error creating account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{appName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hospital Resource Management System
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-sm font-medium text-gray-700"
            >
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Select Your Role
            </Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="cursor-pointer">
                  Administrator
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="medical_staff" id="medical_staff" />
                <Label htmlFor="medical_staff" className="cursor-pointer">
                  Medical Staff
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="reception" id="reception" />
                <Label htmlFor="reception" className="cursor-pointer">
                  Reception
                </Label>
              </div>
            </RadioGroup>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-sm font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>

          <div className="text-xs text-center text-gray-500 mt-6">
            By creating an account, you agree to our{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </div>

          <div className="text-sm text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

import { createContext, useContext, useEffect, useState } from "react";
import { User, AuthResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type UserRole = "admin" | "medical_staff" | "reception";
type UserData = {
  role?: UserRole;
  fullName?: string;
  staffId?: string;
};

type AuthContextType = {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch staff data to get role
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (staffError && staffError.code !== "PGRST116") {
        console.error("Error fetching staff data:", staffError);
        return;
      }

      if (staffData) {
        setUserData({
          role:
            staffData.role === "admin"
              ? "admin"
              : staffData.role === "nurse"
                ? "medical_staff"
                : staffData.role === "doctor"
                  ? "medical_staff"
                  : "reception",
          fullName: staffData.full_name,
          staffId: staffData.id,
        });
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    }
  };

  const refreshUserData = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser?.id) {
        fetchUserData(currentUser.id);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser?.id) {
        fetchUserData(currentUser.id);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (response.error) throw response.error;
    return response;
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await fetchUserData(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/api";

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auth.getMe();
      console.log("Auth response:", response); // Debug log

      if (response.success && response.data) {
        console.log("Setting user:", response.data); // Debug log
        setUser(response.data);
      } else {
        console.log("No user data in response:", response); // Debug log
        setUser(null);
        setError("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Auth error:", error); // Debug log
      setUser(null);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await auth.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to logout");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    logout,
    refreshUser: fetchUser,
  };
}

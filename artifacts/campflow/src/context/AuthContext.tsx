import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { IUser, LoginInput, RegisterInput } from "@/types";
import * as authService from "@/services/authService";
import { tokenStorage } from "@/config/axios";

// ─── Context shape ────────────────────────────────────────────────────────────
export interface AuthContextValue {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until initial check done

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = tokenStorage.getAccess();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
      } catch {
        // Token is invalid or expired; clear and continue as guest
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  // ── Listen for session expiry dispatched by the Axios interceptor ───────────
  useEffect(() => {
    const handleExpiry = () => {
      setUser(null);
    };
    window.addEventListener("campflow:session-expired", handleExpiry);
    return () => window.removeEventListener("campflow:session-expired", handleExpiry);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (input: LoginInput) => {
    const result = await authService.login(input);
    setUser(result.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authService.register(input);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getMe();
    setUser(currentUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

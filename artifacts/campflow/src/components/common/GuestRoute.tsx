import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * GuestRoute
 * Redirects authenticated users away from auth pages (login, register).
 * Redirects them to their role-appropriate dashboard.
 */
export default function GuestRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && user) {
    const destination =
      user.role === "admin" || user.role === "manager"
        ? "/dashboard/admin"
        : "/dashboard";
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

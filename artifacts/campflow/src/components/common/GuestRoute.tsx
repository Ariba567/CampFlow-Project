import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

/**
 * GuestRoute
 * Redirects authenticated users away from auth pages (login, register).
 * Redirects them to their role-appropriate dashboard.
 */
export default function GuestRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="grid min-h-[40vh] place-items-center"><Spinner className="size-6 text-primary" /></div>;

  if (isAuthenticated && user) {
    const destination =
      user.role === "admin" || user.role === "manager"
        ? "/dashboard/admin"
        : "/dashboard";
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

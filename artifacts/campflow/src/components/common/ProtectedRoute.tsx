import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  /** One or more roles allowed to access this route. Omit to allow any authenticated user. */
  roles?: UserRole[];
}

/**
 * ProtectedRoute
 * Redirects unauthenticated users to /login.
 * If `roles` are provided, redirects unauthorised users to /unauthorised.
 * Shows nothing while the session is being restored (prevents flash of redirect).
 */
export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-[40vh] place-items-center"><Spinner className="size-6 text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    if (roles.length === 1 && roles[0] === "customer" && (user.role === "manager" || user.role === "admin")) {
      return <Navigate to="/dashboard/admin" replace />;
    }
    return <Navigate to="/unauthorised" replace />;
  }

  return <Outlet />;
}

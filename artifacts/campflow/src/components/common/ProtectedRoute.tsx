import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

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
    // Prevent premature redirect while session is being restored from storage
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorised" replace />;
  }

  return <Outlet />;
}

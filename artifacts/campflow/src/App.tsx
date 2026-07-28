import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import GuestRoute from "@/components/common/GuestRoute";
import { Toaster } from "@/components/ui/sonner";

// ─── Placeholder page components (replaced during feature development) ────────
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">CampFlow</h1>
        <p className="text-muted-foreground">{label} – coming soon</p>
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
function Router() {
  // BASE_URL is injected by Vite from the artifact's previewPath.
  // Strip trailing slash so BrowserRouter basename works correctly.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<ComingSoon label="Home" />} />
        <Route path="/campgrounds" element={<ComingSoon label="Campgrounds" />} />
        <Route path="/campgrounds/:slug" element={<ComingSoon label="Campground Detail" />} />
        <Route path="/campgrounds/:slug/sites/:siteId" element={<ComingSoon label="Campsite Detail" />} />
        <Route path="/pricing" element={<ComingSoon label="Pricing" />} />
        <Route path="/activities" element={<ComingSoon label="Activities" />} />
        <Route path="/about" element={<ComingSoon label="About" />} />
        <Route path="/contact" element={<ComingSoon label="Contact" />} />
        <Route path="/faq" element={<ComingSoon label="FAQ" />} />
        <Route path="/unauthorised" element={<ComingSoon label="Unauthorised" />} />

        {/* ── Guest-only routes (redirect if already logged in) ── */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<ComingSoon label="Login" />} />
          <Route path="/register" element={<ComingSoon label="Register" />} />
        </Route>

        {/* ── Protected: any authenticated user ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/reservation" element={<ComingSoon label="Reservation" />} />
          <Route path="/dashboard" element={<ComingSoon label="Customer Dashboard" />} />
          <Route path="/dashboard/bookings" element={<ComingSoon label="My Bookings" />} />
          <Route path="/dashboard/profile" element={<ComingSoon label="Profile Settings" />} />
          <Route path="/dashboard/reviews" element={<ComingSoon label="My Reviews" />} />
        </Route>

        {/* ── Protected: manager or admin only ── */}
        <Route element={<ProtectedRoute roles={["manager", "admin"]} />}>
          <Route path="/dashboard/admin" element={<ComingSoon label="Admin Dashboard" />} />
          <Route path="/dashboard/admin/campgrounds" element={<ComingSoon label="Manage Campgrounds" />} />
          <Route path="/dashboard/admin/reservations" element={<ComingSoon label="Manage Reservations" />} />
          <Route path="/dashboard/admin/pricing" element={<ComingSoon label="Pricing Management" />} />
        </Route>

        {/* ── Protected: admin only ── */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/dashboard/admin/users" element={<ComingSoon label="User Management" />} />
          <Route path="/dashboard/admin/analytics" element={<ComingSoon label="Analytics" />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

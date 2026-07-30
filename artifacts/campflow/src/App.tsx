import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import GuestRoute from '@/components/common/GuestRoute';
import Layout from '@/components/common/Layout';
import PagePlaceholder from '@/components/common/PagePlaceholder';
import { Toaster } from '@/components/ui/sonner';

import Home from '@/pages/home';
import Campgrounds from '@/pages/campgrounds';
import CampgroundDetail from '@/pages/campground-detail';
import CampsiteDetail from '@/pages/campsite-detail';
import Pricing from '@/pages/pricing';
import Activities from '@/pages/activities';
import About from '@/pages/about';
import Contact from '@/pages/contact';
import FAQ from '@/pages/faq';
import Dashboard from '@/pages/dashboard';
import DashboardBookings from '@/pages/dashboard-bookings';
import DashboardProfile from '@/pages/dashboard-profile';
import DashboardReviews from '@/pages/dashboard-reviews';
import DashboardAdmin from '@/pages/dashboard-admin';
import DashboardAdminCampgrounds from '@/pages/dashboard-admin-campgrounds';
import DashboardAdminReservations from '@/pages/dashboard-admin-reservations';
import DashboardAdminPricing from '@/pages/dashboard-admin-pricing';
import DashboardAdminUsers from '@/pages/dashboard-admin-users';
import DashboardAdminAnalytics from '@/pages/dashboard-admin-analytics';

function Router() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/campgrounds" element={<Layout><Campgrounds /></Layout>} />
        <Route path="/campgrounds/:slug" element={<Layout><CampgroundDetail /></Layout>} />
        <Route path="/campgrounds/:slug/sites/:siteId" element={<Layout><CampsiteDetail /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/activities" element={<Layout><Activities /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/faq" element={<Layout><FAQ /></Layout>} />
        <Route
          path="/unauthorised"
          element={
            <Layout>
              <PagePlaceholder title="Unauthorised" subtitle="You do not have permission to access this page." actionLabel="Return home" />
            </Layout>
          }
        />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Layout><PagePlaceholder title="Login" /></Layout>} />
          <Route path="/register" element={<Layout><PagePlaceholder title="Register" /></Layout>} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/reservation" element={<Layout><PagePlaceholder title="Reservation" /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard/bookings" element={<Layout><DashboardBookings /></Layout>} />
          <Route path="/dashboard/profile" element={<Layout><DashboardProfile /></Layout>} />
          <Route path="/dashboard/reviews" element={<Layout><DashboardReviews /></Layout>} />
        </Route>

        <Route element={<ProtectedRoute roles={['manager', 'admin']} />}>
          <Route path="/dashboard/admin" element={<Layout><DashboardAdmin /></Layout>} />
          <Route path="/dashboard/admin/campgrounds" element={<Layout><DashboardAdminCampgrounds /></Layout>} />
          <Route path="/dashboard/admin/reservations" element={<Layout><DashboardAdminReservations /></Layout>} />
          <Route path="/dashboard/admin/pricing" element={<Layout><DashboardAdminPricing /></Layout>} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/dashboard/admin/users" element={<Layout><DashboardAdminUsers /></Layout>} />
          <Route path="/dashboard/admin/analytics" element={<Layout><DashboardAdminAnalytics /></Layout>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

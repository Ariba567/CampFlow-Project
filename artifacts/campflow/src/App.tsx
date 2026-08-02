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
import Amenities from '@/pages/amenities';
import Gallery from '@/pages/gallery';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Reservation from '@/pages/reservation';
import ReservationConfirmation from '@/pages/reservation-confirmation';
import Categories from '@/pages/categories';
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
import DashboardAdminCalendar from '@/pages/dashboard-admin-calendar';
import DashboardAdminCampsites from '@/pages/dashboard-admin-campsites';
import DashboardAdminCustomers from '@/pages/dashboard-admin-customers';
import OperationsLayout from '@/components/operations/OperationsLayout';

function Router() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/campgrounds" element={<Layout><Campgrounds /></Layout>} />
        <Route path="/campgrounds/:slug" element={<Layout><CampgroundDetail /></Layout>} />
        <Route path="/campgrounds/:slug/sites/:siteId" element={<Layout><CampsiteDetail /></Layout>} />
        <Route path="/categories/:type" element={<Layout><Categories /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/activities" element={<Layout><Activities /></Layout>} />
        <Route path="/amenities" element={<Layout><Amenities /></Layout>} />
        <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
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
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
        </Route>

        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route path="/reservation" element={<Layout><Reservation /></Layout>} />
          <Route path="/reservation/confirmation/:id" element={<Layout><ReservationConfirmation /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard/bookings" element={<Layout><DashboardBookings /></Layout>} />
          <Route path="/dashboard/reviews" element={<Layout><DashboardReviews /></Layout>} />
        </Route>

        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route path="/dashboard/profile" element={<Layout><DashboardProfile /></Layout>} />
        </Route>

        <Route element={<ProtectedRoute roles={['manager', 'admin']} />}>
          <Route element={<OperationsLayout />}>
            <Route path="/dashboard/admin" element={<DashboardAdmin />} />
            <Route path="/dashboard/admin/reservations" element={<DashboardAdminReservations />} />
            <Route path="/dashboard/admin/calendar" element={<DashboardAdminCalendar />} />
            <Route path="/dashboard/admin/campsites" element={<DashboardAdminCampsites />} />
            <Route path="/dashboard/admin/customers" element={<DashboardAdminCustomers />} />
            <Route path="/dashboard/admin/pricing" element={<DashboardAdminPricing />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<OperationsLayout />}>
            <Route path="/dashboard/admin/campgrounds" element={<DashboardAdminCampgrounds />} />
            <Route path="/dashboard/admin/users" element={<DashboardAdminUsers />} />
            <Route path="/dashboard/admin/analytics" element={<DashboardAdminAnalytics />} />
          </Route>
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

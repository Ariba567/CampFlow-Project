import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import GuestRoute from '@/components/common/GuestRoute';
import Layout from '@/components/common/Layout';
import PagePlaceholder from '@/components/common/PagePlaceholder';
import { Toaster } from '@/components/ui/sonner';

const Home = lazy(() => import('@/pages/home'));
const Campgrounds = lazy(() => import('@/pages/campgrounds'));
const CampgroundDetail = lazy(() => import('@/pages/campground-detail'));
const CampsiteDetail = lazy(() => import('@/pages/campsite-detail'));
const Pricing = lazy(() => import('@/pages/pricing'));
const Activities = lazy(() => import('@/pages/activities'));
const About = lazy(() => import('@/pages/about'));
const Contact = lazy(() => import('@/pages/contact'));
const FAQ = lazy(() => import('@/pages/faq'));
const Amenities = lazy(() => import('@/pages/amenities'));
const Gallery = lazy(() => import('@/pages/gallery'));
const Login = lazy(() => import('@/pages/login'));
const Register = lazy(() => import('@/pages/register'));
const Reservation = lazy(() => import('@/pages/reservation'));
const ReservationConfirmation = lazy(() => import('@/pages/reservation-confirmation'));
const Categories = lazy(() => import('@/pages/categories'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const DashboardBookings = lazy(() => import('@/pages/dashboard-bookings'));
const DashboardProfile = lazy(() => import('@/pages/dashboard-profile'));
const DashboardReviews = lazy(() => import('@/pages/dashboard-reviews'));
const DashboardAdmin = lazy(() => import('@/pages/dashboard-admin'));
const DashboardAdminCampgrounds = lazy(() => import('@/pages/dashboard-admin-campgrounds'));
const DashboardAdminReservations = lazy(() => import('@/pages/dashboard-admin-reservations'));
const DashboardAdminPricing = lazy(() => import('@/pages/dashboard-admin-pricing'));
const DashboardAdminUsers = lazy(() => import('@/pages/dashboard-admin-users'));
const DashboardAdminAnalytics = lazy(() => import('@/pages/dashboard-admin-analytics'));
const DashboardAdminCalendar = lazy(() => import('@/pages/dashboard-admin-calendar'));
const DashboardAdminCampsites = lazy(() => import('@/pages/dashboard-admin-campsites'));
const DashboardAdminCustomers = lazy(() => import('@/pages/dashboard-admin-customers'));
const OperationsLayout = lazy(() => import('@/components/operations/OperationsLayout'));

function Router() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

  return (
    <BrowserRouter basename={basename}>
      <Suspense fallback={<div className="min-h-[50vh] px-4 py-20 text-center text-muted-foreground">Loading page…</div>}>
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
      </Suspense>
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

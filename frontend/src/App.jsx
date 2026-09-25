import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ProviderOnboarding = lazy(() => import('./pages/auth/ProviderOnboarding'));
const PendingApproval = lazy(() => import('./pages/auth/PendingApproval'));
const RejectedApplication = lazy(() => import('./pages/auth/RejectedApplication'));
const ProviderListing = lazy(() => import('./pages/providers/ProviderListing'));
const ProviderProfile = lazy(() => import('./pages/providers/ProviderProfile'));
const BookingFlow = lazy(() => import('./pages/booking/BookingFlow'));
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import PageLoader from './components/common/PageLoader';
const NotFound = lazy(() => import('./pages/NotFound'));

// Public Pages
const About = lazy(() => import('./pages/public/About'));
const Terms = lazy(() => import('./pages/public/Terms'));
const Privacy = lazy(() => import('./pages/public/Privacy'));
const Guidelines = lazy(() => import('./pages/public/Guidelines'));
const Help = lazy(() => import('./pages/public/Help'));
const Contact = lazy(() => import('./pages/public/Contact'));

import { useAuth } from './context/AuthContext';

// Dashboard / Provider Pages
const ProviderDashboard = lazy(() => import('./pages/dashboard/ProviderDashboard'));
const ProviderDocket = lazy(() => import('./pages/provider/ProviderDocket'));
const ProviderLedger = lazy(() => import('./pages/provider/ProviderLedger'));
const ProviderEminence = lazy(() => import('./pages/provider/ProviderEminence'));
const ProviderProfileEdit = lazy(() => import('./pages/provider/ProviderProfileEdit'));

// Dashboard / Citizen Pages
const CitizenDashboard = lazy(() => import('./pages/dashboard/CitizenDashboard'));
const CitizenPetitions = lazy(() => import('./pages/citizen/CitizenPetitions'));
const CitizenHistory = lazy(() => import('./pages/citizen/CitizenHistory'));
const CitizenIssues = lazy(() => import('./pages/citizen/CitizenIssues'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminEscrow = lazy(() => import('./pages/admin/AdminEscrow'));
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'));


// Smart redirect: /dashboard → role-specific dashboard
function DashboardRedirect() {
  const { user, isAuthenticated, isPendingProvider, isRejectedProvider } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isPendingProvider) return <Navigate to="/pending-approval" replace />;
  if (isRejectedProvider) return <Navigate to="/rejected-application" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to={user?.role === 'provider' ? '/provider/dashboard' : '/citizen/dashboard'} replace />;
}

// Route pages are code-split: each loads on first visit instead of all up front.
function AppRoutes() {
  const { pathname } = useLocation();

  // Auth pages render outside MainLayout, which titles every other route.
  useEffect(() => {
    if (pathname === '/login') document.title = 'Log in · Lexium';
    if (pathname === '/register') document.title = 'Create an account · Lexium';
  }, [pathname]);

  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth pages — rendered without the global Navbar/Footer chrome */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/provider-onboarding" element={<ProviderOnboarding />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/rejected-application" element={<RejectedApplication />} />
          <Route path="/providers" element={<ProviderListing />} />
          <Route path="/providers/:id" element={<ProviderProfile />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />

          {/* Protected Provider Routes — approved only */}
          <Route path="/provider" element={<ProtectedRoute allowedRoles={['provider']} requireApproved />}>
            <Route element={<DashboardLayout />}>
              <Route path="dashboard" element={<ProviderDashboard />} />
              <Route path="docket" element={<ProviderDocket />} />
              <Route path="ledger" element={<ProviderLedger />} />
              <Route path="eminence" element={<ProviderEminence />} />
              <Route path="profile" element={<ProviderProfileEdit />} />
            </Route>
          </Route>

          {/* Protected Citizen Routes */}
          <Route path="/citizen" element={<ProtectedRoute allowedRoles={['citizen']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="dashboard" element={<CitizenDashboard />} />
              <Route path="petitions" element={<CitizenPetitions />} />
              <Route path="history" element={<CitizenHistory />} />
              <Route path="issues" element={<CitizenIssues />} />
            </Route>
            <Route path="book/:providerId" element={<BookingFlow />} />
          </Route>

          {/* Public booking route (requires citizen login) */}
          <Route path="/book/:providerId" element={<ProtectedRoute allowedRoles={['citizen']} />}>
            <Route index element={<BookingFlow />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="providers" element={<AdminProviders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="escrow" element={<AdminEscrow />} />
              <Route path="complaints" element={<AdminComplaints />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  );
}

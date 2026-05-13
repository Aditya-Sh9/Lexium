import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProviderOnboarding from './pages/auth/ProviderOnboarding';
import PendingApproval from './pages/auth/PendingApproval';
import RejectedApplication from './pages/auth/RejectedApplication';
import ProviderListing from './pages/providers/ProviderListing';
import ProviderProfile from './pages/providers/ProviderProfile';
import BookingFlow from './pages/booking/BookingFlow';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import About from './pages/public/About';
import Terms from './pages/public/Terms';
import Privacy from './pages/public/Privacy';
import Guidelines from './pages/public/Guidelines';
import Help from './pages/public/Help';
import Contact from './pages/public/Contact';

import { useAuth } from './context/AuthContext';

// Dashboard / Provider Pages
import ProviderDashboard from './pages/dashboard/ProviderDashboard';
import ProviderDocket from './pages/provider/ProviderDocket';
import ProviderLedger from './pages/provider/ProviderLedger';
import ProviderEminence from './pages/provider/ProviderEminence';
import ProviderProfileEdit from './pages/provider/ProviderProfileEdit';

// Dashboard / Citizen Pages
import CitizenDashboard from './pages/dashboard/CitizenDashboard';
import CitizenPetitions from './pages/citizen/CitizenPetitions';
import CitizenHistory from './pages/citizen/CitizenHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProviders from './pages/admin/AdminProviders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEscrow from './pages/admin/AdminEscrow';


// Smart redirect: /dashboard → role-specific dashboard
function DashboardRedirect() {
  const { user, isAuthenticated, isPendingProvider, isRejectedProvider } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isPendingProvider) return <Navigate to="/pending-approval" replace />;
  if (isRejectedProvider) return <Navigate to="/rejected-application" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to={user?.role === 'provider' ? '/provider/dashboard' : '/citizen/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

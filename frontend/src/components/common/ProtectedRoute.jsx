import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, requireApproved }) {
  const { user, isAuthenticated, loading, isPendingProvider, isRejectedProvider } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where they were headed so login can send them back there.
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  // Check role access
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'provider') {
      if (isPendingProvider) return <Navigate to="/pending-approval" replace />;
      return <Navigate to="/provider/dashboard" replace />;
    }
    return <Navigate to="/citizen/dashboard" replace />;
  }

  // For provider routes that require approved status
  if (requireApproved && user?.role === 'provider') {
    if (isPendingProvider) return <Navigate to="/pending-approval" replace />;
    if (isRejectedProvider) return <Navigate to="/rejected-application" replace />;
  }

  return <Outlet />;
}

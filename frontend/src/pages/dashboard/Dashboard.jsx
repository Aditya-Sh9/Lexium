import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import CitizenDashboard from './CitizenDashboard';
import ProviderDashboard from './ProviderDashboard';

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {user?.role === 'provider' ? <ProviderDashboard /> : <CitizenDashboard />}
    </div>
  );
}

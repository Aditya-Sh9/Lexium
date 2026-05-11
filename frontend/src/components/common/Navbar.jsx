import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, X, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isPendingProvider, logout } = useAuth();

  // Determine the dashboard path based on role
  const getDashboardPath = () => {
    if (!isAuthenticated) return '/login';
    if (isAdmin) return '/admin/dashboard';
    if (user?.role === 'provider') {
      return isPendingProvider ? '/pending-approval' : '/provider/dashboard';
    }
    return '/citizen/dashboard';
  };

  // Determine the dashboard label
  const getDashboardLabel = () => {
    if (isAdmin) return 'Admin Panel';
    if (user?.role === 'provider') return isPendingProvider ? 'Status' : 'Dashboard';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/');
  };

  // Public nav links
  const publicLinks = [{ to: '/', label: 'Home' }];

  // Only show Find Providers for authenticated non-admin users (citizens/providers)
  if (isAuthenticated && !isAdmin) {
    publicLinks.push({ to: '/providers', label: 'Find Providers' });
  }

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/20 bg-surface-50/80 backdrop-blur-[20px] shadow-[0_30px_60px_-10px_rgba(15,27,45,0.06)]">
      <div className="flex justify-between items-center h-20 px-6 md:px-12 max-w-[1920px] mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setIsOpen(false)}>
          <div className="w-9 h-9 rounded-lg bg-primary-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Scale size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-primary-900 uppercase tracking-widest font-heading hidden sm:inline">
            Lexium
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {publicLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-sans text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                location.pathname === link.to
                  ? 'text-primary-800 bg-primary-50'
                  : 'text-surface-600 hover:text-primary-800 hover:bg-surface-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Dynamic auth buttons — max 2 */}
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-surface-200">
            {isAuthenticated ? (
              <>
                {/* Button 1: Dashboard/Status */}
                <Link
                  to={getDashboardPath()}
                  className="px-5 py-2 bg-primary-800 text-white font-sans text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-primary-900 transition-all border border-accent-300/40"
                >
                  {getDashboardLabel()}
                </Link>
                {/* Button 2: Logout */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-surface-600 font-sans text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-surface-100 hover:text-red-600 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Button 1: Login */}
                <Link
                  to="/login"
                  className="px-4 py-2 text-surface-700 font-sans text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-surface-50 transition-all"
                >
                  Login
                </Link>
                {/* Button 2: Register */}
                <Link
                  to="/register"
                  className="px-5 py-2 bg-primary-800 text-white font-sans text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-primary-900 transition-all border border-accent-300/40"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-primary-900 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-surface-200 bg-surface-50/95 backdrop-blur-[20px] px-6 py-4 space-y-3">
          {publicLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)}
              className="block font-sans text-base text-surface-800 py-1.5">
              {link.label}
            </Link>
          ))}
          <div className="border-t border-surface-200 pt-3 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardPath()} onClick={() => setIsOpen(false)}
                  className="inline-block bg-primary-800 text-white px-5 py-2.5 font-sans text-sm rounded-lg border border-accent-300/40 w-max font-bold uppercase tracking-widest">
                  {getDashboardLabel()}
                </Link>
                <button onClick={handleLogout}
                  className="text-left text-sm font-sans font-medium text-red-600 cursor-pointer">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="font-sans text-base text-surface-800">Login</Link>
                <Link to="/register" onClick={() => setIsOpen(false)}
                  className="inline-block bg-primary-800 text-white px-5 py-2.5 font-sans text-sm rounded-lg border border-accent-300/40 w-max font-bold uppercase tracking-widest">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

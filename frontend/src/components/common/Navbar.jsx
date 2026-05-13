import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, X, Scale, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isPendingProvider, logout } = useAuth();

  // Dashboard "home" path for the avatar chip
  const dashboardPath = (() => {
    if (!isAuthenticated) return '/login';
    if (isAdmin) return '/admin/dashboard';
    if (user?.role === 'provider') {
      return isPendingProvider ? '/pending-approval' : '/provider/dashboard';
    }
    return '/citizen/dashboard';
  })();

  const dashboardLabel = (() => {
    if (isAdmin) return 'Admin';
    if (user?.role === 'provider') return isPendingProvider ? 'Status' : user?.name?.split(' ')[0] || 'Provider';
    if (user?.role === 'citizen') return user?.name?.split(' ')[0] || 'Citizen';
    return 'Account';
  })();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/');
  };

  // ── Single-nav link computation (replaces the separate DashboardNav) ──
  // Authenticated users see their role-specific dashboard links.
  // Visitors see the public marketplace links.
  let navLinks = [];
  if (!isAuthenticated) {
    navLinks = [
      { to: '/', label: 'Home' },
      { to: '/providers', label: 'Find Providers' },
    ];
  } else if (isAdmin) {
    navLinks = [
      { to: '/admin/dashboard',  label: 'Dashboard' },
      { to: '/admin/providers',  label: 'Providers' },
      { to: '/admin/users',      label: 'Users' },
      { to: '/admin/escrow',     label: 'Escrow' },
    ];
  } else if (user?.role === 'provider') {
    if (isPendingProvider) {
      navLinks = [{ to: '/pending-approval', label: 'Status' }];
    } else {
      navLinks = [
        { to: '/provider/dashboard', label: 'Dashboard' },
        { to: '/provider/docket',    label: 'Docket' },
        { to: '/provider/ledger',    label: 'Ledger' },
        { to: '/provider/eminence',  label: 'Eminence' },
        { to: '/provider/profile',   label: 'Profile' },
      ];
    }
  } else if (user?.role === 'citizen') {
    navLinks = [
      { to: '/citizen/dashboard',  label: 'Dashboard' },
      { to: '/citizen/petitions',  label: 'My Cases' },
      { to: '/citizen/history',    label: 'Case History' },
      { to: '/providers',          label: 'Find Providers' },
    ];
  }

  const initials = user?.name ? getInitials(user.name) : '';

  return (
    <nav className="fixed top-0 w-full z-50 lx-topnav">
      <div
        className="h-[60px] px-6 md:px-8 max-w-[1440px] mx-auto grid items-center"
        style={{ gridTemplateColumns: '1fr auto 1fr' }}
      >
        {/* Brand — left */}
        <Link
          to={dashboardPath}
          className="flex items-center gap-2.5 group justify-self-start"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-7 h-7 rounded-md bg-primary-900 flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
          >
            <Scale size={14} className="text-[var(--brass-light)]" />
          </div>
          <span
            className="text-[18px] font-heading text-primary-900 hidden sm:inline"
            style={{ letterSpacing: '0.01em', fontWeight: 500 }}
          >
            Lexium
          </span>
        </Link>

        {/* Centered nav — middle column. One bar for everything. */}
        <nav className="hidden md:flex items-center gap-7 h-[60px] justify-self-center">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`lx-nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Profile / auth — right */}
        <div className="hidden md:flex items-center gap-2 justify-self-end">
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border border-[var(--hairline-strong)] bg-white text-surface-800 hover:bg-surface-100 transition-colors"
                title={dashboardLabel}
              >
                <span className="w-7 h-7 rounded-full lx-avatar-tone-1 flex items-center justify-center text-[11px] font-semibold">
                  {initials || '—'}
                </span>
                <span className="text-[13px] font-medium hidden lg:inline">{dashboardLabel}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="lx-btn lx-btn-ghost lx-btn-sm"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="lx-btn lx-btn-ghost lx-btn-sm">Login</Link>
              <Link to="/register" className="lx-btn lx-btn-primary lx-btn-sm">Register</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-primary-900 cursor-pointer justify-self-end"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="md:hidden bg-surface-50/95 backdrop-blur-[20px] px-6 py-4 space-y-3"
          style={{ borderTop: '1px solid var(--hairline)' }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={`block py-1.5 text-base ${
                location.pathname === link.to ? 'text-primary-900 font-medium' : 'text-surface-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--hairline)' }}>
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setIsOpen(false)}
                  className="lx-btn lx-btn-primary lx-btn-sm w-max"
                >
                  {dashboardLabel}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-sm font-medium text-[var(--danger-600)] cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="lx-btn lx-btn-ghost lx-btn-sm w-max">
                  Login
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="lx-btn lx-btn-primary lx-btn-sm w-max">
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

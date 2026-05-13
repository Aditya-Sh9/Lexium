import { Link, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Briefcase, IndianRupee, Award, UserCog, FileText, Clock, Users, UserCheck, Shield, Lock } from 'lucide-react';

const providerLinks = [
  { to: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/provider/docket',    label: 'Docket',    icon: Briefcase },
  { to: '/provider/ledger',    label: 'Ledger',    icon: IndianRupee },
  { to: '/provider/eminence',  label: 'Eminence',  icon: Award },
  { to: '/provider/profile',   label: 'Profile',   icon: UserCog },
];

const citizenLinks = [
  { to: '/citizen/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/citizen/petitions',  label: 'My Cases',     icon: FileText },
  { to: '/citizen/history',    label: 'Case History', icon: Clock },
];

const adminLinks = [
  { to: '/admin/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/admin/providers',  label: 'Providers',  icon: UserCheck },
  { to: '/admin/users',      label: 'Users',      icon: Users },
  { to: '/admin/escrow',     label: 'Escrow',     icon: Lock },
];

export default function DashboardNav() {
  const { user } = useAuth();
  const location = useLocation();

  const links = user?.role === 'admin' ? adminLinks :
                user?.role === 'provider' ? providerLinks : citizenLinks;

  return (
    <nav
      className="bg-white/85 backdrop-blur-[12px] sticky top-[60px] z-30"
      style={{ borderBottom: '1px solid var(--hairline)' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide h-11 items-center">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`lx-subtab ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

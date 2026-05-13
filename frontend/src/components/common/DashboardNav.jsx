import { Link, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Briefcase, IndianRupee, Award, UserCog, FileText, Clock, Users, UserCheck, Shield } from 'lucide-react';

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
];

export default function DashboardNav() {
  const { user } = useAuth();
  const location = useLocation();

  const links = user?.role === 'admin' ? adminLinks :
                user?.role === 'provider' ? providerLinks : citizenLinks;

  return (
    <nav className="bg-white/80 backdrop-blur-[16px] border-b border-surface-200 shadow-sm sticky top-20 z-30">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-800 border border-primary-200'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-primary-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

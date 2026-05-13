import { Outlet } from 'react-router';

/**
 * DashboardLayout is intentionally a passthrough.
 * The role-aware nav lives in the single top Navbar (no separate sub-nav).
 */
export default function DashboardLayout() {
  return <Outlet />;
}

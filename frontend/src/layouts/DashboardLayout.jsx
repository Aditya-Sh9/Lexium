import { Outlet } from 'react-router';
import DashboardNav from '../components/common/DashboardNav';

export default function DashboardLayout() {
  return (
    <>
      <DashboardNav />
      <Outlet />
    </>
  );
}

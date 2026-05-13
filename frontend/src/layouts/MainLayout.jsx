import { Outlet } from 'react-router';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import AnimatedBackground from '../components/ui/AnimatedBackground';

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent relative">
      <AnimatedBackground />
      {/* Make sure content is above background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-[60px]">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import ErrorBoundary from '../components/common/ErrorBoundary';
import PageLoader from '../components/common/PageLoader';

const SITE = 'Lexium';

// Document titles by route prefix (first match wins).
const TITLES = [
  ['/providers/', 'Provider profile'],
  ['/providers', 'Find verified legal professionals'],
  ['/book/', 'Book a consultation'],
  ['/citizen/book/', 'Book a consultation'],
  ['/about', 'How it works'],
  ['/help', 'Help centre'],
  ['/contact', 'Contact'],
  ['/terms', 'Terms of service'],
  ['/privacy', 'Privacy policy'],
  ['/guidelines', 'Community guidelines'],
  ['/provider-onboarding', 'Apply as a professional'],
  ['/pending-approval', 'Application under review'],
  ['/rejected-application', 'Application outcome'],
  ['/citizen/dashboard', 'Dashboard'],
  ['/citizen/petitions', 'My cases'],
  ['/citizen/history', 'Case history'],
  ['/citizen/issues', 'Support'],
  ['/provider/dashboard', 'Dashboard'],
  ['/provider/docket', 'Docket'],
  ['/provider/ledger', 'Ledger'],
  ['/provider/eminence', 'Eminence'],
  ['/provider/profile', 'Edit profile'],
  ['/admin/', 'Admin'],
];

// BrowserRouter doesn't reset scroll on navigation. Jump to the top on a
// new path, or to the target element when the URL carries a #hash.
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
}

function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === '/') {
      document.title = `${SITE} — Verified legal help in India`;
      return;
    }
    const match = TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix));
    document.title = match ? `${match[1]} · ${SITE}` : `Page not found · ${SITE}`;
  }, [pathname]);
}

export default function MainLayout() {
  const { pathname } = useLocation();
  useScrollOnNavigate();
  useDocumentTitle();

  return (
    <div className="flex flex-col min-h-screen bg-transparent relative">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <AnimatedBackground />
      {/* Make sure content is above background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 pt-[60px] outline-none">
          {/* Page-level boundaries keep the navbar and footer on screen. */}
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </div>
  );
}

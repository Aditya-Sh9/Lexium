import { useLocation } from 'react-router';

/*
 * Page backdrop for MainLayout. Intentionally static: a flat parchment
 * surface with the faint arch texture on inner pages. Motion is reserved
 * for elements that explain something, not for decoration.
 */
export default function AnimatedBackground() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none bg-surface-50">
      {!isLanding && <div className="absolute inset-0 bg-arch-pattern opacity-25 mix-blend-multiply" />}
    </div>
  );
}

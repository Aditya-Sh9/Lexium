import { Link, useLocation } from 'react-router';
import { ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="px-5 pb-24 pt-20 sm:px-8 lg:pt-28">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 font-heading text-[42px] leading-[1.05] tracking-[-0.02em] text-primary-950 sm:text-[52px]">
          We can’t find that page.
        </h1>
        <p className="mt-5 text-[17px] leading-7 text-surface-700">
          Nothing lives at <span className="mono break-all text-[15px] text-surface-900">{pathname}</span>. It may have moved, or the link may be mistyped.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/" className="lx-btn lx-btn-primary lx-btn-lg">Go to the home page <ArrowRight size={15} aria-hidden="true" /></Link>
          <Link to="/providers" className="lx-btn lx-btn-secondary lx-btn-lg"><Search size={15} aria-hidden="true" /> Find a provider</Link>
        </div>
        <p className="mt-10 text-sm text-surface-600">
          Think this is a broken link on our side? <Link to="/contact" className="font-medium text-primary-800 underline underline-offset-4">Let us know</Link>.
        </p>
      </div>
    </div>
  );
}

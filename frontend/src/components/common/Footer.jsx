import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="w-full mt-16 bg-surface-50 dark:bg-slate-950 pillar-divider-horizontal">
      <div className="flex flex-col items-center justify-center py-12 px-8 gap-8 max-w-[1280px] mx-auto">
        
        <div className="flex flex-wrap justify-center gap-12 mb-4">
          <div className="flex flex-col items-center gap-2">
            <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-surface-800 mb-2">Platform</h4>
            <Link to="/providers" className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 hover:text-primary-900 transition-colors">Browse Providers</Link>
            <Link to="/about" className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 hover:text-primary-900 transition-colors">How it Works</Link>
            <Link to="/register?role=provider" className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 hover:text-primary-900 transition-colors">Join as Professional</Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-surface-800 mb-2">Legal</h4>
            <Link to="/terms" className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 hover:text-primary-900 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 hover:text-primary-900 transition-colors">Privacy Policy</Link>
            <Link to="/guidelines" className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 hover:text-primary-900 transition-colors">Community Guidelines</Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-surface-800 mb-2">Support</h4>
            <Link to="/help" className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 hover:text-primary-900 transition-colors">Help Center</Link>
            <Link to="/contact" className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 hover:text-primary-900 transition-colors">Contact Us</Link>
          </div>
        </div>

        <p className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-surface-800/60 text-center">
          © {new Date().getFullYear()} Digital Chambers of Justice. Under Authority of the Sovereign Digital Framework.
        </p>
      </div>
    </footer>
  );
}

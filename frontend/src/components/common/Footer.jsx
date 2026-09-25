import { Link } from 'react-router';
import { Scale } from 'lucide-react';
import { SUPPORT_EMAIL } from '../../config/site';

const columns = [
  {
    title: 'Find help',
    links: [
      { to: '/providers', label: 'All providers' },
      { to: '/providers?category=advocate', label: 'Advocates' },
      { to: '/providers?category=notary', label: 'Notaries' },
      { to: '/providers?category=mediator', label: 'Mediators' },
      { to: '/providers?category=tax-consultant', label: 'Tax consultants' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { to: '/about', label: 'How it works' },
      { to: '/about#escrow', label: 'Escrow' },
      { to: '/register?role=provider', label: 'Join as a professional' },
      { to: '/login', label: 'Log in' },
    ],
  },
  {
    title: 'Support',
    links: [
      { to: '/help', label: 'Help centre' },
      { to: '/contact', label: 'Contact us' },
      { to: '/guidelines', label: 'Community guidelines' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/terms', label: 'Terms of service' },
      { to: '/privacy', label: 'Privacy policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--hairline-strong)] bg-surface-100">
      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-xs">
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Lexium home">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-900">
                <Scale size={14} className="text-[var(--brass-light)]" aria-hidden="true" />
              </span>
              <span className="font-heading text-[18px] font-medium text-primary-900">Lexium</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-surface-600">
              A marketplace for verified legal professionals in India. Lexium is not a law firm and does not give legal advice.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-4 inline-block text-sm font-medium text-primary-800 underline-offset-4 hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="label label-strong">{col.title}</h2>
                <ul className="mt-4 space-y-1">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="inline-block py-1 text-sm text-surface-600 transition-colors hover:text-primary-900">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--hairline-strong)] pt-6 text-xs text-surface-600 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Lexium. All rights reserved.</p>
          <p>Profiles are reviewed before listing. Always confirm engagement terms with your provider.</p>
        </div>
      </div>
    </footer>
  );
}

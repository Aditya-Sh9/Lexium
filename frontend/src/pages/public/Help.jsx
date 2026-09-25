import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Search } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const sections = [
  {
    id: 'booking',
    title: 'Finding and booking',
    items: [
      { q: 'Do I need an account to search?', a: <>No. Anyone can search the <Link to="/providers">provider registry</Link> and read profiles. You need a free citizen account to book.</> },
      { q: 'How do I choose the right type of professional?', a: <>Search for your issue in plain words, such as “property dispute” or “GST notice”, and compare who comes up. <Link to="/about#citizens">How it works</Link> explains each step.</> },
      { q: 'Can I cancel a request?', a: <>Yes. A request that has not been taken up yet can be withdrawn from <Link to="/citizen/petitions">My Cases</Link>.</> },
    ],
  },
  {
    id: 'fees',
    title: 'Fees and escrow',
    items: [
      { q: 'How much does a consultation cost?', a: 'Each provider sets and publishes their own fees per service. You see the price before you confirm a booking.' },
      { q: 'When am I billed?', a: 'Only after the provider marks the consultation as completed.' },
      { q: 'What does “held in escrow” mean?', a: <>The fee is recorded against your case but not released to the provider until the case is resolved or closed. <Link to="/about#escrow">Read more about escrow</Link>.</> },
    ],
  },
  {
    id: 'issues',
    title: 'Problems with a provider',
    items: [
      { q: 'How do I raise an issue?', a: <>Open the case from <Link to="/citizen/petitions">My Cases</Link> and choose “Need help with this case?”. You can follow its progress under <Link to="/citizen/issues">Support</Link>.</> },
      { q: 'What happens after I raise one?', a: 'The Lexium team reviews it and may contact you or the provider. While it is open, the provider’s fee for that case cannot be released.' },
      { q: 'Can Lexium give me legal advice about the dispute?', a: 'No. Lexium is not a law firm. We can review conduct on the platform, but legal advice must come from a qualified professional.' },
    ],
  },
  {
    id: 'account',
    title: 'Your account',
    items: [
      { q: 'I forgot my password.', a: <>On the <Link to="/login">log in page</Link>, enter your email and choose “Forgot password?”. We will send a reset link.</> },
      { q: 'How is my information used?', a: <>Only to run bookings, verify providers, and keep the platform secure. See the <Link to="/privacy">privacy policy</Link>.</> },
    ],
  },
  {
    id: 'providers',
    title: 'For legal professionals',
    items: [
      { q: 'How do I join?', a: <>Start an <Link to="/register?role=provider">application</Link>. You will need your enrolment or registration number, qualifications, and a government ID.</> },
      { q: 'How long does review take?', a: 'Every application is checked by a person. You can see its status on the pending approval page after you apply, and you will be told the reason if it is declined.' },
      { q: 'When are my fees released?', a: 'After the case reaches resolved or closed, and there is no open issue on it. Your ledger shows what is held and what has cleared.' },
    ],
  },
];

// Flattens a string or JSX answer to plain text for search matching.
const textOf = (node) => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).toLowerCase();
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  return textOf(node.props?.children);
};

function Item({ id, q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-trigger`}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center justify-between gap-6 py-4 text-left text-[15px] font-medium text-surface-900 transition-colors hover:text-primary-800"
        >
          {q}
          <ChevronDown size={17} aria-hidden="true" className={`shrink-0 text-surface-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-8 text-[15px] leading-7 text-surface-700 [&_a]:font-medium [&_a]:text-primary-800 [&_a]:underline [&_a]:underline-offset-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Help() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, items: s.items.filter((it) => it.q.toLowerCase().includes(q) || textOf(it.a).includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [query]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="px-5 pb-20 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <div className="mx-auto max-w-[1100px]">
          <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="max-w-2xl">
            <p className="eyebrow">Help centre</p>
            <h1 className="mt-4 font-heading text-[42px] leading-[1.05] tracking-[-0.02em] text-primary-950 sm:text-[52px]">How can we help?</h1>
            <div className="relative mt-8 max-w-lg">
              <label htmlFor="help-search" className="sr-only">Search help articles</label>
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
              <input
                id="help-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search, e.g. fees, password, escrow"
                className="h-12 w-full rounded-lg border border-surface-300 bg-white pl-11 pr-4 text-base outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10"
              />
            </div>
          </motion.header>

          <div className="mt-14 grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
            <nav aria-label="Help topics" className="hidden lg:block">
              <ul className="sticky top-24 space-y-1 border-l border-[var(--hairline-strong)]">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-surface-600 transition-colors hover:border-primary-800 hover:text-primary-900">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-12" aria-live="polite">
              {filtered.length === 0 && (
                <div className="rounded-[10px] border border-[var(--hairline-strong)] bg-white p-6">
                  <p className="lx-h3">No answers match “{query}”.</p>
                  <p className="body-sm mt-1">Try a different word, or <Link to="/contact" className="font-medium text-primary-800 underline underline-offset-4">send us a message</Link>.</p>
                </div>
              )}
              {filtered.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="font-heading text-[26px] text-primary-950">{s.title}</h2>
                  <div className="mt-3 divide-y divide-[var(--hairline)] border-y border-[var(--hairline-strong)]">
                    {s.items.map((it, i) => <Item key={it.q} id={`${s.id}-${i}`} q={it.q} a={it.a} />)}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-5 rounded-[10px] border border-[var(--hairline-strong)] bg-surface-100 p-7 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-2xl text-primary-950">Still stuck?</h2>
              <p className="mt-1 text-[15px] text-surface-700">Send us a message and a member of the team will get back to you by email.</p>
            </div>
            <Link to="/contact" className="lx-btn lx-btn-primary lx-btn-lg shrink-0">Contact support <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

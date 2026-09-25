import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowRight, BadgeCheck, Calculator, Check, ChevronDown, FileSignature, FileText, Gavel,
  Handshake, IdCard, Landmark, Lock, Pause, Play, RotateCcw, Scale, Search, Stamp, Unlock,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from 'framer-motion';
import { categories, toCategoryId } from '../data/categories';
import { getProviders } from '../services/providerService';
import ProviderCard from '../components/ui/ProviderCard';

const EASE = [0.22, 1, 0.36, 1];

const categoryIcons = {
  advocate: Gavel,
  mediator: Handshake,
  arbitrator: Scale,
  notary: Stamp,
  'document-writer': FileSignature,
  'tax-consultant': Calculator,
};

const pluralLabels = {
  advocate: 'Advocates',
  mediator: 'Mediators',
  arbitrator: 'Arbitrators',
  notary: 'Notaries',
  'document-writer': 'Document Writers',
  'tax-consultant': 'Tax Consultants',
};

const commonSearches = ['Property dispute', 'Divorce', 'GST filing', 'Affidavit', 'Rent agreement'];

// Mirrors the petition status machine used by the backend.
const caseStages = [
  { id: 'pending', label: 'Filed', note: 'Request sent to the advocate' },
  { id: 'under-review', label: 'Under review', note: 'Advocate accepted and is reviewing' },
  { id: 'in-progress', label: 'In progress', note: 'Consultation held, work underway' },
  { id: 'awaiting-documents', label: 'Awaiting documents', note: 'Sale deed copy requested' },
  { id: 'resolved', label: 'Resolved', note: 'Title report delivered' },
];

const steps = [
  { number: '01', title: 'Describe the matter', text: 'Search by issue, service, or city. You do not need to know which kind of professional you need yet.' },
  { number: '02', title: 'Compare verified profiles', text: 'Read practice areas, years in practice, languages, reviews, and the consultation fee before you commit.' },
  { number: '03', title: 'Book and follow the case', text: 'Pick a slot and share the essentials. Every status change is added to a timeline on your dashboard.' },
];

const escrowStages = [
  { icon: Check, title: 'Consultation completed', text: 'The provider marks your consultation as done.' },
  { icon: Lock, title: 'Fee held in escrow', text: 'The fee is recorded against your case, not paid out.' },
  { icon: Scale, title: 'Case resolved or closed', text: 'The matter reaches a final status on the timeline.' },
  { icon: Unlock, title: 'Released by Lexium', text: 'Only then can an administrator release the payment.' },
];

const checks = [
  { icon: IdCard, title: 'Government ID', text: 'Identity is matched against the name on the application.' },
  { icon: Landmark, title: 'Enrolment number', text: 'Advocates submit their Bar Council enrolment for review.' },
  { icon: FileText, title: 'Qualifications', text: 'Degrees and certificates are checked before approval.' },
  { icon: BadgeCheck, title: 'Manual approval', text: 'A person reviews every application. Nobody is listed automatically.' },
];

const faqs = [
  { q: 'Is Lexium a law firm?', a: 'No. Lexium is a marketplace. The advice comes from the independent professional you book, and your working relationship is with them.' },
  { q: 'What does a consultation cost?', a: 'Each provider publishes their own consultation fee on their profile, so you see the price before you book. It is billed only after the consultation has taken place.' },
  { q: 'What if something goes wrong with a provider?', a: 'Raise an issue from your dashboard. It is logged against the case, reviewed by the Lexium team, and the provider’s fee cannot be released while it is open.' },
  { q: 'Can I use Lexium without an account?', a: 'You can search and read every profile without signing up. You need a free citizen account to book, so your case record has somewhere to live.' },
];

function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  const Component = motion[as];
  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Component>
  );
}

function SectionHeading({ eyebrow, title, children, action }) {
  return (
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 font-heading text-[34px] leading-[1.1] tracking-[-0.015em] text-primary-950 sm:text-[42px]" style={{ textWrap: 'balance' }}>
          {title}
        </h2>
        {children && <p className="mt-4 max-w-xl text-base leading-7 text-surface-700">{children}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Hero: example case record that walks through the real status machine ── */
function CaseRecord() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(reduceMotion ? 2 : 0);
  const [playing, setPlaying] = useState(!reduceMotion);
  const [hovered, setHovered] = useState(false);
  const last = caseStages.length - 1;
  const done = active === last;

  useEffect(() => {
    if (!playing || hovered || done) return undefined;
    const timer = setTimeout(() => setActive((i) => Math.min(i + 1, last)), active === 0 ? 1100 : 1800);
    return () => clearTimeout(timer);
  }, [active, playing, hovered, done, last]);

  const toggle = () => {
    if (done) {
      setActive(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-[10px] border border-[var(--hairline-strong)] bg-surface-100" />
      <div className="lx-card relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="label">Example case record</p>
            <p className="mt-1.5 truncate font-heading text-[21px] text-primary-950">Property title review</p>
            <p className="body-xs mt-0.5">Advocate · Pune · Filed 3 Sep</p>
          </div>
          <motion.span
              key={caseStages[active].id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`lx-badge shrink-0 ${done ? 'lx-badge-success' : 'lx-badge-info'}`}
            >
              <span className="lx-badge-dot" style={{ background: 'currentColor' }} />
              {caseStages[active].label}
            </motion.span>
        </div>

        <ol className="px-5 py-5 sm:px-6" aria-label="Case timeline">
          {caseStages.map((stage, i) => {
            const state = i < active ? 'past' : i === active ? 'current' : 'future';
            return (
              <li key={stage.id} className="relative flex gap-3.5 pb-4 last:pb-0" aria-current={state === 'current' ? 'step' : undefined}>
                {i < last && (
                  <span aria-hidden="true" className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-surface-200">
                    <motion.span
                      className="absolute inset-0 origin-top bg-primary-700"
                      initial={false}
                      animate={{ scaleY: i < active ? 1 : 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={`relative mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                    state === 'future' ? 'border-surface-300 bg-white' : 'border-primary-800 bg-primary-800 text-white'
                  }`}
                >
                  {state === 'past' && <Check size={11} strokeWidth={3} />}
                  {state === 'current' && <span className="h-1.5 w-1.5 rounded-full bg-[var(--brass-light)]" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium transition-colors duration-300 ${state === 'future' ? 'text-surface-500' : 'text-surface-900'}`}>{stage.label}</p>
                  <p className={`text-[13px] leading-5 transition-colors duration-300 ${state === 'future' ? 'text-surface-400' : 'text-surface-600'}`}>{stage.note}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--hairline)] bg-surface-50 px-5 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 text-[13px]">
            <motion.span
                key={done ? 'released' : 'held'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? 'bg-[var(--success-50)] text-[var(--success-600)]' : 'bg-[rgba(184,149,79,0.14)] text-[var(--brass-dark)]'}`}
              >
                {done ? <Unlock size={13} aria-hidden="true" /> : <Lock size={13} aria-hidden="true" />}
              </motion.span>
            <span className="min-w-0 truncate text-surface-700">
              <span className="tabular font-semibold text-surface-900">₹1,500</span> fee {done ? 'can now be released' : 'held in escrow'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="lx-btn lx-btn-ghost lx-btn-sm shrink-0"
            aria-label={done ? 'Replay example' : playing ? 'Pause example' : 'Play example'}
          >
            {done ? <RotateCcw size={13} /> : playing ? <Pause size={13} /> : <Play size={13} />}
            <span className="hidden sm:inline">{done ? 'Replay' : playing ? 'Pause' : 'Play'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Escrow flow: connector draws in as the section enters the viewport ── */
function EscrowFlow() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="relative mt-12">
      <div aria-hidden="true" className="absolute bottom-5 left-[19px] top-5 w-px bg-white/10 lg:hidden">
        <motion.div
          className="absolute inset-0 origin-top bg-[var(--brass)]"
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ duration: 1.2, ease: EASE, delay: 0.1 }}
        />
      </div>
      <div aria-hidden="true" className="absolute left-5 right-5 top-5 hidden h-px bg-white/10 lg:block">
        <motion.div
          className="absolute inset-0 origin-left bg-[var(--brass)]"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: EASE, delay: 0.1 }}
        />
      </div>
      <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
        {escrowStages.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <motion.li
              key={stage.title}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.15 + i * 0.22, ease: EASE }}
              className="flex gap-4 lg:flex-col"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-primary-900 text-[var(--brass-light)]">
                <Icon size={17} aria-hidden="true" />
              </span>
              <div>
                <p className="mono text-[11px] text-white/70">Step {i + 1}</p>
                <h3 className="mt-1 font-heading text-xl text-white">{stage.title}</h3>
                <p className="mt-1.5 max-w-[260px] text-sm leading-6 text-white/75">{stage.text}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function FeaturedProviders({ providers, status }) {
  if (status === 'loading') {
    return (
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading providers">
        {[0, 1, 2].map((i) => (
          <div key={i} className="lx-card h-[178px] animate-pulse p-[18px]">
            <div className="flex gap-3">
              <div className="h-14 w-14 rounded-full bg-surface-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 w-2/3 rounded bg-surface-100" />
                <div className="h-3 w-1/2 rounded bg-surface-100" />
                <div className="h-3 w-3/4 rounded bg-surface-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (status === 'error' || providers.length === 0) {
    return (
      <div className="lx-card lx-card-flat mt-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="lx-h3">{status === 'error' ? 'We couldn’t load profiles just now.' : 'New profiles are being reviewed.'}</p>
          <p className="body-sm mt-1">{status === 'error' ? 'The registry is still available. Try opening it directly.' : 'Approved providers appear here as soon as they are verified.'}</p>
        </div>
        <Link to="/providers" className="lx-btn lx-btn-secondary">Open the registry <ArrowRight size={14} /></Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {providers.map((provider, i) => (
        <Reveal key={provider._id || provider.id} delay={i * 0.06}>
          <ProviderCard provider={provider} />
        </Reveal>
      ))}
    </div>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-[var(--hairline-strong)] border-y border-[var(--hairline-strong)]">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        const id = `faq-${i}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                id={`${id}-trigger`}
                aria-expanded={isOpen}
                aria-controls={`${id}-panel`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left font-heading text-xl text-primary-950 transition-colors hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
              >
                {item.q}
                <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-surface-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${id}-panel`}
                  role="region"
                  aria-labelledby={`${id}-trigger`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-5 text-[15px] leading-7 text-surface-700">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    getProviders({ sortBy: 'rating' })
      .then((list) => {
        if (cancelled) return;
        setProviders(Array.isArray(list) ? list : []);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, []);

  const countFor = (id) => providers.filter((p) => toCategoryId(p.service_type || p.category) === id).length;
  const featured = providers.slice(0, 3);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = search.trim();
    navigate(value ? `/providers?search=${encodeURIComponent(value)}` : '/providers');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="overflow-x-clip">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative px-5 pb-20 pt-14 sm:px-8 lg:px-12 lg:pb-28 lg:pt-20">
          <div className="mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <p className="eyebrow flex items-center gap-3"><span aria-hidden="true" className="h-px w-8 bg-[var(--brass)]" /> Verified legal help, India</p>
              <h1 className="mt-6 max-w-[640px] font-heading text-[44px] leading-[1.02] tracking-[-0.025em] text-primary-950 sm:text-6xl lg:text-[68px]" style={{ textWrap: 'balance' }}>
                Find the right lawyer, and see every step of your case.
              </h1>
              <p className="mt-6 max-w-[540px] text-[17px] leading-7 text-surface-700">
                Every professional on Lexium is checked by a person before they are listed. Fees are published up front and held in escrow until your matter is resolved.
              </p>

              <form onSubmit={submitSearch} className="mt-9 flex max-w-[580px] flex-col gap-3 sm:flex-row" role="search">
                <label htmlFor="home-search" className="sr-only">What do you need help with?</label>
                <div className="relative min-w-0 flex-1">
                  <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
                  <input
                    id="home-search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="An issue, a service, or a city"
                    autoComplete="off"
                    className="h-[52px] w-full rounded-lg border border-surface-300 bg-white pl-11 pr-4 text-base text-surface-900 shadow-[var(--shadow-sm)] outline-none transition placeholder:text-surface-500 focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10"
                  />
                </div>
                <button type="submit" className="lx-btn lx-btn-primary h-[52px] shrink-0 px-6 text-[14px]">
                  Search <ArrowRight size={16} aria-hidden="true" />
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[13px] text-surface-600">Common:</span>
                {commonSearches.map((term) => (
                  <Link
                    key={term}
                    to={`/providers?search=${encodeURIComponent(term)}`}
                    className="inline-flex h-8 items-center rounded-full border border-[var(--hairline-strong)] bg-white/70 px-3 text-[13px] text-surface-700 transition-colors hover:border-surface-400 hover:bg-white hover:text-primary-900"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.12, ease: EASE }} className="mx-auto w-full max-w-[460px] lg:max-w-none">
              <CaseRecord />
            </motion.div>
          </div>
        </section>

        {/* ── Practice areas ───────────────────────────────────── */}
        <section id="practice-areas" className="scroll-mt-20 border-y border-[var(--hairline)] bg-white px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            <Reveal>
              <SectionHeading
                eyebrow="Practice areas"
                title="Start with the kind of help you need."
                action={<Link to="/providers" className="lx-btn lx-btn-secondary w-max">All providers <ArrowRight size={14} aria-hidden="true" /></Link>}
              />
            </Reveal>
            <ul className="mt-12 grid border-l border-t border-[var(--hairline-strong)] sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, i) => {
                const Icon = categoryIcons[category.id] || FileText;
                const count = countFor(category.id);
                return (
                  <Reveal as="li" key={category.id} delay={i * 0.04} className="border-b border-r border-[var(--hairline-strong)]">
                    <Link
                      to={`/providers?category=${category.id}`}
                      className="group flex h-full min-h-[180px] flex-col justify-between gap-6 p-6 transition-colors hover:bg-surface-50 focus-visible:bg-surface-50"
                    >
                      <div className="flex items-start justify-between">
                        <Icon size={22} strokeWidth={1.6} aria-hidden="true" className="text-primary-800" />
                        <ArrowRight size={16} aria-hidden="true" className="-translate-x-1 text-surface-400 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-primary-800 group-hover:opacity-100" />
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-heading text-[22px] text-primary-950">{pluralLabels[category.id] || category.name}</h3>
                          {status === 'ready' && count > 0 && (
                            <span className="tabular shrink-0 text-xs text-surface-600">{count} listed</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-surface-600">{category.description}</p>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-20 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <Reveal>
              <SectionHeading eyebrow="How it works" title="From first question to a closed case.">
                A booking creates a case record, not just a calendar slot. Documents, updates, and outcomes stay attached to it.
              </SectionHeading>
              <Link to="/about" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary-800 hover:text-primary-600">
                Read the full process <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <ol className="border-t border-[var(--hairline-strong)]">
              {steps.map((step, i) => (
                <Reveal as="li" key={step.number} delay={i * 0.08} className="grid gap-3 border-b border-[var(--hairline-strong)] py-8 sm:grid-cols-[64px_1fr]">
                  <span className="mono text-sm text-[var(--brass-dark)]">{step.number}</span>
                  <div>
                    <h3 className="font-heading text-2xl text-primary-950">{step.title}</h3>
                    <p className="mt-2 max-w-md text-[15px] leading-7 text-surface-700">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Escrow ───────────────────────────────────────────── */}
        <section id="escrow" className="scroll-mt-20 bg-primary-950 px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-[1200px]">
            <Reveal>
              <p className="eyebrow" style={{ color: 'var(--brass-light)' }}>Escrow</p>
              <h2 className="mt-3 max-w-2xl font-heading text-[34px] leading-[1.1] tracking-[-0.015em] sm:text-[42px]" style={{ textWrap: 'balance' }}>
                Your fee isn’t paid out until your case is finished.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
                Payments are released against the case record, so the professional you hired has a reason to see the matter through.
              </p>
            </Reveal>
            <EscrowFlow />
          </div>
        </section>

        {/* ── Featured providers ───────────────────────────────── */}
        <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-[1200px]">
            <Reveal>
              <SectionHeading
                eyebrow="On the registry"
                title="Highest-rated professionals right now."
                action={<Link to="/providers" className="lx-btn lx-btn-secondary w-max">Browse everyone <ArrowRight size={14} aria-hidden="true" /></Link>}
              />
            </Reveal>
            <FeaturedProviders providers={featured} status={status} />
          </div>
        </section>

        {/* ── Verification ─────────────────────────────────────── */}
        <section id="verification" className="scroll-mt-20 border-y border-[var(--hairline)] bg-white px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <Reveal>
              <SectionHeading eyebrow="Verification" title="What we check before anyone is listed.">
                Applications that fail any of these are declined with a reason. Listed profiles carry a verified mark.
              </SectionHeading>
              <Link to="/guidelines" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary-800 hover:text-primary-600">
                Provider standards <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {checks.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Reveal as="li" key={item.title} delay={i * 0.06} className="flex gap-4">
                    <Icon size={20} strokeWidth={1.6} aria-hidden="true" className="mt-1 shrink-0 text-[var(--brass-dark)]" />
                    <div>
                      <h3 className="lx-h3">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-surface-600">{item.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <Reveal>
              <SectionHeading eyebrow="Questions" title="Before you book.">
                Straight answers to what people ask most.
              </SectionHeading>
              <Link to="/help" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary-800 hover:text-primary-600">
                Visit the help centre <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <Reveal delay={0.08}><Faq /></Reveal>
          </div>
        </section>

        {/* ── For professionals ───────────────────────────────── */}
        <section className="px-5 pb-20 sm:px-8 lg:px-12">
          <Reveal className="mx-auto max-w-[1200px]">
            <div className="grid gap-8 rounded-[10px] border border-[var(--hairline-strong)] bg-surface-100 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
              <div>
                <p className="eyebrow">For legal professionals</p>
                <h2 className="mt-3 max-w-2xl font-heading text-3xl leading-tight text-primary-950 sm:text-[38px]" style={{ textWrap: 'balance' }}>
                  Take on clients who arrive with the facts already written down.
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-surface-700">
                  Apply once, get verified, and manage your docket, consultations, and ledger from one workspace.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link to="/register?role=provider" className="lx-btn lx-btn-primary lx-btn-lg">
                  Apply to join <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link to="/login" className="lx-btn lx-btn-secondary lx-btn-lg">Provider sign in</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </MotionConfig>
  );
}

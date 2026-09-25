import { Link } from 'react-router';
import { motion, MotionConfig } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const citizenSteps = [
  { title: 'Search the registry', text: 'Filter by practice area, city, rating, and experience. Every listed profile has been approved by a Lexium reviewer.' },
  { title: 'Book a consultation', text: 'Choose a service and a time, then describe the matter. This creates your case record straight away.' },
  { title: 'Follow the case', text: 'Your dashboard shows the case timeline, appointments, and any documents the provider asks for.' },
  { title: 'Close it out', text: 'Once the matter is resolved you can leave a review. If something went wrong, raise an issue from the same case.' },
];

const lifecycle = [
  { status: 'Pending', text: 'You have filed the request. The provider has not responded yet.' },
  { status: 'Under review', text: 'The provider accepted and is assessing what is needed.' },
  { status: 'In progress', text: 'Work has started, usually after the first consultation.' },
  { status: 'Awaiting documents', text: 'The provider is waiting on something from you. The request is shown on the case.' },
  { status: 'Resolved', text: 'The provider considers the matter complete.' },
  { status: 'Closed', text: 'The case is finished and archived to your history.' },
];

const providerSteps = [
  { title: 'Apply', text: 'Submit your practice details, enrolment or registration number, qualifications, and ID.' },
  { title: 'Get reviewed', text: 'An administrator checks the application. You are told the outcome, with a reason if declined.' },
  { title: 'Work from the docket', text: 'Accept requests, schedule consultations, and move cases through each status.' },
  { title: 'Get paid on resolution', text: 'Completed consultations appear in your ledger and are released once the case is resolved.' },
];

function Block({ id, eyebrow, title, intro, children }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: EASE }}
      className="scroll-mt-24 grid gap-8 border-t border-[var(--hairline-strong)] py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
    >
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 font-heading text-[30px] leading-tight text-primary-950 sm:text-[34px]">{title}</h2>
        {intro && <p className="mt-3 text-[15px] leading-7 text-surface-700">{intro}</p>}
      </div>
      <div>{children}</div>
    </motion.section>
  );
}

function NumberedList({ items }) {
  return (
    <ol className="space-y-6">
      {items.map((item, i) => (
        <li key={item.title} className="grid grid-cols-[40px_1fr] gap-2">
          <span className="mono pt-1 text-sm text-[var(--brass-dark)]">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <h3 className="font-heading text-[21px] text-primary-950">{item.title}</h3>
            <p className="mt-1 text-[15px] leading-7 text-surface-700">{item.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function About() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="px-5 pb-20 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <div className="mx-auto max-w-[1100px]">
          <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="max-w-2xl pb-14">
            <p className="eyebrow">How it works</p>
            <h1 className="mt-4 font-heading text-[42px] leading-[1.05] tracking-[-0.02em] text-primary-950 sm:text-[56px]">
              One record for every matter, from booking to close.
            </h1>
            <p className="mt-5 text-[17px] leading-7 text-surface-700">
              Lexium connects citizens with independently practising legal professionals. It is not a law firm and does not give legal advice itself. What it adds is verification, a shared case record, and a fee that is only released when the work is done.
            </p>
            <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
              {[['#citizens', 'For citizens'], ['#lifecycle', 'Case statuses'], ['#escrow', 'Escrow'], ['#professionals', 'For professionals']].map(([href, label]) => (
                <a key={href} href={href} className="inline-flex h-9 items-center rounded-full border border-[var(--hairline-strong)] bg-white px-3.5 text-[13px] text-surface-700 transition-colors hover:border-surface-400 hover:text-primary-900">
                  {label}
                </a>
              ))}
            </nav>
          </motion.header>

          <Block id="citizens" eyebrow="For citizens" title="Getting help" intro="Browsing is open to everyone. You need a free account to book, so your case has somewhere to live.">
            <NumberedList items={citizenSteps} />
          </Block>

          <Block id="lifecycle" eyebrow="Case statuses" title="What each status means" intro="Every change is added to the case timeline with the date, so you can always see what happened and when.">
            <dl className="divide-y divide-[var(--hairline)] rounded-[10px] border border-[var(--hairline-strong)] bg-white">
              {lifecycle.map((row) => (
                <div key={row.status} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-sm font-semibold text-surface-900">{row.status}</dt>
                  <dd className="text-sm leading-6 text-surface-700">{row.text}</dd>
                </div>
              ))}
            </dl>
          </Block>

          <Block id="escrow" eyebrow="Escrow" title="When the provider gets paid" intro="The consultation fee is published on the provider’s profile before you book.">
            <div className="space-y-4 text-[15px] leading-7 text-surface-700">
              <p>When a provider marks your consultation as complete, the fee is recorded in escrow against your case. It is not released to them at that point.</p>
              <p>An administrator can release it only after the case is <strong className="font-semibold text-surface-900">resolved</strong> or <strong className="font-semibold text-surface-900">closed</strong>. If you have raised an issue on the case that is still open, the release is blocked until it is dealt with.</p>
              <p className="rounded-[10px] border border-[var(--hairline-strong)] bg-surface-100 px-5 py-4 text-sm">
                Something not right? <Link to="/help#issues" className="font-medium text-primary-800 underline underline-offset-4">Here’s how to raise an issue</Link>.
              </p>
            </div>
          </Block>

          <Block id="professionals" eyebrow="For professionals" title="Joining the registry" intro="Advocates, mediators, arbitrators, notaries, document writers, and tax consultants can apply.">
            <NumberedList items={providerSteps} />
            <Link to="/register?role=provider" className="lx-btn lx-btn-secondary mt-8">Start an application <ArrowRight size={14} aria-hidden="true" /></Link>
          </Block>

          <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-[10px] bg-primary-950 p-8 sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="font-heading text-[28px] leading-tight text-white">Ready to find someone?</h2>
              <p className="mt-2 text-[15px] text-white/75">Browse the registry without an account.</p>
            </div>
            <Link to="/providers" className="lx-btn lx-btn-gold lx-btn-lg shrink-0">Browse providers <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

import { useState } from 'react';
import { Link } from 'react-router';
import { motion, MotionConfig } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import api from '../../services/api';
import { SUPPORT_EMAIL } from '../../config/site';

const EASE = [0.22, 1, 0.36, 1];

const topics = ['A booking or case', 'Fees or escrow', 'A provider’s conduct', 'Joining as a professional', 'My account', 'Something else'];

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Enter your name.';
  if (!form.email.trim()) errors.email = 'Enter your email so we can reply.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter an email address like name@example.com.';
  if (form.message.trim().length < 10) errors.message = 'Tell us a little more (at least 10 characters).';
  return errors;
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label label-strong mb-1.5 block">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1.5 text-[13px] text-[var(--danger-600)]">{error}</p>}
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: topics[0], message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | failed
  const [reference, setReference] = useState('');

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  // Fallback if the API is unreachable: the same message as a pre-filled email.
  const mailtoHref = () => {
    const subject = `[Lexium] ${form.topic}`;
    const body = `${form.message.trim()}\n\n— ${form.name.trim()} (${form.email.trim()})`;
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const resetForm = () => {
    setForm({ name: '', email: '', topic: topics[0], message: '', website: '' });
    setReference('');
    setStatus('idle');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    const found = validate(form);
    setErrors(found);
    const firstInvalid = ['name', 'email', 'message'].find((k) => found[k]);
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }

    setStatus('sending');
    try {
      const res = await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        topic: form.topic,
        message: form.message.trim(),
        website: form.website,
      });
      setReference(res?.reference || '');
      setStatus('sent');
    } catch (err) {
      // Map server-side validation errors back onto their fields.
      if (err.status === 422 && err.body?.errors) {
        const mapped = Object.fromEntries(Object.entries(err.body.errors).map(([k, v]) => [k, [].concat(v)[0]]));
        setErrors(mapped);
        setStatus('idle');
        const first = ['name', 'email', 'message'].find((k) => mapped[k]);
        if (first) document.getElementById(`contact-${first}`)?.focus();
        return;
      }
      setErrors({ form: err.message });
      setStatus('failed');
    }
  };

  const inputCls = (key) =>
    `lx-input h-11 text-[15px] ${errors[key] ? 'border-[var(--danger-600)]' : ''}`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="px-5 pb-20 pt-14 sm:px-8 lg:px-12 lg:pt-20">
        <div className="mx-auto grid max-w-[1100px] gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <p className="eyebrow">Contact</p>
            <h1 className="mt-4 font-heading text-[42px] leading-[1.05] tracking-[-0.02em] text-primary-950 sm:text-[52px]">Talk to the Lexium team.</h1>
            <p className="mt-5 text-[17px] leading-7 text-surface-700">
              For questions about the platform, your account, or a provider’s conduct. We can’t give legal advice about your matter.
            </p>

            <div className="mt-10 space-y-6 border-t border-[var(--hairline-strong)] pt-8">
              <div className="flex gap-4">
                <Mail size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--brass-dark)]" />
                <div>
                  <h2 className="lx-h3">Email</h2>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 inline-block text-[15px] font-medium text-primary-800 underline-offset-4 hover:underline">{SUPPORT_EMAIL}</a>
                </div>
              </div>
              <div className="rounded-[10px] border border-[var(--hairline-strong)] bg-surface-100 p-5">
                <h2 className="lx-h3">Problem with an active case?</h2>
                <p className="mt-1 text-sm leading-6 text-surface-700">
                  Raising it from the case itself links it to the record and pauses the provider’s payout.
                </p>
                <Link to="/help#issues" className="group mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800">
                  How to raise an issue <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease: EASE }} className="lx-card relative p-6 sm:p-8">
            {status === 'sent' ? (
              <div role="status" className="py-6">
                <CheckCircle2 size={28} aria-hidden="true" className="text-[var(--success-600)]" />
                <h2 className="lx-h1 mt-4">Message sent.</h2>
                <p className="mt-3 text-[15px] leading-7 text-surface-700">
                  Thanks, {form.name.trim().split(' ')[0]}. We’ll reply to <strong className="font-medium text-surface-900">{form.email.trim()}</strong>.
                  {reference && <> Your reference is <span className="mono font-medium text-surface-900">{reference}</span>.</>}
                </p>
                <button type="button" onClick={resetForm} className="lx-btn lx-btn-secondary mt-6">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5" aria-busy={status === 'sending'}>
                <h2 className="lx-h2">Send a message</h2>
                {status === 'failed' && (
                  <div role="alert" className="rounded-lg border border-[rgba(145,52,35,0.2)] bg-[var(--danger-50)] px-4 py-3 text-sm text-[var(--danger-600)]">
                    {errors.form || 'Your message could not be sent.'}{' '}
                    <a href={mailtoHref()} className="font-semibold underline underline-offset-2">Email it to us instead</a>.
                  </div>
                )}
                {/* Honeypot: hidden from people, filled in by spam bots. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor="contact-website">Website</label>
                  <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="contact-name" label="Name" error={errors.name}>
                    <input id="contact-name" name="name" value={form.name} onChange={update} autoComplete="name" className={inputCls('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'contact-name-error' : undefined} />
                  </Field>
                  <Field id="contact-email" label="Email" error={errors.email}>
                    <input id="contact-email" name="email" type="email" value={form.email} onChange={update} autoComplete="email" className={inputCls('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'contact-email-error' : undefined} />
                  </Field>
                </div>
                <Field id="contact-topic" label="Topic" error={errors.topic}>
                  <select id="contact-topic" name="topic" value={form.topic} onChange={update} className="lx-input h-11 cursor-pointer text-[15px]">
                    {topics.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field id="contact-message" label="Message" error={errors.message}>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={update}
                    className={`${inputCls('message')} h-auto py-3 leading-6`}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'contact-message-error' : 'contact-message-hint'}
                  />
                  {!errors.message && <p id="contact-message-hint" className="body-xs mt-1.5">Include a case ID if your question is about a specific matter.</p>}
                </Field>
                <button type="submit" disabled={status === 'sending'} className="lx-btn lx-btn-primary lx-btn-lg w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto">
                  {status === 'sending'
                    ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Sending…</>
                    : <>Send message <ArrowRight size={15} aria-hidden="true" /></>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}

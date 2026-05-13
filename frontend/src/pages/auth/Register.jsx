import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Mail, Lock, Eye, EyeOff, Scale, User, Briefcase, Phone,
  ArrowRight, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { themeToast } from '../../utils/alert';

export default function Register() {
  const navigate = useNavigate();
  const { registerCitizen } = useAuth();
  const [role, setRole] = useState('citizen');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'provider') {
      navigate('/provider-onboarding');
      return;
    }

    if (!form.name || !form.email || !form.password) return themeToast.error('Please fill all required fields');
    if (form.password !== form.confirmPassword) return themeToast.error('Passwords do not match');
    if (form.password.length < 6) return themeToast.error('Password must be at least 6 characters');

    try {
      setLoading(true);
      await registerCitizen({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      themeToast.success('Account created successfully!');
      navigate('/citizen/dashboard');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      if (msg.includes('email-already-in-use')) {
        themeToast.error('An account with this email already exists. Try signing in.');
      } else {
        themeToast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--color-surface-50)]">
      {/* ── Brand panel (left) ─────────────────────────────────── */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden px-14 py-14 text-white"
        style={{ background: 'linear-gradient(180deg, #0f1b2d 0%, #0a1220 100%)' }}
      >
        {/* Decorative concentric ring */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: -160, top: 80,
            width: 520, height: 520,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            right: -100, top: 140,
            width: 400, height: 400,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Brand */}
        <Link to="/" className="relative inline-flex items-center gap-3 w-max group">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: 'rgba(232,208,153,0.10)', boxShadow: 'inset 0 0 0 1px rgba(232,208,153,0.18)' }}
          >
            <Scale size={18} className="text-[var(--brass-light)]" />
          </div>
          <span className="font-heading text-[20px]" style={{ letterSpacing: '0.01em', fontWeight: 500 }}>
            Lexium
          </span>
        </Link>

        {/* Value prop */}
        <div className="relative max-w-[520px]">
          <span className="eyebrow" style={{ color: 'var(--brass-light)', opacity: 0.9 }}>Join the Registry</span>
          <h2
            className="font-heading mt-4"
            style={{
              fontSize: 52,
              lineHeight: 1.06,
              letterSpacing: '-0.02em',
              fontWeight: 500,
            }}
          >
            Begin your legal<br/>matter with<br/>confidence.
          </h2>

          <div
            className="mt-6 mb-7"
            style={{ width: 56, height: 1, background: 'linear-gradient(to right, var(--brass), transparent)' }}
          />

          <p className="text-[15px] leading-relaxed opacity-75 max-w-[460px]">
            Sign up to file cases, schedule consultations with verified counsel, and track every step from filing to resolution.
          </p>

          <ul className="mt-10 flex flex-col gap-3.5">
            {[
              'Free to join — no card required',
              'Pay only the published service fee',
              'Settlement guarded by Lexium escrow',
            ].map(line => (
              <li key={line} className="flex items-center gap-3 text-[14px] opacity-85">
                <CheckCircle2 size={14} className="text-[var(--brass-light)] shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between text-[12px] opacity-55">
          <span>© Lexium · Digital Chambers of Justice</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} /> 256-bit encrypted
          </span>
        </div>
      </aside>

      {/* ── Form panel (right) ─────────────────────────────────── */}
      <section className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        {/* Top action */}
        <div className="flex justify-between items-center mb-10 lg:mb-6">
          <Link to="/" className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-900 flex items-center justify-center" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
              <Scale size={16} className="text-[var(--brass-light)]" />
            </div>
            <span className="font-heading text-[20px] text-primary-900" style={{ letterSpacing: '0.01em', fontWeight: 500 }}>
              Lexium
            </span>
          </Link>

          <p className="hidden lg:block body-sm muted ml-auto">
            Already a member?{' '}
            <Link to="/login" className="font-medium text-[var(--color-primary-900)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[480px]">
            <div className="mb-7">
              <h1 className="lx-h1" style={{ fontSize: 32, lineHeight: 1.15 }}>Create your account</h1>
              <p className="body muted mt-1.5">Choose how you want to use Lexium.</p>
            </div>

            {/* Sign up as */}
            <div className="mb-3">
              <span className="label">Sign up as</span>
            </div>
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { id: 'citizen',  label: 'Citizen',         icon: User },
                { id: 'provider', label: 'Legal Provider',  icon: Briefcase },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRole(tab.id)}
                    className={`lx-tab ${role === tab.id ? 'active' : ''}`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {role === 'provider' ? (
              <div className="lx-card p-7">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-100)] flex items-center justify-center mb-4" style={{ border: '1px solid var(--hairline)' }}>
                  <Briefcase size={20} className="text-[var(--color-primary-800)]" />
                </div>
                <h2 className="lx-h2">Provider application</h2>
                <p className="body-sm mt-1.5 mb-5">
                  Legal providers go through a structured onboarding process to ensure platform quality and bar compliance.
                </p>
                <ol className="space-y-2.5 mb-6">
                  {['Basic information', 'Professional details', 'Verification documents', 'Profile setup', 'Review & submit'].map((step, i) => (
                    <li key={i} className="flex items-center gap-3 body-sm">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-surface-100)] text-[var(--color-primary-800)] flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ border: '1px solid var(--hairline)' }}>
                        {i + 1}
                      </span>
                      <span className="text-[var(--color-surface-700)]">{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="body-xs muted mb-5">
                  Your application will be reviewed by our admin team before activation.
                </p>
                <button
                  onClick={() => navigate('/provider-onboarding')}
                  className="lx-btn lx-btn-primary lx-btn-lg w-full"
                >
                  Begin application <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="reg-name" className="label-strong label block mb-1.5">Full name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input id="reg-name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="John Doe" className="lx-input pl-9" autoComplete="name" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="label-strong label block mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="lx-input pl-9" autoComplete="email" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-phone" className="label-strong label block mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="lx-input pl-9" autoComplete="tel" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-pw" className="label-strong label block mb-1.5">Password</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                        <input id="reg-pw" name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Min 6 chars" className="lx-input pl-9 pr-9" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded text-surface-500 hover:text-surface-800 hover:bg-surface-100 cursor-pointer" tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}>
                          {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="reg-cpw" className="label-strong label block mb-1.5">Confirm</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                        <input id="reg-cpw" name="confirmPassword" type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="Repeat" className="lx-input pl-9" autoComplete="new-password" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="lx-btn lx-btn-primary lx-btn-lg w-full mt-2"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <>Create account <ArrowRight size={14} /></>}
                  </button>
                </form>
              </>
            )}

            <p className="lg:hidden text-center body-sm muted mt-6">
              Already a member?{' '}
              <Link to="/login" className="font-medium text-[var(--color-primary-900)] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center body-xs muted mt-8">
          By creating an account you accept our{' '}
          <Link to="/terms" className="text-[var(--color-primary-700)] hover:underline">Terms</Link>{' '}
          and acknowledge our{' '}
          <Link to="/privacy" className="text-[var(--color-primary-700)] hover:underline">Privacy Policy</Link>.
        </p>
      </section>
    </div>
  );
}

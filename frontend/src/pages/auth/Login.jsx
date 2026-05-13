import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Mail, Lock, Eye, EyeOff, Scale, Shield, User, Briefcase,
  ArrowRight, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { themeToast } from '../../utils/alert';

const ROLE_TABS = [
  { id: 'citizen',  label: 'Citizen',        icon: User,      hint: 'Access legal services, file cases, and track consultations.' },
  { id: 'provider', label: 'Legal Provider', icon: Briefcase, hint: 'Manage your practice, docket, and earnings.' },
  { id: 'admin',    label: 'Admin',          icon: Shield,    hint: 'Platform administration portal.' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, adminLogin } = useAuth();
  const [activeRole, setActiveRole] = useState('citizen');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return themeToast.error('All fields are required');

    try {
      setLoading(true);

      if (activeRole === 'admin') {
        await adminLogin(form.email, form.password);
        themeToast.success('Logged in as Admin');
        navigate('/admin/dashboard');
        return;
      }

      const result = await login(form.email, form.password);
      const user = result.user;

      if (user.role === 'admin') {
        themeToast.success('Welcome back!');
        navigate('/admin/dashboard');
      } else if (user.role === 'provider') {
        if (user.status === 'pending') {
          navigate('/pending-approval');
        } else if (user.status === 'rejected') {
          navigate('/rejected-application');
        } else {
          themeToast.success('Welcome back!');
          navigate('/provider/dashboard');
        }
      } else {
        themeToast.success('Welcome back!');
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      const msg = err.message || 'Login failed';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        themeToast.error('Invalid email or password. Please try again.');
      } else if (msg.includes('Invalid admin')) {
        themeToast.error('Invalid admin credentials.');
      } else {
        themeToast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeTab = ROLE_TABS.find(t => t.id === activeRole);

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

        {/* Brand (top) */}
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

        {/* Value prop (middle) */}
        <div className="relative max-w-[520px]">
          <span className="eyebrow" style={{ color: 'var(--brass-light)', opacity: 0.9 }}>The Lexium Registry</span>
          <h2
            className="font-heading mt-4"
            style={{
              fontSize: 52,
              lineHeight: 1.06,
              letterSpacing: '-0.02em',
              fontWeight: 500,
            }}
          >
            Where verified<br/>counsel meets<br/>considered clients.
          </h2>

          <div
            className="mt-6 mb-7"
            style={{ width: 56, height: 1, background: 'linear-gradient(to right, var(--brass), transparent)' }}
          />

          <p className="text-[15px] leading-relaxed opacity-75 max-w-[460px]">
            File cases, track active legal matters, manage consultations, and settle escrow — all within a single, calm workspace.
          </p>

          <ul className="mt-10 flex flex-col gap-3.5">
            {[
              'Verified, bar-registered providers',
              'Transparent escrow-backed payments',
              'Full case timeline and audit trail',
            ].map(line => (
              <li key={line} className="flex items-center gap-3 text-[14px] opacity-85">
                <CheckCircle2 size={14} className="text-[var(--brass-light)] shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer (bottom) */}
        <div className="relative flex items-center justify-between text-[12px] opacity-55">
          <span>© Lexium · Digital Chambers of Justice</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} /> 256-bit encrypted
          </span>
        </div>
      </aside>

      {/* ── Form panel (right) ─────────────────────────────────── */}
      <section className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        {/* Top-right action */}
        <div className="flex justify-between items-center mb-10 lg:mb-6">
          {/* Mobile brand */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-900 flex items-center justify-center" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
              <Scale size={16} className="text-[var(--brass-light)]" />
            </div>
            <span className="font-heading text-[20px] text-primary-900" style={{ letterSpacing: '0.01em', fontWeight: 500 }}>
              Lexium
            </span>
          </Link>

          <p className="hidden lg:block body-sm muted ml-auto">
            New to Lexium?{' '}
            <Link to="/register" className="font-medium text-[var(--color-primary-900)] hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Form container — vertically centered in available space */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[460px]">
            <div className="mb-7">
              <h1 className="lx-h1" style={{ fontSize: 32, lineHeight: 1.15 }}>Welcome back</h1>
              <p className="body muted mt-1.5">Sign in to your account to continue.</p>
            </div>

            {/* CONTINUE AS */}
            <div className="mb-3">
              <span className="label">Continue as</span>
            </div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {ROLE_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveRole(tab.id)}
                    className={`lx-tab ${activeRole === tab.id ? 'active' : ''}`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <p className="body-sm muted mb-6">{activeTab.hint}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="label-strong label block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={activeRole === 'admin' ? 'admin@gmail.com' : 'you@example.com'}
                    className="lx-input pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-pw" className="label-strong label">Password</label>
                  <button
                    type="button"
                    onClick={() => themeToast('Password recovery coming soon.')}
                    className="body-sm text-[var(--color-primary-700)] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <input
                    id="login-pw"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="lx-input pl-9 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded text-surface-500 hover:text-surface-800 hover:bg-surface-100 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Keep me signed in */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--hairline-strong)] text-[var(--color-primary-900)] focus:ring-[var(--color-primary-400)] cursor-pointer"
                />
                <span className="body-sm" style={{ color: 'var(--color-surface-700)' }}>
                  Keep me signed in on this device
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="lx-btn lx-btn-primary lx-btn-lg w-full mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in as {activeTab.label} <ArrowRight size={14} /></>
                )}
              </button>
            </form>

            {/* Mobile-only "create account" link */}
            <p className="lg:hidden text-center body-sm muted mt-6">
              New to Lexium?{' '}
              <Link to="/register" className="font-medium text-[var(--color-primary-900)] hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center body-xs muted mt-8">
          By continuing you accept our{' '}
          <Link to="/terms" className="text-[var(--color-primary-700)] hover:underline">Terms</Link>{' '}
          and acknowledge our{' '}
          <Link to="/privacy" className="text-[var(--color-primary-700)] hover:underline">Privacy Policy</Link>.
        </p>
      </section>
    </div>
  );
}

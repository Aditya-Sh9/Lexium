import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Scale, Shield, User, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { themeToast } from '../../utils/alert';

const ROLE_TABS = [
  { id: 'citizen', label: 'Citizen', icon: User, desc: 'Access legal services' },
  { id: 'provider', label: 'Legal Provider', icon: Briefcase, desc: 'Manage your practice' },
  { id: 'admin', label: 'Admin', icon: Shield, desc: 'Platform management' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, adminLogin } = useAuth();
  const [activeRole, setActiveRole] = useState('citizen');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
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
        // Admin — direct MongoDB login
        await adminLogin(form.email, form.password);
        themeToast.success('Logged in as Admin');
        navigate('/admin/dashboard');
        return;
      }

      // Citizen / Provider — Firebase login
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

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-800 mb-4 shadow-lg">
            <Scale size={26} className="text-white" />
          </div>
          <h1 className="font-heading text-3xl text-surface-900 mb-1">Enter the Chambers</h1>
          <p className="font-sans text-surface-500 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Role Tabs */}
        <div className="flex rounded-xl bg-surface-100 p-1 mb-6 border border-surface-200 gap-1">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveRole(tab.id); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-sans text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
                  activeRole === tab.id
                    ? 'bg-white text-primary-800 shadow-sm border border-surface-200'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-[20px] rounded-2xl p-8 border border-white/60 shadow-[0_30px_60px_-15px_rgba(15,27,45,0.08)]">
          {/* Role-specific hint */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-50 border border-surface-200 mb-6 text-sm text-surface-600">
            {activeRole === 'admin' && <Shield size={16} className="text-primary-800" />}
            {activeRole === 'citizen' && <User size={16} className="text-primary-800" />}
            {activeRole === 'provider' && <Briefcase size={16} className="text-primary-800" />}
            <span>
              {activeRole === 'admin' && 'Admin portal — direct access'}
              {activeRole === 'citizen' && 'Access legal services and book appointments'}
              {activeRole === 'provider' && 'Manage your practice and docket'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={activeRole === 'admin' ? 'admin@gmail.com' : 'you@example.com'}
                  className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-700 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-pw" className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  id="login-pw"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-700 transition-all font-sans"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 cursor-pointer" tabIndex={-1}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-800 text-white font-sans text-sm uppercase tracking-widest font-bold rounded-xl hover:bg-primary-900 disabled:opacity-60 active:scale-[0.98] transition-all cursor-pointer border border-accent-300/50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Sign In as ${ROLE_TABS.find(t => t.id === activeRole)?.label}`
              )}
            </button>
          </form>
        </div>

        {/* Footer links */}
        {activeRole !== 'admin' && (
          <p className="text-center text-sm text-surface-500 mt-6 font-sans">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary-800 hover:underline">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

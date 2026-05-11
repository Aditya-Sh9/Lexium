import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Scale, User, Briefcase, Phone, ArrowRight } from 'lucide-react';
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
      // Redirect to multi-step onboarding
      navigate('/provider-onboarding');
      return;
    }

    // Citizen registration
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

  const inputClass = "w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-700 transition-all font-sans";

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[560px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-800 mb-4 shadow-lg">
            <Scale size={26} className="text-white" />
          </div>
          <h1 className="font-heading text-3xl text-surface-900 mb-1">Create Your Account</h1>
          <p className="font-sans text-surface-500 text-sm">Join the Sovereign Digital Framework</p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-xl bg-surface-100 p-1 mb-6 border border-surface-200 gap-1">
          {[
            { id: 'citizen', label: 'Citizen', icon: User, desc: 'Access legal services instantly' },
            { id: 'provider', label: 'Legal Provider', icon: Briefcase, desc: 'Apply to join the marketplace' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setRole(tab.id); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-sans text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
                  role === tab.id
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

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-[20px] rounded-2xl p-8 border border-white/60 shadow-[0_30px_60px_-15px_rgba(15,27,45,0.08)]">
          {role === 'provider' ? (
            // Provider — redirect to multi-step onboarding
            <div className="text-center py-4">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center">
                <Briefcase size={32} className="text-primary-800" />
              </div>
              <h2 className="font-heading text-2xl text-surface-900 mb-3">Provider Application</h2>
              <p className="font-sans text-surface-600 mb-2 max-w-sm mx-auto leading-relaxed">
                Legal providers go through a professional onboarding process to ensure platform quality and compliance.
              </p>
              <div className="flex flex-col gap-2 text-left max-w-xs mx-auto my-6">
                {['Basic Information', 'Professional Details', 'Verification Documents', 'Profile Setup', 'Review & Submit'].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-surface-600">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
              <p className="text-xs text-surface-400 mb-6 font-sans">Your application will be reviewed by our admin team before activation.</p>
              <button
                onClick={() => navigate('/provider-onboarding')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-800 text-white font-sans text-sm uppercase tracking-widest font-bold rounded-xl hover:bg-primary-900 active:scale-[0.98] transition-all cursor-pointer border border-accent-300/50"
              >
                Begin Application <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            // Citizen — simple form
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="reg-name" className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input id="reg-name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="John Doe" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-pw" className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input id="reg-pw" name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Min 6 chars" className={inputClass} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 cursor-pointer" tabIndex={-1}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-cpw" className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Confirm</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input id="reg-cpw" name="confirmPassword" type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="Confirm" className={inputClass} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-800 text-white font-sans text-sm uppercase tracking-widest font-bold rounded-xl hover:bg-primary-900 disabled:opacity-60 active:scale-[0.98] transition-all cursor-pointer border border-accent-300/50"
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-surface-500 mt-6 font-sans">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary-800 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, User, Briefcase, ShieldCheck, FileText, Eye, EyeOff, Upload, X, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { themeToast } from '../../utils/alert';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Professional', icon: Briefcase },
  { id: 3, title: 'Verification', icon: ShieldCheck },
  { id: 4, title: 'Profile', icon: FileText },
  { id: 5, title: 'Review', icon: Eye },
];

const SERVICE_TYPES = [
  { value: 'advocate', label: 'Advocate' },
  { value: 'arbitrator', label: 'Arbitrator' },
  { value: 'mediator', label: 'Mediator' },
  { value: 'notary', label: 'Notary Public' },
  { value: 'document-writer', label: 'Document Writer' },
  { value: 'tax-consultant', label: 'Tax Consultant' },
];

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Punjabi', 'Malayalam', 'Odia'];

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const { registerProvider } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    // Step 1
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    // Step 2
    serviceType: '', experience: '', specialization: '', location: '',
    // Step 3
    barCouncilId: '', verificationDocs: [], governmentIdName: '', profilePhotoName: '',
    // Step 4
    bio: '', priceRange: '', consultationFee: '', languages: [], availableDays: '', availableHours: '',
  });

  const update = (key, val) => { setForm(f => ({ ...f, [key]: val })); };

  const toggleLang = (lang) => {
    const langs = form.languages.includes(lang)
      ? form.languages.filter(l => l !== lang)
      : [...form.languages, lang];
    update('languages', langs);
  };

  const addVerificationDoc = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Mock upload — store metadata only (ready for cloud migration)
    const doc = { name: `doc_${Date.now()}_${file.name}`, original_name: file.name, size: file.size, uploaded_at: new Date().toISOString() };
    update('verificationDocs', [...form.verificationDocs, doc]);
    e.target.value = '';
  };

  const removeDoc = (idx) => {
    update('verificationDocs', form.verificationDocs.filter((_, i) => i !== idx));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.name || !form.email || !form.password || !form.phone) return 'All fields are required';
        if (form.password.length < 6) return 'Password must be at least 6 characters';
        if (form.password !== form.confirmPassword) return 'Passwords do not match';
        return null;
      case 2:
        if (!form.serviceType || !form.specialization || !form.location) return 'Please fill all professional details';
        return null;
      case 3:
        return null; // Verification docs are optional for now
      case 4:
        if (!form.bio) return 'Please write a short bio';
        return null;
      default: return null;
    }
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { themeToast.error(err); return; }
    setStep(s => Math.min(s + 1, 5));
  };

  const prevStep = () => { setStep(s => Math.max(s - 1, 1)); };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await registerProvider({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        serviceType: form.serviceType,
        experience: form.experience,
        specialization: form.specialization,
        location: form.location,
        barCouncilId: form.barCouncilId,
        bio: form.bio,
        priceRange: form.priceRange,
        consultationFee: parseFloat(form.consultationFee) || 0,
        languages: form.languages,
        availability: `${form.availableDays} | ${form.availableHours}`,
        verificationDocuments: form.verificationDocs,
        governmentId: form.governmentIdName ? { name: form.governmentIdName, uploaded_at: new Date().toISOString() } : null,
        profilePhoto: form.profilePhotoName ? { name: form.profilePhotoName, uploaded_at: new Date().toISOString() } : null,
      });
      themeToast.success('Application submitted successfully!');
      navigate('/pending-approval');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      if (msg.includes('email-already-in-use')) {
        themeToast.error('An account with this email already exists.');
      } else {
        themeToast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-700 transition-all font-sans text-sm";

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12 bg-transparent">
      <div className="w-full max-w-[800px]">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/register" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-800 mb-4 transition-colors font-sans">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center shadow-lg">
              <Scale size={20} className="text-white" />
            </div>
            <h1 className="font-heading text-2xl text-surface-900">Provider Application</h1>
          </div>
          <p className="font-sans text-surface-500 text-sm">Complete all steps to submit your application</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isComplete = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center relative z-10 ${isActive || isComplete ? '' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isComplete ? 'bg-green-600 border-green-600 text-white' :
                    isActive ? 'bg-primary-800 border-primary-800 text-white' :
                    'bg-white border-surface-300 text-surface-400'
                  }`}>
                    {isComplete ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span className={`font-sans text-[10px] uppercase tracking-widest font-bold mt-1.5 whitespace-nowrap ${isActive ? 'text-primary-800' : 'text-surface-400'}`}>
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-16px] ${step > s.id ? 'bg-green-400' : 'bg-surface-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-[20px] rounded-2xl p-8 border border-white/60 shadow-[0_30px_60px_-15px_rgba(15,27,45,0.08)]">

          {/* ── Step 1: Basic Info ────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-heading text-xl text-surface-900 mb-1">Basic Information</h2>
              <p className="text-sm text-surface-500 font-sans mb-4">Your personal details for account creation.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Full Name *</label>
                  <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Adv. John Doe" className={inputClass} />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Email *</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" className={inputClass} />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" className={inputClass} />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Password *</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 6 characters" className={inputClass} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 cursor-pointer"><EyeOff size={16} /></button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Confirm Password *</label>
                  <input type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Re-enter password" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Professional Info ─────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-heading text-xl text-surface-900 mb-1">Professional Information</h2>
              <p className="text-sm text-surface-500 font-sans mb-4">Details about your legal practice.</p>

              <div>
                <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Legal Profession Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICE_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => update('serviceType', t.value)}
                      className={`p-3 rounded-xl border text-sm font-sans font-medium transition-all cursor-pointer ${
                        form.serviceType === t.value
                          ? 'bg-primary-50 border-primary-600 text-primary-800'
                          : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300'
                      }`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Experience (years)</label>
                  <input type="number" min="0" value={form.experience} onChange={e => update('experience', e.target.value)} placeholder="e.g. 10" className={inputClass} />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Specialization *</label>
                  <input value={form.specialization} onChange={e => update('specialization', e.target.value)} placeholder="e.g. Corporate Law" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Location (City) *</label>
                  <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. New Delhi" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Verification ─────────────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-heading text-xl text-surface-900 mb-1">Verification Documents</h2>
              <p className="text-sm text-surface-500 font-sans mb-4">Upload documents to verify your credentials. These will be reviewed by our admin team.</p>

              <div>
                <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Bar Council ID / License Number</label>
                <input value={form.barCouncilId} onChange={e => update('barCouncilId', e.target.value)} placeholder="e.g. DL/1234/2013" className={`${inputClass} font-mono tracking-wider`} />
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Verification Documents</label>
                <div className="border-2 border-dashed border-surface-200 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                  <Upload size={24} className="mx-auto text-surface-400 mb-2" />
                  <p className="text-sm text-surface-500 mb-2">Drop files or click to upload</p>
                  <input type="file" onChange={addVerificationDoc} className="w-full opacity-0 absolute inset-0 cursor-pointer" style={{ position: 'relative' }} />
                </div>
                {form.verificationDocs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.verificationDocs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-50 rounded-lg px-4 py-2 text-sm">
                        <span className="text-surface-700">{doc.original_name}</span>
                        <button onClick={() => removeDoc(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Government ID</label>
                  <input type="file" onChange={(e) => update('governmentIdName', e.target.files[0]?.name || '')}
                    className="w-full text-sm text-surface-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Profile Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => update('profilePhotoName', e.target.files[0]?.name || '')}
                    className="w-full text-sm text-surface-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Profile Setup ────────────────────── */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-heading text-xl text-surface-900 mb-1">Profile Setup</h2>
              <p className="text-sm text-surface-500 font-sans mb-4">Information visible to potential clients.</p>

              <div>
                <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Bio / About *</label>
                <textarea rows={4} value={form.bio} onChange={e => update('bio', e.target.value)}
                  placeholder="Tell potential clients about your experience, approach, and expertise..."
                  className={`${inputClass} resize-none`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Consultation Fee</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-sans">₹</span>
                    <input type="number" min="0" value={form.consultationFee} onChange={e => update('consultationFee', e.target.value)} placeholder="2000" className={`${inputClass} pl-8`} />
                  </div>
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Price Range</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-sans">₹</span>
                    <input value={form.priceRange} onChange={e => update('priceRange', e.target.value)} placeholder="2,000 - 5,000" className={`${inputClass} pl-8`} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button key={lang} type="button" onClick={() => toggleLang(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-all cursor-pointer ${
                        form.languages.includes(lang)
                          ? 'bg-primary-100 text-primary-800 border border-primary-300'
                          : 'bg-surface-50 text-surface-500 border border-surface-200 hover:border-primary-300'
                      }`}
                    >{lang}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Available Days</label>
                  <input value={form.availableDays} onChange={e => update('availableDays', e.target.value)} placeholder="e.g. Monday - Friday" className={inputClass} />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Operating Hours</label>
                  <input value={form.availableHours} onChange={e => update('availableHours', e.target.value)} placeholder="e.g. 10:00 AM - 06:00 PM" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Review & Submit ──────────────────── */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-heading text-xl text-surface-900 mb-1">Review & Submit</h2>
              <p className="text-sm text-surface-500 font-sans mb-4">Please verify all your information before submitting.</p>

              {[
                { label: 'Full Name', value: form.name },
                { label: 'Email', value: form.email },
                { label: 'Phone', value: form.phone },
                { label: 'Profession', value: SERVICE_TYPES.find(t => t.value === form.serviceType)?.label || form.serviceType },
                { label: 'Specialization', value: form.specialization },
                { label: 'Location', value: form.location },
                { label: 'Experience', value: form.experience ? `${form.experience} years` : 'Not specified' },
                { label: 'Bar Council ID', value: form.barCouncilId || 'Not provided' },
                { label: 'Languages', value: form.languages.join(', ') || 'Not specified' },
                { label: 'Consultation Fee', value: form.consultationFee ? `₹${form.consultationFee}` : 'Not set' },
                { label: 'Documents', value: `${form.verificationDocs.length} uploaded` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-surface-100 last:border-0">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-surface-500">{label}</span>
                  <span className="text-sm font-sans text-surface-800 text-right max-w-[60%]">{value}</span>
                </div>
              ))}

              {form.bio && (
                <div className="bg-surface-50 rounded-xl p-4">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-surface-500 block mb-2">Bio</span>
                  <p className="text-sm text-surface-700 leading-relaxed">{form.bio}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 font-sans">
                <strong>Note:</strong> Your application will be reviewed by our admin team. You will receive access once approved. This process typically takes 1-2 business days.
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-surface-200">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 text-sm font-sans font-medium text-surface-600 hover:text-primary-800 transition-colors cursor-pointer">
                <ArrowLeft size={16} /> Previous
              </button>
            ) : <div />}

            {step < 5 ? (
              <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 bg-primary-800 text-white font-sans text-sm uppercase tracking-widest font-bold rounded-xl hover:bg-primary-900 active:scale-[0.98] transition-all cursor-pointer border border-accent-300/50">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-green-700 text-white font-sans text-sm uppercase tracking-widest font-bold rounded-xl hover:bg-green-800 disabled:opacity-60 active:scale-[0.98] transition-all cursor-pointer">
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={18} /> Submit Application</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

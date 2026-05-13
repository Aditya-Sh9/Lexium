import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router';
import { Calendar, Clock, ArrowLeft, CheckCircle, Briefcase, FileText, AlertCircle, ChevronDown, Sparkles, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import { themeToast } from '../../utils/alert';
import { formatRupees, parseAmount } from '../../utils/formatters';

const URGENCY_OPTIONS = [
  { value: 'normal', label: 'Normal',  desc: 'Within a week is fine' },
  { value: 'high',   label: 'High',    desc: 'Within 48 hours' },
  { value: 'urgent', label: 'Urgent',  desc: 'As soon as possible' },
];

const TIME_SLOTS = ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

export default function BookingFlow() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetService = searchParams.get('service') || '';
  const presetPrice   = searchParams.get('price')   || '';

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [createdPetition, setCreatedPetition] = useState(null);

  const [caseData, setCaseData] = useState({
    type: presetService,
    details: '',
    urgency: 'normal',
    preferred_date: '',
    preferred_time: '',
  });

  useEffect(() => {
    api.get(`/providers/${providerId}`)
      .then(setProvider)
      .catch(() => setProvider(null))
      .finally(() => setLoading(false));
  }, [providerId]);

  // Case-type dropdown is HARD-LOCKED to this provider's published services.
  // Each service carries its own price; that price flows through to the transaction.
  const services = useMemo(() => {
    const list = (provider?.services || []).filter(s => s?.name);
    return list.map(s => ({
      name: s.name,
      price: parseAmount(s.price),
      priceLabel: formatRupees(s.price, { emptyDash: false }),
      duration: s.duration || '',
    }));
  }, [provider]);

  // Lock to the first service if nothing selected (or selection isn't in the list).
  useEffect(() => {
    if (!services.length) return;
    const exists = services.find(s => s.name === caseData.type);
    if (!exists) {
      setCaseData(d => ({ ...d, type: services[0].name }));
    }
  }, [services, caseData.type]);

  const selectedService = services.find(s => s.name === caseData.type) || services[0] || null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-surface-500">Loading provider details...</p>
      </div>
    );
  }
  if (!provider) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-semibold mb-2">Provider not found</p>
        <Link to="/providers" className="text-primary-600 hover:underline">← Back to provider listings</Link>
      </div>
    );
  }

  const canSubmitStep1 = !!selectedService && caseData.details.trim().length >= 10;

  const handleSubmit = async () => {
    if (!selectedService) {
      themeToast.error('This provider has not published any services yet.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/citizen/petitions', {
        provider_id: providerId,
        type: selectedService.name,
        details: caseData.details.trim(),
        urgency: caseData.urgency,
        quoted_price: selectedService.price || undefined,
        preferred_date: caseData.preferred_date || undefined,
        preferred_time: caseData.preferred_time || undefined,
      });
      setCreatedPetition(res.petition);
      setStep(3);
    } catch (e) {
      themeToast.error(e.message || 'Failed to file case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {step < 3 && (
        <Link to={`/providers/${providerId}`} className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to {provider.name}'s profile
        </Link>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-200 z-0 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-600 z-0 rounded-full transition-all duration-500"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
          {[1, 2, 3].map(i => (
            <div key={i} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-primary-700 text-white' : 'bg-surface-200 text-surface-500'}`}>
              {step > i ? <CheckCircle size={16} /> : i}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-surface-500 px-1">
          <span>Case Details</span>
          <span>Review &amp; Schedule</span>
          <span>Confirmation</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 sm:p-8">

        {/* ── Step 1: Case Details ───────────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-start gap-3 p-3 bg-primary-50/60 border border-primary-100 rounded-lg">
              <FileText size={18} className="text-primary-700 shrink-0 mt-0.5" />
              <p className="text-sm text-primary-900">
                You're filing a <strong>legal case</strong> with <strong>{provider.name}</strong>. Once filed, the provider will review your matter and accept it — a consultation will then be scheduled.
              </p>
            </div>

            {presetService && services.find(s => s.name === presetService) && (
              <div className="mb-6 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Filing under the service <strong>{presetService}</strong>{presetPrice ? ` (${formatRupees(presetPrice, { emptyDash: false })})` : ''}. Switch via the dropdown if needed.
                </p>
              </div>
            )}

            {services.length === 0 && (
              <div className="mb-6 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">
                  This provider has not published any services yet. Please pick a different provider.
                </p>
              </div>
            )}

            <h2 className="text-xl font-heading font-bold text-surface-900 mb-1">Tell us about your case</h2>
            <p className="text-sm text-surface-500 mb-6">Provide enough detail for the provider to assess your matter.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2 flex items-center gap-2">
                  <Briefcase size={16} /> Service
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 pr-10 cursor-pointer disabled:opacity-60"
                    value={caseData.type}
                    onChange={e => setCaseData({ ...caseData, type: e.target.value })}
                    disabled={services.length === 0}
                  >
                    {services.length === 0 && <option value="">— No services available —</option>}
                    {services.map(s => (
                      <option key={s.name} value={s.name}>
                        {s.name}{s.priceLabel ? `  ·  ${s.priceLabel}` : ''}{s.duration ? `  ·  ${s.duration}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                </div>
                {selectedService && (
                  <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-surface-600">
                    <span className="flex items-center gap-1 font-semibold text-primary-800">
                      <IndianRupee size={12} /> Service fee: {selectedService.priceLabel || `₹${selectedService.price}`}
                    </span>
                    {selectedService.duration && (
                      <span className="flex items-center gap-1 text-surface-500">
                        <Clock size={12} /> {selectedService.duration}
                      </span>
                    )}
                    <span className="text-surface-400 italic">Locked to this provider's published services</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Brief Description of Matter <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                  placeholder="Describe your legal matter in detail. Include relevant background, the outcome you're seeking, and any time-sensitive factors..."
                  value={caseData.details}
                  onChange={e => setCaseData({ ...caseData, details: e.target.value })}
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={caseData.details.trim().length < 10 ? 'text-red-500' : 'text-green-600'}>
                    {caseData.details.trim().length < 10
                      ? `Minimum 10 characters (${caseData.details.trim().length}/10)`
                      : 'Looks good ✓'}
                  </span>
                  <span className="text-surface-400">{caseData.details.length}/2000</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} /> Urgency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {URGENCY_OPTIONS.map(u => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setCaseData({ ...caseData, urgency: u.value })}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        caseData.urgency === u.value
                          ? 'bg-primary-50 border-primary-600 text-primary-700'
                          : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300'
                      }`}
                    >
                      <p className="text-sm font-semibold">{u.label}</p>
                      <p className="text-[11px] text-surface-500 leading-tight mt-0.5">{u.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canSubmitStep1}
              className="mt-8 w-full py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Continue to Schedule
            </button>
          </div>
        )}

        {/* ── Step 2: Preferred Consultation & Review ─────── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-heading font-bold text-surface-900 mb-1">Preferred Consultation Time</h2>
            <p className="text-sm text-surface-500 mb-6">Optional. The provider will use this when scheduling your consultation. If left blank, the provider will pick a time.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} /> Preferred Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={caseData.preferred_date}
                  onChange={e => setCaseData({ ...caseData, preferred_date: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2 flex items-center gap-2">
                  <Clock size={16} /> Preferred Time
                </label>
                <div className="relative">
                  <select
                    value={caseData.preferred_time}
                    onChange={e => setCaseData({ ...caseData, preferred_time: e.target.value })}
                    className="w-full appearance-none px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 pr-10 cursor-pointer"
                  >
                    <option value="">— No preference —</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Review summary */}
            <div className="bg-surface-50 border border-surface-200 rounded-xl p-5 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-3">Filing Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-surface-500">Provider</dt>
                  <dd className="font-semibold text-surface-900 text-right">{provider.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-surface-500">Service</dt>
                  <dd className="font-semibold text-surface-900 text-right">{caseData.type}</dd>
                </div>
                {selectedService && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-surface-500">Service Fee</dt>
                    <dd className="font-bold text-primary-800 text-right">{selectedService.priceLabel || `₹${selectedService.price}`}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-surface-500">Urgency</dt>
                  <dd className="font-semibold text-surface-900 capitalize text-right">{caseData.urgency}</dd>
                </div>
                {(caseData.preferred_date || caseData.preferred_time) && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-surface-500">Preferred Slot</dt>
                    <dd className="font-semibold text-surface-900 text-right">
                      {caseData.preferred_date || 'Any date'}{caseData.preferred_time ? ` · ${caseData.preferred_time}` : ''}
                    </dd>
                  </div>
                )}
                <div className="border-t border-surface-200 pt-2 mt-2">
                  <dt className="text-surface-500 text-xs">Description</dt>
                  <dd className="text-surface-700 text-sm mt-1 line-clamp-3">{caseData.details}</dd>
                </div>
              </dl>
              {selectedService && (
                <p className="mt-3 pt-3 border-t border-surface-200 text-xs text-surface-500">
                  This fee will be billed only after the consultation is completed by the provider.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-surface-200 text-surface-700 font-semibold rounded-xl hover:bg-surface-50 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Filing...</>
                ) : (
                  <><FileText size={16} /> File Case</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirmation ─────────────────────────── */}
        {step === 3 && (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-surface-900 mb-2">Case Filed Successfully</h2>

            {createdPetition?.petition_id && (
              <div className="inline-block px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-800 font-mono text-sm font-bold mb-4">
                {createdPetition.petition_id}
              </div>
            )}

            <p className="text-surface-600 mb-2 max-w-md mx-auto">
              Your case has been filed with <span className="font-semibold">{provider.name}</span>.
            </p>
            <p className="text-sm text-surface-500 mb-8 max-w-md mx-auto">
              The provider will review your matter and accept it. Once accepted, a consultation will be scheduled and you'll see it on your dashboard.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => navigate('/citizen/petitions')}
                className="px-8 py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 transition-colors cursor-pointer"
              >
                View My Cases
              </button>
              <button
                onClick={() => navigate('/providers')}
                className="px-8 py-3 border border-surface-200 text-surface-700 font-semibold rounded-xl hover:bg-surface-50 transition-colors cursor-pointer"
              >
                Find More Providers
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

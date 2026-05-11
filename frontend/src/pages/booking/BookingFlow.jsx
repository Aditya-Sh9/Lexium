import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Calendar, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { themeToast } from '../../utils/alert';

export default function BookingFlow() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    caseDescription: '',
    urgency: 'normal'
  });

  useEffect(() => {
    api.get(`/providers/${providerId}`)
      .then(setProvider)
      .catch(() => setProvider(null))
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) return <div className="p-12 text-center text-surface-500">Loading booking flow...</div>;
  if (!provider) return <div className="p-12 text-center text-red-500">Provider not found</div>;

  const handleNext = async () => {
    if (step === 1 && (!bookingData.date || !bookingData.time)) return;
    if (step === 2 && !bookingData.caseDescription) return;
    
    if (step === 2) {
      // Submit to API
      setSubmitting(true);
      try {
        await api.post('/citizen/appointments', {
          provider_id: providerId,
          date: bookingData.date,
          time: bookingData.time,
          type: bookingData.urgency === 'urgent' ? 'Urgent Consultation' : 'Consultation',
          case_description: bookingData.caseDescription,
        });
        setStep(3);
      } catch (e) {
        themeToast.error(e.message || 'Failed to book appointment. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep(s => s + 1);
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
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-600 z-0 rounded-full transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
          
          {[1, 2, 3].map(i => (
            <div key={i} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-primary-700 text-white' : 'bg-surface-200 text-surface-500'}`}>
              {step > i ? <CheckCircle size={16} /> : i}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-surface-500 px-1">
          <span>Select Time</span>
          <span>Case Details</span>
          <span>Confirmation</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 sm:p-8">
        
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-heading font-bold text-surface-900 mb-6">Select Date & Time</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2 flex items-center gap-2"><Calendar size={16} /> Date</label>
                <input type="date" className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" 
                  value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} 
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              
              {bookingData.date && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2 flex items-center gap-2"><Clock size={16} /> Available Slots</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map(time => (
                      <button key={time} onClick={() => setBookingData({...bookingData, time})}
                        className={`py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${bookingData.time === time ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300'}`}>
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleNext} disabled={!bookingData.date || !bookingData.time}
              className="mt-8 w-full py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors cursor-pointer">
              Continue to Details
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-heading font-bold text-surface-900 mb-6">Case Information</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Brief Description of your case</label>
                <textarea rows="4" className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="E.g., I need to draft a rent agreement for a commercial property..."
                  value={bookingData.caseDescription} onChange={e => setBookingData({...bookingData, caseDescription: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Urgency Level</label>
                <select className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  value={bookingData.urgency} onChange={e => setBookingData({...bookingData, urgency: e.target.value})}>
                  <option value="normal">Normal (Within a week)</option>
                  <option value="high">High (Within 48 hours)</option>
                  <option value="urgent">Urgent (ASAP)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-surface-200 text-surface-700 font-semibold rounded-xl hover:bg-surface-50 transition-colors cursor-pointer">
                Back
              </button>
              <button onClick={handleNext} disabled={!bookingData.caseDescription || submitting} className="flex-1 py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors cursor-pointer">
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-surface-900 mb-2">Booking Requested!</h2>
            <p className="text-surface-600 mb-8 max-w-sm mx-auto">
              Your appointment request with <span className="font-semibold">{provider.name}</span> for <span className="font-semibold">{bookingData.date}</span> at <span className="font-semibold">{bookingData.time}</span> has been submitted and is awaiting provider confirmation.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => navigate('/citizen/dashboard')} className="px-8 py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 transition-colors cursor-pointer">
                Go to Dashboard
              </button>
              <button onClick={() => navigate('/providers')} className="px-8 py-3 border border-surface-200 text-surface-700 font-semibold rounded-xl hover:bg-surface-50 transition-colors cursor-pointer">
                Find More Providers
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

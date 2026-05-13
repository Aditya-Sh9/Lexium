import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Star, Search, MessageSquarePlus, X, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router';
import api from '../../services/api';
import { themeToast } from '../../utils/alert';

function ReviewModal({ appointment, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { themeToast.error('Please select a star rating.'); return; }
    setSubmitting(true);
    const aptId = appointment._id || appointment.id;
    try {
      await api.post(`/citizen/appointments/${aptId}/review`, { rating, review });
      themeToast.success('Review submitted — thank you!');
      onSubmitted();
      onClose();
    } catch (e) {
      themeToast.error(e.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-surface-400 hover:text-surface-700 cursor-pointer">
          <X size={20} />
        </button>

        <h2 className="font-heading text-2xl text-primary-900 mb-1">Leave a Review</h2>
        <p className="text-sm text-surface-500 mb-6">
          For your session with <span className="font-bold text-surface-700">{appointment.provider_name}</span>
        </p>

        {/* Star Rating */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-3">Your Rating</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={`transition-colors ${n <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-surface-300'}`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-surface-500 mt-2">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </p>
          )}
        </div>

        {/* Written Review */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2 block">
            Written Review <span className="text-surface-400 font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            placeholder="Share your experience with this practitioner..."
            rows={4}
            maxLength={1000}
            className="w-full border border-surface-200 rounded-lg px-4 py-3 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none font-sans"
          />
          <p className="text-xs text-surface-400 text-right mt-1">{review.length}/1000</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-surface-300 text-surface-700 py-3 rounded-lg font-sans text-xs uppercase tracking-widest font-bold hover:bg-surface-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 bg-primary-800 text-white py-3 rounded-lg font-sans text-xs uppercase tracking-widest font-bold hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><CheckCircle2 size={16} /> Submit Review</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CitizenHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.get('/citizen/history');
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const filteredHistory = history.filter(record => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (record.provider_name || '').toLowerCase().includes(q)
      || (record.type || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {reviewTarget && (
        <ReviewModal
          appointment={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={fetchHistory}
        />
      )}

      <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent">
        <header className="mb-8 border-b border-surface-200 pb-6">
          <h1 className="font-heading text-4xl text-primary-900">Case History</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Completed consultations and closed legal engagements. Leave reviews for resolved cases.</p>
        </header>

        {/* Pending review banner */}
        {history.filter(r => r.status === 'completed' && !r.reviewed).length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Star size={16} className="fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">
                {history.filter(r => r.status === 'completed' && !r.reviewed).length} {history.filter(r => r.status === 'completed' && !r.reviewed).length === 1 ? 'consultation is' : 'consultations are'} awaiting your review
              </p>
              <p className="text-xs text-amber-700">Your feedback helps the Lexium community find trusted counsel.</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search by provider or case type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all font-sans"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5">Provider</th>
                  <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5">Case Type</th>
                  <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5">Closed On</th>
                  <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5">Status</th>
                  <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <Clock size={40} className="mx-auto text-surface-300 mb-3" />
                      <p className="text-surface-700 font-sans font-semibold mb-1">
                        {searchQuery ? 'No matches found' : 'No closed cases yet'}
                      </p>
                      <p className="text-sm text-surface-500 max-w-md mx-auto">
                        {searchQuery
                          ? 'Try a different provider name or case type.'
                          : 'Resolved consultations and cancelled cases will be archived here for future reference.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((record, i) => (
                    <tr key={record._id || record.id || i} className="hover:bg-surface-50 transition-colors">
                      <td className="p-5">
                        <span className="font-heading text-lg font-semibold text-surface-900">{record.provider_name}</span>
                      </td>
                      <td className="p-5 text-sm font-bold text-surface-700 uppercase tracking-widest">{record.type}</td>
                      <td className="p-5 text-sm text-surface-600">
                        <span className="flex items-center gap-2">
                          <Clock size={14} className="text-surface-400" />
                          {new Date(record.updated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${record.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-end gap-3">
                          {record.status === 'completed' && !record.reviewed && (
                            <button
                              onClick={() => setReviewTarget(record)}
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-600 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded transition-colors cursor-pointer"
                            >
                              <Star size={13} className="fill-amber-500 text-amber-500" /> Leave Review
                            </button>
                          )}
                          {record.status === 'completed' && record.reviewed && (
                            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-green-600">
                              <CheckCircle2 size={13} /> Reviewed
                            </span>
                          )}
                          {record.provider_id && (
                            <Link
                              to={`/book/${record.provider_id}`}
                              className="text-xs font-bold uppercase tracking-widest text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              File New Case
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

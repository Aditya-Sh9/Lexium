import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Star, Search, MessageSquarePlus, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import api from '../../services/api';
import { themeToast } from '../../utils/alert';
import RaiseIssueModal from '../../components/common/RaiseIssueModal';

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
  const [issueTarget, setIssueTarget] = useState(null);
  const [complaints, setComplaints] = useState([]);

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

  const fetchComplaints = async () => {
    try {
      const data = await api.get('/citizen/complaints');
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setComplaints([]);
    }
  };

  useEffect(() => { fetchHistory(); fetchComplaints(); }, []);

  // Surface whether a completed/cancelled record already has an active
  // (open/under-review) complaint so we don't show a duplicate "Report" CTA.
  const activeComplaintFor = (record) => {
    const aptId = record._id || record.id;
    const petId = record.petition_id;
    return complaints.find(c =>
      ['open', 'under-review'].includes(c.status) &&
      ((aptId && c.appointment_id === aptId) || (petId && c.petition_id === petId))
    );
  };

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

      {issueTarget && (
        <RaiseIssueModal
          context={{
            petition_id:    issueTarget.petition_id || null,
            petition_code:  issueTarget.petition_code || null,
            appointment_id: issueTarget._id || issueTarget.id,
            provider_name:  issueTarget.provider_name,
            type:           issueTarget.type,
          }}
          onClose={() => setIssueTarget(null)}
          onSubmitted={fetchComplaints}
        />
      )}

      <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12 font-sans bg-transparent">
        <header className="mb-7 pb-5" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <h1 className="lx-h1">Case History</h1>
          <p className="body mt-1">Completed consultations and closed legal engagements. Leave reviews for resolved cases.</p>
        </header>

        {/* Pending review banner */}
        {history.filter(r => r.status === 'completed' && !r.reviewed).length > 0 && (
          <div className="lx-card mb-6 p-4 flex items-center gap-3" style={{ background: 'var(--warning-50)', borderColor: 'rgba(138,105,25,0.20)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(184,149,79,0.18)', color: 'var(--brass-dark)' }}>
              <Star size={15} className="fill-current" />
            </div>
            <div>
              <p className="strong" style={{ fontSize: 13, color: 'var(--brass-dark)' }}>
                {history.filter(r => r.status === 'completed' && !r.reviewed).length} {history.filter(r => r.status === 'completed' && !r.reviewed).length === 1 ? 'consultation is' : 'consultations are'} awaiting your review
              </p>
              <p className="body-xs" style={{ color: 'var(--brass-mid)' }}>Your feedback helps the Lexium community find trusted counsel.</p>
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by provider or case type…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="lx-input pl-9"
            />
          </div>
        </div>

        <div className="lx-card" style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="lx-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Case type</th>
                  <th>Closed on</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="!p-12 text-center">
                      <Clock size={32} className="mx-auto text-surface-300 mb-2" />
                      <p className="strong" style={{ fontSize: 14 }}>
                        {searchQuery ? 'No matches found' : 'No closed cases yet'}
                      </p>
                      <p className="body-sm muted mt-1 max-w-md mx-auto">
                        {searchQuery
                          ? 'Try a different provider name or case type.'
                          : 'Resolved consultations and cancelled cases will be archived here for future reference.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((record, i) => {
                    const existing = activeComplaintFor(record);
                    const canReport = record.status === 'completed' || record.status === 'cancelled';

                    return (
                      <tr key={record._id || record.id || i}>
                        <td><span className="strong">{record.provider_name}</span></td>
                        <td className="muted">{record.type}</td>
                        <td className="body-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={12} className="text-surface-400" />
                            {new Date(record.updated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        <td>
                          <span className={`lx-badge ${record.status === 'completed' ? 'lx-badge-success' : 'lx-badge-danger'}`}>
                            <span className="lx-badge-dot" style={{ background: record.status === 'completed' ? 'var(--success-600)' : 'var(--danger-600)' }} />
                            {record.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {record.status === 'completed' && !record.reviewed && (
                              <button
                                onClick={() => setReviewTarget(record)}
                                className="lx-btn lx-btn-sm lx-btn-gold"
                              >
                                <Star size={12} className="fill-current" /> Leave Review
                              </button>
                            )}
                            {record.status === 'completed' && record.reviewed && (
                              <span className="lx-badge lx-badge-success">
                                <CheckCircle2 size={11} /> Reviewed
                              </span>
                            )}
                            {record.provider_id && (
                              <Link
                                to={`/book/${record.provider_id}`}
                                className="body-sm text-[var(--color-primary-700)] hover:underline"
                              >
                                File new case
                              </Link>
                            )}
                            {canReport && (existing ? (
                              <span
                                className="inline-flex items-center gap-1 body-xs muted"
                                title={`Complaint ${existing.complaint_id} · ${existing.status}`}
                              >
                                <ShieldAlert size={11} style={{ color: 'var(--brass-mid)' }} />
                                Issue {existing.status === 'under-review' ? 'under review' : 'filed'}
                              </span>
                            ) : (
                              <button
                                onClick={() => setIssueTarget(record)}
                                className="inline-flex items-center gap-1 body-xs muted hover:text-[var(--brass-dark)] transition-colors cursor-pointer"
                                title="Privately report an issue to Lexium administrators"
                              >
                                <ShieldAlert size={11} />
                                Need help?
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

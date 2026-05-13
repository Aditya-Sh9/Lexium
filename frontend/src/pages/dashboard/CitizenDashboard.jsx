import { useState, useEffect } from 'react';
import { Calendar, Star, Clock, MapPin, ChevronRight, X, RefreshCw, Ban, Briefcase, MessageCircle, CheckCircle2, Archive } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { themeToast, themeAlert } from '../../utils/alert';

const STATUS_PILL = {
  pending:              'bg-yellow-100 text-yellow-700',
  'under-review':       'bg-blue-100 text-blue-700',
  'in-progress':        'bg-indigo-100 text-indigo-700',
  'awaiting-documents': 'bg-orange-100 text-orange-700',
  accepted:             'bg-blue-100 text-blue-700',
};

function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    savedProviders: [],
    recentCases: [],
    summary: { activeCases: 0, pendingReviews: 0, resolvedCases: 0, upcomingCount: 0 },
  });

  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.get('/citizen/dashboard');
      setDashboardData({
        upcomingAppointments: data.upcomingAppointments || [],
        savedProviders: data.savedProviders || [],
        recentCases: data.recentCases || [],
        summary: data.summary || { activeCases: 0, pendingReviews: 0, resolvedCases: 0, upcomingCount: 0 },
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleModal) return;
    const modalId = rescheduleModal._id || rescheduleModal.id;
    setActionLoading(modalId);
    try {
      await api.put(`/citizen/appointments/${modalId}/reschedule`, {
        date: rescheduleDate,
        time: rescheduleTime,
      });
      setRescheduleModal(null);
      setRescheduleDate('');
      setRescheduleTime('');
      themeToast.success('Appointment rescheduled successfully');
      fetchDashboard();
    } catch (e) {
      themeToast.error(e.message || 'Failed to reschedule');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    const confirm = await themeAlert.fire({
      title: 'Cancel Appointment?',
      text: 'Are you sure you want to cancel this appointment?',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(id);
    try {
      await api.delete(`/citizen/appointments/${id}`);
      themeToast.success('Appointment cancelled');
      fetchDashboard();
    } catch (e) {
      themeToast.error(e.message || 'Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12 font-sans bg-transparent">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-b border-surface-200 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4"
      >
        <div>
          <h1 className="lx-h1">Welcome, {user?.name || 'Citizen'}</h1>
          <p className="body mt-1">Your active legal cases and upcoming consultations, in one place.</p>
        </div>
        <Link to="/providers" className="lx-btn lx-btn-primary shrink-0">
          Find Counsel
        </Link>
      </motion.header>

      {/* Minimal KPI row — Variation A (single shared border, hairline dividers) */}
      <div className="lx-kpi-row mb-6">
        <Link to="/citizen/petitions" className="lx-kpi lx-kpi-clickable">
          <div className="lx-kpi-label">Active cases</div>
          <div className="lx-kpi-value">{dashboardData.summary.activeCases}</div>
          <div className="lx-kpi-meta">{dashboardData.summary.activeCases === 0 ? 'No active cases yet' : 'Tap to manage'}</div>
        </Link>
        <div className="lx-kpi">
          <div className="lx-kpi-label">Upcoming consults</div>
          <div className="lx-kpi-value">{dashboardData.summary.upcomingCount}</div>
          <div className="lx-kpi-meta">{dashboardData.summary.upcomingCount === 0 ? '—' : 'Scheduled this week'}</div>
        </div>
        <Link to="/citizen/history" className="lx-kpi lx-kpi-clickable">
          <div className="lx-kpi-label">Pending reviews</div>
          <div className="lx-kpi-value">{dashboardData.summary.pendingReviews}</div>
          <div className="lx-kpi-meta">{dashboardData.summary.pendingReviews > 0 ? 'Awaiting your feedback' : 'All caught up'}</div>
        </Link>
        <Link to="/citizen/history" className="lx-kpi lx-kpi-clickable">
          <div className="lx-kpi-label">Resolved cases</div>
          <div className="lx-kpi-value">{dashboardData.summary.resolvedCases}</div>
          <div className="lx-kpi-meta">{dashboardData.summary.resolvedCases === 0 ? '—' : 'Archive of past matters'}</div>
        </Link>
      </div>

      {/* Pending review nudge — only when present */}
      {dashboardData.summary.pendingReviews > 0 && (
        <Link to="/citizen/history" className="block mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100/60 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Star size={16} className="fill-amber-500 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">{dashboardData.summary.pendingReviews} completed {dashboardData.summary.pendingReviews === 1 ? 'consultation is' : 'consultations are'} awaiting your review</p>
              <p className="text-xs text-amber-700">Share your experience to help others find trusted counsel.</p>
            </div>
            <ChevronRight size={18} className="text-amber-600" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-8 space-y-6"
        >
          {/* Upcoming Consultations */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="lx-h3 flex items-center gap-2"><Calendar size={15} className="text-[var(--brass-mid)]" /> Upcoming Consultations</h2>
                <p className="body-xs mt-0.5">Scheduled sessions linked to your active cases</p>
              </div>
              <Link to="/citizen/petitions" className="body-sm text-[var(--color-primary-700)] hover:underline">All cases →</Link>
            </div>

            <div className="lx-card" style={{ overflow: 'hidden' }}>
            <div className="divide-y divide-surface-100">
              {dashboardData.upcomingAppointments.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-surface-200 m-4 rounded-lg">
                  <Calendar size={36} className="mx-auto text-surface-300 mb-3" />
                  <p className="text-surface-600 font-sans font-semibold mb-1">No consultations scheduled</p>
                  <p className="text-sm text-surface-500 mb-3">Your next consultation will appear here once a provider accepts your case.</p>
                  <Link to="/providers" className="text-xs font-bold uppercase tracking-widest text-primary-600 hover:underline">Browse Verified Providers →</Link>
                </div>
              ) : (
                dashboardData.upcomingAppointments.map((apt, i) => {
                  const aptId = apt._id || apt.id;
                  return (
                  <div key={aptId || i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 transition-colors">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-surface-900">{apt.provider_name}</h3>
                      <p className="text-sm text-surface-500 mb-2">{apt.type}</p>
                      <div className="flex gap-3 text-sm font-medium text-surface-600 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar size={14} className="text-accent-400" /> {apt.date}</span>
                        <span className="flex items-center gap-1"><Clock size={14} className="text-accent-400" /> {apt.time}</span>
                        {apt.petition_code && (
                          <Link to="/citizen/petitions" className="flex items-center gap-1 text-primary-600 hover:underline">
                            <Briefcase size={12} /> Case {apt.petition_code}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {apt.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRescheduleModal(apt)}
                          disabled={actionLoading === aptId}
                          className="text-xs font-bold uppercase tracking-widest text-primary-600 border border-primary-600 px-3 py-1 rounded hover:bg-primary-50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw size={12} /> Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(aptId)}
                          disabled={actionLoading === aptId}
                          className="text-xs font-bold uppercase tracking-widest text-red-600 border border-red-300 px-3 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Ban size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
            </div>
          </div>

          {/* Recent Cases — Variation A: inline status table */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="lx-h3 flex items-center gap-2"><Briefcase size={15} className="text-[var(--color-primary-700)]" /> My Recent Cases</h2>
                <p className="body-xs mt-0.5">Open legal matters you've filed</p>
              </div>
              <Link to="/citizen/petitions" className="body-sm text-[var(--color-primary-700)] hover:underline">All cases →</Link>
            </div>

            {dashboardData.recentCases.length === 0 ? (
              <div className="lx-card p-8 text-center">
                <Briefcase size={28} className="mx-auto text-surface-300 mb-2" />
                <p className="strong" style={{ fontSize: 14 }}>No active legal cases</p>
                <p className="body-sm muted mt-1 mb-3">File a case with a verified provider to begin a legal engagement.</p>
                <Link to="/providers" className="lx-btn lx-btn-secondary lx-btn-sm">Browse Providers</Link>
              </div>
            ) : (
              <div className="lx-card" style={{ overflow: 'hidden' }}>
                <table className="lx-table">
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Provider</th>
                      <th>Status</th>
                      <th className="num">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentCases.map((c, i) => {
                      const cId = c._id || c.id;
                      const status = c.status || 'pending';
                      const badgeCls =
                        ['resolved', 'closed', 'completed'].includes(status) ? 'lx-badge-success' :
                        ['under-review', 'in-progress', 'accepted'].includes(status) ? 'lx-badge-info' :
                        ['awaiting-documents', 'pending'].includes(status) ? 'lx-badge-warn' :
                        'lx-badge-neutral';
                      const dotColor =
                        badgeCls === 'lx-badge-success' ? 'var(--success-600)' :
                        badgeCls === 'lx-badge-info' ? 'var(--info-600)' :
                        badgeCls === 'lx-badge-warn' ? 'var(--warning-600)' :
                        'var(--color-surface-500)';
                      return (
                        <tr key={cId || i} onClick={() => window.location.assign('/citizen/petitions')} style={{ cursor: 'pointer' }}>
                          <td><span className="mono" style={{ fontSize: 12 }}>{c.petition_id}</span></td>
                          <td>
                            <p className="strong">{c.provider_name}</p>
                            <p className="body-xs muted">{c.type}</p>
                          </td>
                          <td>
                            <span className={`lx-badge ${badgeCls}`}>
                              <span className="lx-badge-dot" style={{ background: dotColor }} />
                              {status.replace(/-/g, ' ')}
                            </span>
                          </td>
                          <td className="num body-xs muted">{timeAgo(c.updated_at || c.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="lx-card" style={{ overflow: 'hidden' }}>
            <div className="px-5 py-4 hairline-b">
              <h2 className="lx-h3 flex items-center gap-2"><Star size={15} className="text-[var(--brass)]" /> Recommended Counsel</h2>
              <p className="body-xs mt-0.5">Top-rated verified practitioners</p>
            </div>
            <div className="divide-y divide-surface-100">
              {dashboardData.savedProviders.length === 0 ? (
                <div className="p-6 text-center text-sm text-surface-500">
                  Recommended providers will appear here based on ratings and verification.
                </div>
              ) : dashboardData.savedProviders.map((provider, i) => (
                <div key={provider._id || provider.id || i} className="p-4 hover:bg-surface-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading text-xl shrink-0">
                      {provider.name?.charAt(0)}
                    </div>
                    <div>
                      <Link to={`/providers/${provider._id}`} className="font-heading text-lg font-semibold text-surface-900 hover:text-primary-600 transition-colors block">
                        {provider.name}
                      </Link>
                      <p className="text-xs font-sans text-surface-500 uppercase tracking-widest mt-1 font-bold">{provider.specialization}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-sans text-surface-600 font-bold">
                        <span className="flex items-center gap-1"><Star size={14} className="text-accent-300 fill-accent-300" /> {provider.rating}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {provider.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-surface-100 text-center">
              <Link to="/providers" className="text-xs font-bold uppercase tracking-widest text-primary-600 hover:underline">Browse Full Registry</Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* How Lexium Works — horizontal strip, contextual but not intrusive */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 mb-4 bg-white/70 backdrop-blur-[8px] rounded-xl border border-surface-200 px-5 py-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={16} className="text-primary-700" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-primary-800">How Lexium Works</h3>
          <span className="text-xs text-surface-400 hidden sm:inline">— from filing to resolution in four steps</span>
        </div>
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { n: 1, title: 'File a Case',   body: 'Submit your legal matter to a verified provider.' },
            { n: 2, title: 'Consultation',  body: "Attend the session — auto-scheduled on acceptance." },
            { n: 3, title: 'Track Progress',body: 'Follow status updates in My Cases.' },
            { n: 4, title: 'Leave a Review',body: 'Share your experience once the case resolves.' },
          ].map(s => (
            <li key={s.n} className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-bold shrink-0">{s.n}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-900 leading-tight">{s.title}</p>
                <p className="text-xs text-surface-500 mt-0.5 leading-snug">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setRescheduleModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading text-2xl text-surface-900">Reschedule Appointment</h3>
                <button onClick={() => setRescheduleModal(null)} className="text-surface-400 hover:text-surface-600 cursor-pointer"><X size={20} /></button>
              </div>
              <p className="text-sm text-surface-500 mb-4">With <strong>{rescheduleModal.provider_name}</strong> — {rescheduleModal.type}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">New Date</label>
                  <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">New Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map(t => (
                      <button key={t} onClick={() => setRescheduleTime(t)}
                        className={`py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${rescheduleTime === t ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleReschedule} disabled={!rescheduleDate || !rescheduleTime}
                className="mt-6 w-full py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors cursor-pointer">
                Confirm Reschedule
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

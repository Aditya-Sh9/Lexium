import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, Clock, AlertCircle, ChevronDown, ChevronUp,
  Trash2, CheckCircle2, XCircle, Activity, MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router';
import api from '../../services/api';
import { themeToast, themeAlert } from '../../utils/alert';

// ── Status config ────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:             { label: 'Pending',            style: 'bg-yellow-100 text-yellow-700 border-yellow-200',   dot: 'bg-yellow-400' },
  'under-review':      { label: 'Under Review',       style: 'bg-blue-100 text-blue-700 border-blue-200',         dot: 'bg-blue-400' },
  'in-progress':       { label: 'In Progress',        style: 'bg-indigo-100 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-400' },
  'awaiting-documents':{ label: 'Awaiting Documents', style: 'bg-orange-100 text-orange-700 border-orange-200',   dot: 'bg-orange-400' },
  resolved:            { label: 'Resolved',           style: 'bg-green-100 text-green-700 border-green-200',      dot: 'bg-green-400' },
  closed:              { label: 'Closed',             style: 'bg-surface-100 text-surface-600 border-surface-200',dot: 'bg-surface-400' },
  declined:            { label: 'Declined',           style: 'bg-red-100 text-red-700 border-red-200',            dot: 'bg-red-400' },
  accepted:            { label: 'Under Review',       style: 'bg-blue-100 text-blue-700 border-blue-200',         dot: 'bg-blue-400' },
};

const TIMELINE_ICONS = {
  submitted:               <FileText size={14} />,
  accepted:                <CheckCircle2 size={14} />,
  'under-review':          <Activity size={14} />,
  'in-progress':           <Activity size={14} />,
  'awaiting-documents':    <AlertCircle size={14} />,
  'consultation-completed':<CheckCircle2 size={14} />,
  resolved:                <CheckCircle2 size={14} />,
  closed:                  <XCircle size={14} />,
  declined:                <XCircle size={14} />,
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

export default function CitizenPetitions() {
  const { user } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('active');

  const fetchPetitions = async () => {
    setLoading(true);
    try {
      const data = await api.get('/citizen/petitions');
      setPetitions(data);
    } catch (error) {
      console.error('Error fetching petitions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPetitions(); }, []);

  const handleWithdraw = async (id) => {
    const confirmed = await themeAlert.fire({
      title: 'Withdraw Petition?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Yes, withdraw',
    });
    if (!confirmed.isConfirmed) return;

    setActionLoading(id);
    try {
      await api.delete(`/citizen/petitions/${id}`);
      themeToast.success('Petition withdrawn');
      fetchPetitions();
    } catch (e) {
      themeToast.error(e.message || 'Failed to withdraw petition');
    } finally {
      setActionLoading(null);
    }
  };

  const ACTIVE_STATUSES = ['pending', 'under-review', 'in-progress', 'awaiting-documents', 'accepted'];
  const CLOSED_STATUSES = ['resolved', 'closed', 'declined'];

  const filtered = petitions.filter(p =>
    filter === 'active' ? ACTIVE_STATUSES.includes(p.status) : CLOSED_STATUSES.includes(p.status)
  );

  const activeCnt = petitions.filter(p => ACTIVE_STATUSES.includes(p.status)).length;
  const closedCnt = petitions.filter(p => CLOSED_STATUSES.includes(p.status)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent">
      <header className="mb-8 border-b border-surface-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-primary-900">My Cases</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Track the progress of your ongoing legal engagements and consultations.</p>
        </div>
        <Link
          to="/providers"
          className="bg-primary-800 text-white font-sans text-xs uppercase tracking-widest font-bold px-6 py-3 rounded hover:bg-primary-700 transition-colors shrink-0"
        >
          File New Case
        </Link>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { key: 'active', label: 'Active Cases', count: activeCnt },
          { key: 'closed', label: 'Closed / Resolved', count: closedCnt },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-xs uppercase tracking-widest font-bold transition-colors cursor-pointer border ${
              filter === tab.key
                ? 'bg-primary-800 text-white border-primary-800'
                : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-surface-300 mb-4" />
            <h2 className="font-heading text-2xl text-surface-900 mb-2">
              {filter === 'active' ? 'No active legal cases' : 'No closed cases yet'}
            </h2>
            <p className="text-surface-500 mb-6 max-w-md mx-auto">
              {filter === 'active'
                ? 'File a case with a verified provider to begin a legal engagement. Once accepted, a consultation will be auto-scheduled.'
                : 'Resolved, closed, and declined cases will be archived here for your records.'}
            </p>
            {filter === 'active' && (
              <Link to="/providers" className="inline-block bg-primary-800 text-white font-sans text-xs uppercase tracking-widest font-bold px-6 py-3 rounded hover:bg-primary-700 transition-colors">Browse Verified Providers</Link>
            )}
            {filter === 'closed' && (
              <Link to="/citizen/history" className="text-primary-600 font-bold hover:underline text-sm">View consultation history →</Link>
            )}
          </div>
        ) : (
          filtered.map((petition, i) => {
            const petId = petition._id || petition.id;
            const cfg = STATUS_CONFIG[petition.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === petId;
            const timeline = petition.timeline || [];
            const canWithdraw = petition.status === 'pending';
            const consultationDone = timeline.some(t => t.action === 'consultation-completed');
            const lastUpdated = petition.updated_at || (timeline.length > 0 ? timeline[timeline.length - 1].timestamp : petition.created_at);

            return (
              <div key={petId || i} className="bg-white rounded-xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Status stripe */}
                <div className={`h-1 w-full ${cfg.dot.replace('bg-', 'bg-')}`} />

                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    {/* Left: main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-mono text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded">
                          {petition.petition_id}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${cfg.style}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <h3 className="font-heading text-2xl text-surface-900 mb-0.5 truncate">{petition.provider_name}</h3>
                      <p className="font-sans text-sm font-bold uppercase tracking-widest text-surface-400 mb-4">{petition.type}</p>

                      {/* Next step callout */}
                      <div className="bg-surface-50 border border-surface-200 p-4 rounded-lg flex items-start gap-3 mb-3">
                        <AlertCircle size={16} className="text-primary-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-surface-600 uppercase tracking-widest mb-0.5">Next Step</p>
                          <p className="text-sm text-surface-700">{petition.next_step}</p>
                        </div>
                      </div>

                      {/* Consultation linkage hint — reflects actual lifecycle state */}
                      {['under-review', 'in-progress', 'awaiting-documents', 'accepted'].includes(petition.status) && (
                        <div className={`flex items-center gap-2 text-xs mb-3 px-1 ${consultationDone ? 'text-green-700' : 'text-surface-500'}`}>
                          {consultationDone ? <CheckCircle2 size={12} /> : <Clock size={12} className="text-accent-400" />}
                          <span>
                            {consultationDone
                              ? 'Consultation completed — case remains active while the provider continues legal work.'
                              : 'A consultation has been scheduled for this case.'}
                          </span>
                        </div>
                      )}

                      {/* Resolved case — settlement-in-progress hint + review nudge */}
                      {petition.status === 'resolved' && (
                        <div className="mb-3 px-1 space-y-1.5">
                          <Link to="/citizen/history" className="flex items-center gap-2 text-xs text-green-700 font-bold hover:underline">
                            <CheckCircle2 size={12} />
                            Case resolved after consultation — leave a review in Case History →
                          </Link>
                          <p className="text-[11px] text-surface-500 italic flex items-center gap-1.5 pl-4">
                            Administrative settlement in progress.
                          </p>
                        </div>
                      )}

                      {/* Provider notes (if any) */}
                      {petition.provider_notes && (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 mb-3">
                          <MessageSquare size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-0.5">Provider Note</p>
                            <p className="text-sm text-blue-800">{petition.provider_notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Expand: original details + timeline */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : petId)}
                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary-600 hover:text-primary-700 cursor-pointer mt-1"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Hide' : 'View'} Details & Timeline
                      </button>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 animate-fade-in">
                          {petition.details && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2">Your Request</p>
                              <p className="text-sm text-surface-700 bg-surface-50 p-4 rounded-lg border border-surface-200 leading-relaxed">
                                {petition.details}
                              </p>
                            </div>
                          )}

                          {timeline.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-3">Case Timeline</p>
                              <div className="relative pl-6 space-y-4">
                                <div className="absolute left-2 top-1 bottom-1 w-px bg-surface-200" />
                                {timeline.map((entry, idx) => (
                                  <div key={idx} className="relative flex gap-3">
                                    <div className="absolute -left-4 w-5 h-5 rounded-full bg-white border-2 border-surface-300 flex items-center justify-center text-surface-500 shrink-0">
                                      {TIMELINE_ICONS[entry.action] || <Clock size={10} />}
                                    </div>
                                    <div className="bg-surface-50 border border-surface-100 rounded-lg p-3 flex-1">
                                      <p className="text-xs font-bold uppercase tracking-widest text-surface-600 capitalize mb-0.5">
                                        {entry.action.replace(/-/g, ' ')}
                                      </p>
                                      <p className="text-sm text-surface-700">{entry.note}</p>
                                      <p className="text-xs text-surface-400 mt-1">
                                        {new Date(entry.timestamp).toLocaleString('en-IN', {
                                          year: 'numeric', month: 'short', day: 'numeric',
                                          hour: '2-digit', minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: meta + actions */}
                    <div className="w-full md:w-56 border-t md:border-t-0 md:border-l border-surface-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between gap-4 shrink-0">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">Submitted</p>
                          <p className="text-sm text-surface-700 flex items-center gap-1.5">
                            <Clock size={13} className="text-surface-400" />
                            {new Date(petition.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </p>
                        </div>
                        {lastUpdated && lastUpdated !== petition.created_at && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">Last Updated</p>
                            <p className="text-sm text-surface-700 flex items-center gap-1.5">
                              <Activity size={13} className="text-accent-400" />
                              {timeAgo(lastUpdated)}
                            </p>
                          </div>
                        )}
                      </div>

                      {canWithdraw && (
                        <button
                          onClick={() => handleWithdraw(petId)}
                          disabled={actionLoading === petId}
                          className="w-full bg-white text-red-600 border border-red-200 py-2 rounded font-sans text-xs uppercase tracking-widest font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          {actionLoading === petId ? 'Withdrawing…' : 'Withdraw'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

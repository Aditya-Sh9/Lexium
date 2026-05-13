import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, CheckCircle2, XCircle, FileText, Check, Activity, ChevronDown, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { themeToast, themeAlert } from '../../utils/alert';

const STATUS_OPTIONS = [
  { value: 'under-review',       label: 'Under Review' },
  { value: 'in-progress',        label: 'In Progress' },
  { value: 'awaiting-documents', label: 'Awaiting Documents' },
  { value: 'resolved',           label: 'Resolved' },
  { value: 'closed',             label: 'Closed' },
];

const CASE_STATUS_STYLE = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-indigo-100 text-indigo-700',
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

// ── Update status modal ──────────────────────────────────────────
function UpdateStatusModal({ petition, onClose, onUpdated }) {
  const [status, setStatus] = useState('in-progress');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const petId = petition._id || petition.id;
    try {
      await api.put(`/provider/petitions/${petId}/status`, { status, note });
      themeToast.success('Petition status updated');
      onUpdated();
      onClose();
    } catch (e) {
      themeToast.error(e.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <h2 className="font-heading text-2xl text-primary-900 mb-1">Update Case Status</h2>
        <p className="text-sm text-surface-500 mb-6">
          For petition <span className="font-mono">{petition.petition_id}</span> — {petition.citizen_name}
        </p>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2 block">New Status</label>
          <div className="relative">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full appearance-none border border-surface-200 rounded-lg px-4 py-3 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white pr-10 cursor-pointer"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2 block">
            Note to Citizen <span className="text-surface-400 font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add context for the citizen about this status change..."
            rows={3}
            maxLength={500}
            className="w-full border border-surface-200 rounded-lg px-4 py-3 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none font-sans"
          />
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
            disabled={submitting}
            className="flex-1 bg-primary-800 text-white py-3 rounded-lg font-sans text-xs uppercase tracking-widest font-bold hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Updating…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function ProviderDocket() {
  const { user } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [activePetitions, setActivePetitions] = useState([]);
  const [activeCases, setActiveCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [updateTarget, setUpdateTarget] = useState(null);

  const fetchDocketData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/provider/docket');
      setPetitions(data.petitions || []);
      setActiveCases(data.activeCases || []);
      setActivePetitions(data.activePetitions || []);
    } catch (error) {
      console.error('Error fetching docket data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocketData(); }, []);

  const handleAcceptPetition = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/provider/petitions/${id}/accept`);
      themeToast.success('Petition accepted — appointment auto-scheduled');
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to accept petition');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclinePetition = async (id) => {
    const result = await themeAlert.fire({
      title: 'Decline Petition?',
      input: 'textarea',
      inputLabel: 'Reason (optional)',
      inputPlaceholder: 'Provide a brief reason for the citizen...',
      showCancelButton: true,
      confirmButtonText: 'Decline',
    });
    if (!result.isConfirmed) return;

    setActionLoading(id);
    try {
      await api.post(`/provider/petitions/${id}/decline`, { reason: result.value || undefined });
      themeToast.success('Petition declined');
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to decline petition');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id) => {
    const confirmed = await themeAlert.fire({
      title: 'Mark Consultation Complete?',
      text: 'This generates a transaction and unlocks citizen review. The case stays active — close it manually via Update Case Status when the legal work is fully done.',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete consultation',
    });
    if (!confirmed.isConfirmed) return;

    setActionLoading(id);
    try {
      await api.put(`/provider/appointments/${id}/complete`);
      themeToast.success('Consultation completed — transaction created. Case remains open.');
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to complete consultation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptAppointment = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/provider/appointments/${id}/accept`);
      themeToast.success('Appointment confirmed');
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to accept appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineAppointment = async (id) => {
    const confirmed = await themeAlert.fire({
      title: 'Decline Appointment?',
      showCancelButton: true,
      confirmButtonText: 'Yes, decline',
    });
    if (!confirmed.isConfirmed) return;

    setActionLoading(id);
    try {
      await api.post(`/provider/appointments/${id}/decline`);
      themeToast.success('Appointment declined');
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to decline appointment');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {updateTarget && (
        <UpdateStatusModal
          petition={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onUpdated={fetchDocketData}
        />
      )}

      <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent">
        <header className="mb-10 border-b border-surface-200 pb-6">
          <h1 className="font-heading text-4xl text-primary-900">The Docket</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Your operational workspace — review case requests, manage open cases, and complete consultations.</p>
        </header>

        {/* Workflow summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="bg-white p-4 rounded-lg border border-surface-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-yellow-50 text-yellow-700 flex items-center justify-center"><FileText size={16} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">New Requests</p>
              <p className="font-heading text-lg text-primary-900 leading-tight">{petitions.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-surface-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-50 text-blue-700 flex items-center justify-center"><Activity size={16} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Open Cases</p>
              <p className="font-heading text-lg text-primary-900 leading-tight">{activePetitions.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-surface-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-accent-50 text-accent-600 flex items-center justify-center"><Clock size={16} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Consultations</p>
              <p className="font-heading text-lg text-primary-900 leading-tight">{activeCases.length}</p>
            </div>
          </div>
        </div>

        <div className="space-y-12">

          {/* ── Incoming Case Requests ── */}
          <section>
            <div className="mb-6">
              <h2 className="font-heading text-2xl text-primary-900 flex items-center gap-2">
                <FileText className="text-accent-300" /> Incoming Case Requests
                <span className="ml-1 text-base text-surface-400 font-sans font-normal">({petitions.length})</span>
              </h2>
              <p className="text-sm text-surface-500 mt-1">New petitions awaiting your acceptance — accepting auto-schedules a consultation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {petitions.length === 0 ? (
                <div className="col-span-2 bg-white p-10 rounded-xl border border-dashed border-surface-300 text-center">
                  <FileText size={36} className="mx-auto text-surface-300 mb-2" />
                  <p className="text-surface-700 font-semibold">No new case requests</p>
                  <p className="text-sm text-surface-500 mt-1">Citizens filing legal requests with you will appear here for review.</p>
                </div>
              ) : (
                petitions.map((petition, i) => {
                  const petId = petition._id || petition.id;
                  return (
                  <div key={petId || i} className="bg-white rounded-xl p-6 border border-surface-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded">{petition.petition_id}</span>
                            {petition.urgency && petition.urgency !== 'normal' && (
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${petition.urgency === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                {petition.urgency}
                              </span>
                            )}
                          </div>
                          <h3 className="font-heading text-xl text-primary-900 truncate">{petition.citizen_name}</h3>
                          <p className="text-xs font-sans uppercase tracking-widest text-accent-400 font-bold mt-0.5">{petition.type}</p>
                        </div>
                        <span className="text-xs text-surface-400 shrink-0">
                          {new Date(petition.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {petition.details && (
                        <p className="font-sans text-sm text-surface-600 mb-4 line-clamp-3 bg-surface-50 p-4 rounded border border-surface-100 italic">
                          "{petition.details}"
                        </p>
                      )}
                      {(petition.preferred_date || petition.preferred_time) && (
                        <div className="flex items-center gap-2 text-xs text-surface-600 mb-4 px-1">
                          <Calendar size={12} className="text-primary-600" />
                          <span>Citizen prefers: <strong>{petition.preferred_date || 'any date'}{petition.preferred_time ? ` at ${petition.preferred_time}` : ''}</strong></span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptPetition(petId)}
                        disabled={actionLoading === petId}
                        className="flex-1 bg-primary-800 text-white py-2.5 rounded font-sans text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} /> Accept
                      </button>
                      <button
                        onClick={() => handleDeclinePetition(petId)}
                        disabled={actionLoading === petId}
                        className="flex-1 bg-white border border-surface-300 text-surface-700 py-2.5 rounded font-sans text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-surface-50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={15} /> Decline
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ── Active Petitions (accepted, in-progress, etc.) ── */}
          {activePetitions.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="font-heading text-2xl text-primary-900 flex items-center gap-2">
                  <Activity className="text-accent-300" /> Open Cases
                  <span className="ml-1 text-base text-surface-400 font-sans font-normal">({activePetitions.length})</span>
                </h2>
                <p className="text-sm text-surface-500 mt-1">Accepted cases currently in progress — update status as the engagement evolves.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activePetitions.map((petition, i) => {
                  const petId = petition._id || petition.id;
                  const tl = petition.timeline || [];
                  const consultationDone = tl.some(t => t.action === 'consultation-completed');
                  const lastUpdated = petition.updated_at || (tl.length > 0 ? tl[tl.length - 1].timestamp : petition.created_at);
                  return (
                  <div key={petId || i} className="bg-white rounded-xl p-6 border border-surface-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded">{petition.petition_id}</span>
                        <h3 className="font-heading text-lg text-primary-900 mt-1 truncate">{petition.citizen_name}</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-surface-400">{petition.type}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded bg-blue-100 text-blue-700 shrink-0">
                        {petition.status.replace(/-/g, ' ')}
                      </span>
                    </div>

                    {/* Consultation status indicator — visually distinguishes case from consultation */}
                    <div className={`flex items-center gap-2 text-xs mb-3 px-2.5 py-1.5 rounded-md border ${consultationDone ? 'bg-green-50 border-green-100 text-green-700' : 'bg-accent-50 border-accent-100 text-accent-600'}`}>
                      {consultationDone ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      <span className="font-medium">
                        {consultationDone
                          ? 'Consultation completed — case continues'
                          : 'Consultation scheduled — case awaiting session'}
                      </span>
                    </div>

                    {petition.provider_notes && (
                      <div className="flex items-start gap-2 bg-surface-50 border border-surface-100 p-3 rounded mb-3 text-sm text-surface-600">
                        <MessageSquare size={14} className="text-surface-400 shrink-0 mt-0.5" />
                        <span className="italic line-clamp-2">{petition.provider_notes}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-surface-400 mb-3">
                      <span className="flex items-center gap-1"><Clock size={11} /> Updated {timeAgo(lastUpdated)}</span>
                      <span>{tl.length} timeline {tl.length === 1 ? 'event' : 'events'}</span>
                    </div>

                    <button
                      onClick={() => setUpdateTarget(petition)}
                      className="w-full mt-auto border border-primary-700 text-primary-700 py-2 rounded font-sans text-xs uppercase tracking-widest font-bold hover:bg-primary-700 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Activity size={14} /> Update Case Status
                    </button>
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Scheduled Consultations ── */}
          <section>
            <div className="mb-6">
              <h2 className="font-heading text-2xl text-primary-900 flex items-center gap-2">
                <Clock className="text-accent-300" /> Scheduled Consultations
                <span className="ml-1 text-base text-surface-400 font-sans font-normal">({activeCases.length})</span>
              </h2>
              <p className="text-sm text-surface-500 mt-1">Sessions linked to your open cases — marking complete generates a transaction and resolves the related case.</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-200">
                      <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Client</th>
                      <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Case Type</th>
                      <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Date & Time</th>
                      <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Status</th>
                      <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {activeCases.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-10 text-center">
                          <Clock size={32} className="mx-auto text-surface-300 mb-2" />
                          <p className="text-surface-700 font-semibold">No scheduled consultations</p>
                          <p className="text-sm text-surface-500 mt-1">Accepted petitions auto-create a consultation that will appear here.</p>
                        </td>
                      </tr>
                    ) : (
                      activeCases.map((c, i) => {
                        const cId = c._id || c.id;
                        return (
                        <tr key={cId || i} className="hover:bg-surface-50 transition-colors">
                          <td className="p-4">
                            <p className="font-heading text-primary-900 font-semibold">{c.citizen_name}</p>
                            {c.petition_code && (
                              <p className="text-[11px] font-mono text-surface-400 mt-0.5">Case {c.petition_code}</p>
                            )}
                          </td>
                          <td className="p-4 text-sm text-surface-600">{c.type}</td>
                          <td className="p-4 text-sm text-surface-600">
                            <span className="flex items-center gap-2">
                              <Calendar size={13} className="text-surface-400" /> {c.date} — {c.time}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${CASE_STATUS_STYLE[c.status] || 'bg-surface-100 text-surface-600'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {c.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleAcceptAppointment(cId)}
                                    disabled={actionLoading === cId}
                                    className="text-xs font-bold uppercase tracking-widest text-primary-700 border border-primary-700 px-3 py-1.5 rounded hover:bg-primary-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <Check size={13} /> Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineAppointment(cId)}
                                    disabled={actionLoading === cId}
                                    className="text-xs font-bold uppercase tracking-widest text-red-700 border border-red-700 px-3 py-1.5 rounded hover:bg-red-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <XCircle size={13} /> Decline
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleComplete(cId)}
                                  disabled={actionLoading === cId}
                                  className="text-xs font-bold uppercase tracking-widest text-green-700 border border-green-700 px-3 py-1.5 rounded hover:bg-green-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                  <CheckCircle2 size={13} /> Complete
                                </button>
                              )}
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
          </section>

        </div>
      </div>
    </>
  );
}

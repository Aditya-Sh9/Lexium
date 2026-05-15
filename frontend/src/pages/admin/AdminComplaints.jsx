import { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert, Search, Clock, AlertTriangle, CheckCircle2, XCircle,
  X, FileText, IndianRupee, Lock, MessageSquare, History, User2, Briefcase,
  Flag, ChevronRight, Archive, ShieldCheck, Bell, Sparkles,
} from 'lucide-react';
import { themeToast, themeAlert } from '../../utils/alert';
import { formatRupees } from '../../utils/formatters';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ISSUE_TYPE_LABEL = {
  payment:             'Payment Issue',
  misconduct:          'Provider Misconduct',
  'premature-closure': 'Premature Closure',
  unsatisfactory:      'Unsatisfactory',
  fraud:               'Fraudulent Activity',
  other:               'Other',
};

const STATUS_STYLES = {
  open:           { bg: 'var(--warning-50)',  text: 'var(--brass-dark)',        dot: 'var(--brass-dark)' },
  'under-review': { bg: 'var(--info-50)',     text: 'var(--info-600)',          dot: 'var(--info-600)' },
  resolved:       { bg: 'var(--success-50)',  text: 'var(--success-600)',       dot: 'var(--success-600)' },
  dismissed:      { bg: 'var(--color-surface-100)', text: 'var(--color-surface-600)', dot: 'var(--color-surface-500)' },
};

const SEVERITY_STYLES = {
  low:    { bg: 'var(--color-surface-100)', text: 'var(--color-surface-700)' },
  medium: { bg: 'var(--warning-50)', text: 'var(--brass-dark)' },
  high:   { bg: 'var(--danger-50)',  text: 'var(--danger-600)' },
};

const NOTICE_STATUS_LABEL = {
  active:       'Active',
  acknowledged: 'Acknowledged',
  cleared:      'Cleared',
  archived:     'Archived',
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.open;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status.replace('-', ' ')}
    </span>
  );
}

function SeverityPill({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.low;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
      style={{ background: s.bg, color: s.text }}
    >
      {severity}
    </span>
  );
}

export default function AdminComplaints() {
  const [data, setData] = useState({ complaints: [], summary: { total: 0, open: 0, under_review: 0, resolved: 0, dismissed: 0, high_severity: 0 } });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const token = localStorage.getItem('admin_token');

  const fetchData = () => {
    setLoading(true);
    fetch(`${API}/admin/complaints`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setData({
        complaints: d.complaints || [],
        summary: d.summary || { total: 0, open: 0, under_review: 0, resolved: 0, dismissed: 0, high_severity: 0 },
      }))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return data.complaints.filter(c => {
      if (statusFilter === 'high-severity') {
        if (!(c.severity === 'high' && ['open', 'under-review'].includes(c.status))) return false;
      } else if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (c.complaint_id || '').toLowerCase().includes(q) ||
        (c.citizen_name || '').toLowerCase().includes(q) ||
        (c.provider_name || '').toLowerCase().includes(q) ||
        (c.petition_code || '').toLowerCase().includes(q)
      );
    });
  }, [data.complaints, statusFilter, search]);

  return (
    <>
      {selectedId && (
        <ComplaintDetail
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={fetchData}
        />
      )}

      <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12">
        <header className="mb-7 pb-5" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <h1 className="lx-h1">Issue Resolution Center</h1>
          <p className="body mt-1">
            Citizen complaints — visible to administrators only. Providers cannot see these records.
          </p>
        </header>

        {/* Summary chips */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <SummaryCard label="Open"          value={data.summary.open}          icon={Clock}        accent="var(--brass-dark)" />
          <SummaryCard label="Under review"  value={data.summary.under_review}  icon={ShieldAlert}  accent="var(--info-600)" />
          <SummaryCard label="Resolved"      value={data.summary.resolved}      icon={CheckCircle2} accent="var(--success-600)" />
          <SummaryCard label="Dismissed"     value={data.summary.dismissed}     icon={XCircle}      accent="var(--color-surface-500)" />
          <SummaryCard label="High severity" value={data.summary.high_severity} icon={AlertTriangle} accent="var(--danger-600)" />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center mb-5">
          <div className="flex gap-2 flex-wrap">
            {['all', 'open', 'under-review', 'resolved', 'high-severity'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`lx-tab ${statusFilter === s ? 'active' : ''}`}
              >
                {s === 'high-severity' ? 'High severity' : s.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="flex-1 md:max-w-sm md:ml-auto relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, citizen, provider, case…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lx-input pl-9 w-full"
            />
          </div>
        </div>

        {/* Table */}
        <div className="lx-card" style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="lx-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Citizen</th>
                  <th>Provider</th>
                  <th>Case</th>
                  <th>Issue Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Filed</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="!p-12 text-center muted">Loading complaints…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="!p-12 text-center">
                      <ShieldAlert size={28} className="mx-auto text-surface-300 mb-2" />
                      <p className="strong" style={{ fontSize: 14 }}>No complaints match these filters</p>
                      <p className="body-sm muted mt-1">Try widening the filter set or clearing the search.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c._id || c.id}
                      onClick={() => setSelectedId(c._id || c.id)}
                      className="cursor-pointer"
                    >
                      <td><span className="font-mono text-xs">{c.complaint_id}</span></td>
                      <td><span className="strong">{c.citizen_name}</span></td>
                      <td className="muted">{c.provider_name}</td>
                      <td>
                        {c.petition_code ? (
                          <span className="font-mono text-xs muted">{c.petition_code}</span>
                        ) : <span className="muted">—</span>}
                      </td>
                      <td className="body-sm">{ISSUE_TYPE_LABEL[c.issue_type] || c.issue_type}</td>
                      <td><SeverityPill severity={c.severity} /></td>
                      <td><StatusPill status={c.status} /></td>
                      <td className="body-sm muted">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
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

function SummaryCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="lx-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest muted">{label}</span>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="font-heading text-2xl" style={{ color: accent }}>{value}</div>
    </div>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────

function ComplaintDetail({ id, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [tab, setTab] = useState('overview');
  const [noteDraft, setNoteDraft] = useState('');

  // Themed action dialogs (replacing the prior SweetAlert prompts)
  const [warnOpen, setWarnOpen] = useState(false);
  const [deductOpen, setDeductOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(null); // 'resolved' | 'dismissed'

  const token = localStorage.getItem('admin_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    setLoading(true);
    fetch(`${API}/admin/complaints/${id}`, { headers })
      .then(r => r.json())
      .then(d => {
        setDetail(d);
        if (d?.complaint?.provider_id) loadRisk(d.complaint.provider_id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadRisk = (providerId) => {
    fetch(`${API}/admin/providers/${providerId}/complaint-history`, { headers })
      .then(r => r.json())
      .then(setRisk)
      .catch(() => setRisk(null));
  };

  useEffect(() => { load(); }, [id]);

  const post = async (path, body) => {
    setWorking(true);
    try {
      const res = await fetch(`${API}/admin/complaints/${id}${path}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Request failed');
      themeToast.success(j.message || 'Done');
      load();
      onChanged?.();
      return j;
    } catch (e) {
      themeToast.error(e.message || 'Request failed');
    } finally {
      setWorking(false);
    }
  };

  const put = async (path, body) => {
    setWorking(true);
    try {
      const res = await fetch(`${API}/admin/complaints/${id}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Request failed');
      themeToast.success(j.message || 'Done');
      load();
      onChanged?.();
    } catch (e) {
      themeToast.error(e.message || 'Request failed');
    } finally {
      setWorking(false);
    }
  };

  // Direct (no-prompt) status change for "Mark Under Review"
  const setStatusDirect = (status) => put('/status', { status });

  const holdEscrow = async () => {
    const r = await themeAlert.fire({
      title: 'Hold escrow on this case?',
      text: 'This sets the complaint to Under Review, automatically blocking any escrow release on the linked transaction.',
      showCancelButton: true,
      confirmButtonText: 'Place hold',
    });
    if (!r.isConfirmed) return;
    post('/hold-escrow');
  };

  const addNote = async () => {
    if (noteDraft.trim().length < 1) return;
    await post('/notes', { note: noteDraft.trim() });
    setNoteDraft('');
  };

  // Provider notice management — called from the Provider history tab
  const clearNotice = async (noticeId) => {
    setWorking(true);
    try {
      const res = await fetch(`${API}/admin/notices/${noticeId}/clear`, { method: 'POST', headers });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      themeToast.success('Notice cleared.');
      if (detail?.complaint?.provider_id) loadRisk(detail.complaint.provider_id);
    } catch (e) {
      themeToast.error(e.message || 'Failed to clear notice');
    } finally {
      setWorking(false);
    }
  };

  const archiveNotice = async (noticeId) => {
    setWorking(true);
    try {
      const res = await fetch(`${API}/admin/notices/${noticeId}/archive`, { method: 'POST', headers });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      themeToast.success('Notice archived.');
      if (detail?.complaint?.provider_id) loadRisk(detail.complaint.provider_id);
    } catch (e) {
      themeToast.error(e.message || 'Failed to archive notice');
    } finally {
      setWorking(false);
    }
  };

  const clearAllNotices = async () => {
    if (!detail?.complaint?.provider_id) return;
    const r = await themeAlert.fire({
      title: 'Clear all warnings for this provider?',
      text: 'All active and acknowledged notices will be cleared. The provider will see them removed from their dashboard. Compliance Restored status will apply.',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear all',
    });
    if (!r.isConfirmed) return;

    setWorking(true);
    try {
      const res = await fetch(`${API}/admin/providers/${detail.complaint.provider_id}/notices/clear-all`, { method: 'POST', headers });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      themeToast.success(j.message || 'All notices cleared.');
      loadRisk(detail.complaint.provider_id);
    } catch (e) {
      themeToast.error(e.message || 'Failed to clear notices');
    } finally {
      setWorking(false);
    }
  };

  const c = detail?.complaint;
  const isClosed = c && ['resolved', 'dismissed'].includes(c.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4 md:my-0 animate-fade-in"
        style={{ border: '1px solid var(--hairline-strong)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-6 pb-5" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--warning-50)', color: 'var(--brass-dark)', border: '1px solid rgba(138,105,25,0.20)' }}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {c && <StatusPill status={c.status} />}
                  {c && <SeverityPill severity={c.severity} />}
                  {risk?.compliance_restored && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
                      style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}
                      title="Provider has no active warnings; previous compliance issues have been cleared."
                    >
                      <ShieldCheck size={10} /> Compliance Restored
                    </span>
                  )}
                  {risk?.risk_flag && !risk?.compliance_restored && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
                      style={{ background: 'var(--danger-50)', color: 'var(--danger-600)' }}
                      title="Provider has multiple unresolved or repeated high-severity complaints"
                    >
                      <Flag size={10} /> Elevated Monitoring
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-2xl text-primary-900" style={{ letterSpacing: '-0.01em' }}>
                  {c?.complaint_id || 'Complaint'}
                </h2>
                {c && (
                  <p className="body-sm muted mt-0.5">
                    {ISSUE_TYPE_LABEL[c.issue_type] || c.issue_type}
                    {c.petition_code && <> · <span className="font-mono">{c.petition_code}</span></>}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-700 p-1 cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'linked',   label: 'Linked records' },
              { id: 'timeline', label: 'Timeline & Notes' },
              { id: 'history',  label: 'Provider history' },
              { id: 'actions',  label: 'Actions' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`lx-tab ${tab === t.id ? 'active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {loading || !detail ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <>
                  <Field label="Description">
                    <p className="text-sm text-surface-800 leading-relaxed whitespace-pre-line">{c.description}</p>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Citizen">
                      <div className="flex items-center gap-2">
                        <User2 size={13} className="text-surface-400" />
                        <span className="strong" style={{ fontSize: 13 }}>{detail.citizen?.name || c.citizen_name}</span>
                      </div>
                      <p className="body-xs muted mt-0.5 ml-5">{detail.citizen?.email}</p>
                    </Field>
                    <Field label="Provider">
                      <div className="flex items-center gap-2">
                        <Briefcase size={13} className="text-surface-400" />
                        <span className="strong" style={{ fontSize: 13 }}>{detail.provider?.name || c.provider_name}</span>
                      </div>
                      <p className="body-xs muted mt-0.5 ml-5">{detail.provider?.email}</p>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Filed on">
                      <p className="text-sm">{new Date(c.created_at).toLocaleString('en-IN')}</p>
                    </Field>
                    {c.resolved_at && (
                      <Field label="Closed on">
                        <p className="text-sm">{new Date(c.resolved_at).toLocaleString('en-IN')}</p>
                      </Field>
                    )}
                  </div>

                  {c.evidence?.length > 0 && (
                    <Field label="Evidence (metadata only)">
                      <div className="flex flex-wrap gap-2">
                        {c.evidence.map((e, idx) => (
                          <span key={idx} className="lx-badge lx-badge-neutral">
                            <FileText size={11} /> {e.original_name || e.name}
                          </span>
                        ))}
                      </div>
                    </Field>
                  )}
                </>
              )}

              {tab === 'linked' && (
                <>
                  <Field label="Case (Petition)">
                    {detail.petition ? (
                      <div className="lx-card lx-card-inset p-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs">{detail.petition.petition_id}</span>
                          <span className="lx-badge lx-badge-info">{detail.petition.status}</span>
                        </div>
                        <p className="strong" style={{ fontSize: 13 }}>{detail.petition.type}</p>
                        <p className="body-xs muted mt-1">{detail.petition.next_step}</p>
                      </div>
                    ) : <p className="body-sm muted">No petition linked.</p>}
                  </Field>

                  <Field label="Consultation">
                    {detail.appointment ? (
                      <div className="lx-card lx-card-inset p-3.5">
                        <p className="text-sm">
                          {detail.appointment.type} · {detail.appointment.date} at {detail.appointment.time}
                        </p>
                        <p className="body-xs muted mt-1">Status: {detail.appointment.status}</p>
                      </div>
                    ) : <p className="body-sm muted">No consultation linked.</p>}
                  </Field>

                  <Field label="Transaction / Escrow">
                    {detail.transaction ? (
                      <div className="lx-card lx-card-inset p-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs">{detail.transaction.transaction_id}</span>
                          <span className={`lx-badge ${detail.transaction.status === 'escrow' ? 'lx-badge-warn' : 'lx-badge-success'}`}>
                            {detail.transaction.status}
                          </span>
                        </div>
                        <p className="strong tabular" style={{ fontSize: 14 }}>
                          {formatRupees(detail.transaction.amount, { emptyDash: false })}
                        </p>
                        <p className="body-xs muted mt-1">{detail.transaction.type}</p>
                      </div>
                    ) : <p className="body-sm muted">No transaction linked.</p>}
                  </Field>

                  <Field label="Provider context">
                    {detail.provider ? (
                      <dl className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
                        <dt className="muted">Specialization</dt><dd>{detail.provider.specialization || '—'}</dd>
                        <dt className="muted">Location</dt><dd>{detail.provider.location || '—'}</dd>
                        <dt className="muted">Rating</dt><dd>{detail.provider.rating?.toFixed?.(1) || '—'}</dd>
                        <dt className="muted">Status</dt><dd>{detail.provider.status}</dd>
                      </dl>
                    ) : <p className="body-sm muted">Provider record missing.</p>}
                  </Field>
                </>
              )}

              {tab === 'timeline' && (
                <>
                  <Field label="Action log">
                    {c.actions_log?.length > 0 ? (
                      <div className="relative pl-5 space-y-3">
                        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-surface-200" />
                        {c.actions_log.map((a, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-white border-2 border-surface-300" />
                            <p className="text-xs font-bold uppercase tracking-widest text-surface-700">
                              {a.action.replace(/-/g, ' ')}
                            </p>
                            <p className="text-sm text-surface-700 mt-0.5">{a.note}</p>
                            <p className="body-xs muted mt-0.5">{new Date(a.timestamp).toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="body-sm muted">No actions logged yet.</p>}
                  </Field>

                  <Field label="Internal notes">
                    {c.admin_notes?.length > 0 ? (
                      <div className="space-y-2">
                        {c.admin_notes.map((n, idx) => (
                          <div key={idx} className="lx-card lx-card-quiet p-3">
                            <p className="text-sm text-surface-800">{n.note}</p>
                            <p className="body-xs muted mt-1">{new Date(n.timestamp).toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="body-sm muted">No internal notes yet.</p>}

                    {!isClosed && (
                      <div className="mt-3">
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Add a private note for the moderation log…"
                          rows={3}
                          className="lx-input resize-none"
                          style={{ height: 'auto', padding: '10px 12px' }}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={addNote}
                            disabled={working || noteDraft.trim().length === 0}
                            className="lx-btn lx-btn-secondary lx-btn-sm"
                          >
                            <MessageSquare size={12} /> Add note
                          </button>
                        </div>
                      </div>
                    )}
                  </Field>
                </>
              )}

              {tab === 'history' && (
                <>
                  {!risk ? (
                    <p className="body-sm muted">Loading provider history…</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniStat label="Total complaints"  value={risk.total} />
                        <MiniStat label="Unresolved"        value={risk.unresolved}         accent="var(--brass-dark)" />
                        <MiniStat label="High severity"     value={risk.high_severity}      accent="var(--danger-600)" />
                        <MiniStat label="Escrow holds"      value={risk.escrow_holds_count} accent="var(--info-600)" />
                        <MiniStat label="Active warnings"   value={risk.active_warnings}    accent="var(--brass-dark)" />
                        <MiniStat label="Cleared warnings"  value={risk.cleared_warnings}   accent="var(--success-600)" />
                        <MiniStat label="Total warnings"    value={risk.warning_count} />
                        <MiniStat
                          label="Last warning"
                          value={risk.last_warning_at
                            ? new Date(risk.last_warning_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                            : '—'}
                        />
                      </div>

                      <div
                        className="lx-card lx-card-inset p-3.5 flex items-start gap-2.5"
                        style={
                          risk.compliance_restored
                            ? { background: 'var(--success-50)', borderColor: 'rgba(47,107,63,0.18)' }
                            : risk.risk_flag
                              ? { background: 'var(--danger-50)', borderColor: 'rgba(145,52,35,0.18)' }
                              : undefined
                        }
                      >
                        {risk.compliance_restored ? (
                          <Sparkles size={14} style={{ color: 'var(--success-600)', marginTop: 2 }} />
                        ) : (
                          <Flag size={14} style={{ color: risk.risk_flag ? 'var(--danger-600)' : 'var(--success-600)', marginTop: 2 }} />
                        )}
                        <div>
                          <p className="strong" style={{ fontSize: 13 }}>{risk.standing || 'Good Standing'}</p>
                          <p className="body-xs muted mt-0.5">{risk.standing_note}</p>
                          {risk.last_compliance_action?.timestamp && (
                            <p className="body-xs muted mt-1.5">
                              Most recent action: <span className="strong" style={{ fontSize: 11 }}>{(risk.last_compliance_action.action || '').replace(/-/g, ' ')}</span>
                              {' · '}
                              {new Date(risk.last_compliance_action.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Warning management */}
                      <Field label={`Compliance notices (${risk.recent_notices?.length || 0})`}>
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="body-xs muted">
                            Active and acknowledged notices are visible to the provider. Cleared / archived notices are admin-only history.
                          </p>
                          {risk.active_warnings > 0 && (
                            <button
                              onClick={clearAllNotices}
                              disabled={working}
                              className="lx-btn lx-btn-secondary lx-btn-sm shrink-0"
                            >
                              <ShieldCheck size={12} /> Clear all
                            </button>
                          )}
                        </div>

                        {risk.recent_notices?.length > 0 ? (
                          <div className="space-y-2">
                            {risk.recent_notices.map((n) => (
                              <NoticeRow
                                key={n._id}
                                notice={n}
                                disabled={working}
                                onClear={() => clearNotice(n._id)}
                                onArchive={() => archiveNotice(n._id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="body-sm muted">No compliance notices on record for this provider.</p>
                        )}
                      </Field>

                      <Field label="Recent complaints against this provider">
                        {risk.recent?.length > 0 ? (
                          <div className="space-y-2">
                            {risk.recent.map((r) => (
                              <div key={r._id} className="lx-card lx-card-quiet p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs">{r.complaint_id}</span>
                                    <SeverityPill severity={r.severity} />
                                    <StatusPill status={r.status} />
                                  </div>
                                  <p className="body-xs muted truncate">
                                    {ISSUE_TYPE_LABEL[r.issue_type] || r.issue_type}
                                    {r.petition_code ? <> · <span className="font-mono">{r.petition_code}</span></> : null}
                                    {' · '}{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                  </p>
                                </div>
                                <ChevronRight size={14} className="text-surface-300 shrink-0" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="body-sm muted">No other complaints against this provider.</p>
                        )}
                      </Field>
                    </>
                  )}
                </>
              )}

              {tab === 'actions' && (
                <>
                  <Field label="Status transitions">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setStatusDirect('under-review')}
                        disabled={working || c.status === 'under-review' || isClosed}
                        className="lx-btn lx-btn-secondary"
                      >
                        <ShieldAlert size={13} /> Mark Under Review
                      </button>
                      <button
                        onClick={holdEscrow}
                        disabled={working || isClosed}
                        className="lx-btn lx-btn-secondary"
                      >
                        <Lock size={13} /> Hold Escrow
                      </button>
                      <button
                        onClick={() => setResolveOpen('resolved')}
                        disabled={working || isClosed}
                        className="lx-btn lx-btn-primary"
                        style={{ background: 'var(--success-600)' }}
                      >
                        <CheckCircle2 size={13} /> Resolve
                      </button>
                      <button
                        onClick={() => setResolveOpen('dismissed')}
                        disabled={working || isClosed}
                        className="lx-btn lx-btn-secondary"
                      >
                        <XCircle size={13} /> Dismiss
                      </button>
                    </div>
                  </Field>

                  <Field label="Moderation actions (internal)">
                    <div className="space-y-2">
                      <button
                        onClick={() => setWarnOpen(true)}
                        disabled={working || isClosed}
                        className="lx-btn lx-btn-secondary w-full justify-start"
                      >
                        <AlertTriangle size={13} /> Issue compliance warning
                      </button>
                      <button
                        onClick={() => setDeductOpen(true)}
                        disabled={working || isClosed}
                        className="lx-btn lx-btn-secondary w-full justify-start"
                      >
                        <IndianRupee size={13} /> Apply compliance adjustment
                      </button>
                    </div>
                    <p className="body-xs muted mt-3 flex items-start gap-1.5">
                      <Lock size={11} className="mt-0.5 shrink-0" />
                      <span>
                        Warnings appear to providers as generic professionalism notices.
                        Ledger adjustments appear as compliance lines without any complaint context.
                      </span>
                    </p>
                  </Field>

                  {isClosed && (
                    <div className="lx-card lx-card-inset p-3 flex items-start gap-2">
                      <History size={14} className="text-surface-500 mt-0.5" />
                      <p className="body-sm muted">
                        This complaint is closed. Actions are read-only.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-7 py-4" style={{ borderTop: '1px solid var(--hairline)' }}>
          <button onClick={onClose} className="lx-btn lx-btn-ghost">Close</button>
        </div>
      </div>

      {/* Action modals */}
      {warnOpen && (
        <WarnProviderModal
          working={working}
          onCancel={() => setWarnOpen(false)}
          onConfirm={async ({ reason, guidance_note }) => {
            await post('/warn-provider', { reason, guidance_note });
            setWarnOpen(false);
          }}
        />
      )}
      {deductOpen && (
        <AdjustEarningsModal
          working={working}
          onCancel={() => setDeductOpen(false)}
          onConfirm={async ({ amount, reason }) => {
            await post('/deduct', { amount, reason });
            setDeductOpen(false);
          }}
        />
      )}
      {resolveOpen && c && (
        <ResolveComplaintModal
          mode={resolveOpen}
          hasEscrow={Boolean(detail?.transaction && detail.transaction.status === 'escrow')}
          escrowAmount={detail?.transaction?.amount}
          working={working}
          onCancel={() => setResolveOpen(null)}
          onConfirm={async ({ release_escrow, note }) => {
            await put('/status', { status: resolveOpen, release_escrow, note });
            setResolveOpen(null);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="label mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="lx-card lx-card-inset p-3">
      <p className="text-xs font-bold uppercase tracking-widest muted mb-1">{label}</p>
      <p className="font-heading text-xl" style={{ color: accent || 'var(--color-primary-900)' }}>{value ?? 0}</p>
    </div>
  );
}

function NoticeRow({ notice, disabled, onClear, onArchive }) {
  const issued = notice.created_at ? new Date(notice.created_at) : null;
  const cleared = ['cleared', 'archived'].includes(notice.status);

  return (
    <div
      className="lx-card lx-card-quiet p-3 flex items-start gap-3"
      style={cleared ? { opacity: 0.7 } : undefined}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: cleared ? 'var(--color-surface-100)' : 'rgba(184,149,79,0.18)',
          color: cleared ? 'var(--color-surface-500)' : 'var(--brass-dark)',
        }}
      >
        {cleared ? <ShieldCheck size={12} /> : <Bell size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-surface-700)' }}>
            {notice.type || 'notice'}
          </span>
          <SeverityPill severity={notice.severity || 'low'} />
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: cleared ? 'var(--color-surface-100)' : 'var(--info-50)',
              color: cleared ? 'var(--color-surface-600)' : 'var(--info-600)',
            }}
          >
            {NOTICE_STATUS_LABEL[notice.status] || notice.status || 'Active'}
          </span>
        </div>
        <p className="text-sm text-surface-800">{notice.message}</p>
        {notice.guidance_note && (
          <p
            className="body-xs mt-1.5 pl-2"
            style={{ borderLeft: '2px solid var(--brass-light)', color: 'var(--color-surface-700)' }}
          >
            Admin guidance: {notice.guidance_note}
          </p>
        )}
        <p className="body-xs muted mt-1">
          Issued {issued ? issued.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          {notice.acknowledged_at && (
            <> · Acknowledged {new Date(notice.acknowledged_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</>
          )}
          {notice.cleared_at && (
            <> · Cleared by {notice.cleared_by || 'Compliance'} {new Date(notice.cleared_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</>
          )}
        </p>
      </div>
      {!cleared && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <button onClick={onClear}   disabled={disabled} className="lx-btn lx-btn-secondary lx-btn-sm" title="Clear notice">
            <ShieldCheck size={11} /> Clear
          </button>
          <button onClick={onArchive} disabled={disabled} className="lx-btn lx-btn-ghost lx-btn-sm" title="Archive notice">
            <Archive size={11} /> Archive
          </button>
        </div>
      )}
    </div>
  );
}

// ── Themed action modals (replacing inline SweetAlert prompts) ─────

function ModalShell({ icon: Icon, title, subtitle, children, footer, onClose, accent = 'var(--brass-dark)' }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in"
        style={{ border: '1px solid var(--hairline-strong)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--warning-50)', color: accent, border: '1px solid rgba(138,105,25,0.20)' }}
          >
            <Icon size={16} />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-lg text-primary-900" style={{ letterSpacing: '-0.01em' }}>{title}</h3>
            {subtitle && <p className="body-sm muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-700 cursor-pointer p-1" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid var(--hairline)' }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

function WarnProviderModal({ working, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [guidance, setGuidance] = useState('');

  const valid = reason.trim().length >= 5;

  return (
    <ModalShell
      icon={AlertTriangle}
      title="Issue compliance warning"
      subtitle="Logged internally; provider sees only a generic compliance notice plus the optional guidance below."
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} disabled={working} className="lx-btn lx-btn-ghost">Cancel</button>
          <button
            onClick={() => onConfirm({ reason: reason.trim(), guidance_note: guidance.trim() || null })}
            disabled={working || !valid}
            className="lx-btn lx-btn-primary"
            style={{ background: 'var(--brass-dark)' }}
          >
            {working ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Issue warning'}
          </button>
        </>
      }
    >
      <div>
        <label className="label">Internal reason (admin-only)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly summarise the moderation concern. This stays on the complaint record."
          rows={3}
          className="lx-input mt-1.5 resize-none"
          style={{ height: 'auto', padding: '12px 14px' }}
        />
        <p className="body-xs muted mt-1">Never shown to the provider.</p>
      </div>

      <div>
        <label className="label">Guidance note for provider (optional)</label>
        <textarea
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          placeholder="e.g. Please ensure consultation closure is confirmed with clients."
          rows={3}
          className="lx-input mt-1.5 resize-none"
          style={{ height: 'auto', padding: '12px 14px' }}
        />
        <p className="body-xs muted mt-1">
          Shown to the provider with the generic warning. Do not include complaint IDs or citizen names.
        </p>
      </div>
    </ModalShell>
  );
}

function AdjustEarningsModal({ working, onCancel, onConfirm }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Compliance Adjustment');

  const numericAmount = parseFloat(amount);
  const valid = numericAmount > 0 && reason.trim().length > 0;

  return (
    <ModalShell
      icon={IndianRupee}
      title="Apply compliance adjustment"
      subtitle="Creates a compliance ledger line on the provider's account. No complaint context is exposed."
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} disabled={working} className="lx-btn lx-btn-ghost">Cancel</button>
          <button
            onClick={() => onConfirm({ amount: numericAmount, reason: reason.trim() })}
            disabled={working || !valid}
            className="lx-btn lx-btn-primary"
            style={{ background: 'var(--brass-dark)' }}
          >
            {working ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Apply adjustment'}
          </button>
        </>
      }
    >
      <div>
        <label className="label">Amount (₹)</label>
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 500"
          className="lx-input mt-1.5 w-full"
        />
      </div>

      <div>
        <label className="label">Ledger description</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={120}
          placeholder="Compliance Adjustment / Administrative Hold"
          className="lx-input mt-1.5 w-full"
        />
        <p className="body-xs muted mt-1">Appears as the transaction type on the provider's ledger.</p>
      </div>
    </ModalShell>
  );
}

function ResolveComplaintModal({ mode, hasEscrow, escrowAmount, working, onCancel, onConfirm }) {
  const isResolve = mode === 'resolved';
  const [releaseEscrow, setReleaseEscrow] = useState(false);
  const [note, setNote] = useState('');

  return (
    <ModalShell
      icon={isResolve ? CheckCircle2 : XCircle}
      title={isResolve ? 'Resolve complaint' : 'Dismiss complaint'}
      subtitle={isResolve
        ? 'Marks this complaint as resolved. Any held escrow remains blocked until you explicitly release it.'
        : 'Marks this complaint as dismissed. Any held escrow remains blocked until you explicitly release it.'}
      onClose={onCancel}
      accent={isResolve ? 'var(--success-600)' : 'var(--color-surface-600)'}
      footer={
        <>
          <button onClick={onCancel} disabled={working} className="lx-btn lx-btn-ghost">Cancel</button>
          <button
            onClick={() => onConfirm({ release_escrow: releaseEscrow, note: note.trim() || null })}
            disabled={working}
            className="lx-btn lx-btn-primary"
            style={{ background: isResolve ? 'var(--success-600)' : 'var(--color-primary-900)' }}
          >
            {working
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : (isResolve ? 'Resolve complaint' : 'Dismiss complaint')}
          </button>
        </>
      }
    >
      {hasEscrow && (
        <label
          className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
          style={{
            background: releaseEscrow ? 'var(--success-50)' : 'var(--color-surface-50)',
            border: '1px solid ' + (releaseEscrow ? 'rgba(47,107,63,0.20)' : 'var(--hairline)'),
          }}
        >
          <input
            type="checkbox"
            checked={releaseEscrow}
            onChange={(e) => setReleaseEscrow(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <p className="strong" style={{ fontSize: 13, color: 'var(--color-primary-900)' }}>
              Release held escrow
            </p>
            <p className="body-xs muted mt-0.5">
              Moves the linked transaction
              {typeof escrowAmount === 'number' ? <> ({formatRupees(escrowAmount, { emptyDash: false })})</> : null}
              {' '}from <span className="font-mono">escrow</span> to <span className="font-mono">cleared</span> in the provider's ledger and logs the event on the complaint timeline.
            </p>
          </div>
        </label>
      )}

      <div>
        <label className="label">Optional closing note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={isResolve
            ? 'Add a closing note for the moderation record (admin-only).'
            : 'Reason for dismissal (admin-only).'}
          className="lx-input mt-1.5 resize-none"
          style={{ height: 'auto', padding: '12px 14px' }}
        />
        <p className="body-xs muted mt-1">Not shown to provider; visible in the moderation log.</p>
      </div>
    </ModalShell>
  );
}

import { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert, Clock, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Lock, AlertTriangle, FileText, Search, Inbox,
} from 'lucide-react';
import { Link } from 'react-router';
import api from '../../services/api';

const ISSUE_TYPE_LABEL = {
  payment:             'Payment Issue',
  misconduct:          'Provider Misconduct',
  'premature-closure': 'Premature Closure',
  unsatisfactory:      'Unsatisfactory Service',
  fraud:               'Fraudulent Activity',
  other:               'Other',
};

// Citizen-facing status → presentation. Keeps the visual tone restrained.
const STATUS_PRESENTATION = {
  'open':           { label: 'Open',                bg: 'var(--warning-50)',         text: 'var(--brass-dark)' },
  'under-review':   { label: 'Under Review',        bg: 'var(--info-50)',            text: 'var(--info-600)' },
  'escrow-on-hold': { label: 'Escrow On Hold',      bg: 'var(--info-50)',            text: 'var(--info-600)' },
  'action-taken':   { label: 'Action Taken',        bg: 'var(--warning-50)',         text: 'var(--brass-dark)' },
  'resolved':       { label: 'Resolved',            bg: 'var(--success-50)',         text: 'var(--success-600)' },
  'dismissed':      { label: 'Reviewed & Closed',   bg: 'var(--color-surface-100)',  text: 'var(--color-surface-600)' },
};

const SEVERITY_PRESENTATION = {
  low:    { bg: 'var(--color-surface-100)', text: 'var(--color-surface-700)' },
  medium: { bg: 'var(--warning-50)', text: 'var(--brass-dark)' },
  high:   { bg: 'var(--danger-50)',  text: 'var(--danger-600)' },
};

// Map action codes to icons used in the timeline.
const TIMELINE_ICON = {
  'filed':               FileText,
  'status-under-review': ShieldAlert,
  'escrow-held':         Lock,
  'provider-warned':     AlertTriangle,
  'earnings-deducted':   AlertTriangle,
  'escrow-released':     CheckCircle2,
  'status-resolved':     CheckCircle2,
  'status-dismissed':    XCircle,
};

function StatusPill({ status }) {
  const s = STATUS_PRESENTATION[status] || STATUS_PRESENTATION.open;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      {s.label}
    </span>
  );
}

function SeverityPill({ severity }) {
  const s = SEVERITY_PRESENTATION[severity] || SEVERITY_PRESENTATION.low;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
      style={{ background: s.bg, color: s.text }}
    >
      {severity}
    </span>
  );
}

export default function CitizenIssues() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/citizen/complaints');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const counts = useMemo(() => ({
    all:    items.length,
    active: items.filter(i => ['open', 'under-review', 'escrow-on-hold', 'action-taken'].includes(i.public_status)).length,
    closed: items.filter(i => ['resolved', 'dismissed'].includes(i.public_status)).length,
  }), [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filter === 'active' && !['open', 'under-review', 'escrow-on-hold', 'action-taken'].includes(i.public_status)) return false;
      if (filter === 'closed' && !['resolved', 'dismissed'].includes(i.public_status)) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (i.complaint_id || '').toLowerCase().includes(q) ||
        (i.provider_name || '').toLowerCase().includes(q) ||
        (i.petition_code || '').toLowerCase().includes(q) ||
        (ISSUE_TYPE_LABEL[i.issue_type] || i.issue_type || '').toLowerCase().includes(q)
      );
    });
  }, [items, filter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12 font-sans bg-transparent">
      <header className="mb-7 pb-5" style={{ borderBottom: '1px solid var(--hairline)' }}>
        <h1 className="lx-h1">Support &amp; Resolution Center</h1>
        <p className="body mt-1">
          Track concerns you have reported to Lexium Compliance. Updates from our administrators appear here as the review progresses.
        </p>
      </header>

      {/* Filter tabs */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',    label: 'All',    count: counts.all },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'closed', label: 'Closed', count: counts.closed },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`lx-tab ${filter === t.key ? 'active' : ''}`}
            >
              {t.label}
              <span className="lx-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 md:max-w-sm md:ml-auto relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, provider, case…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lx-input pl-9 w-full"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="lx-card p-12 text-center">
          <Inbox size={36} className="mx-auto text-surface-300 mb-3" />
          <p className="strong" style={{ fontSize: 14 }}>
            {items.length === 0 ? 'No reports filed yet' : 'No reports match these filters'}
          </p>
          <p className="body-sm muted mt-1 max-w-md mx-auto">
            {items.length === 0
              ? 'If you ever face a concern with a completed engagement, you can report it from the case in Case History or My Cases.'
              : 'Try widening the filter set or clearing the search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <IssueCard
              key={c._id || c.id}
              complaint={c}
              expanded={expanded === (c._id || c.id)}
              onToggle={() => setExpanded(expanded === (c._id || c.id) ? null : (c._id || c.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueCard({ complaint, expanded, onToggle }) {
  const created = complaint.created_at ? new Date(complaint.created_at) : null;
  const updated = complaint.updated_at ? new Date(complaint.updated_at) : null;
  const filed   = created ? created.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const last    = updated ? updated.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="lx-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded">
                {complaint.complaint_id}
              </span>
              <StatusPill status={complaint.public_status || complaint.status} />
              <SeverityPill severity={complaint.severity} />
              {complaint.escrow_on_hold && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
                  style={{ background: 'var(--info-50)', color: 'var(--info-600)' }}
                >
                  <Lock size={10} /> Escrow Protected
                </span>
              )}
            </div>

            <h3 className="font-heading text-lg text-surface-900 mb-0.5 truncate">
              {complaint.provider_name || '—'}
            </h3>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-surface-400 mb-2">
              {ISSUE_TYPE_LABEL[complaint.issue_type] || complaint.issue_type}
              {complaint.petition_code && <> · <span className="font-mono normal-case tracking-normal">{complaint.petition_code}</span></>}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">Filed</p>
            <p className="text-sm text-surface-700 flex items-center gap-1.5 justify-end">
              <Clock size={13} className="text-surface-400" /> {filed}
            </p>
            {last && (
              <p className="body-xs muted mt-1">Last update {last}</p>
            )}
          </div>
        </div>

        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary-600 hover:text-primary-700 cursor-pointer mt-2"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide' : 'View'} timeline &amp; details
        </button>

        {expanded && (
          <div className="mt-5 pt-5 space-y-5 animate-fade-in" style={{ borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p className="label mb-1.5">Your description</p>
              <p className="text-sm text-surface-800 leading-relaxed bg-surface-50 border border-surface-200 rounded-lg p-3 whitespace-pre-line">
                {complaint.description}
              </p>
            </div>

            <div>
              <p className="label mb-3">Compliance Timeline</p>
              {complaint.public_actions && complaint.public_actions.length > 0 ? (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-1 bottom-1 w-px bg-surface-200" />
                  {complaint.public_actions.map((a, idx) => {
                    const Icon = TIMELINE_ICON[a.code] || Clock;
                    return (
                      <div key={idx} className="relative flex gap-3">
                        <div
                          className="absolute -left-4 w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center shrink-0"
                          style={{
                            borderColor: 'var(--hairline-strong)',
                            color: 'var(--brass-mid)',
                          }}
                        >
                          <Icon size={10} />
                        </div>
                        <div className="bg-surface-50 border border-surface-100 rounded-lg p-3 flex-1">
                          <p className="text-xs font-bold uppercase tracking-widest text-surface-700">
                            {a.label}
                          </p>
                          <p className="text-sm text-surface-700 mt-0.5">{a.note}</p>
                          {a.timestamp && (
                            <p className="body-xs muted mt-1">
                              {new Date(a.timestamp).toLocaleString('en-IN', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="body-sm muted">No updates from Lexium Compliance yet.</p>
              )}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              {complaint.petition_id && (
                <Link
                  to="/citizen/petitions"
                  className="body-sm text-[var(--color-primary-700)] hover:underline"
                >
                  View linked case →
                </Link>
              )}
              {['resolved', 'dismissed'].includes(complaint.status) && complaint.resolved_at && (
                <span className="body-xs muted">
                  Closed on {new Date(complaint.resolved_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

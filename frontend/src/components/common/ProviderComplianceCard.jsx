import { useState, useEffect } from 'react';
import { ShieldCheck, Bell, Check, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { themeToast } from '../../utils/alert';

/**
 * ProviderComplianceCard
 *
 * A discreet card surfaced on the provider dashboard when administrators
 * have issued one or more generic compliance notices. The card is
 * intentionally restrained: parchment background, brass accent, no aggressive
 * red. It exposes ONLY the generic message — never complaint IDs,
 * citizen names, or case codes.
 */
export default function ProviderComplianceCard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [acking, setAcking]     = useState(null);

  const fetchNotices = async () => {
    try {
      const data = await api.get('/provider/notices');
      setNotices(Array.isArray(data?.notices) ? data.notices : []);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const acknowledge = async (id) => {
    setAcking(id);
    try {
      await api.post(`/provider/notices/${id}/acknowledge`);
      themeToast.success('Notice acknowledged.');
      fetchNotices();
    } catch (e) {
      themeToast.error(e.message || 'Failed to acknowledge notice');
    } finally {
      setAcking(null);
    }
  };

  if (loading) return null;

  // Backend already filters out cleared/archived notices for providers.
  // Unread = status is still 'active' (provider hasn't acknowledged yet).
  const unread = notices.filter(n => (n.status || 'active') === 'active');
  if (notices.length === 0) return null;

  return (
    <div
      className="lx-card mb-6 overflow-hidden"
      style={
        unread.length > 0
          ? { background: 'var(--warning-50)', borderColor: 'rgba(138,105,25,0.20)' }
          : undefined
      }
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-4 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: unread.length > 0 ? 'rgba(184,149,79,0.18)' : 'var(--color-surface-100)',
              color: unread.length > 0 ? 'var(--brass-dark)' : 'var(--color-surface-500)',
            }}
          >
            {unread.length > 0 ? <Bell size={15} /> : <ShieldCheck size={15} />}
          </div>
          <div>
            <p
              className="strong"
              style={{
                fontSize: 13,
                color: unread.length > 0 ? 'var(--brass-dark)' : 'var(--color-surface-800)',
              }}
            >
              {unread.length > 0
                ? `${unread.length} compliance ${unread.length === 1 ? 'notice' : 'notices'} require acknowledgement`
                : 'Compliance notices'}
            </p>
            <p className="body-xs muted mt-0.5">
              {unread.length > 0
                ? 'Please review and acknowledge to keep your standing in good order.'
                : 'All prior notices acknowledged.'}
            </p>
          </div>
        </div>
        <div className="text-surface-500 shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2.5 animate-fade-in" style={{ borderTop: '1px solid var(--hairline)' }}>
          {notices.map((n) => (
            <NoticeRow
              key={n._id}
              notice={n}
              busy={acking === n._id}
              onAck={() => acknowledge(n._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoticeRow({ notice, busy, onAck }) {
  const issued = notice.created_at ? new Date(notice.created_at) : null;
  const isActive = (notice.status || 'active') === 'active';

  return (
    <div
      className="lx-card lx-card-quiet p-3.5 flex items-start gap-3 mt-2.5"
      style={
        isActive
          ? { background: '#fff', borderColor: 'var(--hairline-strong)' }
          : { background: 'var(--color-surface-50)' }
      }
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: 'rgba(184,149,79,0.18)',
          color: 'var(--brass-dark)',
        }}
      >
        <ShieldCheck size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--brass-dark)' }}
          >
            {notice.type === 'warning' ? 'Compliance Warning' : (notice.type || 'Notice')}
          </span>
          {!isActive && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}
            >
              <Check size={9} /> Acknowledged
            </span>
          )}
        </div>

        <p className="text-sm text-surface-800 leading-relaxed">{notice.message}</p>

        {notice.guidance_note && (
          <p
            className="body-xs mt-2 pl-3 py-1.5 pr-2 rounded"
            style={{
              borderLeft: '2px solid var(--brass-light)',
              background: 'rgba(184,149,79,0.07)',
              color: 'var(--color-surface-800)',
            }}
          >
            <span className="strong" style={{ fontSize: 11, color: 'var(--brass-dark)' }}>
              Admin guidance:
            </span>{' '}
            {notice.guidance_note}
          </p>
        )}

        <p className="body-xs muted mt-2">
          Issued {issued ? issued.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          {notice.acknowledged_at && (
            <> · Acknowledged {new Date(notice.acknowledged_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</>
          )}
        </p>
      </div>
      {isActive && (
        <button
          onClick={onAck}
          disabled={busy}
          className="lx-btn lx-btn-secondary lx-btn-sm shrink-0"
        >
          {busy ? (
            <span className="w-3 h-3 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Check size={11} /> Acknowledge</>
          )}
        </button>
      )}
    </div>
  );
}

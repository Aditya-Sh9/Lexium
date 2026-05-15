import { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, FileWarning } from 'lucide-react';
import api from '../../services/api';
import { themeToast } from '../../utils/alert';

const ISSUE_TYPES = [
  { value: 'payment',            label: 'Payment Issue' },
  { value: 'misconduct',         label: 'Provider Misconduct' },
  { value: 'premature-closure',  label: 'Case Closed Without Consent' },
  { value: 'unsatisfactory',     label: 'Unsatisfactory Service' },
  { value: 'fraud',              label: 'Fraudulent Activity' },
  { value: 'other',              label: 'Other' },
];

const SEVERITY = [
  { value: 'low',    label: 'Low',    desc: 'Minor inconvenience' },
  { value: 'medium', label: 'Medium', desc: 'Material problem' },
  { value: 'high',   label: 'High',   desc: 'Requires urgent admin attention' },
];

const MIN_LEN = 20;

/**
 * RaiseIssueModal — discreet citizen-side complaint form.
 *
 * Props:
 *  - context: { petition_id?, petition_code?, appointment_id?, transaction_id?, provider_name?, type? }
 *  - onClose
 *  - onSubmitted (called after a successful submission)
 */
export default function RaiseIssueModal({ context, onClose, onSubmitted }) {
  const [issueType, setIssueType] = useState('unsatisfactory');
  const [severity, setSeverity]   = useState('medium');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const remaining = Math.max(0, MIN_LEN - description.trim().length);

  const handleSubmit = async () => {
    if (description.trim().length < MIN_LEN) {
      themeToast.error(`Please provide at least ${MIN_LEN} characters describing the issue.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        petition_id:    context.petition_id    || null,
        appointment_id: context.appointment_id || null,
        transaction_id: context.transaction_id || null,
        issue_type:     issueType,
        severity,
        description:    description.trim(),
        evidence:       evidence ? [{ original_name: evidence.name, size: evidence.size }] : [],
      };

      await api.post('/citizen/complaints', payload);
      themeToast.success('Your concern has been forwarded to Lexium Compliance.');
      onSubmitted?.();
      onClose();
    } catch (e) {
      themeToast.error(e.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative animate-fade-in"
        style={{ border: '1px solid var(--hairline-strong)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-5" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--warning-50)', color: 'var(--brass-dark)', border: '1px solid rgba(138,105,25,0.20)' }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="font-heading text-xl text-primary-900" style={{ letterSpacing: '-0.01em' }}>
                Report an Issue
              </h2>
              <p className="body-sm muted mt-0.5">
                {context.petition_code ? <>Case <span className="font-mono">{context.petition_code}</span> · </> : null}
                {context.provider_name || 'Provider'} {context.type ? <>· {context.type}</> : null}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-700 cursor-pointer p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Issue type */}
          <div>
            <label className="label">Issue type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="lx-input mt-1.5"
            >
              {ISSUE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="label">Severity</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {SEVERITY.map(s => {
                const active = severity === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className="rounded-lg px-3 py-2.5 text-left transition-all cursor-pointer"
                    style={{
                      background: active ? 'var(--warning-50)' : 'var(--color-surface-50)',
                      border: active
                        ? '1px solid rgba(138,105,25,0.30)'
                        : '1px solid var(--hairline)',
                    }}
                  >
                    <div
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: active ? 'var(--brass-dark)' : 'var(--color-surface-700)' }}
                    >
                      {s.label}
                    </div>
                    <div className="body-xs muted mt-0.5">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Describe the issue</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Be specific. Include dates, what was promised, and what actually happened. Admin moderators read this — it is never shown to the provider."
              rows={5}
              maxLength={2000}
              className="lx-input mt-1.5 resize-none"
              style={{ height: 'auto', padding: '12px 14px' }}
            />
            <div className="flex justify-between mt-1">
              <span className="body-xs muted">
                {remaining > 0 ? `${remaining} more characters required` : 'Looks good.'}
              </span>
              <span className="body-xs muted">{description.length}/2000</span>
            </div>
          </div>

          {/* Evidence placeholder */}
          <div>
            <label className="label">Evidence (optional)</label>
            <label
              className="mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer"
              style={{ background: 'var(--color-surface-50)', border: '1px dashed var(--hairline-strong)' }}
            >
              <FileWarning size={14} className="text-surface-400" />
              <span className="body-sm muted truncate">
                {evidence ? evidence.name : 'Attach a screenshot or document (filename only)'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setEvidence(e.target.files?.[0] || null)}
              />
            </label>
            <p className="body-xs muted mt-1.5 flex items-start gap-1.5">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              <span>
                Filename metadata is recorded for the admin's reference. Actual file storage
                is not yet wired — share the document with the admin separately if needed.
              </span>
            </p>
          </div>

          {/* Auto-linked context */}
          <div className="lx-card lx-card-quiet p-3.5">
            <div className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2">
              Auto-attached
            </div>
            <dl className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
              {context.petition_code && (
                <>
                  <dt className="muted">Case</dt>
                  <dd className="font-mono">{context.petition_code}</dd>
                </>
              )}
              {context.provider_name && (
                <>
                  <dt className="muted">Provider</dt>
                  <dd className="strong" style={{ fontSize: 12 }}>{context.provider_name}</dd>
                </>
              )}
              {context.appointment_id && (
                <>
                  <dt className="muted">Consultation</dt>
                  <dd className="font-mono truncate">{context.appointment_id.slice(-8)}</dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-4" style={{ borderTop: '1px solid var(--hairline)' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            className="lx-btn lx-btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || description.trim().length < MIN_LEN}
            className="lx-btn lx-btn-primary"
            style={{ background: 'var(--brass-dark)' }}
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Submit Confidential Report</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

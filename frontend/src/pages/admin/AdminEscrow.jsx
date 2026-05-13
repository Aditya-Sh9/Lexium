import { useState, useEffect, useMemo } from 'react';
import { Lock, ShieldCheck, AlertCircle, IndianRupee, Search, CheckCircle2 } from 'lucide-react';
import { themeToast, themeAlert } from '../../utils/alert';
import { formatRupees } from '../../utils/formatters';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const CASE_STATUS_STYLE = {
  pending:              'bg-yellow-100 text-yellow-700',
  'under-review':       'bg-blue-100 text-blue-700',
  'in-progress':        'bg-indigo-100 text-indigo-700',
  'awaiting-documents': 'bg-orange-100 text-orange-700',
  accepted:             'bg-blue-100 text-blue-700',
  resolved:             'bg-green-100 text-green-700',
  closed:               'bg-surface-200 text-surface-700',
};

export default function AdminEscrow() {
  const [data, setData] = useState({ transactions: [], summary: { count: 0, totalHeld: 0, releasable: 0, blockedByCase: 0 } });
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | releasable | blocked
  const token = localStorage.getItem('admin_token');

  const fetchData = () => {
    setLoading(true);
    fetch(`${API}/admin/escrow`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setData({
        transactions: d.transactions || [],
        summary: d.summary || { count: 0, totalHeld: 0, releasable: 0, blockedByCase: 0 },
      }))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRelease = async (trx) => {
    const result = await themeAlert.fire({
      title: 'Release Escrow Funds?',
      html: `<div class="text-sm text-left">
        Release <strong>${formatRupees(trx.amount, { emptyDash: false })}</strong> to
        <strong>${trx.provider_name}</strong>?<br/>
        <span class="text-surface-500">Case ${trx.petition_code || trx.petition_id?.slice(-6) || '—'} is currently <strong>${trx.case_status || 'unknown'}</strong>.</span>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'Yes, release funds',
    });
    if (!result.isConfirmed) return;

    setReleasingId(trx._id || trx.id);
    try {
      const res = await fetch(`${API}/admin/transactions/${trx._id || trx.id}/release`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const body = await res.json();
      if (res.ok) {
        themeToast.success('Funds released — transaction cleared');
        fetchData();
      } else {
        themeToast.error(body.error || 'Failed to release funds');
      }
    } catch {
      themeToast.error('Network error. Please try again.');
    } finally {
      setReleasingId(null);
    }
  };

  const filtered = useMemo(() => {
    return data.transactions.filter(t => {
      if (filter === 'releasable' && !t.releasable) return false;
      if (filter === 'blocked'    && t.releasable)  return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (t.provider_name  || '').toLowerCase().includes(q) ||
        (t.client_name    || '').toLowerCase().includes(q) ||
        (t.petition_code  || '').toLowerCase().includes(q) ||
        (t.transaction_id || '').toLowerCase().includes(q)
      );
    });
  }, [data.transactions, search, filter]);

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-surface-200 animate-pulse" />)}
        </div>
        <div className="h-96 bg-white rounded-xl border border-surface-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12">
      <div className="mb-8">
        <h1 className="lx-h1 flex items-center gap-3">
          <Lock size={22} className="text-[var(--warning-600)]" /> Escrow Management
        </h1>
        <p className="body mt-1">Review transactions held in escrow and release funds once the related case is resolved.</p>
      </div>

      {/* Summary KPI row — Variation A */}
      <div className="lx-kpi-row mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="lx-kpi">
          <div className="lx-kpi-label">Total held</div>
          <div className="lx-kpi-value">{formatRupees(data.summary.totalHeld, { emptyDash: false })}</div>
          <div className="lx-kpi-meta">Across {data.summary.count} escrow transaction{data.summary.count !== 1 ? 's' : ''}</div>
        </div>
        <div className="lx-kpi">
          <div className="lx-kpi-label">Releasable</div>
          <div className="lx-kpi-value" style={data.summary.releasable > 0 ? { color: 'var(--success-600)' } : undefined}>{data.summary.releasable}</div>
          <div className="lx-kpi-meta">Cases resolved — ready for clearance</div>
        </div>
        <div className="lx-kpi">
          <div className="lx-kpi-label">Blocked by case</div>
          <div className="lx-kpi-value">{data.summary.blockedByCase}</div>
          <div className="lx-kpi-meta">Awaiting provider to resolve the case</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search provider, client, case, or txn ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="lx-input pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',        label: 'All',        count: data.transactions.length },
            { key: 'releasable', label: 'Releasable', count: data.summary.releasable },
            { key: 'blocked',    label: 'Blocked',    count: data.summary.blockedByCase },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`lx-tab ${filter === f.key ? 'active' : ''}`}
            >
              {f.label}
              <span className="lx-tab-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bordered card table — Variation A */}
      <div className="lx-card" style={{ overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="lx-table tabular">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Provider</th>
                <th>Client &amp; Case</th>
                <th>Consult date</th>
                <th>Case status</th>
                <th className="num">Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="!p-12 text-center">
                    <Lock size={28} className="mx-auto text-surface-300 mb-2" />
                    <p className="strong" style={{ fontSize: 14 }}>No escrow transactions</p>
                    <p className="body-sm muted mt-1">
                      {search || filter !== 'all'
                        ? 'Adjust your filters to see other transactions.'
                        : 'Funds held in escrow will appear here when providers complete consultations.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(t => {
                  const tid = t._id || t.id;
                  const caseStatus = t.case_status || 'unknown';
                  const caseBadgeCls =
                    ['resolved', 'closed'].includes(caseStatus) ? 'lx-badge-success' :
                    ['cancelled', 'declined'].includes(caseStatus) ? 'lx-badge-danger' :
                    'lx-badge-info';
                  return (
                    <tr key={tid}>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="mono" style={{ fontSize: 12 }}>{t.transaction_id}</span>
                          <span className="body-xs muted">{t.date}</span>
                        </div>
                      </td>
                      <td>
                        <p className="strong">{t.provider_name}</p>
                        <p className="body-xs muted">{t.type}</p>
                      </td>
                      <td>
                        <p className="strong">{t.client_name}</p>
                        {t.petition_code && (
                          <p className="mono body-xs" style={{ color: 'var(--color-surface-500)' }}>{t.petition_code}</p>
                        )}
                      </td>
                      <td className="body-sm muted" style={{ whiteSpace: 'nowrap' }}>{t.consultation_date || '—'}</td>
                      <td>
                        <span className={`lx-badge ${caseBadgeCls}`}>
                          <span className="lx-badge-dot" style={{ background: ['resolved', 'closed'].includes(caseStatus) ? 'var(--success-600)' : ['cancelled', 'declined'].includes(caseStatus) ? 'var(--danger-600)' : 'var(--info-600)' }} />
                          {caseStatus.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="num strong">{formatRupees(t.amount, { emptyDash: false })}</td>
                      <td style={{ textAlign: 'center' }}>
                        {t.releasable ? (
                          <button
                            onClick={() => handleRelease(t)}
                            disabled={releasingId === tid}
                            className="lx-btn lx-btn-sm"
                            style={{ background: 'var(--success-600)', color: 'white' }}
                          >
                            {releasingId === tid
                              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <><ShieldCheck size={12} /> Release</>}
                          </button>
                        ) : (
                          <span
                            title="Provider must resolve the case before funds can be released"
                            className="lx-btn lx-btn-sm lx-btn-ghost"
                            style={{ cursor: 'not-allowed', opacity: 0.6 }}
                          >
                            <Lock size={12} /> Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="body-xs muted mt-4 max-w-2xl">
        <AlertCircle size={11} className="inline mr-1 align-text-bottom" />
        Funds are only releasable once the linked case is marked <strong>resolved</strong> or <strong>closed</strong> by the provider.
        This protects both citizens and providers — disputes can be raised before settlement.
      </p>
    </div>
  );
}

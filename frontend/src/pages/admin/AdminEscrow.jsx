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
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-surface-200 animate-pulse" />)}
        </div>
        <div className="h-96 bg-white rounded-xl border border-surface-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-surface-900 mb-1 flex items-center gap-3">
          <Lock size={26} className="text-amber-600" /> Escrow Management
        </h1>
        <p className="font-sans text-surface-500">Review transactions held in escrow and release funds once the related case is resolved.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <p className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Total Held</p>
          </div>
          <p className="font-heading text-3xl text-primary-900 font-bold">{formatRupees(data.summary.totalHeld, { emptyDash: false })}</p>
          <p className="text-xs text-surface-500 mt-1">Across {data.summary.count} escrow transaction{data.summary.count !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <p className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Releasable</p>
          </div>
          <p className="font-heading text-3xl text-primary-900 font-bold">{data.summary.releasable}</p>
          <p className="text-xs text-green-700 mt-1">Cases resolved — funds ready for clearance</p>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-surface-100 text-surface-600 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
            <p className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Blocked by Case</p>
          </div>
          <p className="font-heading text-3xl text-primary-900 font-bold">{data.summary.blockedByCase}</p>
          <p className="text-xs text-surface-500 mt-1">Awaiting provider to resolve the case</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search provider, client, case, or txn ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm font-sans"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',        label: 'All',         count: data.transactions.length },
            { key: 'releasable', label: 'Releasable',  count: data.summary.releasable },
            { key: 'blocked',    label: 'Blocked',     count: data.summary.blockedByCase },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-xs uppercase tracking-widest font-bold border transition-colors cursor-pointer ${
                filter === f.key
                  ? 'bg-primary-800 text-white border-primary-800'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-surface-100 text-surface-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Transaction</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Provider</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Client &amp; Case</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Consult Date</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Case Status</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4 text-right">Amount</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <Lock size={32} className="mx-auto text-surface-300 mb-2" />
                    <p className="text-surface-700 font-semibold">No escrow transactions</p>
                    <p className="text-sm text-surface-500 mt-1">
                      {search || filter !== 'all'
                        ? 'Adjust your filters to see other transactions.'
                        : 'Funds held in escrow will appear here when providers complete consultations.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(t => {
                  const tid = t._id || t.id;
                  const statusCls = CASE_STATUS_STYLE[t.case_status] || 'bg-surface-100 text-surface-600';
                  return (
                    <tr key={tid} className="hover:bg-surface-50 transition-colors">
                      <td className="p-4">
                        <p className="font-mono text-xs text-surface-500">{t.transaction_id}</p>
                        <p className="text-[11px] text-surface-400 mt-0.5">{t.date}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-primary-900">{t.provider_name}</p>
                        <p className="text-xs text-surface-500">{t.type}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-surface-800">{t.client_name}</p>
                        {t.petition_code && (
                          <p className="text-[11px] font-mono text-surface-400 mt-0.5">{t.petition_code}</p>
                        )}
                      </td>
                      <td className="p-4 text-sm text-surface-600 whitespace-nowrap">{t.consultation_date || '—'}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${statusCls}`}>
                          {(t.case_status || 'unknown').replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span className="font-heading text-lg font-bold text-primary-900 flex items-center justify-end">
                          {formatRupees(t.amount, { emptyDash: false })}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {t.releasable ? (
                          <button
                            onClick={() => handleRelease(t)}
                            disabled={releasingId === tid}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-sans font-bold hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer uppercase tracking-wider"
                          >
                            {releasingId === tid
                              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <><ShieldCheck size={13} /> Release</>}
                          </button>
                        ) : (
                          <span
                            title="Provider must resolve the case before funds can be released"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 text-surface-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                          >
                            <Lock size={13} /> Locked
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

      <p className="text-xs text-surface-500 mt-4 max-w-2xl">
        <AlertCircle size={12} className="inline mr-1 align-text-bottom" />
        Funds are only releasable once the linked case is marked <strong>resolved</strong> or <strong>closed</strong> by the provider.
        This protects both citizens and providers — disputes can be raised before settlement.
      </p>
    </div>
  );
}

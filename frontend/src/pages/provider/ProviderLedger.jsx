import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Download, IndianRupee, Lock, Search } from 'lucide-react';
import api from '../../services/api';
import { formatRupees } from '../../utils/formatters';

const STATUS_STYLES = {
  cleared: 'bg-green-100 text-green-700',
  escrow:  'bg-amber-100 text-amber-800',
};

const STATUS_LABELS = {
  cleared: 'Cleared',
  escrow:  'In Escrow',
};

export default function ProviderLedger() {
  const { user } = useAuth();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/provider/ledger');
      setLedgerData(data);
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLedgerData(); }, []);

  const handleExport = () => {
    if (!ledgerData?.transactions?.length) return;
    const header = 'Date,Transaction ID,Client,Type,Amount,Status\n';
    const rows = ledgerData.transactions.map(t =>
      `${t.date},${t.transaction_id},${t.client_name},${t.type},${t.amount},${t.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_statement_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTransactions = useMemo(() => {
    if (!ledgerData?.transactions) return [];
    return ledgerData.transactions.filter(t => {
      const matchesSearch = !searchQuery
        || (t.client_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        || (t.type || '').toLowerCase().includes(searchQuery.toLowerCase())
        || (t.transaction_id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ledgerData, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    if (!ledgerData?.transactions) return { all: 0, cleared: 0, escrow: 0 };
    return ledgerData.transactions.reduce((acc, t) => {
      acc.all++;
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, { all: 0, cleared: 0, escrow: 0 });
  }, [ledgerData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-accent-300 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12 font-sans bg-transparent">
      <header className="mb-10 border-b border-surface-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="lx-h1">Financial Ledger</h1>
          <p className="body mt-1">Earnings from completed consultations — cleared payouts and funds awaiting administrative release.</p>
        </div>
        <button onClick={handleExport} className="lx-btn lx-btn-secondary">
          <Download size={14} /> Export CSV
        </button>
      </header>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-primary-800 rounded-xl p-7 shadow-diffused relative overflow-hidden col-span-1 md:col-span-1">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white/10 to-transparent" />
          <span className="font-sans text-xs uppercase tracking-widest font-bold text-white/70 flex items-center gap-2">
            <TrendingUp size={14} /> Cleared Earnings
          </span>
          <p className="font-heading text-4xl text-white flex items-center mt-3">
            <IndianRupee size={28} className="text-accent-300 mr-1" />
            {(ledgerData?.clearedValue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-white/50 text-xs mt-2">Available for withdrawal</p>
        </div>

        <div className="bg-white rounded-xl p-7 border border-amber-200 shadow-sm">
          <span className="font-sans text-xs uppercase tracking-widest font-bold text-amber-700 flex items-center gap-2">
            <Lock size={14} /> Held in Escrow
          </span>
          <p className="font-heading text-4xl text-primary-900 flex items-center mt-3">
            <IndianRupee size={28} className="text-amber-500 mr-1" />
            {(ledgerData?.escrowValue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-surface-500 text-xs mt-2">Awaiting administrative release after case resolution</p>
        </div>

        <div className="bg-white rounded-xl p-7 border border-surface-200 shadow-sm">
          <span className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 flex items-center gap-2">
            <IndianRupee size={14} /> Total Accrued
          </span>
          <p className="font-heading text-4xl text-primary-900 flex items-center mt-3">
            <IndianRupee size={28} className="text-primary-400 mr-1" />
            {((ledgerData?.clearedValue || 0) + (ledgerData?.escrowValue || 0)).toLocaleString('en-IN')}
          </p>
          <p className="text-surface-400 text-xs mt-2">{counts.all} total transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search client, type, or ID…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="lx-input pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',     label: 'All',       count: counts.all },
            { key: 'escrow',  label: 'In escrow', count: counts.escrow || 0 },
            { key: 'cleared', label: 'Cleared',   count: counts.cleared || 0 },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`lx-tab ${statusFilter === f.key ? 'active' : ''}`}
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
                <th>Client &amp; Case</th>
                <th>Status</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="!p-12 text-center">
                    <IndianRupee size={28} className="mx-auto text-surface-300 mb-2" />
                    <p className="strong" style={{ fontSize: 14 }}>
                      {searchQuery || statusFilter !== 'all'
                        ? 'No matching transactions'
                        : 'No earnings recorded yet'}
                    </p>
                    <p className="body-sm muted mt-1">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Adjust your filters to see other transactions.'
                        : 'Transactions are generated automatically when you complete a consultation.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx, i) => (
                  <tr key={trx._id || trx.id || i}>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="mono" style={{ fontSize: 12 }}>{trx.transaction_id}</span>
                        <span className="body-xs muted">{trx.date}</span>
                      </div>
                    </td>
                    <td>
                      <p className="strong">{trx.client_name}</p>
                      <p className="body-xs muted">
                        {trx.type}
                        {trx.petition_code && <span className="mono"> · {trx.petition_code}</span>}
                      </p>
                    </td>
                    <td>
                      <span className={`lx-badge ${trx.status === 'cleared' ? 'lx-badge-success' : 'lx-badge-warn'}`}>
                        <span className="lx-badge-dot" style={{ background: trx.status === 'cleared' ? 'var(--success-600)' : 'var(--warning-600)' }} />
                        {STATUS_LABELS[trx.status] || trx.status}
                      </span>
                    </td>
                    <td className="num strong">
                      {formatRupees(trx.amount, { emptyDash: false })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

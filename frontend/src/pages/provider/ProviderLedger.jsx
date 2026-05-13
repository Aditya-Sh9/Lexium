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
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent">
      <header className="mb-10 border-b border-surface-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-primary-900">Financial Ledger</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Earnings from completed consultations — cleared payouts and funds awaiting administrative release.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-white border border-surface-300 text-surface-700 px-4 py-2.5 rounded font-sans text-xs uppercase tracking-widest font-bold hover:bg-surface-50 cursor-pointer transition-colors"
        >
          <Download size={15} /> Export CSV
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
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search client, type, or ID…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm font-sans"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',     label: 'All',      count: counts.all },
            { key: 'escrow',  label: 'In Escrow',count: counts.escrow || 0 },
            { key: 'cleared', label: 'Cleared',  count: counts.cleared || 0 },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-xs uppercase tracking-widest font-bold border transition-colors cursor-pointer ${
                statusFilter === f.key
                  ? 'bg-primary-800 text-white border-primary-800'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === f.key ? 'bg-white/20' : 'bg-surface-100 text-surface-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Date</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Transaction ID</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Client &amp; Case</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Status</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <IndianRupee size={32} className="mx-auto text-surface-300 mb-2" />
                    <p className="text-surface-700 font-semibold">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No matching transactions'
                        : 'No earnings recorded yet'}
                    </p>
                    <p className="text-sm text-surface-500 mt-1">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Adjust your filters to see other transactions.'
                        : 'Transactions are generated automatically when you complete a consultation.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx, i) => (
                  <tr key={trx._id || trx.id || i} className="hover:bg-surface-50 transition-colors">
                    <td className="p-4 text-sm text-surface-600 whitespace-nowrap">{trx.date}</td>
                    <td className="p-4 font-mono text-xs text-surface-500 whitespace-nowrap">{trx.transaction_id}</td>
                    <td className="p-4">
                      <p className="font-semibold text-primary-900">{trx.client_name}</p>
                      <p className="text-xs text-surface-500">
                        {trx.type}
                        {trx.petition_code && <span className="ml-1 text-surface-400">· {trx.petition_code}</span>}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${STATUS_STYLES[trx.status] || 'bg-surface-100 text-surface-600'}`}>
                        {STATUS_LABELS[trx.status] || trx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-heading text-lg font-bold text-primary-900 flex items-center justify-end">
                        {formatRupees(trx.amount, { emptyDash: false })}
                      </span>
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

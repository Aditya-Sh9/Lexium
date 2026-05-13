import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Download, IndianRupee, Clock, Search, Trash2, Filter } from 'lucide-react';
import api from '../../services/api';
import { themeToast, themeAlert } from '../../utils/alert';

const STATUS_STYLES = {
  cleared:  'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  refunded: 'bg-red-100 text-red-700',
};

export default function ProviderLedger() {
  const { user } = useAuth();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (trx) => {
    const confirmed = await themeAlert.fire({
      title: 'Remove Transaction?',
      text: `Remove ${trx.transaction_id} (₹${trx.amount})? This cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
    });
    if (!confirmed.isConfirmed) return;

    const trxId = trx._id || trx.id;
    setDeletingId(trxId);
    try {
      await api.delete(`/provider/transactions/${trxId}`);
      themeToast.success('Transaction removed');
      fetchLedgerData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to remove transaction');
    } finally {
      setDeletingId(null);
    }
  };

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
    if (!ledgerData?.transactions) return { all: 0, cleared: 0, pending: 0, refunded: 0 };
    return ledgerData.transactions.reduce((acc, t) => {
      acc.all++;
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, { all: 0, cleared: 0, pending: 0, refunded: 0 });
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
          <p className="font-sans text-lg text-surface-500 mt-2">Earnings from completed consultations — cleared payouts and pending escrow.</p>
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
            <TrendingUp size={14} /> Cleared Value
          </span>
          <p className="font-heading text-4xl text-white flex items-center mt-3">
            <IndianRupee size={28} className="text-accent-300 mr-1" />
            {(ledgerData?.clearedValue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-white/50 text-xs mt-2">Available for withdrawal</p>
        </div>

        <div className="bg-white rounded-xl p-7 border border-surface-200 shadow-sm">
          <span className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 flex items-center gap-2">
            <Clock size={14} /> Pending Escrow
          </span>
          <p className="font-heading text-4xl text-primary-900 flex items-center mt-3">
            <IndianRupee size={28} className="text-surface-400 mr-1" />
            {(ledgerData?.pendingEscrow || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-surface-400 text-xs mt-2">Held until case completion</p>
        </div>

        <div className="bg-white rounded-xl p-7 border border-surface-200 shadow-sm">
          <span className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 flex items-center gap-2">
            <IndianRupee size={14} /> Total Accrued
          </span>
          <p className="font-heading text-4xl text-primary-900 flex items-center mt-3">
            <IndianRupee size={28} className="text-primary-400 mr-1" />
            {((ledgerData?.clearedValue || 0) + (ledgerData?.pendingEscrow || 0)).toLocaleString('en-IN')}
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
            { key: 'all',      label: 'All',      count: counts.all },
            { key: 'cleared',  label: 'Cleared',  count: counts.cleared || 0 },
            { key: 'pending',  label: 'Pending',  count: counts.pending || 0 },
            { key: 'refunded', label: 'Refunded', count: counts.refunded || 0 },
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
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Client & Type</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Status</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4 text-right">Amount</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
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
                      <p className="text-xs text-surface-500">{trx.type}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${STATUS_STYLES[trx.status] || 'bg-surface-100 text-surface-600'}`}>
                        {trx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-heading text-lg font-bold text-primary-900 flex items-center justify-end">
                        <IndianRupee size={15} /> {(trx.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(trx)}
                        disabled={deletingId === (trx._id || trx.id)}
                        title="Remove transaction"
                        className="w-8 h-8 flex items-center justify-center mx-auto rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {deletingId === trx._id
                          ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={15} />}
                      </button>
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

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Download, IndianRupee, Clock } from 'lucide-react';
import api from '../../services/api';

export default function ProviderLedger() {
  const { user } = useAuth();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchLedgerData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-accent-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent min-h-screen">
      <header className="mb-12 border-b border-surface-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-heading text-4xl text-primary-900">Financial Ledger</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Track your accrued value, payouts, and pending escrow.</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-surface-300 text-surface-700 px-4 py-2 rounded font-sans text-xs uppercase tracking-widest font-bold hover:bg-surface-50 cursor-pointer">
          <Download size={16} /> Export Statement
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Cleared Value */}
        <div className="bg-primary-800 rounded-xl p-8 shadow-diffused relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="font-sans text-xs uppercase tracking-widest font-bold text-white/70 flex items-center gap-2">
              <TrendingUp size={16} /> Cleared Value
            </span>
            <div className="mt-4">
              <p className="font-heading text-5xl text-white flex items-center">
                <IndianRupee size={36} className="text-accent-300 mr-1" />
                {(ledgerData?.clearedValue || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-white/60 text-sm mt-2">Available for immediate withdrawal.</p>
            </div>
          </div>
        </div>

        {/* Pending Escrow */}
        <div className="bg-white rounded-xl p-8 border border-surface-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 flex items-center gap-2">
              <Clock size={16} /> Pending Escrow
            </span>
            <div className="mt-4">
              <p className="font-heading text-5xl text-primary-900 flex items-center">
                <IndianRupee size={36} className="text-surface-400 mr-1" />
                {(ledgerData?.pendingEscrow || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-surface-500 text-sm mt-2">Held securely until case completion.</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-heading text-2xl text-primary-900 mb-6">Recent Transactions</h2>
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Date</th>
              <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Transaction ID</th>
              <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Client & Type</th>
              <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Status</th>
              <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {(!ledgerData?.transactions || ledgerData.transactions.length === 0) ? (
              <tr><td colSpan="5" className="p-8 text-center text-surface-500">No transactions yet.</td></tr>
            ) : (
              ledgerData.transactions.map(trx => (
                <tr key={trx._id} className="hover:bg-surface-50 transition-colors">
                  <td className="p-4 text-sm text-surface-600">{trx.date}</td>
                  <td className="p-4 font-mono text-xs text-surface-500">{trx.transaction_id}</td>
                  <td className="p-4">
                    <p className="font-semibold text-primary-900">{trx.client_name}</p>
                    <p className="text-xs text-surface-500">{trx.type}</p>
                  </td>
                  <td className="p-4">
                    {trx.status === 'cleared' ? (
                      <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded bg-green-100 text-green-700">Cleared</span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded bg-yellow-100 text-yellow-700">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-heading text-lg font-bold text-primary-900 flex items-center justify-end">
                      <IndianRupee size={16} /> {(trx.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

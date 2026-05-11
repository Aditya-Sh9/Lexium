import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Star, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router';
import api from '../../services/api';

export default function CitizenHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.get('/citizen/history');
        setHistory(data);
      } catch (error) {
        console.error('Error fetching history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(record => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (record.provider_name || '').toLowerCase().includes(q)
      || (record.type || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent min-h-screen">
      <header className="mb-12 border-b border-surface-200 pb-6">
        <h1 className="font-heading text-4xl text-primary-900">Past Records</h1>
        <p className="font-sans text-lg text-surface-500 mt-2">History of your closed and cancelled legal engagements.</p>
      </header>

      {/* Search */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Search past records..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all font-sans" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5">Provider</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5">Case Type</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5">Closed On</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5">Status</th>
                <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-surface-500">No past records found.</td>
                </tr>
              ) : (
                filteredHistory.map(record => (
                  <tr key={record._id} className="hover:bg-surface-50 transition-colors">
                    <td className="p-5">
                      <span className="font-heading text-lg font-semibold text-surface-900">
                        {record.provider_name}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-bold text-surface-700 uppercase tracking-widest">{record.type}</td>
                    <td className="p-5 text-sm text-surface-600">
                      <span className="flex items-center gap-2">
                        <Clock size={14} className="text-surface-400" /> 
                        {new Date(record.updated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${record.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {record.provider_id && (
                        <Link to={`/providers/${record.provider_id}`} className="text-xs font-bold uppercase tracking-widest text-primary-600 hover:text-primary-700 hover:underline">
                          Book Again
                        </Link>
                      )}
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

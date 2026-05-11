import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Clock, AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import api from '../../services/api';

export default function CitizenPetitions() {
  const { user } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPetitions = async () => {
    setLoading(true);
    try {
      const data = await api.get('/citizen/petitions');
      setPetitions(data);
    } catch (error) {
      console.error('Error fetching petitions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPetitions(); }, []);

  const handleWithdraw = async (id) => {
    if (!confirm('Are you sure you want to withdraw this petition?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/citizen/petitions/${id}`);
      fetchPetitions();
    } catch (e) {
      alert(e.message || 'Failed to withdraw petition');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      case 'pending': default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent min-h-screen">
      <header className="mb-12 border-b border-surface-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="font-heading text-4xl text-primary-900">My Petitions</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Track your active bookings and legal requests.</p>
        </div>
        <Link to="/providers" className="bg-primary-800 text-white font-sans text-xs uppercase tracking-widest font-bold px-6 py-3 rounded hover:bg-primary-700 transition-colors">
          New Petition
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {petitions.length === 0 ? (
          <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-surface-300 mb-4" />
            <h2 className="font-heading text-2xl text-surface-900 mb-2">No Active Petitions</h2>
            <p className="text-surface-500 mb-6">You don't have any ongoing requests with legal practitioners.</p>
            <Link to="/providers" className="text-primary-600 font-bold hover:underline">Browse Practitioners</Link>
          </div>
        ) : (
          petitions.map(petition => (
            <div key={petition._id} className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-surface-500 bg-surface-100 px-2 py-1 rounded">{petition.petition_id}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${getStatusStyle(petition.status)}`}>
                      {petition.status}
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl text-surface-900 mb-1">{petition.provider_name}</h3>
                  <p className="font-sans text-sm font-bold uppercase tracking-widest text-surface-500 mb-4">{petition.type}</p>
                  
                  <div className="bg-surface-50 border border-surface-200 p-4 rounded-lg flex items-start gap-3">
                    <AlertCircle size={18} className="text-primary-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-surface-700">Next Step</p>
                      <p className="text-sm text-surface-600">{petition.next_step}</p>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {petition.details && (
                    <div className="mt-3">
                      <button 
                        onClick={() => setExpandedId(expandedId === petition._id ? null : petition._id)}
                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary-600 hover:text-primary-700 cursor-pointer"
                      >
                        {expandedId === petition._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expandedId === petition._id ? 'Hide' : 'View'} Details
                      </button>
                      {expandedId === petition._id && (
                        <div className="mt-2 p-4 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-700 animate-fade-in">
                          {petition.details}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-surface-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-1">Submitted On</p>
                    <p className="text-sm text-surface-900 flex items-center gap-2"><Clock size={14} className="text-surface-400" /> {new Date(petition.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    {petition.status !== 'declined' && petition.status !== 'accepted' && (
                      <button 
                        onClick={() => handleWithdraw(petition._id)}
                        disabled={actionLoading === petition._id}
                        className="w-full bg-white text-red-600 border border-red-200 py-2 rounded font-sans text-xs uppercase tracking-widest font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 size={14} /> Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

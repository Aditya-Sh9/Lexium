import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, CheckCircle2, XCircle, FileText, Check } from 'lucide-react';
import api from '../../services/api';
import { themeToast, themeAlert } from '../../utils/alert';

export default function ProviderDocket() {
  const { user } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [activeCases, setActiveCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDocketData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/provider/docket');
      setPetitions(data.petitions || []);
      setActiveCases(data.activeCases || []);
    } catch (error) {
      console.error('Error fetching docket data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocketData(); }, []);

  const handleAcceptPetition = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/provider/petitions/${id}/accept`);
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to accept petition');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclinePetition = async (id) => {
    const confirm = await themeAlert.fire({
      title: 'Decline Petition?',
      text: 'Are you sure you want to decline this petition?',
      showCancelButton: true,
      confirmButtonText: 'Yes, decline',
    });
    if (!confirm.isConfirmed) return;
    
    setActionLoading(id);
    try {
      await api.post(`/provider/petitions/${id}/decline`);
      themeToast.success('Petition declined');
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to decline petition');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id) => {
    const confirm = await themeAlert.fire({
      title: 'Complete Case?',
      text: 'Mark this case as completed?',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete',
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(id);
    try {
      await api.put(`/provider/appointments/${id}/complete`);
      themeToast.success('Case completed successfully');
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to complete appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptAppointment = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/provider/appointments/${id}/accept`);
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to accept appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineAppointment = async (id) => {
    const confirm = await themeAlert.fire({
      title: 'Decline Appointment?',
      text: 'Are you sure you want to decline this appointment?',
      showCancelButton: true,
      confirmButtonText: 'Yes, decline',
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(id);
    try {
      await api.post(`/provider/appointments/${id}/decline`);
      themeToast.success('Appointment declined');
      fetchDocketData();
    } catch (e) {
      themeToast.error(e.message || 'Failed to decline appointment');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent min-h-screen">
      <header className="mb-12 border-b border-surface-200 pb-6">
        <h1 className="font-heading text-4xl text-primary-900">The Docket</h1>
        <p className="font-sans text-lg text-surface-500 mt-2">Manage incoming petitions and active legal engagements.</p>
      </header>

      <div className="space-y-12">
        {/* Incoming Petitions */}
        <section>
          <h2 className="font-heading text-2xl text-primary-900 mb-6 flex items-center gap-2">
            <FileText className="text-accent-300" /> Incoming Petitions ({petitions.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {petitions.length === 0 ? (
              <p className="text-surface-500 col-span-2 bg-white p-8 rounded-xl border border-surface-200 text-center">No new petitions pending review.</p>
            ) : (
              petitions.map(petition => (
                <div key={petition.id || petition._id} className="bg-white rounded-xl p-6 border border-surface-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-heading text-xl text-primary-900">{petition.citizen_name}</h3>
                        <p className="text-xs font-sans uppercase tracking-widest text-accent-400 font-bold mt-1">{petition.type}</p>
                      </div>
                      <span className="text-xs font-sans text-surface-500 bg-surface-100 px-2 py-1 rounded">
                        {new Date(petition.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {petition.details && (
                      <p className="font-sans text-sm text-surface-600 mb-6 line-clamp-3 bg-surface-50 p-4 rounded border border-surface-100">
                        "{petition.details}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleAcceptPetition(petition.id || petition._id)} disabled={actionLoading === (petition.id || petition._id)}
                      className="flex-1 bg-primary-800 text-white py-2 rounded font-sans text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50">
                      <CheckCircle2 size={16} /> Accept
                    </button>
                    <button onClick={() => handleDeclinePetition(petition.id || petition._id)} disabled={actionLoading === (petition.id || petition._id)}
                      className="flex-1 bg-white border border-surface-300 text-surface-700 py-2 rounded font-sans text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-surface-50 transition-colors cursor-pointer disabled:opacity-50">
                      <XCircle size={16} /> Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Active Engagements */}
        <section>
          <h2 className="font-heading text-2xl text-primary-900 mb-6 flex items-center gap-2">
            <Clock className="text-accent-300" /> Active Engagements ({activeCases.length})
          </h2>
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Client</th>
                    <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Case Type</th>
                    <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Date & Time</th>
                    <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Status</th>
                    <th className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500 p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {activeCases.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-surface-500">No active cases.</td>
                    </tr>
                  ) : (
                    activeCases.map(c => (
                      <tr key={c.id || c._id} className="hover:bg-surface-50 transition-colors">
                        <td className="p-4 font-heading text-primary-900 font-semibold">{c.citizen_name}</td>
                        <td className="p-4 text-sm text-surface-600">{c.type}</td>
                        <td className="p-4 text-sm text-surface-600">
                          <span className="flex items-center gap-2">
                            <Calendar size={14} className="text-surface-400" /> {c.date} — {c.time}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary-100 text-primary-800">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {c.status === 'pending' ? (
                              <>
                                <button onClick={() => handleAcceptAppointment(c.id || c._id)} disabled={actionLoading === (c.id || c._id)}
                                  className="text-xs font-sans uppercase tracking-widest font-bold text-primary-700 border border-primary-700 px-3 py-1.5 rounded hover:bg-primary-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                                  <Check size={14} /> Accept
                                </button>
                                <button onClick={() => handleDeclineAppointment(c.id || c._id)} disabled={actionLoading === (c.id || c._id)}
                                  className="text-xs font-sans uppercase tracking-widest font-bold text-red-700 border border-red-700 px-3 py-1.5 rounded hover:bg-red-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                                  <XCircle size={14} /> Decline
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleComplete(c.id || c._id)} disabled={actionLoading === (c.id || c._id)}
                                className="text-xs font-sans uppercase tracking-widest font-bold text-green-700 border border-green-700 px-3 py-1.5 rounded hover:bg-green-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                                <Check size={14} /> Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

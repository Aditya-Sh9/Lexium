import { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, Award, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router';
import api from '../../services/api';
import { motion } from 'framer-motion';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    upcomingAppointments: [],
    standing: '...',
    activeClients: 0,
    weeklyApts: 0,
    badgesEarned: 0,
    accruedValue: { pending: 0, cleared: 0, monthlyTotal: 0 },
    pathProgress: { casesClosed: 0, proBono: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    api.get('/provider/dashboard')
      .then(res => {
        setData({
          upcomingAppointments: res.todayDocket || [],
          standing: res.standing || 'Exemplary',
          activeClients: res.activeClients || 0,
          weeklyApts: res.weeklyApts || 0,
          badgesEarned: res.badgesEarned || 0,
          accruedValue: res.accruedValue || { pending: 0, cleared: 0, monthlyTotal: 0 },
          pathProgress: res.pathProgress || { casesClosed: 0, proBono: 0 }
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/provider/appointments/${id}/accept`);
      fetchDashboard();
    } catch (e) {
      alert(e.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id) => {
    if (!confirm('Are you sure you want to decline this petition?')) return;
    setActionLoading(id);
    try {
      await api.post(`/provider/appointments/${id}/decline`);
      fetchDashboard();
    } catch (e) {
      alert(e.message || 'Failed to decline');
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

  const upcomingAppointments = data.upcomingAppointments;

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 pb-24 font-sans bg-transparent min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end border-b border-surface-200 pb-6 gap-6"
      >
        <div>
          <h1 className="font-heading text-4xl text-primary-900">Reputation & Dashboard</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Manage your practice within the Sovereign Digital Framework.</p>
        </div>
        <div className="md:text-right bg-white p-4 rounded-xl border border-surface-200 shadow-sm">
          <span className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Current Standing</span>
          <p className="font-heading text-2xl text-accent-300 flex items-center md:justify-end gap-2 mt-1">
            <ShieldCheck size={24} /> {data.standing}
          </p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Schedule & Stats Panel */}
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-8 bg-white/80 backdrop-blur-[20px] rounded-xl p-8 border border-white/60 shadow-diffused relative overflow-hidden flex flex-col min-h-[500px]"
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f1b2d 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="font-heading text-2xl text-primary-900 mb-8 flex items-center gap-3">
              <Calendar className="text-accent-300" /> The Docket (Today)
            </h2>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-surface-50 p-4 rounded-lg border border-surface-200 flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-primary-100 text-primary-800 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs font-sans uppercase tracking-widest font-bold text-surface-500">Active Clients</p>
                  <p className="text-xl font-heading text-primary-900">{data.activeClients}</p>
                </div>
              </div>
              <div className="bg-surface-50 p-4 rounded-lg border border-surface-200 flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-primary-100 text-primary-800 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs font-sans uppercase tracking-widest font-bold text-surface-500">Weekly Apts</p>
                  <p className="text-xl font-heading text-primary-900">{data.weeklyApts}</p>
                </div>
              </div>
              <div className="bg-surface-50 p-4 rounded-lg border border-surface-200 flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-accent-50 text-accent-300 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs font-sans uppercase tracking-widest font-bold text-surface-500">Badges</p>
                  <p className="text-xl font-heading text-primary-900">{data.badgesEarned}</p>
                </div>
              </div>
            </div>

            {/* Appointments List */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <div className="p-8 text-center text-surface-500 font-sans border border-dashed border-surface-300 rounded-xl">No active petitions today.</div>
                ) : (
                  upcomingAppointments.map((apt) => (
                    <div key={apt.id || apt._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${apt.status === 'confirmed' ? 'bg-accent-300' : 'bg-surface-300'}`}></div>
                      
                      <div className="flex gap-4 items-center pl-2">
                        <div className="w-12 h-12 rounded-full bg-primary-800 flex items-center justify-center font-heading text-xl text-white shadow-inner shrink-0">
                          {(apt.citizen_name || 'C').charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-heading text-lg text-primary-900">{apt.citizen_name}</h3>
                          <p className="text-sm font-sans text-surface-600 mb-1">{apt.type}</p>
                          <span className="flex items-center gap-1 text-xs font-bold font-sans tracking-widest uppercase text-surface-500">
                            <Clock size={12} className="text-accent-300" /> {apt.time} — {apt.date}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col sm:items-end items-center gap-3 shrink-0">
                        {apt.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAccept(apt.id || apt._id)} 
                              disabled={actionLoading === (apt.id || apt._id)}
                              className="px-4 py-2 bg-primary-800 text-white text-xs font-sans uppercase tracking-widest font-bold rounded shadow-sm hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50"
                            >Accept</button>
                            <button 
                              onClick={() => handleDecline(apt.id || apt._id)} 
                              disabled={actionLoading === (apt.id || apt._id)}
                              className="px-4 py-2 bg-white text-surface-700 border border-surface-300 text-xs font-sans uppercase tracking-widest font-bold rounded hover:bg-surface-50 transition-colors cursor-pointer disabled:opacity-50"
                            >Decline</button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-accent-50 text-accent-500">
                            <CheckCircle2 size={14} /> {apt.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Earnings Stack */}
        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-4 bg-white/80 backdrop-blur-[20px] rounded-xl p-8 border border-white/60 shadow-diffused flex flex-col justify-between"
        >
          <div>
            <h2 className="font-heading text-2xl text-primary-900 mb-2 flex items-center gap-2">
              <TrendingUp className="text-accent-300" /> Accrued Value
            </h2>
            <p className="font-sans text-sm text-surface-500 mb-8">Value generated from closed dockets.</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-end items-center gap-2 pb-8">
            <div className="w-32 h-6 bg-gradient-to-r from-[#B8942E] via-[#c8a84e] to-[#9a7c2e] rounded-sm shadow-[0_2px_4px_rgba(0,0,0,0.2)] border-t border-[#f0d68a] opacity-50 relative flex items-center justify-center">
              <span className="text-[#1A0F08]/50 text-xs font-bold font-sans">+₹{data.accruedValue.pending.toLocaleString('en-IN')} Pending</span>
            </div>
            <div className="w-32 h-8 bg-gradient-to-r from-[#B8942E] via-[#c8a84e] to-[#9a7c2e] rounded-sm shadow-[0_4px_6px_rgba(0,0,0,0.3)] border-t border-[#f0d68a] z-10 flex items-center justify-center text-[#1A0F08] font-bold">₹{data.accruedValue.cleared.toLocaleString('en-IN')}</div>
            <div className="w-32 h-8 bg-gradient-to-r from-[#B8942E] via-[#c8a84e] to-[#9a7c2e] rounded-sm shadow-[0_4px_6px_rgba(0,0,0,0.3)] border-t border-[#f0d68a] z-20"></div>
            <div className="w-32 h-8 bg-gradient-to-r from-[#B8942E] via-[#c8a84e] to-[#9a7c2e] rounded-sm shadow-[0_4px_6px_rgba(0,0,0,0.3)] border-t border-[#f0d68a] z-30"></div>
            <div className="w-36 h-4 bg-primary-950 rounded-sm shadow-xl z-40 mt-2"></div>
          </div>
          
          <div className="mt-auto text-center border-t border-surface-200 pt-6">
            <span className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Monthly Total</span>
            <p className="font-heading text-4xl text-primary-900 mt-2">₹{data.accruedValue.monthlyTotal.toLocaleString('en-IN')}</p>
            <button 
              onClick={() => navigate('/provider/ledger')}
              className="mt-6 px-6 py-3 border border-primary-800 text-primary-800 font-sans text-xs uppercase tracking-widest font-bold rounded hover:bg-primary-800 hover:text-white transition-colors w-full cursor-pointer"
            >
              View Financial Ledger
            </button>
          </div>
        </motion.section>

        {/* Progress Journey */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-12 bg-white/80 backdrop-blur-[20px] rounded-xl p-8 border border-white/60 shadow-diffused overflow-x-auto"
        >
          <h2 className="font-heading text-2xl text-primary-900 mb-8">Path to Eminence</h2>
          
          <div className="relative w-full min-w-[600px] h-32 flex items-center justify-between px-8">
            <div className="absolute left-12 right-12 top-1/2 h-1 bg-surface-200 -translate-y-1/2 rounded-full z-0"></div>
            <div className="absolute left-12 top-1/2 h-1 bg-accent-300 -translate-y-1/2 rounded-full z-0" style={{ width: '50%' }}></div>

            <div className="flex flex-col items-center gap-3 relative z-10 -mt-2">
              <div className="w-10 h-10 rounded-full bg-primary-800 text-white flex items-center justify-center shadow-md border-2 border-accent-300">
                <CheckCircle2 size={18} />
              </div>
              <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-primary-900 text-center">Join<br/>Registry</span>
            </div>

            <div className="flex flex-col items-center gap-3 relative z-10 -mt-2">
              <div className="w-12 h-12 rounded-full bg-accent-300 text-primary-900 flex items-center justify-center shadow-[0_0_15px_rgba(200,168,78,0.4)] border-2 border-white">
                <Award size={24} />
              </div>
              <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-primary-900 text-center">{data.pathProgress.casesClosed} Cases<br/>Closed</span>
            </div>

            <div className="flex flex-col items-center gap-3 relative z-10 -mt-2 opacity-50">
              <div className="w-10 h-10 rounded-full bg-white text-surface-400 flex items-center justify-center shadow-inner border border-surface-300">
                <ShieldCheck size={18} />
              </div>
              <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-surface-500 text-center">Pro Bono<br/>Champion</span>
            </div>

            <div className="flex flex-col items-center gap-3 relative z-10 -mt-2 opacity-50">
              <div className="w-10 h-10 rounded-full bg-white text-surface-400 flex items-center justify-center shadow-inner border border-surface-300">
                <Award size={18} />
              </div>
              <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-surface-500 text-center">Senior<br/>Status</span>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

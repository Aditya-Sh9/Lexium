import { useState, useEffect } from 'react';
import { Calendar, Star, Clock, MapPin, ChevronRight, X, RefreshCw, Ban } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { themeToast, themeAlert } from '../../utils/alert';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    savedProviders: []
  });

  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.get('/citizen/dashboard');
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleModal) return;
    setActionLoading(rescheduleModal._id);
    try {
      await api.put(`/citizen/appointments/${rescheduleModal._id}/reschedule`, {
        date: rescheduleDate,
        time: rescheduleTime,
      });
      setRescheduleModal(null);
      setRescheduleDate('');
      setRescheduleTime('');
      themeToast.success('Appointment rescheduled successfully');
      fetchDashboard();
    } catch (e) {
      themeToast.error(e.message || 'Failed to reschedule');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    const confirm = await themeAlert.fire({
      title: 'Cancel Appointment?',
      text: 'Are you sure you want to cancel this appointment?',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(id);
    try {
      await api.delete(`/citizen/appointments/${id}`);
      themeToast.success('Appointment cancelled');
      fetchDashboard();
    } catch (e) {
      themeToast.error(e.message || 'Failed to cancel');
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

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent min-h-screen">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 border-b border-surface-200 pb-6 flex justify-between items-end"
      >
        <div>
          <h1 className="font-heading text-4xl text-primary-900">Welcome, {user?.name || 'Citizen'}</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Manage your legal petitions and saved professionals.</p>
        </div>
        <Link to="/providers" className="bg-primary-800 text-white font-sans text-xs uppercase tracking-widest font-bold px-6 py-3 rounded hover:bg-primary-700 transition-colors">
          Find Counsel
        </Link>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-8"
        >
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Link to="/citizen/petitions" className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm hover:border-accent-400 transition-colors flex items-center justify-between group">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary-50 text-primary-800 rounded-full flex items-center justify-center">
                   <Calendar size={24} />
                 </div>
                 <div>
                   <h3 className="font-heading text-xl text-surface-900">My Petitions</h3>
                   <p className="text-sm text-surface-500">Track active bookings</p>
                 </div>
               </div>
               <ChevronRight className="text-surface-300 group-hover:text-accent-400 transition-colors" />
             </Link>
             <Link to="/citizen/history" className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm hover:border-accent-400 transition-colors flex items-center justify-between group">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-accent-50 text-accent-600 rounded-full flex items-center justify-center">
                   <Clock size={24} />
                 </div>
                 <div>
                   <h3 className="font-heading text-xl text-surface-900">Past Records</h3>
                   <p className="text-sm text-surface-500">View history & reviews</p>
                 </div>
               </div>
               <ChevronRight className="text-surface-300 group-hover:text-accent-400 transition-colors" />
             </Link>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-100 flex justify-between items-center bg-surface-50">
              <h2 className="text-lg font-heading font-semibold flex items-center gap-2 text-surface-900">
                <Calendar size={20} className="text-accent-400" /> Upcoming Appointments
              </h2>
              <Link to="/citizen/petitions" className="text-xs font-bold uppercase tracking-widest text-primary-600 hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-surface-100">
              {dashboardData.upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center text-surface-500 font-sans border border-dashed border-surface-200 m-4 rounded">No upcoming appointments. <Link to="/providers" className="text-primary-600 font-bold hover:underline">Book one now</Link></div>
              ) : (
                dashboardData.upcomingAppointments.map((apt) => (
                  <div key={apt._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 transition-colors">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-surface-900">{apt.provider_name}</h3>
                      <p className="text-sm text-surface-500 mb-2">{apt.type}</p>
                      <div className="flex gap-4 text-sm font-medium text-surface-600">
                        <span className="flex items-center gap-1"><Calendar size={14} className="text-accent-400" /> {apt.date}</span>
                        <span className="flex items-center gap-1"><Clock size={14} className="text-accent-400" /> {apt.time}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {apt.status}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setRescheduleModal(apt)} 
                          disabled={actionLoading === apt._id}
                          className="text-xs font-bold uppercase tracking-widest text-primary-600 border border-primary-600 px-3 py-1 rounded hover:bg-primary-50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw size={12} /> Reschedule
                        </button>
                        <button 
                          onClick={() => handleCancel(apt._id)} 
                          disabled={actionLoading === apt._id}
                          className="text-xs font-bold uppercase tracking-widest text-red-600 border border-red-300 px-3 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Ban size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </motion.div>

        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-100 bg-surface-50">
              <h2 className="text-lg font-heading font-semibold flex items-center gap-2 text-surface-900">
                <Star size={20} className="text-accent-300" /> Top Providers
              </h2>
            </div>
            <div className="divide-y divide-surface-100">
              {dashboardData.savedProviders.map((provider) => (
                <div key={provider._id} className="p-4 hover:bg-surface-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading text-xl shrink-0">
                      {provider.name?.charAt(0)}
                    </div>
                    <div>
                      <Link to={`/providers/${provider._id}`} className="font-heading text-lg font-semibold text-surface-900 hover:text-primary-600 transition-colors block">
                        {provider.name}
                      </Link>
                      <p className="text-xs font-sans text-surface-500 uppercase tracking-widest mt-1 font-bold">{provider.specialization}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-sans text-surface-600 font-bold">
                        <span className="flex items-center gap-1"><Star size={14} className="text-accent-300 fill-accent-300" /> {provider.rating}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {provider.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-surface-100 text-center">
              <Link to="/providers" className="text-xs font-bold uppercase tracking-widest text-primary-600 hover:underline">Find more providers</Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setRescheduleModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading text-2xl text-surface-900">Reschedule Appointment</h3>
                <button onClick={() => setRescheduleModal(null)} className="text-surface-400 hover:text-surface-600 cursor-pointer"><X size={20} /></button>
              </div>
              <p className="text-sm text-surface-500 mb-4">With <strong>{rescheduleModal.provider_name}</strong> — {rescheduleModal.type}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">New Date</label>
                  <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">New Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map(t => (
                      <button key={t} onClick={() => setRescheduleTime(t)}
                        className={`py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${rescheduleTime === t ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleReschedule} disabled={!rescheduleDate || !rescheduleTime}
                className="mt-6 w-full py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors cursor-pointer">
                Confirm Reschedule
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

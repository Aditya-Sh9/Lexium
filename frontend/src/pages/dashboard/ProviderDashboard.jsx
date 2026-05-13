import { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, Award, Clock, ShieldCheck, CheckCircle2, Star, Trophy, Briefcase, FileText } from 'lucide-react';
import { formatRupees } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router';
import api from '../../services/api';
import { motion } from 'framer-motion';

const TIER_MILESTONES = [
  { label: 'Join Registry',      cases: 0,  done: true },
  { label: 'Tier II',            cases: 5 },
  { label: 'Tier III',           cases: 15 },
  { label: 'Tier IV',            cases: 30 },
  { label: 'Tier V',             cases: 50 },
];

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    upcomingAppointments: [],
    standing: '...',
    activeClients: 0,
    openCases: 0,
    newRequests: 0,
    weeklyApts: 0,
    badgesEarned: 0,
    leaderboardPosition: null,
    recentReviews: [],
    accruedValue: { escrow: 0, cleared: 0, monthlyTotal: 0 },
    pathProgress: { casesClosed: 0, proBono: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    api.get('/provider/dashboard')
      .then(res => {
        setData({
          upcomingAppointments: res.todayDocket || [],
          standing: res.standing || 'Good',
          activeClients: res.activeClients || 0,
          openCases: res.openCases || 0,
          newRequests: res.newRequests || 0,
          weeklyApts: res.weeklyApts || 0,
          badgesEarned: res.badgesEarned || 0,
          leaderboardPosition: res.leaderboardPosition ?? null,
          recentReviews: res.recentReviews || [],
          accruedValue: res.accruedValue || { escrow: 0, cleared: 0, monthlyTotal: 0 },
          pathProgress: res.pathProgress || { casesClosed: 0, proBono: 0 },
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
    if (!confirm('Are you sure you want to decline this appointment?')) return;
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
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { casesClosed } = data.pathProgress;

  // Dynamic progress: which milestone segment is the current position in?
  const maxCases = 50;
  const progressPct = Math.min((casesClosed / maxCases) * 100, 100);

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 pb-16 font-sans bg-transparent">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end border-b border-surface-200 pb-6 gap-6"
      >
        <div>
          <h1 className="font-heading text-4xl text-primary-900">Practice Workspace</h1>
          <p className="font-sans text-lg text-surface-500 mt-2">Your active cases, scheduled consultations, and accrued earnings at a glance.</p>
        </div>
        <div className="flex gap-4 flex-wrap md:justify-end">
          {data.leaderboardPosition && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
              <Trophy size={20} className="text-amber-500" />
              <div>
                <p className="text-xs font-sans uppercase tracking-widest font-bold text-amber-600">Leaderboard Rank</p>
                <p className="font-heading text-xl text-amber-700">#{data.leaderboardPosition}</p>
              </div>
            </div>
          )}
          <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm">
            <span className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Standing</span>
            <p className="font-heading text-2xl text-accent-300 flex items-center gap-2 mt-1">
              <ShieldCheck size={22} /> {data.standing}
            </p>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Main Schedule Panel ── */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-8 bg-white/80 backdrop-blur-[20px] rounded-xl p-8 border border-white/60 shadow-diffused relative overflow-hidden flex flex-col min-h-[500px]"
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f1b2d 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-6">
              <h2 className="font-heading text-2xl text-primary-900 flex items-center gap-3">
                <Calendar className="text-accent-300" /> Today's Consultations
              </h2>
              <p className="text-sm text-surface-500 mt-1">Confirmed and pending sessions scheduled in your docket</p>
            </div>

            {/* Quick Stats — lead with case-level metrics that match the new lifecycle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: <FileText size={18} />,    label: 'New Requests',   value: data.newRequests,   to: '/provider/docket', highlight: data.newRequests > 0 },
                { icon: <Briefcase size={18} />,   label: 'Open Cases',     value: data.openCases,     to: '/provider/docket' },
                { icon: <Calendar size={18} />,    label: "Today's Sessions", value: data.upcomingAppointments.length },
                { icon: <Users size={18} />,       label: 'Active Clients', value: data.activeClients },
              ].map(stat => {
                const body = (
                  <div className={`bg-surface-50 p-3 rounded-lg border flex items-center gap-3 ${stat.highlight ? 'border-amber-300 ring-1 ring-amber-100' : 'border-surface-200'}`}>
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${stat.highlight ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-800'}`}>
                      {stat.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-surface-500 leading-tight">{stat.label}</p>
                      <p className="text-lg font-heading text-primary-900 leading-tight">{stat.value}</p>
                    </div>
                  </div>
                );
                return stat.to
                  ? <Link key={stat.label} to={stat.to} className="hover:opacity-80 transition-opacity">{body}</Link>
                  : <div key={stat.label}>{body}</div>;
              })}
            </div>

            {/* Appointments List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {data.upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-surface-300 rounded-xl">
                  <Calendar size={32} className="mx-auto text-surface-300 mb-2" />
                  <p className="text-surface-700 font-sans font-semibold">No consultations scheduled today</p>
                  <p className="text-sm text-surface-500 mt-1">New petitions appear in <Link to="/provider/docket" className="text-primary-700 font-bold hover:underline">The Docket</Link> for review.</p>
                </div>
              ) : (
                data.upcomingAppointments.map(apt => (
                  <div key={apt._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${apt.status === 'confirmed' ? 'bg-accent-300' : 'bg-surface-300'}`} />
                    <div className="flex gap-4 items-center pl-2">
                      <div className="w-11 h-11 rounded-full bg-primary-800 flex items-center justify-center font-heading text-xl text-white shrink-0">
                        {(apt.citizen_name || 'C').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-heading text-lg text-primary-900">{apt.citizen_name}</h3>
                        <p className="text-sm text-surface-600">{apt.type}</p>
                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-surface-500 mt-0.5">
                          <Clock size={11} className="text-accent-300" /> {apt.time} — {apt.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col sm:items-end gap-2 shrink-0">
                      {apt.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(apt._id)} disabled={actionLoading === apt._id}
                            className="px-4 py-2 bg-primary-800 text-white text-xs font-sans uppercase tracking-widest font-bold rounded hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50">
                            Accept
                          </button>
                          <button onClick={() => handleDecline(apt._id)} disabled={actionLoading === apt._id}
                            className="px-4 py-2 bg-white text-surface-700 border border-surface-300 text-xs font-sans uppercase tracking-widest font-bold rounded hover:bg-surface-50 transition-colors cursor-pointer disabled:opacity-50">
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-accent-50 text-accent-500">
                          <CheckCircle2 size={13} /> {apt.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-surface-200 flex items-center justify-between gap-3 flex-wrap">
              <Link to="/provider/docket" className="text-xs font-bold uppercase tracking-widest text-primary-700 hover:underline">
                View Full Docket →
              </Link>
              <span className="text-[11px] text-surface-400">Petitions, open cases & consultations</span>
            </div>
          </div>
        </motion.section>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Accrued Value */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-[20px] rounded-xl p-8 border border-white/60 shadow-diffused flex flex-col"
          >
            <h2 className="font-heading text-xl text-primary-900 mb-1 flex items-center gap-2">
              <TrendingUp className="text-accent-300" /> Accrued Earnings
            </h2>
            <p className="font-sans text-xs text-surface-500 mb-6">Funds tied to active legal matters &amp; cleared payouts</p>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-600">Cleared</span>
                <span className="font-heading text-lg text-primary-900">{formatRupees(data.accruedValue.cleared, { emptyDash: false })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-600 flex items-center gap-1.5">
                  Held in Escrow
                </span>
                <span className="font-heading text-lg text-amber-700">{formatRupees(data.accruedValue.escrow, { emptyDash: false })}</span>
              </div>
              <div className="border-t border-surface-200 pt-4 flex justify-between items-center">
                <span className="text-sm font-bold text-surface-700">Total</span>
                <span className="font-heading text-2xl text-primary-900">{formatRupees(data.accruedValue.monthlyTotal, { emptyDash: false })}</span>
              </div>
              <p className="text-[11px] text-surface-500 leading-snug pt-1 border-t border-surface-100">
                Escrow funds release to your cleared balance after the admin reviews each resolved case.
              </p>
            </div>

            <button
              onClick={() => navigate('/provider/ledger')}
              className="mt-6 px-6 py-2.5 border border-primary-800 text-primary-800 font-sans text-xs uppercase tracking-widest font-bold rounded hover:bg-primary-800 hover:text-white transition-colors w-full cursor-pointer"
            >
              View Financial Ledger
            </button>
          </motion.section>

          {/* Recent Reviews */}
          {data.recentReviews.length > 0 && (
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-[20px] rounded-xl p-6 border border-white/60 shadow-diffused"
            >
              <h2 className="font-heading text-lg text-primary-900 mb-4 flex items-center gap-2">
                <Star size={18} className="text-amber-400 fill-amber-400" /> Recent Reviews
              </h2>
              <div className="space-y-4">
                {data.recentReviews.map((review, i) => (
                  <div key={i} className="border-b border-surface-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="text-sm font-bold text-surface-800">{review.author}</p>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={11} className={n <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300'} />
                        ))}
                      </div>
                    </div>
                    {review.text && (
                      <p className="text-xs text-surface-600 line-clamp-2 italic">"{review.text}"</p>
                    )}
                    <p className="text-[10px] text-surface-400 mt-1">{review.date}</p>
                  </div>
                ))}
              </div>
              <Link to="/provider/eminence" className="text-xs font-bold uppercase tracking-widest text-primary-700 hover:underline mt-3 block">
                View All Reviews →
              </Link>
            </motion.section>
          )}
        </div>

        {/* ── Path to Eminence ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-12 bg-white/80 backdrop-blur-[20px] rounded-xl p-8 border border-white/60 shadow-diffused overflow-x-auto"
        >
          <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
            <div>
              <h2 className="font-heading text-2xl text-primary-900">Path to Eminence</h2>
              <p className="text-sm text-surface-500 mt-1">{casesClosed} of {maxCases} cases closed</p>
            </div>
            <Link to="/provider/eminence" className="text-xs font-bold uppercase tracking-widest text-primary-700 border border-primary-700 px-4 py-2 rounded hover:bg-primary-700 hover:text-white transition-colors">
              Full Eminence Page
            </Link>
          </div>

          <div className="relative w-full min-w-[560px]">
            {/* Track */}
            <div className="h-2 bg-surface-100 rounded-full relative">
              <div
                className="h-2 bg-gradient-to-r from-primary-700 to-accent-300 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Milestones */}
            <div className="flex justify-between mt-4">
              {TIER_MILESTONES.map((m, i) => {
                const reached = casesClosed >= m.cases;
                return (
                  <div key={i} className="flex flex-col items-center gap-2" style={{ width: `${100 / (TIER_MILESTONES.length - 1)}%`, maxWidth: '20%' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors ${
                      reached
                        ? 'bg-primary-800 border-accent-300 text-white shadow-md'
                        : 'bg-white border-surface-300 text-surface-400'
                    }`}>
                      {reached ? <CheckCircle2 size={16} /> : m.cases}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${reached ? 'text-primary-900' : 'text-surface-400'}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

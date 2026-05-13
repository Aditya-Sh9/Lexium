import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Users, UserCheck, Clock, Calendar, FileText, TrendingUp, ChevronRight, Trophy, Star, Award, MapPin, Briefcase, UserX, Lock } from 'lucide-react';
import { themeToast, themeAlert } from '../../utils/alert';
import { formatRupees } from '../../utils/formatters';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [escrow, setEscrow] = useState({ totalHeld: 0, releasable: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const token = localStorage.getItem('admin_token');

  const fetchDashboard = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/admin/dashboard`,    { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/admin/escrow`,       { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ])
      .then(([d, e]) => {
        setData(d);
        if (e?.summary) setEscrow(e.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  const approveProvider = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/admin/providers/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (res.ok) {
        themeToast.success('Provider approved');
        fetchDashboard(); // Refresh all stats + lists
      } else {
        themeToast.error(result.error || 'Failed to approve');
      }
    } catch (e) {
      console.error(e);
      themeToast.error('Network error. Please try again.');
    }
    setActionLoading(null);
  };

  const rejectProvider = async (id) => {
    const confirm = await themeAlert.fire({
      title: 'Reject Provider?',
      text: 'Are you sure you want to reject this provider?',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject',
    });
    if (!confirm.isConfirmed) return;

    setActionLoading(id);
    try {
      const res = await fetch(`${API}/admin/providers/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Application does not meet requirements' }),
      });
      if (res.ok) {
        themeToast.success('Provider rejected');
        fetchDashboard();
      }
    } catch (e) { console.error(e); themeToast.error('Failed to reject provider'); }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-surface-200 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-64 bg-white rounded-xl border border-surface-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentUsers = data?.recent_users || [];
  const recentPending = data?.recent_pending || [];
  const leaderboard = data?.leaderboard || [];

  const cards = [
    { label: 'Total Users', value: stats.total_users || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Approvals', value: stats.pending_providers || 0, icon: Clock, color: 'text-amber-600 bg-amber-50', link: '/admin/providers?tab=pending' },
    { label: 'Approved Providers', value: stats.approved_providers || 0, icon: UserCheck, color: 'text-green-600 bg-green-50' },
    { label: 'Total Appointments', value: stats.total_appointments || 0, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12">
      <div className="mb-8">
        <h1 className="lx-h1">Admin Dashboard</h1>
        <p className="body mt-1">Platform overview and management</p>
      </div>

      {/* Minimal KPI row — Variation A */}
      <div className="lx-kpi-row mb-8">
        {cards.map(({ label, value, link }) => {
          const inner = (
            <>
              <div className="lx-kpi-label">{label}</div>
              <div className="lx-kpi-value">{value}</div>
              <div className="lx-kpi-meta">{link ? 'View details' : 'Platform total'}</div>
            </>
          );
          return link ? (
            <Link key={label} to={link} className="lx-kpi lx-kpi-clickable">{inner}</Link>
          ) : (
            <div key={label} className="lx-kpi">{inner}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Providers with APPROVE/REJECT buttons */}
        <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-lg text-surface-900">Pending Provider Applications</h2>
            <Link to="/admin/providers" className="text-xs text-primary-700 font-sans font-bold uppercase tracking-widest hover:underline">View All</Link>
          </div>
          {recentPending.length === 0 ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-green-500 mb-3">
                <UserCheck size={24} />
              </div>
              <p className="text-surface-600 font-heading text-lg">All clear!</p>
              <p className="text-sm text-surface-500 font-sans mt-1">No pending applications to review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPending.map((p) => (
                <div key={p._id || p.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 border border-surface-100 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center font-heading font-bold text-sm shrink-0">
                      {p.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium text-surface-800 truncate">{p.name}</p>
                      <p className="font-sans text-xs text-surface-500 flex items-center gap-2">
                        <span className="flex items-center gap-0.5"><Briefcase size={10} /> {p.service_type}</span>
                        <span className="flex items-center gap-0.5"><MapPin size={10} /> {p.location}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => approveProvider(p._id || p.id)}
                      disabled={actionLoading === (p._id || p.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-sans font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      {actionLoading === (p._id || p.id) ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserCheck size={12} /> Approve</>}
                    </button>
                    <button
                      onClick={() => rejectProvider(p._id || p.id)}
                      disabled={actionLoading === (p._id || p.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-sans font-bold rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      <UserX size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-lg text-surface-900">Recent Registrations</h2>
            <Link to="/admin/users" className="text-xs text-primary-700 font-sans font-bold uppercase tracking-widest hover:underline">View All</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-surface-500 font-sans py-6 text-center">No recent registrations</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.slice(0, 6).map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 border border-surface-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-medium text-surface-800">{u.name}</p>
                      <p className="font-sans text-xs text-surface-500">{u.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    u.role === 'provider' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                    u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-surface-100 text-surface-600 border-surface-200'
                  }`}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Provider Leaderboard ─── */}
      <div className="mt-6 bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="font-heading text-lg text-surface-900">Provider Leaderboard</h2>
              <p className="font-sans text-xs text-surface-500">Top-rated providers on the platform</p>
            </div>
          </div>
        </div>
        
        {leaderboard.length === 0 ? (
          <p className="text-sm text-surface-500 font-sans py-6 text-center">No leaderboard data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500 w-12">Rank</th>
                  <th className="text-left px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Provider</th>
                  <th className="text-left px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Specialization</th>
                  <th className="text-center px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Rating</th>
                  <th className="text-center px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Reviews</th>
                  <th className="text-center px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Cases</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((p, i) => (
                  <tr key={p._id || p.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-sm' :
                        i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-sm' :
                        i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-sm' :
                        'bg-surface-100 text-surface-600'
                      }`}>
                        {i < 3 ? <Trophy size={14} /> : i + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-sm shrink-0">
                          {p.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-sans text-sm font-medium text-surface-800">{p.name}</p>
                          <p className="font-sans text-xs text-surface-500 flex items-center gap-1"><MapPin size={10} /> {p.location || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-surface-600">{p.specialization}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-surface-800">
                        <Star size={14} className="text-amber-400 fill-amber-400" /> {p.rating?.toFixed(1) || '0.0'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-sans text-sm text-surface-600">{p.review_count || 0}</td>
                    <td className="px-4 py-3 text-center font-sans text-sm text-surface-600">{p.cases_closed || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Citizens', value: stats.total_citizens || 0, icon: Users },
          { label: 'Petitions', value: stats.total_petitions || 0, icon: FileText },
          { label: 'Rejected', value: stats.rejected_providers || 0, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm text-center">
            <Icon size={18} className="mx-auto text-surface-400 mb-2" />
            <p className="font-heading text-xl text-surface-900 font-bold">{value}</p>
            <p className="font-sans text-[10px] text-surface-500 uppercase tracking-widest font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Escrow snapshot — quick funnel from dashboard to escrow management */}
      <Link
        to="/admin/escrow"
        className={`mt-6 block rounded-xl border p-5 shadow-sm hover:shadow-md transition-all group ${escrow.releasable > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-surface-200'}`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${escrow.releasable > 0 ? 'bg-amber-100 text-amber-700' : 'bg-surface-100 text-surface-500'}`}>
              <Lock size={22} />
            </div>
            <div>
              <p className="font-heading text-lg text-surface-900">Escrow Management</p>
              <p className="font-sans text-sm text-surface-600">
                <strong>{formatRupees(escrow.totalHeld, { emptyDash: false })}</strong> held across {escrow.count} transaction{escrow.count !== 1 ? 's' : ''}
                {escrow.releasable > 0 && <> · <span className="text-amber-700 font-semibold">{escrow.releasable} ready to release</span></>}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary-700 flex items-center gap-1 group-hover:underline">
            Review escrow <ChevronRight size={14} />
          </span>
        </div>
      </Link>
    </div>
  );
}

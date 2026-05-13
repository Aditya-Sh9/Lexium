import { useState, useEffect } from 'react';
import {
  Users, User, Briefcase, Shield, Search, Trash2,
  X, Star, Award, Trophy, TrendingUp, IndianRupee,
  CheckCircle2, ShieldCheck, Gift, Lock
} from 'lucide-react';
import { formatRupees } from '../../utils/formatters';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ── Helper: normalize MongoDB $oid to string ─────────────────────
function resolveId(u) { return u?._id || u?.id || ''; }

// ── Provider Profile Modal ───────────────────────────────────────
function ProviderProfileModal({ userId, onClose }) {
  const token = localStorage.getItem('admin_token');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [awardAmount, setAwardAmount] = useState('');
  const [awardReason, setAwardReason] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [awardMsg, setAwardMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/admin/providers/${userId}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAward = async () => {
    if (!awardAmount || !awardReason) return;
    setAwarding(true);
    setAwardMsg('');
    try {
      const res = await fetch(`${API}/admin/providers/${userId}/award`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(awardAmount), reason: awardReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setAwardMsg(data.message || 'Award granted successfully.');
        setAwardAmount('');
        setAwardReason('');
        // Refresh stats to show updated earnings
        fetch(`${API}/admin/providers/${userId}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).then(setStats);
      } else {
        setAwardMsg(data.error || 'Failed to award.');
      }
    } catch {
      setAwardMsg('Network error. Please try again.');
    } finally {
      setAwarding(false);
    }
  };

  const p = stats?.provider;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-full transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="p-16 flex justify-center">
            <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : !stats || !p ? (
          <div className="p-12 text-center text-surface-500">Could not load provider profile.</div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-primary-900 rounded-t-2xl p-8 text-white">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-accent-300 text-primary-900 flex items-center justify-center font-heading font-bold text-3xl shrink-0">
                  {p.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-heading text-2xl">{p.name}</h2>
                    {stats.leaderboardPosition && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        <Trophy size={11} /> #{stats.leaderboardPosition}
                      </span>
                    )}
                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {stats.tier}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mt-1">{p.specialization} · {p.service_type}</p>
                  <p className="text-white/50 text-xs mt-0.5">{p.email} · {p.location}</p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3 mt-6">
                {[
                  { label: 'Rating', value: (p.rating || 0).toFixed(1), icon: <Star size={14} className="fill-amber-400 text-amber-400" /> },
                  { label: 'Reviews', value: p.review_count || 0, icon: <Users size={14} /> },
                  { label: 'Cases Closed', value: stats.casesClosed, icon: <CheckCircle2 size={14} /> },
                  { label: 'Experience', value: `${p.experience || 0}y`, icon: <ShieldCheck size={14} /> },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="flex justify-center mb-1 text-white/60">{s.icon}</div>
                    <p className="font-heading text-xl text-white">{s.value}</p>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Badges & Earnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="bg-surface-50 rounded-xl border border-surface-200 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-4 flex items-center gap-2">
                    <TrendingUp size={14} /> Earnings
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-surface-600">Total Cleared</span>
                      <span className="font-heading text-lg text-primary-900">
                        {formatRupees(stats.totalEarned || 0, { emptyDash: false })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-surface-600 flex items-center gap-1">
                        <Lock size={11} className="text-amber-600" /> Held in Escrow
                      </span>
                      <span className="font-heading text-base text-amber-700">
                        {formatRupees(stats.heldInEscrow || stats.pendingEscrow || 0, { emptyDash: false })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="bg-surface-50 rounded-xl border border-surface-200 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-4 flex items-center gap-2">
                    <Award size={14} /> Badges & Achievements
                  </h3>
                  {stats.badges?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {stats.badges.map(badge => (
                        <div key={badge} className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle2 size={14} className="text-green-500" /> {badge}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-surface-400 italic">No badges earned yet.</p>
                  )}
                  <p className="text-xs text-surface-400 mt-3">{stats.badges?.length || 0} of 3 pinnacle badges earned</p>
                </div>
              </div>

              {/* Bio */}
              {p.bio && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2">Bio</h3>
                  <p className="text-sm text-surface-700 leading-relaxed bg-surface-50 border border-surface-100 rounded-lg p-4">{p.bio}</p>
                </div>
              )}

              {/* Recent Transactions */}
              {stats.recentTransactions?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-3 flex items-center gap-2">
                    <IndianRupee size={14} /> Recent Transactions
                  </h3>
                  <div className="rounded-xl border border-surface-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-surface-100">
                        {stats.recentTransactions.slice(0, 5).map((t, i) => (
                          <tr key={i} className="hover:bg-surface-50">
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-surface-800">{t.client_name}</p>
                              <p className="text-xs text-surface-400">{t.type}</p>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-surface-400 whitespace-nowrap">{t.date}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                t.status === 'cleared' ? 'bg-green-100 text-green-700' :
                                t.status === 'escrow'  ? 'bg-amber-100 text-amber-800' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {t.status === 'escrow' ? 'In Escrow' : t.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-heading text-primary-900 whitespace-nowrap">
                              {formatRupees(t.amount, { emptyDash: false })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Award Section */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-4 flex items-center gap-2">
                  <Gift size={14} /> Award Performance Bonus
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-amber-700 font-bold mb-1 block">Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5000"
                      value={awardAmount}
                      onChange={e => setAwardAmount(e.target.value)}
                      className="w-full border border-amber-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-amber-700 font-bold mb-1 block">Reason / Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Outstanding case resolution"
                      value={awardReason}
                      onChange={e => setAwardReason(e.target.value)}
                      maxLength={100}
                      className="w-full border border-amber-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAward}
                  disabled={awarding || !awardAmount || !awardReason}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-widest py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {awarding
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Gift size={14} /> Grant Award</>}
                </button>
                {awardMsg && (
                  <p className={`text-xs mt-2 font-medium ${awardMsg.includes('success') || awardMsg.includes('awarded') ? 'text-green-700' : 'text-red-600'}`}>
                    {awardMsg}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [profileModal, setProfileModal] = useState(null); // provider _id to show
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    setLoading(true);
    const url = filterRole ? `${API}/admin/users?role=${filterRole}` : `${API}/admin/users`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [filterRole]);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => resolveId(u) !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const roleIcon = (role) => {
    if (role === 'admin') return <Shield size={14} />;
    if (role === 'provider') return <Briefcase size={14} />;
    return <User size={14} />;
  };

  const roleBadge = (role, status) => {
    const base = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border inline-flex items-center gap-1';
    if (role === 'admin') return `${base} bg-purple-50 text-purple-700 border-purple-200`;
    if (role === 'provider') {
      if (status === 'pending') return `${base} bg-amber-50 text-amber-700 border-amber-200`;
      if (status === 'rejected') return `${base} bg-red-50 text-red-700 border-red-200`;
      return `${base} bg-green-50 text-green-700 border-green-200`;
    }
    return `${base} bg-surface-100 text-surface-600 border-surface-200`;
  };

  return (
    <>
      {profileModal && (
        <ProviderProfileModal
          userId={profileModal}
          onClose={() => setProfileModal(null)}
        />
      )}

      <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12">
        <div className="mb-7">
          <h1 className="lx-h1">User Management</h1>
          <p className="body mt-1">All registered users on the platform. Click a provider row to view their full profile.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="lx-input pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: '', label: 'All' },
              { id: 'citizen', label: 'Citizens' },
              { id: 'provider', label: 'Providers' },
              { id: 'admin', label: 'Admins' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterRole(tab.id)}
                className={`lx-tab ${filterRole === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="lx-card" style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="lx-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center">
                      <span className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin inline-block" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-surface-500 font-sans text-sm">No users found</td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const uid = resolveId(u);
                    const isProvider = u.role === 'provider';
                    return (
                      <tr
                        key={uid}
                        className={`border-b border-surface-100 last:border-0 transition-colors ${isProvider ? 'hover:bg-primary-50 cursor-pointer' : 'hover:bg-surface-50'}`}
                        onClick={isProvider ? () => setProfileModal(uid) : undefined}
                        title={isProvider ? 'Click to view provider profile' : undefined}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isProvider ? 'bg-primary-100 text-primary-800' : 'bg-surface-100 text-surface-600'}`}>
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-sans text-sm font-medium text-surface-800 flex items-center gap-1.5">
                                {u.name}
                                {isProvider && <span className="text-[10px] text-primary-500 font-bold uppercase tracking-widest">(View Profile)</span>}
                              </p>
                              <p className="font-sans text-xs text-surface-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={roleBadge(u.role, u.status)}>
                            {roleIcon(u.role)} {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-sans font-medium ${
                            u.status === 'active' || u.status === 'approved' ? 'text-green-600' :
                            u.status === 'pending' ? 'text-amber-600' :
                            u.status === 'rejected' ? 'text-red-600' : 'text-surface-500'
                          }`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-sans text-xs text-surface-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                          {deleteId === uid ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDelete(uid)}
                                disabled={deleting}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                                className="px-3 py-1 bg-surface-200 text-surface-700 text-xs font-bold rounded hover:bg-surface-300 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteId(uid)}
                              title="Delete User"
                              className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer inline-block"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-surface-400 font-sans mt-4">{filtered.length} user(s) found</p>
      </div>
    </>
  );
}

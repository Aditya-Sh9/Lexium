import { useState, useEffect } from 'react';
import { Users, User, Briefcase, Shield, Search, Trash2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => (u._id || u.id) !== id));
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
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-surface-900 mb-1">User Management</h1>
        <p className="font-sans text-surface-500">All registered users on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-700 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1 border border-surface-200 w-fit">
          {[
            { id: '', label: 'All' },
            { id: 'citizen', label: 'Citizens' },
            { id: 'provider', label: 'Providers' },
            { id: 'admin', label: 'Admins' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilterRole(tab.id)}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-medium transition-all cursor-pointer ${
                filterRole === tab.id
                  ? 'bg-white shadow-sm border border-surface-200 text-surface-900'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="text-left px-5 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">User</th>
                <th className="text-left px-5 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Role</th>
                <th className="text-left px-5 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Status</th>
                <th className="text-left px-5 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Joined</th>
                <th className="text-right px-5 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center"><span className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin inline-block" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-surface-500 font-sans text-sm">No users found</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id || u.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-sans text-sm font-medium text-surface-800">{u.name}</p>
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
                        u.status === 'rejected' ? 'text-red-600' :
                        'text-surface-500'
                      }`}>{u.status || 'active'}</span>
                    </td>
                    <td className="px-5 py-3 font-sans text-xs text-surface-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {deleteId === (u._id || u.id) ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDelete(u._id || u.id)} disabled={deleting}
                            className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 disabled:opacity-50 transition-colors">
                            Confirm
                          </button>
                          <button onClick={() => setDeleteId(null)} disabled={deleting}
                            className="px-3 py-1 bg-surface-200 text-surface-700 text-xs font-bold rounded hover:bg-surface-300 disabled:opacity-50 transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(u._id || u.id)} title="Delete User"
                          className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer inline-block">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-surface-400 font-sans mt-4">{filtered.length} user(s) found</p>
    </div>
  );
}

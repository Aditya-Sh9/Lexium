import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { UserCheck, UserX, Clock, MapPin, Briefcase, Calendar, ChevronDown, Trash2 } from 'lucide-react';
import { themeToast } from '../../utils/alert';
import { formatPriceRange, formatRupees } from '../../utils/formatters';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600' },
  { id: 'approved', label: 'Approved', icon: UserCheck, color: 'text-green-600' },
  { id: 'rejected', label: 'Rejected', icon: UserX, color: 'text-red-600' },
];

export default function AdminProviders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'pending');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem('admin_token');

  const fetchProviders = async (status) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/providers?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      console.error(e);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders(activeTab);
  }, [activeTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setExpandedId(null);
  };

  const approveProvider = async (id) => {
    setActionLoading(id);
    try {
      await fetch(`${API}/admin/providers/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      themeToast.success('Provider approved');
      fetchProviders(activeTab);
    } catch (e) { console.error(e); themeToast.error('Failed to approve'); }
    setActionLoading(null);
  };

  const rejectProvider = async (id) => {
    setActionLoading(id);
    try {
      await fetch(`${API}/admin/providers/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || 'Application does not meet requirements' }),
      });
      themeToast.success('Provider rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchProviders(activeTab);
    } catch (e) { console.error(e); themeToast.error('Failed to reject'); }
    setActionLoading(null);
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/admin/providers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        themeToast.success('Provider removed successfully');
        setProviders(providers.filter(p => (p._id || p.id) !== id));
      } else {
        themeToast.error('Failed to remove provider');
      }
    } catch (e) {
      console.error(e);
      themeToast.error('Failed to remove provider');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 pb-12">
      <div className="mb-7">
        <h1 className="lx-h1">Provider Management</h1>
        <p className="body mt-1">Review, approve, or reject provider applications.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`lx-tab ${activeTab === id ? 'active' : ''}`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Provider List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 lx-card animate-pulse" />)}
        </div>
      ) : providers.length === 0 ? (
        <div className="lx-card p-12 text-center">
          <p className="strong" style={{ fontSize: 14 }}>No {activeTab} providers</p>
          <p className="body-sm muted mt-1">Nothing to review here right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p._id || p.id} className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-heading font-bold text-lg shrink-0">
                      {p.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg text-surface-900 mb-1">{p.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-surface-500 font-sans">
                        <span className="flex items-center gap-1"><Briefcase size={14} /> {p.service_type}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {p.location || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> {p.experience || 0} yrs</span>
                      </div>
                      <p className="text-xs text-surface-400 mt-1 font-sans">{p.email}</p>
                      {p.bar_council_id && <p className="text-xs text-surface-400 font-mono mt-0.5">Bar ID: {p.bar_council_id}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === (p._id || p.id) ? null : (p._id || p.id))}
                      className="p-2 text-surface-400 hover:text-primary-700 cursor-pointer transition-colors" title="View details">
                      <ChevronDown size={18} className={`transition-transform ${expandedId === (p._id || p.id) ? 'rotate-180' : ''}`} />
                    </button>

                    {activeTab === 'pending' && (
                      <>
                        <button onClick={() => approveProvider(p._id || p.id)} disabled={actionLoading === (p._id || p.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-sans font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer">
                          {actionLoading === (p._id || p.id) ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserCheck size={16} /> Approve</>}
                        </button>
                        <button onClick={() => setRejectModal(p._id || p.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 text-sm font-sans font-medium rounded-lg hover:bg-red-100 border border-red-200 transition-colors cursor-pointer">
                          <UserX size={16} /> Reject
                        </button>
                      </>
                    )}

                    {activeTab === 'rejected' && (
                      <button onClick={() => approveProvider(p._id || p.id)} disabled={actionLoading === (p._id || p.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-sans font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer">
                        <UserCheck size={16} /> Re-Approve
                      </button>
                    )}

                    {deleteId === (p._id || p.id) ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDelete(p._id || p.id)} disabled={deleting}
                          className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 disabled:opacity-50 transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => setDeleteId(null)} disabled={deleting}
                          className="px-3 py-1 bg-surface-200 text-surface-700 text-xs font-bold rounded hover:bg-surface-300 disabled:opacity-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteId(p._id || p.id)} title="Remove Provider"
                        className="p-2 text-surface-400 hover:text-red-600 cursor-pointer transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Rejection reason */}
                {p.rejection_reason && activeTab === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 font-sans">
                    <strong>Rejection Reason:</strong> {p.rejection_reason}
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {expandedId === (p._id || p.id) && (
                <div className="border-t border-surface-100 p-5 bg-surface-50 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
                    {p.specialization && <div><span className="text-surface-500 font-bold text-xs uppercase tracking-widest">Specialization:</span> <span className="text-surface-700 block">{p.specialization}</span></div>}
                    {p.languages?.length > 0 && <div><span className="text-surface-500 font-bold text-xs uppercase tracking-widest">Languages:</span> <span className="text-surface-700 block">{p.languages.join(', ')}</span></div>}
                    {p.price_range && <div><span className="label">Price Range:</span> <span className="text-surface-700 block tabular">{formatPriceRange(p.price_range)}</span></div>}
                    {p.consultation_fee && <div><span className="label">Consultation Fee:</span> <span className="text-surface-700 block tabular">{formatRupees(p.consultation_fee, { emptyDash: false })}</span></div>}
                  </div>
                  {p.bio && (
                    <div className="mt-3">
                      <span className="text-surface-500 font-bold text-xs uppercase tracking-widest font-sans">Bio:</span>
                      <p className="text-sm text-surface-700 leading-relaxed mt-1 font-sans">{p.bio}</p>
                    </div>
                  )}
                  {p.verification_documents?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-surface-500 font-bold text-xs uppercase tracking-widest font-sans">Documents:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {p.verification_documents.map((d, i) => (
                          <span key={i} className="px-3 py-1 bg-white rounded-lg border border-surface-200 text-xs text-surface-600">{d.original_name || d.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-xl text-surface-900 mb-2">Reject Application</h3>
            <p className="text-sm text-surface-500 font-sans mb-4">Provide a reason for the rejection. This will be visible to the applicant.</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient documentation, Invalid credentials..."
              className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all font-sans text-sm resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm font-sans text-surface-600 hover:text-surface-800 cursor-pointer">Cancel</button>
              <button onClick={() => rejectProvider(rejectModal)} disabled={actionLoading === rejectModal}
                className="px-5 py-2 bg-red-600 text-white text-sm font-sans font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

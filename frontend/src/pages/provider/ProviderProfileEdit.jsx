import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, MapPin, Briefcase, Camera, Save, X } from 'lucide-react';
import api from '../../services/api';

export default function ProviderProfileEdit() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service_type: '',
    bar_council_id: '',
    location: '',
    experience: '',
    bio: '',
    specialization: '',
    price_range: '',
    consultation_fee: '',
    availableDays: '',
    availableHours: '',
    services: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await api.get('/provider/profile');
        setFormData({
          name: data.name || '',
          email: user?.email || '',
          service_type: data.service_type || '',
          bar_council_id: data.bar_council_id || '',
          location: data.location || '',
          experience: data.experience || '',
          bio: data.bio || '',
          specialization: data.specialization || '',
          price_range: data.price_range || '',
          consultation_fee: data.consultation_fee || '',
          availableDays: data.availability?.split(' | ')[0] || '',
          availableHours: data.availability?.split(' | ')[1] || '',
          services: data.services || []
        });
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/provider/profile', {
        ...formData,
        availability: `${formData.availableDays} | ${formData.availableHours}`
      });
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const addService = () => setFormData({ ...formData, services: [...formData.services, { name: '', price: '', duration: '' }] });
  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };
  const removeService = (index) => setFormData({ ...formData, services: formData.services.filter((_, i) => i !== index) });

  const inputClass = "w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-sans";
  const standardInputClass = "w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-sans text-sm";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 font-sans bg-transparent min-h-screen">
      <header className="mb-12 border-b border-surface-200 pb-6">
        <h1 className="font-heading text-4xl text-primary-900">Profile Settings</h1>
        <p className="font-sans text-lg text-surface-500 mt-2">Manage your public information on the Sovereign Registry.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-surface-200 p-8">
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center justify-between ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
            <button type="button" onClick={() => setMessage('')} className="cursor-pointer"><X size={16} /></button>
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-800 text-white flex items-center justify-center font-heading text-3xl">
              {formData.name.charAt(0)}
            </div>
            <button type="button" className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-surface-200 rounded-full flex items-center justify-center text-primary-900 hover:bg-surface-50 shadow-sm cursor-pointer">
              <Camera size={14} />
            </button>
          </div>
          <div>
            <h3 className="font-heading text-xl text-primary-900">Profile Portrait</h3>
            <p className="text-sm text-surface-500 mt-1">PNG, JPG up to 5MB. Must be professional attire.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Given Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input name="name" value={formData.name} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Email (Private)</label>
            <input type="email" name="email" value={formData.email} disabled className={`${inputClass} bg-surface-100 text-surface-500 cursor-not-allowed`} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Practitioner Class</label>
            <div className="relative">
              <Briefcase size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <select name="service_type" value={formData.service_type} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                <option value="advocate">Advocate</option>
                <option value="mediator">Mediator</option>
                <option value="arbitrator">Arbitrator</option>
                <option value="notary">Notary Public</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Sovereign Registry ID</label>
            <input name="bar_council_id" value={formData.bar_council_id} disabled className={`${inputClass} bg-surface-100 text-surface-500 cursor-not-allowed font-mono`} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Chamber Location (City)</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input name="location" value={formData.location} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Years of Practice</label>
            <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-sans" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Specialization Label</label>
            <input name="specialization" value={formData.specialization} onChange={handleChange} placeholder="E.g., Corporate Governance" className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-sans" />
          </div>
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Consultation Fee</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-sans text-sm">₹</span>
              <input type="number" name="consultation_fee" value={formData.consultation_fee} onChange={handleChange} placeholder="2000" className={`${standardInputClass} pl-8`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Price Range</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-sans text-sm">₹</span>
              <input name="price_range" value={formData.price_range} onChange={handleChange} placeholder="2,000 - 5,000" className={`${standardInputClass} pl-8`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Available Days</label>
            <input name="availableDays" value={formData.availableDays} onChange={handleChange} placeholder="E.g., Monday - Friday" className={standardInputClass} />
          </div>
          <div>
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Operating Hours</label>
            <input name="availableHours" value={formData.availableHours} onChange={handleChange} placeholder="E.g., 10:00 AM - 06:00 PM" className={standardInputClass} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600">Offered Services</label>
            <button type="button" onClick={addService} className="text-xs font-sans font-bold text-primary-800 hover:underline cursor-pointer">+ Add Service</button>
          </div>
          {formData.services.map((svc, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-3 mb-3 p-4 border border-surface-200 rounded-xl bg-white">
              <input value={svc.name} onChange={e => updateService(i, 'name', e.target.value)} placeholder="Service Name (e.g. Legal Consultation)" className={`${standardInputClass} flex-1`} />
              <div className="relative w-full md:w-32 shrink-0">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-sans text-sm">₹</span>
                <input type="number" value={svc.price} onChange={e => updateService(i, 'price', e.target.value)} placeholder="Price" className={`${standardInputClass} pl-8`} />
              </div>
              <input value={svc.duration} onChange={e => updateService(i, 'duration', e.target.value)} placeholder="Duration (e.g. 60 min)" className={`${standardInputClass} w-full md:w-32 shrink-0`} />
              <button type="button" onClick={() => removeService(i)} className="text-red-500 hover:text-red-700 px-3 cursor-pointer"><X size={18} /></button>
            </div>
          ))}
          {formData.services.length === 0 && <p className="text-sm font-sans text-surface-500 italic">No services added yet.</p>}
        </div>

        <div className="mb-8">
          <label className="block text-xs font-sans uppercase tracking-widest font-bold text-surface-600 mb-1.5">Professional Biography</label>
          <textarea 
            name="bio" 
            value={formData.bio} 
            onChange={handleChange} 
            rows="4" 
            className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-sans resize-none"
            placeholder="Describe your expertise and practice areas..."
          ></textarea>
        </div>

        <div className="flex justify-end pt-6 border-t border-surface-200">
          <button type="submit" disabled={saving} className="bg-primary-800 text-white font-sans text-xs uppercase tracking-widest font-bold px-8 py-3 rounded hover:bg-primary-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}

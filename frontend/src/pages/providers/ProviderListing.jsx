import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { X, Search } from 'lucide-react';
import ProviderCard from '../../components/ui/ProviderCard';
import { getProviders, getAvailableLocations } from '../../services/providerService';
import { categories } from '../../data/categories';

export default function ProviderListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    minRating: '',
    sortBy: 'rating',
  });

  // Load locations from API
  useEffect(() => {
    getAvailableLocations().then(setLocations).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    getProviders(filters).then((data) => {
      setProviders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filters]);

  // Sync URL params when category/search change from external navigation
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const loc = searchParams.get('location') || '';
    if (cat !== filters.category || search !== filters.search || loc !== filters.location) {
      setFilters((f) => ({ ...f, category: cat, search, location: loc }));
    }
  }, [searchParams]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    const params = new URLSearchParams();
    if (next.category) params.set('category', next.category);
    if (next.search) params.set('search', next.search);
    if (next.location) params.set('location', next.location);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ category: '', search: '', location: '', minRating: '', sortBy: 'rating' });
    setSearchParams({});
  };

  const activeFilterCount = [filters.category, filters.location, filters.minRating].filter(Boolean).length;

  return (
    <main className="max-w-[1920px] mx-auto px-6 py-24 flex flex-col lg:flex-row gap-8 bg-transparent min-h-screen">
      {/* Filters Sidebar */}
      <aside className="w-full lg:w-72 shrink-0">
        <div className="glass-panel rounded-xl p-6 sticky top-28 shadow-diffused">
          <div className="flex justify-between items-center mb-6 border-b border-surface-200 pb-2">
            <h2 className="font-heading text-2xl text-surface-900">Filter Providers</h2>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-primary-800 font-bold uppercase tracking-widest cursor-pointer hover:underline">Clear</button>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Search Keywords</label>
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input 
                  type="text" 
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="minimal-input w-full pl-8 py-2 font-sans text-sm text-surface-900" 
                  placeholder="Name or expertise..." 
                />
              </div>
            </div>

            <div>
              <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Practice Area</label>
              <select 
                value={filters.category} 
                onChange={(e) => updateFilter('category', e.target.value)} 
                className="minimal-input w-full py-2 font-sans text-sm text-surface-900 appearance-none cursor-pointer"
              >
                <option value="">All Areas</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Jurisdiction (City)</label>
              <select 
                value={filters.location} 
                onChange={(e) => updateFilter('location', e.target.value)} 
                className="minimal-input w-full py-2 font-sans text-sm text-surface-900 appearance-none cursor-pointer"
              >
                <option value="">All Locations</option>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Minimum Rating</label>
              <select 
                value={filters.minRating} 
                onChange={(e) => updateFilter('minRating', e.target.value ? Number(e.target.value) : '')} 
                className="minimal-input w-full py-2 font-sans text-sm text-surface-900 appearance-none cursor-pointer"
              >
                <option value="">Any</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>

            <div>
              <label className="block font-sans text-xs uppercase tracking-widest font-bold text-surface-500 mb-2">Sort By</label>
              <select 
                value={filters.sortBy} 
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} 
                className="minimal-input w-full py-2 font-sans text-sm text-surface-900 appearance-none cursor-pointer"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* Marketplace Canvas */}
      <section className="flex-1">
        <header className="mb-8">
          <h1 className="font-heading text-4xl text-surface-900 mb-4">Certified Legal Practitioners</h1>
          <p className="font-sans text-lg text-surface-500 max-w-2xl">
            Access verified counsel within the Sovereign Digital Framework. Review expertise, credentials, and reputation scores before proceeding with formal engagement.
          </p>
        </header>

        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.category && (
              <span className="flex items-center gap-1 px-3 py-1 bg-surface-200 text-surface-800 text-sm font-sans rounded-full">
                {categories.find((c) => c.id === filters.category)?.name}
                <button onClick={() => updateFilter('category', '')} className="hover:text-primary-900 cursor-pointer"><X size={14} /></button>
              </span>
            )}
            {filters.location && (
              <span className="flex items-center gap-1 px-3 py-1 bg-surface-200 text-surface-800 text-sm font-sans rounded-full">
                {filters.location}
                <button onClick={() => updateFilter('location', '')} className="hover:text-primary-900 cursor-pointer"><X size={14} /></button>
              </span>
            )}
          </div>
        )}

        <p className="font-sans text-sm uppercase tracking-widest text-surface-500 mb-6 font-bold">
          {providers.length} practitioner{providers.length !== 1 ? 's' : ''} established
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-surface-200 p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-surface-200" />
                  <div className="flex-1 space-y-2 mt-2">
                    <div className="h-4 bg-surface-200 rounded w-3/4" />
                    <div className="h-3 bg-surface-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-surface-200 rounded" />
                  <div className="h-3 bg-surface-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-xl border border-white">
            <p className="text-surface-500 font-heading text-2xl mb-2">No practitioners matched the criteria</p>
            <p className="text-surface-400 font-sans text-sm">Please broaden your search parameters</p>
            <button onClick={clearFilters} className="mt-6 px-6 py-2 border border-primary-800 text-primary-800 font-sans text-xs uppercase tracking-widest font-bold rounded hover:bg-primary-800 hover:text-white transition-colors cursor-pointer">
              Reset Protocol
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {providers.map((p) => <ProviderCard key={p._id || p.id} provider={p} />)}
          </div>
        )}
      </section>
    </main>
  );
}

import { Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

/**
 * SearchBar — hero/global search for finding legal providers
 *
 * @param {string} className — additional classes
 * @param {'hero'|'compact'} variant — hero for landing page, compact for nav/listing
 */
export default function SearchBar({ className = '', variant = 'hero' }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (location) params.set('location', location);
    navigate(`/providers?${params.toString()}`);
  };

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSearch} className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search legal services..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-100 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Search
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-surface-200 p-2 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for advocates, mediators, notaries..."
            className="w-full pl-12 pr-4 py-3.5 text-base bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-surface-400"
          />
        </div>

        {/* Location input */}
        <div className="relative sm:w-48">
          <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City"
            className="w-full pl-11 pr-4 py-3.5 text-base bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-surface-400"
          />
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="px-8 py-3.5 text-base font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          Find Providers
        </button>
      </div>
    </form>
  );
}

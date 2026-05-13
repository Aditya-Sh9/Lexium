import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { MapPin, Clock, ArrowLeft, Briefcase, GraduationCap, Star as StarIcon, FileText } from 'lucide-react';
import RatingStars from '../../components/ui/RatingStars';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { getInitials, formatDate } from '../../utils/helpers';
import { formatRupees, formatPriceRange, formatDuration } from '../../utils/formatters';

export default function ProviderProfile() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    setLoading(true);
    api.get(`/providers/${id}`)
      .then(setProvider)
      .catch(() => setProvider(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-surface-200 rounded w-1/4" />
          <div className="flex gap-6">
            <div className="w-24 h-24 rounded-full bg-surface-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-surface-200 rounded w-1/2" />
              <div className="h-4 bg-surface-200 rounded w-1/3" />
              <div className="h-4 bg-surface-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-surface-500 text-lg mb-4">Provider not found</p>
        <Link to="/providers" className="text-primary-600 font-medium hover:text-primary-700">← Back to listings</Link>
      </div>
    );
  }

  const { name, initials, service_type, serviceType, specialization, rating, review_count, reviewCount, price_range, priceRange, location, experience, bio, badges, languages, qualifications, services, reviews } = provider;
  const displayServiceType = service_type || serviceType;
  const displayReviewCount = review_count || reviewCount || 0;
  const displayPriceRange = price_range || priceRange || '';

  const tabs = [
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'qualifications', label: 'Qualifications', icon: GraduationCap },
    { id: 'reviews', label: `Reviews (${displayReviewCount})`, icon: StarIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/providers" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to providers
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary-600 to-accent-300" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-24 h-24 rounded-full bg-primary-700 text-white flex items-center justify-center font-heading font-bold text-2xl shrink-0 mx-auto sm:mx-0">
              {initials || getInitials(name)}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl font-heading font-bold text-surface-900">{name}</h1>
                {badges?.map((b) => <Badge key={b} variant={b} />)}
              </div>
              <p className="text-surface-600 font-medium mb-1">{specialization}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-surface-500 mb-3">
                <span className="flex items-center gap-1"><MapPin size={14} /> {location}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {experience} yrs experience</span>
                <span className="text-primary-600 font-medium">{displayServiceType}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <RatingStars rating={rating} size={18} showValue />
                <span className="text-sm text-surface-400">({displayReviewCount} reviews)</span>
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 text-center sm:text-right">
              <p className="text-sm text-surface-500 mb-1">Starting from</p>
              <p className="text-xl font-bold text-surface-900 mb-3">{formatPriceRange(displayPriceRange, { emptyDash: true })}</p>
              <Link to={`/book/${provider._id || id}`} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 active:scale-[0.98] transition-all cursor-pointer">
                <FileText size={18} /> File a Case
              </Link>
            </div>
          </div>

          <p className="mt-6 text-surface-600 leading-relaxed border-t border-surface-100 pt-6">{bio}</p>

          {languages && (
            <div className="mt-4 flex flex-wrap gap-2">
              {languages.map((l) => (
                <span key={l} className="px-3 py-1 text-xs font-medium bg-surface-100 text-surface-600 rounded-full">{l}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-surface-200 flex gap-0 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-6 animate-fade-in">
        {activeTab === 'services' && (
          <div className="space-y-3">
            {services?.map((s, i) => {
              const params = new URLSearchParams({ service: s.name || '' });
              if (s.price) params.set('price', String(s.price));
              const bookHref = `/book/${provider._id || id}?${params.toString()}`;
              return (
                <div key={i} className="bg-white rounded-xl border border-surface-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-surface-900">{s.name}</h4>
                    {s.duration && (
                      <p className="text-sm text-surface-500 flex items-center gap-1.5 mt-0.5">
                        <Clock size={13} /> {formatDuration(s.duration)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-surface-900">{formatRupees(s.price)}</p>
                    <Link to={bookHref} className="text-sm text-primary-600 font-medium hover:text-primary-700 mt-1 cursor-pointer">File a Case →</Link>
                  </div>
                </div>
              );
            })}
            {(!services || services.length === 0) && (
              <p className="text-surface-500 p-4 text-center">No services listed yet.</p>
            )}
          </div>
        )}

        {activeTab === 'qualifications' && (
          <div className="bg-white rounded-xl border border-surface-200 p-6">
            <ul className="space-y-3">
              {qualifications?.map((q, i) => (
                <li key={i} className="flex items-start gap-3 text-surface-700">
                  <GraduationCap size={18} className="text-primary-600 mt-0.5 shrink-0" />
                  {q}
                </li>
              ))}
              {(!qualifications || qualifications.length === 0) && (
                <li className="text-surface-500">No qualifications listed.</li>
              )}
            </ul>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews?.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-surface-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-surface-800">{r.author}</span>
                    <RatingStars rating={r.rating} size={14} />
                  </div>
                  <span className="text-xs text-surface-400">{formatDate(r.date)}</span>
                </div>
                <p className="text-surface-600 text-sm leading-relaxed">{r.text}</p>
              </div>
            ))}
            {(!reviews || reviews.length === 0) && (
              <p className="text-surface-500 text-center p-4">No reviews yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

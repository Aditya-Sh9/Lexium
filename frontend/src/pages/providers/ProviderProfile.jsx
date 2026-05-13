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
      <Link to="/providers" className="inline-flex items-center gap-1.5 body-sm muted hover:text-primary-700 mb-5 transition-colors">
        <ArrowLeft size={14} /> Back to providers
      </Link>

      {/* Detail-dense hero — Variation A */}
      <div className="lx-card">
        <div className="p-6 sm:p-7 grid gap-5" style={{ gridTemplateColumns: 'auto 1fr auto', alignItems: 'flex-start' }}>
          <div className="lx-avatar lx-avatar-xl lx-avatar-tone-2">
            {initials || getInitials(name)}
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="lx-h2" style={{ margin: 0 }}>{name}</h1>
              {badges?.map((b) => <Badge key={b} variant={b} />)}
            </div>
            <span className="body" style={{ color: 'var(--color-surface-700)' }}>{specialization}</span>
            <div className="flex flex-wrap items-center gap-4 body-sm mt-0.5">
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> {location}</span>
              <span className="inline-flex items-center gap-1"><Clock size={12} /> {experience} yrs</span>
              <span className="inline-flex items-center gap-1"><Briefcase size={12} /> {displayServiceType}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={rating} size={13} showValue={false} />
              <span className="tabular strong" style={{ fontSize: 13 }}>{Number(rating || 0).toFixed(1)}</span>
              <span className="muted body-sm">({displayReviewCount} reviews)</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
            <span className="label">Starting from</span>
            <span className="tabular" style={{ fontSize: 18, fontFamily: 'var(--font-heading)', color: 'var(--color-primary-950, #0a1220)', letterSpacing: '-0.01em', fontWeight: 500 }}>
              {formatPriceRange(displayPriceRange, { emptyDash: true })}
            </span>
            <Link to={`/book/${provider._id || id}`} className="lx-btn lx-btn-primary lx-btn-sm mt-1">
              <FileText size={12} /> File a Case
            </Link>
          </div>
        </div>

        {bio && (
          <div className="px-6 sm:px-7 pb-6 sm:pb-7">
            <p className="body" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>{bio}</p>
            {languages && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {languages.map((l) => (
                  <span key={l} className="lx-badge lx-badge-neutral">{l}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-7 flex gap-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--hairline)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`lx-subtab ${activeTab === tab.id ? 'active' : ''}`}>
              <Icon size={13} /> {tab.label}
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

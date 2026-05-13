import { Link } from 'react-router';
import { MapPin, Briefcase, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getInitials } from '../../utils/helpers';
import { formatPriceRange } from '../../utils/formatters';

/**
 * ProviderCard — displays a provider summary in listings
 */
export default function ProviderCard({ provider }) {
  const {
    _id,
    id,
    name,
    initials,
    service_type,
    serviceType,
    specialization,
    rating,
    review_count,
    reviewCount,
    price_range,
    priceRange,
    location,
    experience,
    badges,
  } = provider;

  const providerId = _id || id;
  const displayType = service_type || serviceType;
  const displayReviewCount = review_count || reviewCount || 0;
  const displayPrice = price_range || priceRange || '';

  const isVerified = badges?.includes('verified');
  const isTopRated = badges?.includes('topRated') || badges?.includes('top-rated');

  return (
    <Link to={`/providers/${providerId}`} className="lx-card block transition-all hover:border-[var(--color-surface-300)]">
      {/* Body — horizontal layout (avatar | identity | top badge) */}
      <div className="p-[18px]">
        <div className="flex items-start gap-3">
          <div className="lx-avatar lx-avatar-lg lx-avatar-tone-2">
            {initials || getInitials(name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="strong truncate" style={{ fontSize: 15 }}>{name}</span>
              {isVerified && <CheckCircle2 size={13} className="text-[var(--info-600)] shrink-0" />}
            </div>
            <span className="body-sm muted">{specialization}</span>
            <div className="flex flex-wrap gap-3 mt-1 items-center">
              <span className="inline-flex items-center gap-1 tabular" style={{ fontSize: 12, fontWeight: 600 }}>
                <Star size={11} fill="currentColor" className="text-[var(--brass)]" />
                {Number(rating || 0).toFixed(1)}
                <span className="muted" style={{ fontWeight: 500 }}>({displayReviewCount})</span>
              </span>
              <span className="inline-flex items-center gap-1 body-xs muted"><MapPin size={11} /> {location}</span>
              <span className="inline-flex items-center gap-1 body-xs muted"><Briefcase size={11} /> {experience} yrs</span>
            </div>
          </div>

          {isTopRated && (
            <span className="lx-badge lx-badge-gold shrink-0">Top rated</span>
          )}
        </div>

        <p className="body-sm mt-3" style={{ color: 'var(--color-surface-600)' }}>
          {experience} years of experience practicing in {location}. Providing expertise as a registered {displayType}.
        </p>
      </div>

      {/* Footer — divider + price + CTA */}
      <div
        className="flex items-center justify-between px-[18px] py-2.5"
        style={{ borderTop: '1px solid var(--hairline)', background: 'var(--color-surface-50)' }}
      >
        <div className="flex flex-col">
          <span className="label" style={{ fontSize: 10 }}>From</span>
          <span className="tabular strong" style={{ fontSize: 13 }}>
            {formatPriceRange(displayPrice, { emptyDash: true })}
            <span className="muted" style={{ fontWeight: 400 }}> /consult</span>
          </span>
        </div>
        <span className="lx-btn lx-btn-secondary lx-btn-sm">
          View profile <ArrowRight size={11} />
        </span>
      </div>
    </Link>
  );
}

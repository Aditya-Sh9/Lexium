import { Link } from 'react-router';
import { MapPin } from 'lucide-react';
import RatingStars from './RatingStars';
import Badge from './Badge';
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

  return (
    <Link
      to={`/providers/${providerId}`}
      className="bg-white rounded-xl p-6 shadow-diffused border border-white/50 relative overflow-hidden bg-arch-pattern group block hover:-translate-y-1 transition-all duration-300"
    >
      {/* Verification Badge */}
      {badges?.includes('verified') && (
        <div className="absolute top-4 right-4 wax-seal w-8 h-8 rounded-full flex items-center justify-center text-white" title="Verified Counsel">
          <span className="material-symbols-outlined text-[16px]">verified</span>
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded shadow-inset-engraved overflow-hidden shrink-0 flex items-center justify-center bg-primary-800 text-white font-heading text-xl">
          {provider.avatar ? (
            <img alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={provider.avatar} />
          ) : (
            initials || getInitials(name)
          )}
        </div>
        
        <div>
          <h3 className="font-heading text-[20px] text-surface-900 leading-tight mb-1 group-hover:text-primary-800 transition-colors">
            {name}
          </h3>
          <p className="font-sans text-[10px] text-surface-500 uppercase tracking-widest font-bold">
            {specialization}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1 mb-2">
          <RatingStars rating={rating || 0} size={16} showValue={false} />
          <span className="font-sans text-[10px] text-surface-500 ml-2 mt-1 font-bold uppercase tracking-widest">
            {rating} ({displayReviewCount})
          </span>
        </div>
        <p className="font-sans text-[14px] text-surface-600 line-clamp-2">
          {experience} years of experience practicing in {location}. Providing expertise as a registered {displayType}.
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 pillar-divider-horizontal">
        <span className="font-heading text-[18px] text-primary-900 font-bold">
          {formatPriceRange(displayPrice, { emptyDash: true })}
          <span className="text-[12px] text-surface-500 font-sans font-normal"> /consultation</span>
        </span>
        <button className="bg-surface-50 text-primary-800 border border-primary-800 font-sans text-[12px] font-medium px-4 py-1.5 rounded hover:bg-primary-800 hover:text-white transition-colors cursor-pointer">
          View Docket
        </button>
      </div>
    </Link>
  );
}

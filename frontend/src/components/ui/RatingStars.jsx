import { Star, StarHalf } from 'lucide-react';

/**
 * RatingStars — renders filled, half, and empty stars
 *
 * @param {number} rating — 0 to 5
 * @param {number} size — icon size in px (default 16)
 * @param {boolean} showValue — show numeric value beside stars
 */
export default function RatingStars({ rating = 0, size = 16, showValue = false }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: full }, (_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          className="fill-accent-400 text-accent-400"
        />
      ))}
      {hasHalf && (
        <StarHalf
          size={size}
          className="fill-accent-400 text-accent-400"
        />
      )}
      {Array.from({ length: empty }, (_, i) => (
        <Star
          key={`empty-${i}`}
          size={size}
          className="text-surface-300"
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-surface-700">
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}

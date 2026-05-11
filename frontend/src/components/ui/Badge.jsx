import { ShieldCheck, Award, Zap, Sparkles } from 'lucide-react';
import { cn } from '../../utils/helpers';

const badgeConfig = {
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  topRated: {
    label: 'Top Rated',
    icon: Award,
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  fastResponder: {
    label: 'Fast Responder',
    icon: Zap,
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  new: {
    label: 'New',
    icon: Sparkles,
    classes: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

/**
 * Badge — displays a colored badge with icon and label
 *
 * @param {'verified'|'topRated'|'fastResponder'|'new'} variant
 * @param {'sm'|'md'} size
 */
export default function Badge({ variant = 'verified', size = 'sm' }) {
  const config = badgeConfig[variant];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        config.classes,
        sizeClasses
      )}
    >
      <Icon size={size === 'sm' ? 12 : 14} />
      {config.label}
    </span>
  );
}

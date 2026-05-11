import { Link } from 'react-router';
import {
  Scale,
  Handshake,
  Gavel,
  Stamp,
  FileText,
  Calculator,
} from 'lucide-react';
import { cn } from '../../utils/helpers';

const iconMap = {
  Scale,
  Handshake,
  Gavel,
  Stamp,
  FileText,
  Calculator,
};

/**
 * CategoryCard — displays a legal service category
 */
export default function CategoryCard({ category }) {
  const { id, name, icon, description, providerCount, color } = category;
  const Icon = iconMap[icon] || Scale;

  return (
    <Link
      to={`/providers?category=${id}`}
      className={cn(
        'group block rounded-xl border p-6 transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        color
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
      <h3 className="font-heading font-semibold text-lg mb-1">{name}</h3>
      <p className="text-sm opacity-80 leading-relaxed mb-3">{description}</p>
      <span className="text-xs font-medium opacity-70">
        {providerCount}+ providers
      </span>
    </Link>
  );
}

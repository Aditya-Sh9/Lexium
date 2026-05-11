/**
 * Utility helpers
 */

/**
 * Generates initials from a full name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formats a number with commas (e.g., 1234 → "1,234")
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Formats a date string to a readable format
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncates text to a given length and appends "…"
 */
export function truncate(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Classname merge utility (simple version)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

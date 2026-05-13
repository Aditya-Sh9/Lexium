/**
 * Currency + numeric formatting utilities.
 * Use these everywhere instead of inline string templates so display stays
 * consistent across providers, ledgers, dashboards and admin screens.
 */

/**
 * Parse any price-ish value ("₹2,000", "2000", "  1,500.00 ", 1500) into a number.
 * Returns 0 for null/undefined/non-numeric input.
 */
export function parseAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^\d.]/g, '');
  const n = cleaned ? Number(cleaned) : 0;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format a single numeric value as Indian rupees with grouping.
 *   formatRupees(1500)    → "₹1,500"
 *   formatRupees("2000")  → "₹2,000"
 *   formatRupees(null)    → "—"
 *   formatRupees(0)       → "₹0"
 */
export function formatRupees(value, { emptyDash = true } = {}) {
  if ((value === null || value === undefined || value === '') && emptyDash) return '—';
  const n = parseAmount(value);
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * Format a price-or-range string. Accepts:
 *   "1500"               → "₹1,500"
 *   "1500 - 8000"        → "₹1,500 - ₹8,000"
 *   "₹2,000 - ₹5,000"    → "₹2,000 - ₹5,000"  (currency on both bounds — common)
 *   "₹2,000 – ₹5,000"    → "₹2,000 - ₹5,000"  (en/em-dash too)
 *   "2000-5000"          → "₹2,000 - ₹5,000"  (no spaces)
 *   1500                 → "₹1,500"
 *   ""                   → "" (or "—" depending on flag)
 */
export function formatPriceRange(value, { emptyDash = false } = {}) {
  if (value === null || value === undefined || value === '') return emptyDash ? '—' : '';
  if (typeof value === 'number') return formatRupees(value, { emptyDash: false });

  const s = String(value).trim();
  // Tolerate currency symbols on either bound, any dash variant, optional whitespace.
  const m = s.match(/[₹$€£¥]?\s*(\d[\d,]*\.?\d*)\s*(?:-|–|—|~|to)\s*[₹$€£¥]?\s*(\d[\d,]*\.?\d*)/i);
  if (m) {
    return `${formatRupees(m[1], { emptyDash: false })} - ${formatRupees(m[2], { emptyDash: false })}`;
  }
  // Single value
  return formatRupees(s, { emptyDash: false });
}

/**
 * Format a duration string. "30" → "30 min" (if bare); "30 min" → unchanged.
 */
export function formatDuration(d) {
  if (d === null || d === undefined || d === '') return '';
  const s = String(d).trim();
  if (/hour|hr|min|day|week/i.test(s)) return s;
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n === 1 ? '1 hour' : `${n} hours`;
}

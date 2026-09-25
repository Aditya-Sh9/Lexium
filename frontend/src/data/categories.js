export const categories = [
  {
    id: 'advocate',
    name: 'Advocate',
    icon: 'Scale',
    description: 'Licensed lawyers for civil, criminal, corporate, and family law matters.',
    providerCount: 245,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'mediator',
    name: 'Mediator',
    icon: 'Handshake',
    description: 'Neutral professionals helping parties reach mutually acceptable agreements.',
    providerCount: 89,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'arbitrator',
    name: 'Arbitrator',
    icon: 'Gavel',
    description: 'Resolve disputes outside court through binding arbitration proceedings.',
    providerCount: 62,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'notary',
    name: 'Notary',
    icon: 'Stamp',
    description: 'Authenticate documents, administer oaths, and certify legal papers.',
    providerCount: 178,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'document-writer',
    name: 'Document Writer',
    icon: 'FileText',
    description: 'Draft legal documents, petitions, affidavits, and contracts.',
    providerCount: 134,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'tax-consultant',
    name: 'Tax Consultant',
    icon: 'Calculator',
    description: 'Expert advice on tax planning, GST compliance, and income tax matters.',
    providerCount: 96,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
];

const byId = Object.fromEntries(categories.map((c) => [c.id, c]));

/**
 * Normalises any stored service type — "advocate", "Advocate",
 * "Document Writer", "document_writer" — to its category id.
 */
export function toCategoryId(value) {
  const slug = String(value || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (byId[slug]) return slug;
  if (slug === 'notary-public') return 'notary';
  return slug;
}

/** Human label for a stored service type, e.g. "document-writer" → "Document Writer". */
export function categoryLabel(value) {
  const id = toCategoryId(value);
  return byId[id]?.name || value || '';
}

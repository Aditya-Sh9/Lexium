/**
 * Provider Service — fetches from Laravel API
 */
import api from './api';
import { categories, categoryLabel, toCategoryId } from '../data/categories';

/**
 * GET /api/providers — fetches providers with optional client-side filters
 */
export async function getProviders(filters = {}) {
  const allProviders = await api.get('/providers');

  let results = allProviders.map((p) => ({ ...p, service_type: toCategoryId(p.service_type || p.category) }));

  if (filters.category) {
    results = results.filter((p) => p.service_type === toCategoryId(filters.category));
  }

  if (filters.search) {
    // Every word must appear somewhere in the profile, so "GST filing" finds a
    // tax consultant whose services list "GST Return Filing".
    const terms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
    results = results.filter((p) => {
      const haystack = [
        p.name, p.specialization, p.location, p.bio,
        p.service_type, categoryLabel(p.service_type),
        ...(p.services || []).map((s) => s?.name),
      ].join(' ').toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  if (filters.location) {
    results = results.filter(
      (p) => (p.location || '').toLowerCase() === filters.location.toLowerCase()
    );
  }

  if (filters.minRating) {
    results = results.filter((p) => (p.rating || 0) >= filters.minRating);
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'experience':
        results.sort((a, b) => parseInt(b.experience || 0) - parseInt(a.experience || 0));
        break;
      default:
        break;
    }
  }

  return results;
}

/**
 * GET /api/providers/:id — fetches a single provider by MongoDB _id
 */
export async function getProviderById(id) {
  return api.get(`/providers/${id}`);
}

/**
 * GET /api/categories — returns service categories
 */
export async function getCategories() {
  // Use local data for categories since they're static
  return categories;
}

/**
 * Extracts unique locations from fetched providers
 */
export async function getAvailableLocations() {
  const providers = await api.get('/providers');
  return [...new Set(providers.map((p) => p.location).filter(Boolean))].sort();
}

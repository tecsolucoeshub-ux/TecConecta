import { Provider } from '../types';

/**
 * Normalizes text for forgiving search:
 * - Removes diacritics / accents (e.g., 'Soluções' -> 'solucoes', 'São Paulo' -> 'sao paulo')
 * - Converts to lower case
 * - Trims extra whitespace
 */
export function normalizeSearchText(text?: string | null): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Multi-term, accent-insensitive search matcher for providers.
 * Allows visitors to type flexible queries such as:
 * - "eletricista sp"
 * - "solucoes rio verde"
 * - "damaceno"
 * - "ia"
 * - "marcos"
 * - "pintor"
 */
export function matchesProviderSearch(provider: Provider, query: string): boolean {
  const cleanQuery = normalizeSearchText(query);
  if (!cleanQuery) return true;

  // Split query into distinct tokens (ignoring empty strings)
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const searchableBlob = normalizeSearchText([
    provider.name,
    provider.category,
    provider.city,
    provider.neighborhood || '',
    provider.address || '',
    provider.description || '',
  ].join(' '));

  // Every typed token must be found in the searchable blob
  return tokens.every((token) => searchableBlob.includes(token));
}

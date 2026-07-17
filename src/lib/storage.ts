const FAVORITES_KEY = 'realperf-favorites';
const COMPARISONS_KEY = 'realperf-saved-comparisons';

export type ChipSource = 'cloud' | 'edge';

export interface StoredChipRef {
  id: string;
  source: ChipSource;
}

export interface SavedComparison {
  items: StoredChipRef[];
  names: string[];
  createdAt: string;
}

function getChipKey(item: StoredChipRef) {
  return `${item.source}:${item.id}`;
}

function dedupeChipRefs(items: StoredChipRef[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getChipKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeChipRef(value: unknown): StoredChipRef | null {
  if (typeof value === 'string') {
    return { id: value, source: 'cloud' };
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'source' in value &&
    typeof value.id === 'string' &&
    (value.source === 'cloud' || value.source === 'edge')
  ) {
    return { id: value.id, source: value.source };
  }

  return null;
}

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function serializeCompareItems(items: StoredChipRef[]) {
  return dedupeChipRefs(items)
    .map((item) => `${item.source}:${item.id}`)
    .join(',');
}

export function parseCompareItems(
  itemsParam?: string | null,
  legacyIdsParam?: string | null
) {
  if (itemsParam) {
    return dedupeChipRefs(
      itemsParam
        .split(',')
        .map((token) => token.trim())
        .map((token) => {
          const [source, ...idParts] = token.split(':');
          const id = idParts.join(':');
          if ((source === 'cloud' || source === 'edge') && id) {
            return { id, source };
          }
          return null;
        })
        .filter((item): item is StoredChipRef => item !== null)
    );
  }

  if (legacyIdsParam) {
    return dedupeChipRefs(
      legacyIdsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => ({ id, source: 'cloud' as const }))
    );
  }

  return [];
}

export function buildCompareHref(items: StoredChipRef[], includeBasePath = true) {
  const serialized = serializeCompareItems(items);
  const query = `items=${encodeURIComponent(serialized)}`;
  return includeBasePath ? `/compare?${query}` : serialized;
}

export function getFavorites() {
  const raw = readLocalStorage<unknown[]>(FAVORITES_KEY, []);
  return dedupeChipRefs(raw.map(normalizeChipRef).filter((item): item is StoredChipRef => item !== null));
}

export function toggleFavorite(item: StoredChipRef) {
  const favorites = getFavorites();
  const nextFavorites = favorites.some((fav) => getChipKey(fav) === getChipKey(item))
    ? favorites.filter((fav) => getChipKey(fav) !== getChipKey(item))
    : [...favorites, item];

  writeLocalStorage(FAVORITES_KEY, nextFavorites);
  return nextFavorites.length > favorites.length;
}

export function isFavorite(item: StoredChipRef) {
  return getFavorites().some((fav) => getChipKey(fav) === getChipKey(item));
}

export function getSavedComparisons() {
  const raw = readLocalStorage<unknown[]>(COMPARISONS_KEY, []);

  return raw
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;

      const items = Array.isArray((entry as { items?: unknown[] }).items)
        ? ((entry as { items: unknown[] }).items
            .map(normalizeChipRef)
            .filter((item): item is StoredChipRef => item !== null))
        : Array.isArray((entry as { ids?: unknown[] }).ids)
          ? ((entry as { ids: unknown[] }).ids
              .map(normalizeChipRef)
              .filter((item): item is StoredChipRef => item !== null))
          : [];

      if (items.length === 0) return null;

      return {
        items: dedupeChipRefs(items),
        names: Array.isArray((entry as { names?: unknown[] }).names)
          ? (entry as { names: unknown[] }).names.filter(
              (name): name is string => typeof name === 'string'
            )
          : [],
        createdAt:
          typeof (entry as { createdAt?: unknown }).createdAt === 'string'
            ? ((entry as { createdAt: string }).createdAt)
            : new Date().toISOString(),
      };
    })
    .filter((item): item is SavedComparison => item !== null);
}

export function saveComparison(items: StoredChipRef[], names: string[]) {
  const comparisons = getSavedComparisons();
  comparisons.unshift({
    items: dedupeChipRefs(items),
    names,
    createdAt: new Date().toISOString(),
  });

  if (comparisons.length > 20) comparisons.pop();
  writeLocalStorage(COMPARISONS_KEY, comparisons);
}

export function deleteComparison(index: number) {
  const comparisons = getSavedComparisons();
  comparisons.splice(index, 1);
  writeLocalStorage(COMPARISONS_KEY, comparisons);
}

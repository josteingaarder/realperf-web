const FAVORITES_KEY = 'realperf-favorites';
const COMPARISONS_KEY = 'realperf-saved-comparisons';

export interface SavedComparison {
  ids: string[];
  names: string[];
  createdAt: string;
}

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(id);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return idx < 0;
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function getSavedComparisons(): SavedComparison[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COMPARISONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveComparison(ids: string[], names: string[]) {
  if (typeof window === 'undefined') return;
  const comps = getSavedComparisons();
  comps.unshift({ ids, names, createdAt: new Date().toISOString() });
  if (comps.length > 20) comps.pop();
  localStorage.setItem(COMPARISONS_KEY, JSON.stringify(comps));
}

export function deleteComparison(index: number) {
  if (typeof window === 'undefined') return;
  const comps = getSavedComparisons();
  comps.splice(index, 1);
  localStorage.setItem(COMPARISONS_KEY, JSON.stringify(comps));
}

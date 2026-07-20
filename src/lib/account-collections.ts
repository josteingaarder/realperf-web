import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { SavedComparison, StoredChipRef } from '@/lib/storage';

export interface CollectionViewer {
  id: string;
  email: string | null;
}

export interface SavedComparisonRecord extends SavedComparison {
  id: string;
}

interface CollectionsState {
  user: CollectionViewer | null;
  favorites: StoredChipRef[];
  comparisons: SavedComparisonRecord[];
}

function normalizeChipSource(value: unknown): StoredChipRef['source'] | null {
  return value === 'cloud' || value === 'edge' ? value : null;
}

function normalizeStoredChipRef(value: unknown): StoredChipRef | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as { id?: unknown; source?: unknown };
  const source = normalizeChipSource(record.source);

  if (typeof record.id !== 'string' || !source) {
    return null;
  }

  return { id: record.id, source };
}

export async function getCollectionViewer(): Promise<CollectionViewer | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function fetchFavoriteRefsForCurrentUser(): Promise<StoredChipRef[]> {
  const viewer = await getCollectionViewer();

  if (!viewer) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_favorite_chips')
    .select('chip_id,chip_source')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => {
      const source = normalizeChipSource(row.chip_source);
      if (!source || typeof row.chip_id !== 'string') {
        return null;
      }

      return {
        id: row.chip_id,
        source,
      };
    })
    .filter((item): item is StoredChipRef => item !== null);
}

export async function fetchSavedComparisonsForCurrentUser(): Promise<SavedComparisonRecord[]> {
  const viewer = await getCollectionViewer();

  if (!viewer) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_saved_comparisons')
    .select('id,items,names,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => {
      const items = Array.isArray(row.items)
        ? row.items.map(normalizeStoredChipRef).filter((item): item is StoredChipRef => item !== null)
        : [];

      if (items.length === 0) {
        return null;
      }

      return {
        id: row.id,
        items,
        names: Array.isArray(row.names) ? row.names.filter((name): name is string => typeof name === 'string') : [],
        createdAt: row.created_at,
      };
    })
    .filter((item): item is SavedComparisonRecord => item !== null);
}

export async function fetchCollectionsState(): Promise<CollectionsState> {
  const user = await getCollectionViewer();

  if (!user) {
    return {
      user: null,
      favorites: [],
      comparisons: [],
    };
  }

  const [favorites, comparisons] = await Promise.all([
    fetchFavoriteRefsForCurrentUser(),
    fetchSavedComparisonsForCurrentUser(),
  ]);

  return {
    user,
    favorites,
    comparisons,
  };
}

async function requireCollectionViewer() {
  const viewer = await getCollectionViewer();

  if (!viewer) {
    throw new Error('AUTH_REQUIRED');
  }

  return viewer;
}

export async function toggleFavoriteForCurrentUser(item: StoredChipRef) {
  const viewer = await requireCollectionViewer();
  const supabase = await createServerSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from('user_favorite_chips')
    .select('user_id')
    .eq('chip_id', item.id)
    .eq('chip_source', item.source)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    const { error } = await supabase
      .from('user_favorite_chips')
      .delete()
      .eq('user_id', viewer.id)
      .eq('chip_id', item.id)
      .eq('chip_source', item.source);

    if (error) {
      throw new Error(error.message);
    }

    return { favorited: false };
  }

  const { error } = await supabase.from('user_favorite_chips').insert({
    user_id: viewer.id,
    chip_id: item.id,
    chip_source: item.source,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { favorited: true };
}

export async function saveComparisonForCurrentUser(items: StoredChipRef[], names: string[]) {
  const viewer = await requireCollectionViewer();
  const supabase = await createServerSupabaseClient();
  const sanitizedItems = items
    .map(normalizeStoredChipRef)
    .filter((item): item is StoredChipRef => item !== null);

  if (sanitizedItems.length < 2) {
    throw new Error('At least two chips are required to save a comparison.');
  }

  const { data, error } = await supabase
    .from('user_saved_comparisons')
    .insert({
      user_id: viewer.id,
      items: sanitizedItems,
      names: names.filter((name): name is string => typeof name === 'string'),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
  };
}

export async function deleteSavedComparisonForCurrentUser(id: string) {
  const viewer = await requireCollectionViewer();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('user_saved_comparisons')
    .delete()
    .eq('id', id)
    .eq('user_id', viewer.id);

  if (error) {
    throw new Error(error.message);
  }
}

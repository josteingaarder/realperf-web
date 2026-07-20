'use server';

import type { StoredChipRef } from '@/lib/storage';
import {
  deleteSavedComparisonForCurrentUser,
  saveComparisonForCurrentUser,
  toggleFavoriteForCurrentUser,
} from '@/lib/account-collections';

function getSafeMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong.';
}

export async function toggleFavoriteAction(item: StoredChipRef) {
  try {
    const result = await toggleFavoriteForCurrentUser(item);
    return {
      ok: true,
      favorited: result.favorited,
    };
  } catch (error) {
    const message = getSafeMessage(error);
    return {
      ok: false,
      code: message === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'UNKNOWN_ERROR',
      message,
    };
  }
}

export async function saveComparisonAction(items: StoredChipRef[], names: string[]) {
  try {
    const result = await saveComparisonForCurrentUser(items, names);
    return {
      ok: true,
      id: result.id,
    };
  } catch (error) {
    const message = getSafeMessage(error);
    return {
      ok: false,
      code: message === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'UNKNOWN_ERROR',
      message,
    };
  }
}

export async function deleteSavedComparisonAction(id: string) {
  try {
    await deleteSavedComparisonForCurrentUser(id);
    return {
      ok: true,
    };
  } catch (error) {
    const message = getSafeMessage(error);
    return {
      ok: false,
      code: message === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'UNKNOWN_ERROR',
      message,
    };
  }
}

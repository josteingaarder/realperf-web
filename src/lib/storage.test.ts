import { beforeEach, describe, expect, it } from 'vitest';
import {
  getFavorites,
  parseCompareItems,
  toggleFavorite,
  type StoredChipRef,
} from '@/lib/storage';

describe('storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('parses compare items from new and legacy query params', () => {
    expect(
      parseCompareItems('edge:1,cloud:2,edge:1', null)
    ).toEqual<StoredChipRef[]>([
      { id: '1', source: 'edge' },
      { id: '2', source: 'cloud' },
    ]);

    expect(parseCompareItems(null, 'a,b')).toEqual<StoredChipRef[]>([
      { id: 'a', source: 'cloud' },
      { id: 'b', source: 'cloud' },
    ]);
  });

  it('stores favorites with source awareness', () => {
    toggleFavorite({ id: 'chip-1', source: 'cloud' });
    toggleFavorite({ id: 'chip-1', source: 'edge' });

    expect(getFavorites()).toEqual<StoredChipRef[]>([
      { id: 'chip-1', source: 'cloud' },
      { id: 'chip-1', source: 'edge' },
    ]);

    toggleFavorite({ id: 'chip-1', source: 'cloud' });

    expect(getFavorites()).toEqual<StoredChipRef[]>([
      { id: 'chip-1', source: 'edge' },
    ]);
  });
});

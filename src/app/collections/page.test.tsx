import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionsPage from '@/app/collections/page';
import type { SavedComparisonRecord } from '@/lib/account-collections';
import type { StoredChipRef } from '@/lib/storage';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/SiteHeader', () => ({
  default: () => <div data-testid="site-header">header</div>,
}));

vi.mock('@/components/SiteHeaderWithAuth', () => ({
  default: () => <div data-testid="site-header">header</div>,
}));

vi.mock('@/lib/account-collections', () => ({
  fetchCollectionsState: vi.fn(),
}));

vi.mock('@/lib/catalog', () => ({
  fetchFavoriteChipCards: vi.fn(),
  getSourceLabel: (source: string) => source,
}));

vi.mock('@/lib/storage', () => ({
  buildCompareHref: vi.fn(() => '/compare?items=edge%3A1'),
}));

describe('CollectionsPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const accountCollections = await import('@/lib/account-collections');
    const catalog = await import('@/lib/catalog');

    vi.mocked(accountCollections.fetchCollectionsState).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
      },
      favorites: [],
      comparisons: [],
    });
    vi.mocked(catalog.fetchFavoriteChipCards).mockResolvedValue([]);
  });

  it('shows empty states when there are no favorites or saved comparisons', async () => {
    render(await CollectionsPage());

    await waitFor(() => {
      expect(screen.getByText('No favorite chips yet')).toBeInTheDocument();
    });

    expect(screen.getByText('No saved comparisons yet')).toBeInTheDocument();
  });

  it('shows a sign-in prompt when the viewer is a guest', async () => {
    const accountCollections = await import('@/lib/account-collections');

    vi.mocked(accountCollections.fetchCollectionsState).mockResolvedValue({
      user: null,
      favorites: [] satisfies StoredChipRef[],
      comparisons: [] satisfies SavedComparisonRecord[],
    });

    render(await CollectionsPage());

    await waitFor(() => {
      expect(screen.getByText('Sign in to use My Collections')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/sign-in');
  });
});

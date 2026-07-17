import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionsPage from '@/app/collections/page';

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

vi.mock('@/lib/catalog', () => ({
  fetchFavoriteChipCards: vi.fn(),
  getSourceLabel: (source: string) => source,
}));

vi.mock('@/lib/storage', () => ({
  buildCompareHref: vi.fn(() => '/compare?items=edge%3A1'),
  deleteComparison: vi.fn(),
  getFavorites: vi.fn(),
  getSavedComparisons: vi.fn(),
  toggleFavorite: vi.fn(),
}));

describe('CollectionsPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const storage = await import('@/lib/storage');
    const catalog = await import('@/lib/catalog');

    vi.mocked(storage.getFavorites).mockReturnValue([]);
    vi.mocked(storage.getSavedComparisons).mockReturnValue([]);
    vi.mocked(catalog.fetchFavoriteChipCards).mockResolvedValue([]);
  });

  it('shows empty states when there are no favorites or saved comparisons', async () => {
    render(<CollectionsPage />);

    await waitFor(() => {
      expect(screen.getByText('No favorite chips yet')).toBeInTheDocument();
    });

    expect(screen.getByText('No saved comparisons yet')).toBeInTheDocument();
  });
});

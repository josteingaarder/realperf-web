import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { canManageManufacturer, canReviewManufacturer, hasReviewAccess, type ConsoleSession } from '@/lib/console-auth';

function buildSession(overrides?: Partial<ConsoleSession>): ConsoleSession {
  return {
    user: {
      id: 'user-1',
      email: 'user@example.com',
    },
    profile: {
      display_name: 'User',
      role: 'vendor_editor',
    },
    memberships: [],
    ...overrides,
  };
}

describe('console auth review helpers', () => {
  it('grants super admins global review and manage access', () => {
    const session = buildSession({
      profile: {
        display_name: 'Admin',
        role: 'super_admin',
      },
    });

    expect(hasReviewAccess(session)).toBe(true);
    expect(canReviewManufacturer(session, 'm-1')).toBe(true);
    expect(canManageManufacturer(session, 'm-1')).toBe(true);
  });

  it('lets reviewer memberships review but not manage manufacturer records', () => {
    const session = buildSession({
      memberships: [
        {
          manufacturer_id: 'm-review',
          role: 'reviewer',
        },
      ],
    });

    expect(hasReviewAccess(session)).toBe(true);
    expect(canReviewManufacturer(session, 'm-review')).toBe(true);
    expect(canManageManufacturer(session, 'm-review')).toBe(false);
  });

  it('keeps editor memberships on authoring permissions only', () => {
    const session = buildSession({
      memberships: [
        {
          manufacturer_id: 'm-edit',
          role: 'editor',
        },
      ],
    });

    expect(hasReviewAccess(session)).toBe(false);
    expect(canManageManufacturer(session, 'm-edit')).toBe(true);
    expect(canReviewManufacturer(session, 'm-edit')).toBe(false);
  });
});

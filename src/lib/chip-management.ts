import { createServerSupabaseClient } from '@/lib/supabase-server';
import { canManageManufacturer, canReviewManufacturer, type ConsoleSession } from '@/lib/console-auth';

export type ManagedChipSource = 'cloud' | 'edge';

export interface ManagedChipListItem {
  id: string;
  source: ManagedChipSource;
  name: string;
  manufacturer: string | null;
  manufacturer_id: string | null;
  category: string | null;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  updated_at: string | null;
  href: string;
}

export interface ManufacturerOption {
  id: string;
  name: string;
}

type ChipRow = Omit<ManagedChipListItem, 'source' | 'href'>;

export function isChipSource(value: string): value is ManagedChipSource {
  return value === 'cloud' || value === 'edge';
}

export function getChipTable(source: ManagedChipSource) {
  return source === 'cloud' ? 'cloud_chips' : 'edge_chips';
}

function applyManufacturerScope<T extends { manufacturer_id: string | null }>(
  session: ConsoleSession,
  rows: T[]
) {
  if (session.profile.role === 'super_admin') {
    return rows;
  }

  return rows.filter((row) => canManageManufacturer(session, row.manufacturer_id));
}

function applyReviewScope<T extends { manufacturer_id: string | null }>(session: ConsoleSession, rows: T[]) {
  if (session.profile.role === 'super_admin') {
    return rows;
  }

  return rows.filter((row) => canReviewManufacturer(session, row.manufacturer_id));
}

export async function fetchManagedChipList(session: ConsoleSession): Promise<ManagedChipListItem[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: cloudRows }, { data: edgeRows }] = await Promise.all([
    supabase
      .from('cloud_chips')
      .select('id,name,manufacturer,manufacturer_id,category,status,updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('edge_chips')
      .select('id,name,manufacturer,manufacturer_id,category,status,updated_at')
      .order('updated_at', { ascending: false }),
  ]);

  const cloudItems = applyManufacturerScope(session, (cloudRows ?? []) as ChipRow[]).map(
    (row) =>
      ({
        ...row,
        source: 'cloud' as const,
        href: `/console/chips/cloud/${row.id}`,
      }) satisfies ManagedChipListItem
  );

  const edgeItems = applyManufacturerScope(session, (edgeRows ?? []) as ChipRow[]).map(
    (row) =>
      ({
        ...row,
        source: 'edge' as const,
        href: `/console/chips/edge/${row.id}`,
      }) satisfies ManagedChipListItem
  );

  return [...cloudItems, ...edgeItems].sort((left, right) =>
    (right.updated_at ?? '').localeCompare(left.updated_at ?? '')
  );
}

export async function fetchPendingReviewChipList(session: ConsoleSession): Promise<ManagedChipListItem[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: cloudRows }, { data: edgeRows }] = await Promise.all([
    supabase
      .from('cloud_chips')
      .select('id,name,manufacturer,manufacturer_id,category,status,updated_at')
      .eq('status', 'pending_review')
      .order('updated_at', { ascending: false }),
    supabase
      .from('edge_chips')
      .select('id,name,manufacturer,manufacturer_id,category,status,updated_at')
      .eq('status', 'pending_review')
      .order('updated_at', { ascending: false }),
  ]);

  const cloudItems = applyReviewScope(session, (cloudRows ?? []) as ChipRow[]).map(
    (row) =>
      ({
        ...row,
        source: 'cloud' as const,
        href: `/console/chips/cloud/${row.id}`,
      }) satisfies ManagedChipListItem
  );

  const edgeItems = applyReviewScope(session, (edgeRows ?? []) as ChipRow[]).map(
    (row) =>
      ({
        ...row,
        source: 'edge' as const,
        href: `/console/chips/edge/${row.id}`,
      }) satisfies ManagedChipListItem
  );

  return [...cloudItems, ...edgeItems].sort((left, right) =>
    (right.updated_at ?? '').localeCompare(left.updated_at ?? '')
  );
}

export async function fetchManufacturerOptions(session: ConsoleSession): Promise<ManufacturerOption[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('manufacturers').select('id,name').order('name', { ascending: true });
  const rows = (data ?? []) as ManufacturerOption[];

  if (session.profile.role === 'super_admin') {
    return rows;
  }

  const permittedIds = new Set(session.memberships.map((membership) => membership.manufacturer_id));
  return rows.filter((row) => permittedIds.has(row.id));
}

export async function fetchChipForEdit(session: ConsoleSession, source: ManagedChipSource, id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from(getChipTable(source)).select('*').eq('id', id).maybeSingle();

  if (!data) {
    return null;
  }

  if (!canManageManufacturer(session, data.manufacturer_id)) {
    return null;
  }

  return data;
}

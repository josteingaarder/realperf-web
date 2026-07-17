import { supabase } from '@/lib/supabase';
import { serializeCompareItems, type ChipSource, type StoredChipRef } from '@/lib/storage';

export interface FavoriteChipCard {
  id: string;
  source: ChipSource;
  name: string;
  manufacturer: string;
  category: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  href: string;
}

export interface CompareChip {
  id: string;
  source: ChipSource;
  name: string;
  manufacturer: string;
  category: string;
  architecture?: string | null;
  process_node?: string | null;
  vram_gb?: number | null;
  tdp_watt?: number | null;
  fp16_tflops?: number | null;
  fp32_tflops?: number | null;
  ai_tops?: number | null;
  price_usd?: number | null;
}

function getChipKey(item: StoredChipRef) {
  return `${item.source}:${item.id}`;
}

function orderByInput<T extends { id: string; source: ChipSource }>(
  records: T[],
  items: StoredChipRef[]
) {
  const order = new Map(items.map((item, index) => [getChipKey(item), index]));
  return records.sort(
    (left, right) =>
      (order.get(getChipKey(left)) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(getChipKey(right)) ?? Number.MAX_SAFE_INTEGER)
  );
}

function formatMetricValue(value: number | null | undefined, unit: string) {
  return value == null ? '—' : `${value.toLocaleString()} ${unit}`;
}

export function getSourceLabel(source: ChipSource) {
  return source === 'cloud' ? 'Cloud' : 'Edge';
}

export async function fetchFavoriteChipCards(items: StoredChipRef[]) {
  const cloudIds = items.filter((item) => item.source === 'cloud').map((item) => item.id);
  const edgeIds = items.filter((item) => item.source === 'edge').map((item) => item.id);
  const cards: FavoriteChipCard[] = [];

  if (cloudIds.length > 0) {
    const { data } = await supabase
      .from('cloud_chips')
      .select('id,name,manufacturer,category,fp16_tflops')
      .in('id', cloudIds);

    cards.push(
      ...(data ?? []).map((chip) => ({
        id: chip.id,
        source: 'cloud' as const,
        name: chip.name,
        manufacturer: chip.manufacturer,
        category: chip.category,
        primaryMetricLabel: 'FP16',
        primaryMetricValue: formatMetricValue(chip.fp16_tflops, 'TFLOPS'),
        href: `/chips/${chip.id}`,
      }))
    );
  }

  if (edgeIds.length > 0) {
    const { data } = await supabase
      .from('edge_chips')
      .select('id,name,manufacturer,category,ai_tops')
      .in('id', edgeIds);

    cards.push(
      ...(data ?? []).map((chip) => ({
        id: chip.id,
        source: 'edge' as const,
        name: chip.name,
        manufacturer: chip.manufacturer,
        category: chip.category,
        primaryMetricLabel: 'AI TOPS',
        primaryMetricValue: formatMetricValue(chip.ai_tops, 'TOPS'),
        href: `/edge?items=${encodeURIComponent(serializeCompareItems([{ id: chip.id, source: 'edge' }]))}`,
      }))
    );
  }

  return orderByInput(cards, items);
}

export async function fetchCompareChips(items: StoredChipRef[]) {
  const cloudIds = items.filter((item) => item.source === 'cloud').map((item) => item.id);
  const edgeIds = items.filter((item) => item.source === 'edge').map((item) => item.id);
  const chips: CompareChip[] = [];

  if (cloudIds.length > 0) {
    const { data } = await supabase
      .from('cloud_chips')
      .select('id,name,manufacturer,category,architecture,process_node,vram_gb,tdp_watt,fp16_tflops,fp32_tflops,price_usd')
      .in('id', cloudIds);

    chips.push(
      ...((data ?? []) as Omit<CompareChip, 'source'>[]).map((chip) => ({
        ...chip,
        source: 'cloud' as const,
      }))
    );
  }

  if (edgeIds.length > 0) {
    const { data } = await supabase
      .from('edge_chips')
      .select('id,name,manufacturer,category,process_node,vram_gb,tdp_watt,ai_tops,price_usd')
      .in('id', edgeIds);

    chips.push(
      ...((data ?? []) as Omit<CompareChip, 'source'>[]).map((chip) => ({
        ...chip,
        source: 'edge' as const,
      }))
    );
  }

  return orderByInput(chips, items);
}

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { canManageManufacturer, type ConsoleSession } from '@/lib/console-auth';
import { fetchManagedChipList } from '@/lib/chip-management';

export type BenchmarkLifecycleStatus = 'draft' | 'pending_review' | 'published' | 'archived';
export type ModelLifecycleStatus = 'draft' | 'published' | 'archived';

export interface ManagedModelListItem {
  id: string;
  name: string;
  category: string;
  vendor: string | null;
  family: string | null;
  status: ModelLifecycleStatus;
  updated_at: string | null;
}

export interface ManagedModelOption {
  id: string;
  name: string;
  category: string;
}

export interface BenchmarkChipOption {
  id: string;
  source: 'cloud' | 'edge';
  name: string;
  manufacturer: string | null;
  manufacturer_id: string | null;
  status: string;
}

export interface ManagedBenchmarkListItem {
  id: string;
  chip_source: 'cloud' | 'edge';
  chip_id: string;
  chip_name: string;
  manufacturer_name: string | null;
  model_name: string;
  variant_name: string;
  task_type: string;
  metric_name: string;
  metric_unit: string;
  primary_value: number;
  status: BenchmarkLifecycleStatus;
  updated_at: string | null;
  href: string;
}

interface NestedModelRow {
  id: string;
  name: string;
}

interface NestedVariantRow {
  id: string;
  name: string;
  model: NestedModelRow | NestedModelRow[] | null;
}

interface NestedScenarioRow {
  id: string;
  task_type: string;
  metric_name: string;
  metric_unit: string;
  variant: NestedVariantRow | NestedVariantRow[] | null;
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function fetchModelList(): Promise<ManagedModelListItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('models')
    .select('id,name,category,vendor,family,status,updated_at')
    .order('updated_at', { ascending: false });

  return (data ?? []) as ManagedModelListItem[];
}

export async function fetchModelOptions(): Promise<ManagedModelOption[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('models').select('id,name,category').order('name', { ascending: true });
  return (data ?? []) as ManagedModelOption[];
}

export async function fetchModelForEdit(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('models').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function fetchBenchmarkChipOptions(session: ConsoleSession): Promise<BenchmarkChipOption[]> {
  const chips = await fetchManagedChipList(session);

  return chips.map((chip) => ({
    id: chip.id,
    source: chip.source,
    name: chip.name,
    manufacturer: chip.manufacturer,
    manufacturer_id: chip.manufacturer_id,
    status: chip.status,
  }));
}

export async function fetchBenchmarkList(session: ConsoleSession): Promise<ManagedBenchmarkListItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('benchmark_results')
    .select(
      `
      id,
      chip_source,
      chip_id,
      manufacturer_id,
      primary_value,
      status,
      updated_at,
      scenario:benchmark_scenarios (
        id,
        task_type,
        metric_name,
        metric_unit,
        variant:model_variants (
          id,
          name,
          model:models (
            id,
            name
          )
        )
      )
    `
    )
    .order('updated_at', { ascending: false });

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    chip_source: 'cloud' | 'edge';
    chip_id: string;
    manufacturer_id: string;
    primary_value: number;
    status: BenchmarkLifecycleStatus;
    updated_at: string | null;
    scenario: NestedScenarioRow | NestedScenarioRow[] | null;
  }>;

  const filteredRows = rows.filter(
    (row) => session.profile.role === 'super_admin' || canManageManufacturer(session, row.manufacturer_id)
  );

  const cloudIds = filteredRows.filter((row) => row.chip_source === 'cloud').map((row) => row.chip_id);
  const edgeIds = filteredRows.filter((row) => row.chip_source === 'edge').map((row) => row.chip_id);

  const [{ data: cloudChips }, { data: edgeChips }] = await Promise.all([
    cloudIds.length
      ? supabase.from('cloud_chips').select('id,name,manufacturer').in('id', cloudIds)
      : Promise.resolve({ data: [] }),
    edgeIds.length ? supabase.from('edge_chips').select('id,name,manufacturer').in('id', edgeIds) : Promise.resolve({ data: [] }),
  ]);

  const chipMap = new Map<string, { name: string; manufacturer: string | null }>();

  for (const chip of cloudChips ?? []) {
    chipMap.set(`cloud:${chip.id}`, {
      name: chip.name,
      manufacturer: chip.manufacturer ?? null,
    });
  }

  for (const chip of edgeChips ?? []) {
    chipMap.set(`edge:${chip.id}`, {
      name: chip.name,
      manufacturer: chip.manufacturer ?? null,
    });
  }

  return filteredRows.map((row) => {
    const scenario = firstRelation(row.scenario);
    const variant = firstRelation(scenario?.variant);
    const model = firstRelation(variant?.model);
    const chip = chipMap.get(`${row.chip_source}:${row.chip_id}`);
    return {
      id: row.id,
      chip_source: row.chip_source,
      chip_id: row.chip_id,
      chip_name: chip?.name ?? 'Unknown chip',
      manufacturer_name: chip?.manufacturer ?? null,
      model_name: model?.name ?? 'Unknown model',
      variant_name: variant?.name ?? 'Unnamed variant',
      task_type: scenario?.task_type ?? 'Unknown task',
      metric_name: scenario?.metric_name ?? 'Unknown metric',
      metric_unit: scenario?.metric_unit ?? 'Unknown unit',
      primary_value: row.primary_value,
      status: row.status,
      updated_at: row.updated_at,
      href: `/console/benchmarks/${row.id}`,
    } satisfies ManagedBenchmarkListItem;
  });
}

export async function fetchBenchmarkForEdit(session: ConsoleSession, id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('benchmark_results')
    .select(
      `
      *,
      scenario:benchmark_scenarios (
        *,
        llm_details:llm_scenario_details (*),
        vision_details:vision_scenario_details (*),
        speech_details:speech_scenario_details (*),
        variant:model_variants (
          *,
          model:models (*)
        )
      ),
      evidence:benchmark_evidence (*)
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const normalized = {
    ...data,
    scenario: firstRelation(data.scenario as NestedScenarioRow | NestedScenarioRow[] | null),
    evidence: Array.isArray(data.evidence) ? data.evidence : data.evidence ? [data.evidence] : [],
  };

  if (!canManageManufacturer(session, normalized.manufacturer_id)) {
    return null;
  }

  if (normalized.scenario) {
    const scenarioVariant = firstRelation(normalized.scenario.variant);
    const llmDetails = firstRelation(
      (normalized.scenario as Record<string, unknown>).llm_details as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const visionDetails = firstRelation(
      (normalized.scenario as Record<string, unknown>).vision_details as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const speechDetails = firstRelation(
      (normalized.scenario as Record<string, unknown>).speech_details as Record<string, unknown> | Record<string, unknown>[] | null
    );
    normalized.scenario = {
      ...normalized.scenario,
      llm_details: llmDetails,
      vision_details: visionDetails,
      speech_details: speechDetails,
      variant: scenarioVariant
        ? {
            ...scenarioVariant,
            model: firstRelation(scenarioVariant.model),
          }
        : null,
    };
  }

  return normalized;
}

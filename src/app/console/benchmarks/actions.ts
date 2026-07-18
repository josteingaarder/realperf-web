'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { canManageManufacturer, requireConsoleSession } from '@/lib/console-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type BenchmarkLifecycleStatus = 'draft' | 'pending_review' | 'published' | 'archived';

function asOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function asOptionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }

  const parsed = Number(text);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${text}`);
  }

  return parsed;
}

function asOptionalInteger(value: FormDataEntryValue | null) {
  const parsed = asOptionalNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function revalidateBenchmarkRoutes(resultId?: string, chipSource?: 'cloud' | 'edge', chipId?: string) {
  revalidatePath('/console');
  revalidatePath('/console/benchmarks');
  revalidatePath('/console/models');

  if (resultId) {
    revalidatePath(`/console/benchmarks/${resultId}`);
  }

  if (chipSource && chipId) {
    revalidatePath(chipSource === 'cloud' ? `/chips/${chipId}` : `/edge/${chipId}`);
  }
}

function assertStatusTransitionAllowed(isAdmin: boolean, nextStatus: BenchmarkLifecycleStatus) {
  if (isAdmin) {
    return;
  }

  if (nextStatus !== 'draft' && nextStatus !== 'pending_review') {
    throw new Error('Vendor accounts can only save drafts or submit for review.');
  }
}

async function getManagedChip(
  session: Awaited<ReturnType<typeof requireConsoleSession>>,
  chipSource: 'cloud' | 'edge',
  chipId: string
) {
  const supabase = await createServerSupabaseClient();
  const table = chipSource === 'cloud' ? 'cloud_chips' : 'edge_chips';
  const { data: chip } = await supabase
    .from(table)
    .select('id,name,manufacturer_id')
    .eq('id', chipId)
    .maybeSingle();

  if (!chip || !canManageManufacturer(session, chip.manufacturer_id)) {
    throw new Error('Chip not found or access denied.');
  }

  return chip;
}

export async function saveBenchmarkAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const resultId = asOptionalString(formData.get('benchmark_result_id'));
  const chipSource = String(formData.get('chip_source') ?? '') as 'cloud' | 'edge';
  const chipId = String(formData.get('chip_id') ?? '');
  const modelId = String(formData.get('model_id') ?? '');

  if (!chipId || !modelId || (chipSource !== 'cloud' && chipSource !== 'edge')) {
    redirect(`/console/benchmarks${resultId ? `/${resultId}` : '/new'}?error=Chip and model are required.`);
  }

  try {
    const chip = await getManagedChip(session, chipSource, chipId);

    const variantPayload = {
      model_id: modelId,
      name: String(formData.get('variant_name') ?? '').trim(),
      precision: asOptionalString(formData.get('precision')),
      quantization: asOptionalString(formData.get('quantization')),
      context_length: asOptionalInteger(formData.get('context_length')),
      input_resolution: asOptionalString(formData.get('input_resolution')),
      weights_source_url: asOptionalString(formData.get('weights_source_url')),
      notes: asOptionalString(formData.get('variant_notes')),
      status: 'draft' as const,
      updated_by: session.user.id,
    };

    if (!variantPayload.name) {
      throw new Error('Variant name is required.');
    }

    const scenarioPayload = {
      task_type: String(formData.get('task_type') ?? '').trim(),
      batch_size: asOptionalInteger(formData.get('batch_size')),
      sequence_length: asOptionalInteger(formData.get('sequence_length')),
      input_shape: asOptionalString(formData.get('input_shape')),
      dataset: asOptionalString(formData.get('dataset')),
      framework: String(formData.get('framework') ?? '').trim(),
      runtime: asOptionalString(formData.get('runtime')),
      compiler: asOptionalString(formData.get('compiler')),
      metric_name: String(formData.get('metric_name') ?? '').trim(),
      metric_unit: String(formData.get('metric_unit') ?? '').trim(),
      notes: asOptionalString(formData.get('scenario_notes')),
      status: 'draft' as const,
      updated_by: session.user.id,
    };

    if (!scenarioPayload.task_type || !scenarioPayload.framework || !scenarioPayload.metric_name || !scenarioPayload.metric_unit) {
      throw new Error('Task type, framework, metric name, and metric unit are required.');
    }

    const resultPayload = {
      chip_source: chipSource,
      chip_id: chipId,
      manufacturer_id: chip.manufacturer_id,
      primary_value: asOptionalNumber(formData.get('primary_value')),
      secondary_value: asOptionalNumber(formData.get('secondary_value')),
      latency_ms_p50: asOptionalNumber(formData.get('latency_ms_p50')),
      latency_ms_p99: asOptionalNumber(formData.get('latency_ms_p99')),
      throughput: asOptionalNumber(formData.get('throughput')),
      power_watt: asOptionalNumber(formData.get('power_watt')),
      memory_gb: asOptionalNumber(formData.get('memory_gb')),
      source_url: asOptionalString(formData.get('source_url')),
      notes: asOptionalString(formData.get('result_notes')),
      updated_by: session.user.id,
    };

    if (resultPayload.primary_value == null) {
      throw new Error('Primary result value is required.');
    }

    let variantId = asOptionalString(formData.get('variant_id'));
    let scenarioId = asOptionalString(formData.get('scenario_id'));

    if (variantId) {
      const { error } = await supabase.from('model_variants').update(variantPayload).eq('id', variantId);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('model_variants')
        .insert({
          ...variantPayload,
          created_by: session.user.id,
        })
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'Failed to create model variant.');
      }

      variantId = data.id;
    }

    if (scenarioId) {
      const { error } = await supabase
        .from('benchmark_scenarios')
        .update({
          ...scenarioPayload,
          model_variant_id: variantId,
        })
        .eq('id', scenarioId);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('benchmark_scenarios')
        .insert({
          ...scenarioPayload,
          model_variant_id: variantId,
          created_by: session.user.id,
        })
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'Failed to create benchmark scenario.');
      }

      scenarioId = data.id;
    }

    let savedResultId = resultId;

    if (resultId) {
      const { data: existing } = await supabase
        .from('benchmark_results')
        .select('id,manufacturer_id,status')
        .eq('id', resultId)
        .maybeSingle();

      if (!existing || !canManageManufacturer(session, existing.manufacturer_id)) {
        throw new Error('Benchmark result not found or access denied.');
      }

      const nextStatus = (existing.status as BenchmarkLifecycleStatus | null) ?? 'draft';
      assertStatusTransitionAllowed(session.profile.role === 'super_admin', nextStatus);

      const { error } = await supabase
        .from('benchmark_results')
        .update({
          ...resultPayload,
          scenario_id: scenarioId,
        })
        .eq('id', resultId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('benchmark_results')
        .insert({
          ...resultPayload,
          scenario_id: scenarioId,
          status: 'draft',
          created_by: session.user.id,
        })
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'Failed to create benchmark result.');
      }

      savedResultId = data.id;
    }

    const evidenceId = asOptionalString(formData.get('evidence_id'));
    const evidenceFilePath = asOptionalString(formData.get('evidence_file_path'));

    if (savedResultId) {
      if (evidenceFilePath) {
        const evidencePayload = {
          benchmark_result_id: savedResultId,
          kind: String(formData.get('evidence_kind') ?? 'artifact'),
          file_path: evidenceFilePath,
          title: asOptionalString(formData.get('evidence_title')),
          description: asOptionalString(formData.get('evidence_description')),
        };

        if (evidenceId) {
          const { error } = await supabase.from('benchmark_evidence').update(evidencePayload).eq('id', evidenceId);
          if (error) {
            throw new Error(error.message);
          }
        } else {
          const { error } = await supabase.from('benchmark_evidence').insert(evidencePayload);
          if (error) {
            throw new Error(error.message);
          }
        }
      } else if (evidenceId) {
        const { error } = await supabase.from('benchmark_evidence').delete().eq('id', evidenceId);
        if (error) {
          throw new Error(error.message);
        }
      }
    }

    revalidateBenchmarkRoutes(savedResultId ?? undefined, chipSource, chipId);
    redirect(`/console/benchmarks/${savedResultId}?message=Benchmark entry saved successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save benchmark entry.';
    redirect(`/console/benchmarks${resultId ? `/${resultId}` : '/new'}?error=${encodeURIComponent(message)}`);
  }
}

export async function changeBenchmarkStatusAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const resultId = String(formData.get('benchmark_result_id') ?? '');
  const nextStatus = String(formData.get('next_status') ?? '') as BenchmarkLifecycleStatus;

  if (!resultId) {
    redirect('/console/benchmarks?error=Missing benchmark result reference.');
  }

  try {
    assertStatusTransitionAllowed(session.profile.role === 'super_admin', nextStatus);

    const { data: existing } = await supabase
      .from('benchmark_results')
      .select('id,manufacturer_id,chip_source,chip_id')
      .eq('id', resultId)
      .maybeSingle();

    if (!existing || !canManageManufacturer(session, existing.manufacturer_id)) {
      throw new Error('Benchmark result not found or access denied.');
    }

    const { error } = await supabase
      .from('benchmark_results')
      .update({
        status: nextStatus,
        published_at: nextStatus === 'published' ? new Date().toISOString() : null,
        archived_at: nextStatus === 'archived' ? new Date().toISOString() : null,
        updated_by: session.user.id,
      })
      .eq('id', resultId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateBenchmarkRoutes(resultId, existing.chip_source, existing.chip_id);
    redirect(`/console/benchmarks/${resultId}?message=Benchmark status updated to ${nextStatus}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update benchmark status.';
    redirect(`/console/benchmarks/${resultId}?error=${encodeURIComponent(message)}`);
  }
}

export async function deleteBenchmarkAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const resultId = String(formData.get('benchmark_result_id') ?? '');

  if (!resultId) {
    redirect('/console/benchmarks?error=Missing benchmark result reference.');
  }

  try {
    const { data: existing } = await supabase
      .from('benchmark_results')
      .select('id,manufacturer_id,chip_source,chip_id')
      .eq('id', resultId)
      .maybeSingle();

    if (!existing || !canManageManufacturer(session, existing.manufacturer_id)) {
      throw new Error('Benchmark result not found or access denied.');
    }

    const { error } = await supabase.from('benchmark_results').delete().eq('id', resultId);
    if (error) {
      throw new Error(error.message);
    }

    revalidateBenchmarkRoutes(resultId, existing.chip_source, existing.chip_id);
    redirect('/console/benchmarks?message=Benchmark entry deleted successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete benchmark entry.';
    redirect(`/console/benchmarks/${resultId}?error=${encodeURIComponent(message)}`);
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireConsoleSession, canManageManufacturer } from '@/lib/console-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getChipTable, isChipSource, type ManagedChipSource } from '@/lib/chip-management';

type ChipLifecycleStatus = 'draft' | 'pending_review' | 'published' | 'archived';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

function getChipRedirectPath(source: ManagedChipSource, chipId?: string | null) {
  return chipId ? `/console/chips/${source}/${chipId}` : `/console/chips/${source}/new`;
}

async function resolveManufacturer(
  source: ManagedChipSource,
  chipId: string | null,
  manufacturerIdInput: string | null,
  manufacturerNameInput: string | null
) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();

  if (manufacturerIdInput) {
    const { data: manufacturer } = await supabase
      .from('manufacturers')
      .select('id,name')
      .eq('id', manufacturerIdInput)
      .maybeSingle();

    if (!manufacturer) {
      throw new Error('Manufacturer not found.');
    }

    if (!canManageManufacturer(session, manufacturer.id)) {
      throw new Error('You do not have permission to manage this manufacturer.');
    }

    return manufacturer;
  }

  if (!manufacturerNameInput) {
    throw new Error('Manufacturer is required.');
  }

  const slug = slugify(manufacturerNameInput);
  const { data: existing } = await supabase.from('manufacturers').select('id,name').eq('slug', slug).maybeSingle();

  if (existing) {
    if (!canManageManufacturer(session, existing.id) && session.profile.role !== 'super_admin') {
      throw new Error('You do not have permission to use this manufacturer.');
    }

    return existing;
  }

  if (session.profile.role !== 'super_admin') {
    throw new Error('Only admins can create new manufacturers during chip entry.');
  }

  const { data: created, error } = await supabase
    .from('manufacturers')
    .insert({
      name: manufacturerNameInput,
      slug,
    })
    .select('id,name')
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? 'Failed to create manufacturer.');
  }

  if (chipId && source) {
    revalidatePath(getChipRedirectPath(source, chipId));
  }

  return created;
}

function buildChipPayload(
  source: ManagedChipSource,
  manufacturer: { id: string; name: string },
  formData: FormData,
  actorId: string
) {
  const basePayload = {
    name: String(formData.get('name') ?? '').trim(),
    manufacturer: manufacturer.name,
    manufacturer_id: manufacturer.id,
    category: asOptionalString(formData.get('category')),
    process_node: asOptionalString(formData.get('process_node')),
    vram_gb: asOptionalNumber(formData.get('vram_gb')),
    tdp_watt: asOptionalNumber(formData.get('tdp_watt')),
    price_usd: asOptionalNumber(formData.get('price_usd')),
    release_date: asOptionalString(formData.get('release_date')),
    summary: asOptionalString(formData.get('summary')),
    source_url: asOptionalString(formData.get('source_url')),
    updated_by: actorId,
  };

  if (!basePayload.name) {
    throw new Error('Chip name is required.');
  }

  if (source === 'cloud') {
    return {
      ...basePayload,
      architecture: asOptionalString(formData.get('architecture')),
      form_factor: asOptionalString(formData.get('form_factor')),
      cooling_type: asOptionalString(formData.get('cooling_type')),
      vram_type: asOptionalString(formData.get('vram_type')),
      interconnect_bandwidth_gb_s: asOptionalNumber(formData.get('interconnect_bandwidth_gb_s')),
      tensor_core_count: asOptionalInteger(formData.get('tensor_core_count')),
      supported_precisions: asOptionalString(formData.get('supported_precisions')),
      fp16_tflops: asOptionalNumber(formData.get('fp16_tflops')),
      fp32_tflops: asOptionalNumber(formData.get('fp32_tflops')),
    };
  }

  return {
    ...basePayload,
    ai_tops: asOptionalNumber(formData.get('ai_tops')),
  };
}

function assertStatusTransitionAllowed(isAdmin: boolean, nextStatus: ChipLifecycleStatus) {
  if (isAdmin) {
    return;
  }

  if (nextStatus !== 'draft' && nextStatus !== 'pending_review') {
    throw new Error('Vendor accounts can only save drafts or submit for review.');
  }
}

function revalidateChipRoutes(source: ManagedChipSource, chipId?: string) {
  revalidatePath('/console');
  revalidatePath('/console/chips');
  revalidatePath('/chips');
  revalidatePath('/edge');
  revalidatePath('/benchmark/vision');
  revalidatePath('/benchmark/speech');
  revalidatePath('/benchmark/llm');
  revalidatePath('/architecture');
  revalidatePath('/chip-of-the-day');

  if (chipId) {
    revalidatePath(`/console/chips/${source}/${chipId}`);
    revalidatePath(source === 'cloud' ? `/chips/${chipId}` : `/edge/${chipId}`);
    revalidatePath(source === 'cloud' ? `/architecture/cloud/${chipId}` : `/architecture/edge/${chipId}`);
  }
}

export async function saveChipAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const source = String(formData.get('source') ?? '');
  const chipId = asOptionalString(formData.get('chip_id'));

  if (!isChipSource(source)) {
    redirect('/console/chips?error=Unsupported chip type.');
  }

  const redirectBase = getChipRedirectPath(source, chipId);

  try {
    const manufacturer = await resolveManufacturer(
      source,
      chipId,
      asOptionalString(formData.get('manufacturer_id')),
      asOptionalString(formData.get('manufacturer_name'))
    );
    const payload = buildChipPayload(source, manufacturer, formData, session.user.id);
    const table = getChipTable(source);

    if (chipId) {
      const { data: existing } = await supabase
        .from(table)
        .select('id,manufacturer_id,status')
        .eq('id', chipId)
        .maybeSingle();

      if (!existing || !canManageManufacturer(session, existing.manufacturer_id)) {
        throw new Error('Chip not found or access denied.');
      }

      const nextStatus = (existing.status as ChipLifecycleStatus | null) ?? 'draft';
      assertStatusTransitionAllowed(session.profile.role === 'super_admin', nextStatus);

      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', chipId);

      if (error) {
        throw new Error(error.message);
      }

      revalidateChipRoutes(source, chipId);
      redirect(`/console/chips/${source}/${chipId}?message=Chip updated successfully.`);
    }

    const initialStatus: ChipLifecycleStatus = session.profile.role === 'super_admin' ? 'draft' : 'draft';
    const { data: created, error } = await supabase
      .from(table)
      .insert({
        ...payload,
        status: initialStatus,
        created_by: session.user.id,
      })
      .select('id')
      .single();

    if (error || !created) {
      throw new Error(error?.message ?? 'Failed to create chip.');
    }

    revalidateChipRoutes(source, created.id);
    redirect(`/console/chips/${source}/${created.id}?message=Chip created successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save chip.';
    redirect(`${redirectBase}?error=${encodeURIComponent(message)}`);
  }
}

export async function changeChipStatusAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const source = String(formData.get('source') ?? '');
  const chipId = String(formData.get('chip_id') ?? '');
  const nextStatus = String(formData.get('next_status') ?? '') as ChipLifecycleStatus;

  if (!isChipSource(source) || !chipId) {
    redirect('/console/chips?error=Missing chip reference.');
  }

  try {
    assertStatusTransitionAllowed(session.profile.role === 'super_admin', nextStatus);

    const table = getChipTable(source);
    const { data: chip } = await supabase
      .from(table)
      .select('id,manufacturer_id')
      .eq('id', chipId)
      .maybeSingle();

    if (!chip || !canManageManufacturer(session, chip.manufacturer_id)) {
      throw new Error('Chip not found or access denied.');
    }

    const updatePayload: Record<string, string | null> = {
      status: nextStatus,
      published_at: nextStatus === 'published' ? new Date().toISOString() : null,
      archived_at: nextStatus === 'archived' ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from(table).update(updatePayload).eq('id', chipId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateChipRoutes(source, chipId);
    redirect(`/console/chips/${source}/${chipId}?message=Status updated to ${nextStatus}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update status.';
    redirect(`/console/chips/${source}/${chipId}?error=${encodeURIComponent(message)}`);
  }
}

export async function deleteChipAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const source = String(formData.get('source') ?? '');
  const chipId = String(formData.get('chip_id') ?? '');

  if (!isChipSource(source) || !chipId) {
    redirect('/console/chips?error=Missing chip reference.');
  }

  try {
    const table = getChipTable(source);
    const { data: chip } = await supabase
      .from(table)
      .select('id,manufacturer_id')
      .eq('id', chipId)
      .maybeSingle();

    if (!chip || !canManageManufacturer(session, chip.manufacturer_id)) {
      throw new Error('Chip not found or access denied.');
    }

    const { error } = await supabase.from(table).delete().eq('id', chipId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateChipRoutes(source, chipId);
    redirect('/console/chips?message=Chip deleted successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete chip.';
    redirect(`/console/chips/${source}/${chipId}?error=${encodeURIComponent(message)}`);
  }
}

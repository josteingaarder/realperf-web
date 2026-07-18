'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireConsoleSession } from '@/lib/console-auth';
import { slugify } from '@/lib/benchmark-management';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type ModelLifecycleStatus = 'draft' | 'published' | 'archived';

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

function revalidateModelRoutes(modelId?: string) {
  revalidatePath('/console');
  revalidatePath('/console/models');
  revalidatePath('/console/benchmarks');

  if (modelId) {
    revalidatePath(`/console/models/${modelId}`);
  }
}

export async function saveModelAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const modelId = asOptionalString(formData.get('model_id'));
  const name = String(formData.get('name') ?? '').trim();

  if (!name) {
    redirect(`/console/models${modelId ? `/${modelId}` : '/new'}?error=Model name is required.`);
  }

  const payload = {
    name,
    slug: slugify(name),
    category: String(formData.get('category') ?? '').trim(),
    vendor: asOptionalString(formData.get('vendor')),
    family: asOptionalString(formData.get('family')),
    parameter_size_b: asOptionalNumber(formData.get('parameter_size_b')),
    modality: asOptionalString(formData.get('modality')),
    description: asOptionalString(formData.get('description')),
    updated_by: session.user.id,
  };

  if (!payload.category) {
    redirect(`/console/models${modelId ? `/${modelId}` : '/new'}?error=Category is required.`);
  }

  try {
    if (modelId) {
      const { error } = await supabase.from('models').update(payload).eq('id', modelId);
      if (error) {
        throw new Error(error.message);
      }

      revalidateModelRoutes(modelId);
      redirect(`/console/models/${modelId}?message=Model updated successfully.`);
    }

    const { data, error } = await supabase
      .from('models')
      .insert({
        ...payload,
        created_by: session.user.id,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create model.');
    }

    revalidateModelRoutes(data.id);
    redirect(`/console/models/${data.id}?message=Model created successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save model.';
    redirect(`/console/models${modelId ? `/${modelId}` : '/new'}?error=${encodeURIComponent(message)}`);
  }
}

export async function changeModelStatusAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const modelId = String(formData.get('model_id') ?? '');
  const nextStatus = String(formData.get('next_status') ?? '') as ModelLifecycleStatus;

  if (!modelId) {
    redirect('/console/models?error=Missing model reference.');
  }

  try {
    const { error } = await supabase
      .from('models')
      .update({
        status: nextStatus,
        published_at: nextStatus === 'published' ? new Date().toISOString() : null,
        updated_by: session.user.id,
      })
      .eq('id', modelId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateModelRoutes(modelId);
    redirect(`/console/models/${modelId}?message=Model status updated to ${nextStatus}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update model status.';
    redirect(`/console/models/${modelId}?error=${encodeURIComponent(message)}`);
  }
}

export async function deleteModelAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const modelId = String(formData.get('model_id') ?? '');

  if (!modelId) {
    redirect('/console/models?error=Missing model reference.');
  }

  try {
    const { error } = await supabase.from('models').delete().eq('id', modelId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateModelRoutes(modelId);
    redirect('/console/models?message=Model deleted successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete model.';
    redirect(`/console/models/${modelId}?error=${encodeURIComponent(message)}`);
  }
}

import { changeModelStatusAction, deleteModelAction, saveModelAction } from '@/app/console/models/actions';

interface ModelEditorFormProps {
  model?: Record<string, unknown> | null;
}

function inputClassName() {
  return 'mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500';
}

function getStatusLabel(status: unknown) {
  if (typeof status === 'string' && status.length > 0) {
    return status.replace('_', ' ');
  }

  return 'draft';
}

export default function ModelEditorForm({ model }: ModelEditorFormProps) {
  const modelId = typeof model?.id === 'string' ? model.id : '';
  const isEditing = modelId.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Lifecycle</div>
            <div className="mt-2 text-2xl font-semibold text-white">{getStatusLabel(model?.status)}</div>
          </div>

          {isEditing ? (
            <div className="flex flex-wrap gap-3">
              <form action={changeModelStatusAction}>
                <input type="hidden" name="model_id" value={modelId} />
                <input type="hidden" name="next_status" value="draft" />
                <button
                  type="submit"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-500"
                >
                  Save As Draft
                </button>
              </form>
              <form action={changeModelStatusAction}>
                <input type="hidden" name="model_id" value={modelId} />
                <input type="hidden" name="next_status" value="published" />
                <button
                  type="submit"
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
                >
                  Publish
                </button>
              </form>
              <form action={changeModelStatusAction}>
                <input type="hidden" name="model_id" value={modelId} />
                <input type="hidden" name="next_status" value="archived" />
                <button
                  type="submit"
                  className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400"
                >
                  Archive
                </button>
              </form>
            </div>
          ) : (
            <div className="text-sm text-slate-400">New models start as drafts until they are published.</div>
          )}
        </div>
      </div>

      <form action={saveModelAction} className="space-y-6">
        <input type="hidden" name="model_id" value={modelId} />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-lg font-semibold text-white">Model Identity</div>
            <div className="mt-5 grid gap-5">
              <label className="block text-sm text-slate-300">
                Name
                <input
                  name="name"
                  required
                  defaultValue={typeof model?.name === 'string' ? model.name : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Category
                <input
                  name="category"
                  required
                  defaultValue={typeof model?.category === 'string' ? model.category : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Vendor
                <input
                  name="vendor"
                  defaultValue={typeof model?.vendor === 'string' ? model.vendor : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Family
                <input
                  name="family"
                  defaultValue={typeof model?.family === 'string' ? model.family : ''}
                  className={inputClassName()}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-lg font-semibold text-white">Capacity And Context</div>
            <div className="mt-5 grid gap-5">
              <label className="block text-sm text-slate-300">
                Parameter Size (B)
                <input
                  name="parameter_size_b"
                  inputMode="decimal"
                  defaultValue={model?.parameter_size_b == null ? '' : String(model.parameter_size_b)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Modality
                <input
                  name="modality"
                  defaultValue={typeof model?.modality === 'string' ? model.modality : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Description
                <textarea
                  name="description"
                  rows={8}
                  defaultValue={typeof model?.description === 'string' ? model.description : ''}
                  className={inputClassName()}
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
        >
          {isEditing ? 'Save Changes' : 'Create Draft'}
        </button>
      </form>

      {isEditing ? (
        <form action={deleteModelAction}>
          <input type="hidden" name="model_id" value={modelId} />
          <button
            type="submit"
            className="rounded-full border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-400"
          >
            Delete Model
          </button>
        </form>
      ) : null}
    </div>
  );
}

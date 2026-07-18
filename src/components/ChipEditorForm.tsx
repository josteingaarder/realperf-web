import type { ManufacturerOption } from '@/lib/chip-management';
import type { AppRole } from '@/lib/console-auth';
import { saveChipAction, changeChipStatusAction, deleteChipAction } from '@/app/console/chips/actions';

type ChipSource = 'cloud' | 'edge';

interface ChipEditorFormProps {
  source: ChipSource;
  chip?: Record<string, unknown> | null;
  manufacturers: ManufacturerOption[];
  actorRole: AppRole;
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

export default function ChipEditorForm({
  source,
  chip,
  manufacturers,
  actorRole,
}: ChipEditorFormProps) {
  const chipId = typeof chip?.id === 'string' ? chip.id : '';
  const manufacturerId = typeof chip?.manufacturer_id === 'string' ? chip.manufacturer_id : '';
  const manufacturerName = typeof chip?.manufacturer === 'string' ? chip.manufacturer : '';
  const isCloud = source === 'cloud';
  const isEditing = chipId.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Lifecycle</div>
            <div className="mt-2 text-2xl font-semibold text-white">{getStatusLabel(chip?.status)}</div>
          </div>

          {isEditing ? (
            <div className="flex flex-wrap gap-3">
              <form action={changeChipStatusAction}>
                <input type="hidden" name="source" value={source} />
                <input type="hidden" name="chip_id" value={chipId} />
                <input type="hidden" name="next_status" value="draft" />
                <button
                  type="submit"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-500"
                >
                  Save As Draft
                </button>
              </form>

              <form action={changeChipStatusAction}>
                <input type="hidden" name="source" value={source} />
                <input type="hidden" name="chip_id" value={chipId} />
                <input type="hidden" name="next_status" value="pending_review" />
                <button
                  type="submit"
                  className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-400"
                >
                  Submit For Review
                </button>
              </form>

              {actorRole === 'super_admin' ? (
                <form action={changeChipStatusAction}>
                  <input type="hidden" name="source" value={source} />
                  <input type="hidden" name="chip_id" value={chipId} />
                  <input type="hidden" name="next_status" value="published" />
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
                  >
                    Publish
                  </button>
                </form>
              ) : null}

              {actorRole === 'super_admin' ? (
                <form action={changeChipStatusAction}>
                  <input type="hidden" name="source" value={source} />
                  <input type="hidden" name="chip_id" value={chipId} />
                  <input type="hidden" name="next_status" value="archived" />
                  <button
                    type="submit"
                    className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400"
                  >
                    Archive
                  </button>
                </form>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-slate-400">New chips start as drafts until they are reviewed and published.</div>
          )}
        </div>
      </div>

      <form action={saveChipAction} className="space-y-6">
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="chip_id" value={chipId} />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-lg font-semibold text-white">Identity</div>
            <div className="mt-5 grid gap-5">
              <label className="block text-sm text-slate-300">
                Chip Name
                <input
                  name="name"
                  required
                  defaultValue={typeof chip?.name === 'string' ? chip.name : ''}
                  className={inputClassName()}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Manufacturer
                <select name="manufacturer_id" defaultValue={manufacturerId} className={inputClassName()}>
                  <option value="">Select a manufacturer</option>
                  {manufacturers.map((manufacturer) => (
                    <option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Manufacturer Name Override
                <input
                  name="manufacturer_name"
                  defaultValue={manufacturerName}
                  placeholder="Used when creating a new manufacturer as admin"
                  className={inputClassName()}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Category
                <input
                  name="category"
                  defaultValue={typeof chip?.category === 'string' ? chip.category : ''}
                  className={inputClassName()}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Release Date
                <input
                  name="release_date"
                  type="date"
                  defaultValue={typeof chip?.release_date === 'string' ? chip.release_date : ''}
                  className={inputClassName()}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Source URL
                <input
                  name="source_url"
                  type="url"
                  defaultValue={typeof chip?.source_url === 'string' ? chip.source_url : ''}
                  className={inputClassName()}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-lg font-semibold text-white">Commercial And Summary</div>
            <div className="mt-5 grid gap-5">
              <label className="block text-sm text-slate-300">
                Summary
                <textarea
                  name="summary"
                  rows={6}
                  defaultValue={typeof chip?.summary === 'string' ? chip.summary : ''}
                  className={inputClassName()}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Process Node
                <input
                  name="process_node"
                  defaultValue={typeof chip?.process_node === 'string' ? chip.process_node : ''}
                  className={inputClassName()}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Price In USD
                <input
                  name="price_usd"
                  inputMode="decimal"
                  defaultValue={chip?.price_usd == null ? '' : String(chip.price_usd)}
                  className={inputClassName()}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Power Draw In Watts
                <input
                  name="tdp_watt"
                  inputMode="decimal"
                  defaultValue={chip?.tdp_watt == null ? '' : String(chip.tdp_watt)}
                  className={inputClassName()}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Memory Capacity In GB
                <input
                  name="vram_gb"
                  inputMode="decimal"
                  defaultValue={chip?.vram_gb == null ? '' : String(chip.vram_gb)}
                  className={inputClassName()}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-lg font-semibold text-white">Technical Metrics</div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {isCloud ? (
              <>
                <label className="block text-sm text-slate-300">
                  Architecture
                  <input
                    name="architecture"
                    defaultValue={typeof chip?.architecture === 'string' ? chip.architecture : ''}
                    className={inputClassName()}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Form Factor
                  <input
                    name="form_factor"
                    defaultValue={typeof chip?.form_factor === 'string' ? chip.form_factor : ''}
                    className={inputClassName()}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Cooling Type
                  <input
                    name="cooling_type"
                    defaultValue={typeof chip?.cooling_type === 'string' ? chip.cooling_type : ''}
                    className={inputClassName()}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Memory Type
                  <input
                    name="vram_type"
                    defaultValue={typeof chip?.vram_type === 'string' ? chip.vram_type : ''}
                    className={inputClassName()}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  FP16 TFLOPS
                  <input
                    name="fp16_tflops"
                    inputMode="decimal"
                    defaultValue={chip?.fp16_tflops == null ? '' : String(chip.fp16_tflops)}
                    className={inputClassName()}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  FP32 TFLOPS
                  <input
                    name="fp32_tflops"
                    inputMode="decimal"
                    defaultValue={chip?.fp32_tflops == null ? '' : String(chip.fp32_tflops)}
                    className={inputClassName()}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Interconnect Bandwidth GB/s
                  <input
                    name="interconnect_bandwidth_gb_s"
                    inputMode="decimal"
                    defaultValue={
                      chip?.interconnect_bandwidth_gb_s == null ? '' : String(chip.interconnect_bandwidth_gb_s)
                    }
                    className={inputClassName()}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Tensor Core Count
                  <input
                    name="tensor_core_count"
                    inputMode="numeric"
                    defaultValue={chip?.tensor_core_count == null ? '' : String(chip.tensor_core_count)}
                    className={inputClassName()}
                  />
                </label>

                <label className="block text-sm text-slate-300 md:col-span-2 xl:col-span-3">
                  Supported Precisions
                  <input
                    name="supported_precisions"
                    defaultValue={typeof chip?.supported_precisions === 'string' ? chip.supported_precisions : ''}
                    className={inputClassName()}
                  />
                </label>
              </>
            ) : (
              <label className="block text-sm text-slate-300">
                AI TOPS
                <input
                  name="ai_tops"
                  inputMode="decimal"
                  defaultValue={chip?.ai_tops == null ? '' : String(chip.ai_tops)}
                  className={inputClassName()}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="submit"
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            {isEditing ? 'Save Changes' : 'Create Draft'}
          </button>
        </div>
      </form>

      {isEditing ? (
        <form action={deleteChipAction}>
          <input type="hidden" name="source" value={source} />
          <input type="hidden" name="chip_id" value={chipId} />
          <button
            type="submit"
            className="rounded-full border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-400"
          >
            Delete Chip
          </button>
        </form>
      ) : null}
    </div>
  );
}

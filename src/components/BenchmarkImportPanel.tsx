import Link from 'next/link';
import { importBenchmarksAction } from '@/app/console/benchmarks/actions';
import { BENCHMARK_IMPORT_HEADERS } from '@/lib/benchmark-import';

export default function BenchmarkImportPanel() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">Bulk import</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Import benchmark data from CSV</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Each row maps to one benchmark result entry. The importer auto-creates missing models, variants, and
            scenarios, then upserts the matching result for the selected chip and scenario combination.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/templates/benchmark-import-template.csv"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-500"
          >
            Download CSV Template
          </Link>
          <Link
            href="/templates/benchmark-import-h200-smoke-test.csv"
            className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            Download H200 Test CSV
          </Link>
          <Link
            href="/docs/benchmark-import-guide.txt"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-500"
          >
            Open Import Guide
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form action={importBenchmarksAction} className="rounded-2xl border border-slate-800 bg-black/30 p-5">
          <div className="text-sm font-medium text-white">Upload file</div>
          <p className="mt-2 text-sm text-slate-400">
            Supports `.csv` files exported from spreadsheets. Required columns must remain unchanged.
          </p>

          <label className="mt-5 block text-sm text-slate-300">
            CSV File
            <input
              type="file"
              name="csv_file"
              accept=".csv,text/csv"
              required
              className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
            />
          </label>

          <button
            type="submit"
            className="mt-5 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            Import Benchmark CSV
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800 bg-black/30 p-5">
          <div className="text-sm font-medium text-white">Expected columns</div>
          <p className="mt-2 text-sm text-slate-400">
            The template contains all supported fields. At minimum, keep chip reference, model fields, variant name,
            task fields, metric fields, and `primary_value`.
          </p>

          <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
            <code className="text-xs leading-6 text-slate-300">{BENCHMARK_IMPORT_HEADERS.join(', ')}</code>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>`chip_id` is preferred; otherwise use `chip_name` plus `chip_manufacturer`.</li>
            <li>`status` supports `draft`, `pending_review`, `published`, `archived`.</li>
            <li>Vendor accounts can only import `draft` or `pending_review` rows.</li>
            <li>Existing results are updated when `chip_source + chip_id + scenario` already exist.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

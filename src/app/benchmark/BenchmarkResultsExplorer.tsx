'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { BenchmarkCategory, PublicBenchmarkRow } from '@/lib/public-benchmarks';

interface BenchmarkResultsExplorerProps {
  category: BenchmarkCategory;
  rows: PublicBenchmarkRow[];
}

function getUniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function formatScenarioSummary(row: PublicBenchmarkRow) {
  const parts = [
    row.batchSize != null ? `Batch ${row.batchSize}` : null,
    row.sequenceLength != null ? `Seq ${row.sequenceLength}` : null,
    row.inputShape ?? null,
    row.inputResolution ? `Res ${row.inputResolution}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : 'Default scenario';
}

function formatValue(value: number | null, unit: string) {
  return value == null ? '—' : `${value.toLocaleString()} ${unit}`;
}

export default function BenchmarkResultsExplorer({ category, rows }: BenchmarkResultsExplorerProps) {
  const [chipSource, setChipSource] = useState<'all' | 'cloud' | 'edge'>('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedTaskType, setSelectedTaskType] = useState('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const modelOptions = useMemo(() => getUniqueValues(rows.map((row) => row.modelName)), [rows]);
  const frameworkOptions = useMemo(() => getUniqueValues(rows.map((row) => row.framework)), [rows]);
  const taskOptions = useMemo(() => getUniqueValues(rows.map((row) => row.taskType)), [rows]);
  const manufacturerOptions = useMemo(
    () => getUniqueValues(rows.map((row) => row.chipManufacturer)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      if (chipSource !== 'all' && row.chipSource !== chipSource) {
        return false;
      }

      if (selectedModel !== 'all' && row.modelName !== selectedModel) {
        return false;
      }

      if (selectedFramework !== 'all' && row.framework !== selectedFramework) {
        return false;
      }

      if (selectedTaskType !== 'all' && row.taskType !== selectedTaskType) {
        return false;
      }

      if (selectedManufacturer !== 'all' && row.chipManufacturer !== selectedManufacturer) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        row.chipName,
        row.chipManufacturer,
        row.modelName,
        row.variantName,
        row.framework,
        row.taskType,
        row.dataset,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [chipSource, rows, searchTerm, selectedFramework, selectedManufacturer, selectedModel, selectedTaskType]);

  const trackedModels = new Set(rows.map((row) => row.modelId).filter(Boolean)).size;
  const trackedChips = new Set(rows.map((row) => `${row.chipSource}:${row.chipId}`)).size;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm text-slate-500 mb-2">Tracked Models</div>
          <div className="text-3xl font-bold text-white">{trackedModels}</div>
          <div className="mt-2 text-sm text-slate-400">Published {category} models with active benchmark records</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm text-slate-500 mb-2">Result Rows</div>
          <div className="text-3xl font-bold text-white">{rows.length}</div>
          <div className="mt-2 text-sm text-slate-400">Each row represents one chip under one scenario definition</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm text-slate-500 mb-2">Chips Covered</div>
          <div className="text-3xl font-bold text-white">{trackedChips}</div>
          <div className="mt-2 text-sm text-slate-400">Cloud and edge accelerators with published benchmark results</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-300">Result filters</div>
            <p className="mt-1 text-sm text-slate-500">
              Narrow the result set by chip segment, model, framework, manufacturer, or task shape.
            </p>
          </div>
          <div className="rounded-full border border-slate-800 bg-black/40 px-4 py-2 text-sm text-slate-400">
            Showing {filteredRows.length} of {rows.length} rows
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="block text-sm text-slate-300">
            Search
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Chip, model, framework..."
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Segment
            <select
              value={chipSource}
              onChange={(event) => setChipSource(event.target.value as 'all' | 'cloud' | 'edge')}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            >
              <option value="all">All</option>
              <option value="cloud">Cloud</option>
              <option value="edge">Edge</option>
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Model
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            >
              <option value="all">All</option>
              {modelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Framework
            <select
              value={selectedFramework}
              onChange={(event) => setSelectedFramework(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            >
              <option value="all">All</option>
              {frameworkOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Task Type
            <select
              value={selectedTaskType}
              onChange={(event) => setSelectedTaskType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            >
              <option value="all">All</option>
              {taskOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Manufacturer
            <select
              value={selectedManufacturer}
              onChange={(event) => setSelectedManufacturer(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            >
              <option value="all">All</option>
              {manufacturerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredRows.length > 0 ? (
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-slate-700 bg-black/40 px-3 py-1 text-xs text-slate-300">
                      {row.chipSource === 'cloud' ? 'Cloud' : 'Edge'}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-black/40 px-3 py-1 text-xs text-slate-300">
                      {row.metricName}
                    </span>
                    {row.precision ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                        {row.precision}
                      </span>
                    ) : null}
                    {row.quantization ? (
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                        {row.quantization}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-start gap-4">
                    <div className="min-w-[220px]">
                      <div className="text-sm text-slate-500">Chip</div>
                      <Link href={row.chipHref} className="mt-1 block text-xl font-semibold text-white hover:text-emerald-400 transition">
                        {row.chipName}
                      </Link>
                      <div className="mt-1 text-sm text-slate-400">
                        {row.chipManufacturer ?? 'Unknown manufacturer'} · {row.chipPrimaryMetric}
                      </div>
                    </div>

                    <div className="min-w-[220px]">
                      <div className="text-sm text-slate-500">Model</div>
                      <div className="mt-1 text-xl font-semibold text-white">{row.modelName}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {row.variantName}
                        {row.modelVendor ? ` · ${row.modelVendor}` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[280px] grid-cols-2 gap-4 xl:w-[340px]">
                  <div className="rounded-xl border border-slate-800 bg-black/30 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Primary</div>
                    <div className="mt-2 text-2xl font-bold text-emerald-400">
                      {formatValue(row.primaryValue, row.metricUnit)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-black/30 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Throughput</div>
                    <div className="mt-2 text-2xl font-bold text-white">{formatValue(row.throughput, row.metricUnit)}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-black/30 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Latency P50</div>
                    <div className="mt-2 text-xl font-semibold text-white">{formatValue(row.latencyP50, 'ms')}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-black/30 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Power</div>
                    <div className="mt-2 text-xl font-semibold text-white">{formatValue(row.powerWatt, 'W')}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
                  <div className="text-sm font-medium text-white">Scenario Dimensions</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      {row.taskType}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      {row.framework}
                    </span>
                    {row.runtime ? (
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                        Runtime {row.runtime}
                      </span>
                    ) : null}
                    {row.compiler ? (
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                        Compiler {row.compiler}
                      </span>
                    ) : null}
                    {row.dataset ? (
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                        Dataset {row.dataset}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 text-sm text-slate-400">{formatScenarioSummary(row)}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
                  <div className="text-sm font-medium text-white">Secondary Metrics</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <div>Secondary: {formatValue(row.secondaryValue, row.metricUnit)}</div>
                    <div>Latency P99: {formatValue(row.latencyP99, 'ms')}</div>
                    <div>Memory: {formatValue(row.memoryGb, 'GB')}</div>
                    <div>Category: {row.chipCategory ?? '—'}</div>
                  </div>
                  {row.sourceUrl ? (
                    <Link href={row.sourceUrl} className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
                      View Source
                    </Link>
                  ) : null}
                </div>
              </div>

              {row.notes ? (
                <div className="mt-4 rounded-xl border border-slate-800 bg-black/20 p-4 text-sm text-slate-400">
                  {row.notes}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-10 text-center">
          <div className="text-lg font-semibold text-white">No results match the current filters</div>
          <p className="mt-3 text-sm text-slate-400">
            Try widening the selected segment, model, framework, or manufacturer filters.
          </p>
        </div>
      )}
    </div>
  );
}

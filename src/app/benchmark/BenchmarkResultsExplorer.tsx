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

function formatValue(value: number | null, unit: string) {
  return value == null ? '—' : `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
}

function isLowerBetter(metricName: string) {
  return /latency|ttft|time/i.test(metricName);
}

function pushCondition(parts: string[], label: string, value: string | number | boolean | null | undefined) {
  if (value == null) {
    return;
  }

  if (typeof value === 'string' && !value.trim()) {
    return;
  }

  if (typeof value === 'boolean') {
    parts.push(`${label} ${value ? 'Yes' : 'No'}`);
    return;
  }

  parts.push(`${label} ${value}`);
}

function buildScenarioConditions(row: PublicBenchmarkRow, category: BenchmarkCategory) {
  const parts: string[] = [];

  pushCondition(parts, 'Task', row.taskType);
  pushCondition(parts, 'Framework', row.framework);
  pushCondition(parts, 'Runtime', row.runtime);
  pushCondition(parts, 'Batch', row.batchSize);
  pushCondition(parts, 'Seq', row.sequenceLength);
  pushCondition(parts, 'Precision', row.precision);
  pushCondition(parts, 'Quant', row.quantization);
  pushCondition(parts, 'Variant', row.variantName);

  if (category === 'vision') {
    pushCondition(parts, 'Subtype', row.visionTaskSubtype);
    if (row.visionInputWidth != null && row.visionInputHeight != null) {
      parts.push(`Input ${row.visionInputWidth}x${row.visionInputHeight}`);
    } else {
      pushCondition(parts, 'Input', row.inputResolution ?? row.inputShape);
    }
    pushCondition(parts, 'FPS', row.visionVideoFps);
    pushCondition(parts, 'Channels', row.visionChannels);
  }

  if (category === 'speech') {
    pushCondition(parts, 'Subtype', row.speechTaskSubtype);
    pushCondition(parts, 'Audio', row.speechAudioDurationSec != null ? `${row.speechAudioDurationSec}s` : row.inputShape);
    pushCondition(parts, 'Sample Rate', row.speechSampleRateHz != null ? `${row.speechSampleRateHz}Hz` : null);
    pushCondition(parts, 'Streaming', row.speechStreaming);
    pushCondition(parts, 'Chunk', row.speechChunkDurationMs != null ? `${row.speechChunkDurationMs}ms` : null);
    pushCondition(parts, 'Language', row.speechLanguage);
  }

  if (category === 'llm') {
    pushCondition(parts, 'Mode', row.llmRequestMode);
    pushCondition(parts, 'Input Tokens', row.llmInputTokens);
    pushCondition(parts, 'Output Tokens', row.llmOutputTokens);
    pushCondition(parts, 'Concurrency', row.llmConcurrency);
    pushCondition(parts, 'Context', row.contextLength);
    pushCondition(parts, 'Decoding', row.llmDecodingStrategy);
  }

  return parts;
}

function buildScenarioLabel(row: PublicBenchmarkRow, category: BenchmarkCategory) {
  const parts: string[] = [row.taskType];

  if (category === 'vision') {
    parts.push(row.inputResolution ?? row.inputShape ?? `${row.visionInputWidth ?? '—'}x${row.visionInputHeight ?? '—'}`);
    if (row.batchSize != null) {
      parts.push(`BS${row.batchSize}`);
    }
    if (row.precision) {
      parts.push(row.precision);
    }
    if (row.quantization) {
      parts.push(row.quantization);
    }
    if (row.visionVideoFps != null) {
      parts.push(`${row.visionVideoFps} FPS`);
    }
  }

  if (category === 'speech') {
    if (row.speechTaskSubtype) {
      parts.push(row.speechTaskSubtype);
    }
    if (row.speechAudioDurationSec != null) {
      parts.push(`${row.speechAudioDurationSec}s`);
    } else if (row.inputShape) {
      parts.push(row.inputShape);
    }
    if (row.precision) {
      parts.push(row.precision);
    }
    if (row.quantization) {
      parts.push(row.quantization);
    }
    if (row.speechStreaming != null) {
      parts.push(row.speechStreaming ? 'Streaming' : 'Offline');
    }
  }

  if (category === 'llm') {
    if (row.llmRequestMode) {
      parts.push(row.llmRequestMode);
    }
    if (row.llmInputTokens != null || row.llmOutputTokens != null) {
      parts.push(`${row.llmInputTokens ?? '—'} in / ${row.llmOutputTokens ?? '—'} out`);
    }
    if (row.batchSize != null) {
      parts.push(`BS${row.batchSize}`);
    }
    if (row.llmConcurrency != null) {
      parts.push(`Conc ${row.llmConcurrency}`);
    }
    if (row.precision) {
      parts.push(row.precision);
    }
    if (row.quantization) {
      parts.push(row.quantization);
    }
  }

  parts.push(row.framework);
  return parts.filter(Boolean).join(' · ');
}

export default function BenchmarkResultsExplorer({ category, rows }: BenchmarkResultsExplorerProps) {
  const [chipSource, setChipSource] = useState<'all' | 'cloud' | 'edge'>('all');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');

  const modelOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    for (const row of rows) {
      if (row.modelId && !map.has(row.modelId)) {
        map.set(row.modelId, {
          id: row.modelId,
          name: row.modelName,
        });
      }
    }

    return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [rows]);

  const activeModelId = modelOptions.some((option) => option.id === selectedModelId)
    ? selectedModelId
    : (modelOptions[0]?.id ?? '');

  const modelRows = useMemo(() => rows.filter((row) => row.modelId === activeModelId), [activeModelId, rows]);

  const scenarioOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();

    for (const row of modelRows) {
      if (!map.has(row.scenarioId)) {
        map.set(row.scenarioId, {
          id: row.scenarioId,
          label: buildScenarioLabel(row, category),
        });
      }
    }

    return [...map.values()].sort((left, right) => left.label.localeCompare(right.label));
  }, [category, modelRows]);

  const activeScenarioId = scenarioOptions.some((option) => option.id === selectedScenarioId)
    ? selectedScenarioId
    : (scenarioOptions[0]?.id ?? '');

  const baseScenarioRows = useMemo(
    () => modelRows.filter((row) => row.scenarioId === activeScenarioId),
    [activeScenarioId, modelRows]
  );

  const manufacturerOptions = useMemo(() => getUniqueValues(baseScenarioRows.map((row) => row.chipManufacturer)), [baseScenarioRows]);

  const comparisonRows = useMemo(() => {
    const nextRows = baseScenarioRows.filter((row) => {
      if (chipSource !== 'all' && row.chipSource !== chipSource) {
        return false;
      }

      if (selectedManufacturer !== 'all' && row.chipManufacturer !== selectedManufacturer) {
        return false;
      }

      return true;
    });

    return nextRows.sort((left, right) => {
      if (left.metricName === right.metricName && isLowerBetter(left.metricName)) {
        return left.primaryValue - right.primaryValue;
      }

      return right.primaryValue - left.primaryValue;
    });
  }, [baseScenarioRows, chipSource, selectedManufacturer]);

  const activeScenarioReference = comparisonRows[0] ?? baseScenarioRows[0] ?? modelRows[0] ?? null;
  const trackedModels = modelOptions.length;
  const trackedChips = new Set(rows.map((row) => `${row.chipSource}:${row.chipId}`)).size;
  const comparableProfiles = new Set(rows.map((row) => row.scenarioId)).size;
  const scenarioConditions = activeScenarioReference ? buildScenarioConditions(activeScenarioReference, category) : [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm text-slate-500 mb-2">Tracked Models</div>
          <div className="text-3xl font-bold text-white">{trackedModels}</div>
          <div className="mt-2 text-sm text-slate-400">Published {category} models with active benchmark records</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm text-slate-500 mb-2">Comparable Profiles</div>
          <div className="text-3xl font-bold text-white">{comparableProfiles}</div>
          <div className="mt-2 text-sm text-slate-400">Each profile represents one model under one shared test condition</div>
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
            <div className="text-sm font-medium text-slate-300">Comparison controls</div>
            <p className="mt-1 text-sm text-slate-500">
              Select one model and one test profile, then compare all chips under the same benchmark condition.
            </p>
          </div>
          <div className="rounded-full border border-slate-800 bg-black/40 px-4 py-2 text-sm text-slate-400">
            Comparing {comparisonRows.length} chip results
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm text-slate-300">
            Model
            <select
              value={activeModelId}
              onChange={(event) => {
                setSelectedModelId(event.target.value);
                setSelectedScenarioId('');
                setSelectedManufacturer('all');
              }}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            >
              {modelOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Test Profile
            <select
              value={activeScenarioId}
              onChange={(event) => {
                setSelectedScenarioId(event.target.value);
                setSelectedManufacturer('all');
              }}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            >
              {scenarioOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
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

      {activeScenarioReference ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500">Selected model</div>
                <div className="mt-1 text-2xl font-semibold text-white">{activeScenarioReference.modelName}</div>
                <div className="mt-2 text-sm text-slate-400">
                  {activeScenarioReference.variantName}
                  {activeScenarioReference.modelVendor ? ` · ${activeScenarioReference.modelVendor}` : ''}
                </div>
              </div>
              <div className="rounded-full border border-slate-800 bg-black/40 px-4 py-2 text-sm text-slate-400">
                Primary metric: {activeScenarioReference.metricName} ({activeScenarioReference.metricUnit})
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {scenarioConditions.map((condition) => (
                <span
                  key={condition}
                  className="rounded-full border border-slate-700 bg-black/30 px-3 py-1 text-xs text-slate-300"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-950">
                  <th className="sticky left-0 border-b border-slate-800 bg-slate-950 p-4 text-left text-sm font-medium text-slate-500">
                    Chip
                  </th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">Segment</th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">Manufacturer</th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">
                    {activeScenarioReference.metricName}
                  </th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">Throughput</th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">Latency P50</th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">Latency P99</th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">Power</th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">Memory</th>
                  <th className="border-b border-slate-800 p-4 text-left text-sm font-medium text-slate-500">Source</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800/60 transition hover:bg-slate-900/30">
                    <td className="sticky left-0 bg-black p-4 align-top">
                      <Link href={row.chipHref} className="font-semibold text-white transition hover:text-emerald-400">
                        {row.chipName}
                      </Link>
                      <div className="mt-1 text-xs text-slate-400">{row.chipPrimaryMetric}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-300">{row.chipSource === 'cloud' ? 'Cloud' : 'Edge'}</td>
                    <td className="p-4 text-sm text-slate-300">{row.chipManufacturer ?? '—'}</td>
                    <td className="p-4 text-sm font-semibold text-emerald-400">{formatValue(row.primaryValue, row.metricUnit)}</td>
                    <td className="p-4 text-sm text-slate-200">{formatValue(row.throughput, row.metricUnit)}</td>
                    <td className="p-4 text-sm text-slate-200">{formatValue(row.latencyP50, 'ms')}</td>
                    <td className="p-4 text-sm text-slate-200">{formatValue(row.latencyP99, 'ms')}</td>
                    <td className="p-4 text-sm text-slate-200">{formatValue(row.powerWatt, 'W')}</td>
                    <td className="p-4 text-sm text-slate-200">{formatValue(row.memoryGb, 'GB')}</td>
                    <td className="p-4 text-sm text-slate-200">
                      {row.sourceUrl ? (
                        <Link href={row.sourceUrl} className="font-medium text-emerald-400 transition hover:text-emerald-300">
                          View Source
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-10 text-center">
          <div className="text-lg font-semibold text-white">No comparable results are available</div>
          <p className="mt-3 text-sm text-slate-400">
            Try selecting another model, test profile, or widening the selected chip segment.
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { BenchmarkCategory, PublicBenchmarkRow } from '@/lib/public-benchmarks';

interface BenchmarkResultsExplorerProps {
  category: BenchmarkCategory;
  rows: PublicBenchmarkRow[];
}

type FilterSection = 'core' | 'advanced';

type FilterConfig = {
  key: string;
  label: string;
  section: FilterSection;
  getValue: (row: PublicBenchmarkRow) => string | null;
};

function getUniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))].sort((left, right) => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);

    if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
      return leftNumber - rightNumber;
    }

    return left.localeCompare(right);
  });
}

function formatValue(value: number | null, unit: string) {
  return value == null ? '—' : `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
}

function isLowerBetter(metricName: string) {
  return /latency|ttft|time/i.test(metricName);
}

function stringifyNumber(value: number | null | undefined, suffix = '') {
  return value == null ? null : `${value}${suffix}`;
}

function stringifyBoolean(value: boolean | null | undefined, trueLabel: string, falseLabel: string) {
  if (value == null) {
    return null;
  }

  return value ? trueLabel : falseLabel;
}

function getVisionResolution(row: PublicBenchmarkRow) {
  if (row.visionInputWidth != null && row.visionInputHeight != null) {
    return `${row.visionInputWidth}x${row.visionInputHeight}`;
  }

  return row.inputResolution ?? row.inputShape ?? null;
}

function getSpeechDuration(row: PublicBenchmarkRow) {
  if (row.speechAudioDurationSec != null) {
    return `${row.speechAudioDurationSec}s`;
  }

  return row.inputShape ?? null;
}

function getCategoryFilterConfigs(category: BenchmarkCategory): FilterConfig[] {
  if (category === 'llm') {
    return [
      { key: 'task', label: 'Task', section: 'core', getValue: (row) => row.taskType },
      { key: 'requestMode', label: 'Request Mode', section: 'core', getValue: (row) => row.llmRequestMode },
      { key: 'inputTokens', label: 'Input Tokens', section: 'core', getValue: (row) => stringifyNumber(row.llmInputTokens) },
      { key: 'outputTokens', label: 'Output Tokens', section: 'core', getValue: (row) => stringifyNumber(row.llmOutputTokens) },
      { key: 'batchSize', label: 'Batch Size', section: 'core', getValue: (row) => stringifyNumber(row.batchSize) },
      { key: 'precision', label: 'Precision', section: 'core', getValue: (row) => row.precision },
      { key: 'quantization', label: 'Quantization', section: 'core', getValue: (row) => row.quantization },
      { key: 'framework', label: 'Framework', section: 'advanced', getValue: (row) => row.framework },
      { key: 'runtime', label: 'Runtime', section: 'advanced', getValue: (row) => row.runtime },
      { key: 'concurrency', label: 'Concurrency', section: 'advanced', getValue: (row) => stringifyNumber(row.llmConcurrency) },
      { key: 'contextLength', label: 'Context Length', section: 'advanced', getValue: (row) => stringifyNumber(row.contextLength) },
      { key: 'decoding', label: 'Decoding', section: 'advanced', getValue: (row) => row.llmDecodingStrategy },
      {
        key: 'rpsTarget',
        label: 'Requests/s Target',
        section: 'advanced',
        getValue: (row) => stringifyNumber(row.llmRequestsPerSecondTarget),
      },
    ];
  }

  if (category === 'vision') {
    return [
      {
        key: 'taskSubtype',
        label: 'Task',
        section: 'core',
        getValue: (row) => row.visionTaskSubtype ?? row.taskType,
      },
      { key: 'resolution', label: 'Input Resolution', section: 'core', getValue: getVisionResolution },
      { key: 'batchSize', label: 'Batch Size', section: 'core', getValue: (row) => stringifyNumber(row.batchSize) },
      { key: 'precision', label: 'Precision', section: 'core', getValue: (row) => row.precision },
      { key: 'quantization', label: 'Quantization', section: 'core', getValue: (row) => row.quantization },
      { key: 'framework', label: 'Framework', section: 'core', getValue: (row) => row.framework },
      { key: 'runtime', label: 'Runtime', section: 'advanced', getValue: (row) => row.runtime },
      { key: 'videoFps', label: 'Input FPS', section: 'advanced', getValue: (row) => stringifyNumber(row.visionVideoFps) },
      { key: 'channels', label: 'Channels', section: 'advanced', getValue: (row) => stringifyNumber(row.visionChannels) },
      { key: 'dataset', label: 'Dataset', section: 'advanced', getValue: (row) => row.dataset },
    ];
  }

  return [
    {
      key: 'taskSubtype',
      label: 'Task',
      section: 'core',
      getValue: (row) => row.speechTaskSubtype ?? row.taskType,
    },
    {
      key: 'streaming',
      label: 'Mode',
      section: 'core',
      getValue: (row) => stringifyBoolean(row.speechStreaming, 'Streaming', 'Offline'),
    },
    { key: 'duration', label: 'Audio Duration', section: 'core', getValue: getSpeechDuration },
    { key: 'sampleRate', label: 'Sample Rate', section: 'core', getValue: (row) => stringifyNumber(row.speechSampleRateHz, 'Hz') },
    { key: 'precision', label: 'Precision', section: 'core', getValue: (row) => row.precision },
    { key: 'quantization', label: 'Quantization', section: 'core', getValue: (row) => row.quantization },
    { key: 'framework', label: 'Framework', section: 'core', getValue: (row) => row.framework },
    { key: 'runtime', label: 'Runtime', section: 'advanced', getValue: (row) => row.runtime },
    { key: 'chunk', label: 'Chunk Duration', section: 'advanced', getValue: (row) => stringifyNumber(row.speechChunkDurationMs, 'ms') },
    { key: 'language', label: 'Language', section: 'advanced', getValue: (row) => row.speechLanguage },
    { key: 'decoding', label: 'Decoding', section: 'advanced', getValue: (row) => row.speechDecodingStrategy },
    { key: 'dataset', label: 'Dataset', section: 'advanced', getValue: (row) => row.dataset },
  ];
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
    pushCondition(parts, 'Input', getVisionResolution(row));
    pushCondition(parts, 'FPS', row.visionVideoFps);
    pushCondition(parts, 'Channels', row.visionChannels);
  }

  if (category === 'speech') {
    pushCondition(parts, 'Subtype', row.speechTaskSubtype);
    pushCondition(parts, 'Audio', getSpeechDuration(row));
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
    parts.push(getVisionResolution(row) ?? 'Default input');
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
    parts.push(getSpeechDuration(row) ?? 'Default audio');
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

function filterMatches(row: PublicBenchmarkRow, config: FilterConfig, value: string | undefined) {
  if (!value) {
    return true;
  }

  return config.getValue(row) === value;
}

function fallbackCopyToClipboard(value: string) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

export default function BenchmarkResultsExplorer({ category, rows }: BenchmarkResultsExplorerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const filterConfigs = useMemo(() => getCategoryFilterConfigs(category), [category]);
  const coreFilters = filterConfigs.filter((config) => config.section === 'core');
  const advancedFilters = filterConfigs.filter((config) => config.section === 'advanced');

  const selectedModelId = searchParams.get('model') ?? '';
  const selectedScenarioId = searchParams.get('profile') ?? '';
  const selectedManufacturer = searchParams.get('manufacturer') ?? 'all';
  const selectedSegment = searchParams.get('segment');
  const chipSource: 'all' | 'cloud' | 'edge' =
    selectedSegment === 'cloud' || selectedSegment === 'edge' ? selectedSegment : 'all';
  const selectedFilters = useMemo(
    () =>
      Object.fromEntries(
        filterConfigs.flatMap((config) => {
          const value = searchParams.get(`f_${config.key}`);
          return value ? [[config.key, value]] : [];
        })
      ) as Record<string, string>,
    [filterConfigs, searchParams]
  );

  const updateSearchParams = (mutator: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };
  const sharePath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  useEffect(() => {
    if (copyState === 'idle') {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCopyState('idle');
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [copyState]);

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

  const scenarioRecords = useMemo(() => {
    const map = new Map<string, PublicBenchmarkRow>();

    for (const row of modelRows) {
      if (!map.has(row.scenarioId)) {
        map.set(row.scenarioId, row);
      }
    }

    return [...map.values()];
  }, [modelRows]);

  const filterOptions = useMemo(() => {
    return Object.fromEntries(
      filterConfigs.map((config) => {
        const options = getUniqueValues(
          scenarioRecords
            .filter((row) =>
              filterConfigs.every((otherConfig) => {
                if (otherConfig.key === config.key) {
                  return true;
                }

                return filterMatches(row, otherConfig, selectedFilters[otherConfig.key]);
              })
            )
            .map((row) => config.getValue(row))
        );

        return [config.key, options];
      })
    ) as Record<string, string[]>;
  }, [filterConfigs, scenarioRecords, selectedFilters]);

  const matchingScenarioRecords = useMemo(() => {
    return scenarioRecords.filter((row) =>
      filterConfigs.every((config) => filterMatches(row, config, selectedFilters[config.key]))
    );
  }, [filterConfigs, scenarioRecords, selectedFilters]);

  const resolvedScenarioOptions = useMemo(() => {
    return matchingScenarioRecords
      .map((row) => ({
        id: row.scenarioId,
        label: buildScenarioLabel(row, category),
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [category, matchingScenarioRecords]);

  const activeScenarioId = resolvedScenarioOptions.some((option) => option.id === selectedScenarioId)
    ? selectedScenarioId
    : (resolvedScenarioOptions[0]?.id ?? '');

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

  const activeScenarioReference = comparisonRows[0] ?? baseScenarioRows[0] ?? matchingScenarioRecords[0] ?? modelRows[0] ?? null;
  const trackedModels = modelOptions.length;
  const trackedChips = new Set(rows.map((row) => `${row.chipSource}:${row.chipId}`)).size;
  const comparableProfiles = new Set(rows.map((row) => row.scenarioId)).size;
  const scenarioConditions = activeScenarioReference ? buildScenarioConditions(activeScenarioReference, category) : [];
  const selectedFilterBadges = filterConfigs
    .map((config) => {
      const value = selectedFilters[config.key];
      return value ? `${config.label}: ${value}` : null;
    })
    .filter((value): value is string => Boolean(value));
  const hasActiveAdvancedFilters = advancedFilters.some((config) => Boolean(selectedFilters[config.key]));

  const handleFilterChange = (key: string, value: string) => {
    updateSearchParams((params) => {
      if (value) {
        params.set(`f_${key}`, value);
      } else {
        params.delete(`f_${key}`);
      }

      params.delete('profile');
      params.delete('manufacturer');
    });
  };

  const resetFilters = () => {
    updateSearchParams((params) => {
      params.delete('profile');
      params.delete('manufacturer');
      params.delete('segment');
      for (const config of filterConfigs) {
        params.delete(`f_${config.key}`);
      }
    });
  };

  const handleCopyShareLink = async () => {
    const shareUrl =
      typeof window === 'undefined' ? sharePath : `${window.location.origin}${sharePath}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (!fallbackCopyToClipboard(shareUrl)) {
        throw new Error('Fallback copy failed');
      }

      setCopyState('copied');
    } catch {
      setCopyState(fallbackCopyToClipboard(shareUrl) ? 'copied' : 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="mb-2 text-sm text-slate-500">Tracked Models</div>
          <div className="text-3xl font-bold text-white">{trackedModels}</div>
          <div className="mt-2 text-sm text-slate-400">Published {category} models with active benchmark records</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="mb-2 text-sm text-slate-500">Comparable Profiles</div>
          <div className="text-3xl font-bold text-white">{comparableProfiles}</div>
          <div className="mt-2 text-sm text-slate-400">Core filters resolve into one shared benchmark profile before table rendering</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="mb-2 text-sm text-slate-500">Chips Covered</div>
          <div className="text-3xl font-bold text-white">{trackedChips}</div>
          <div className="mt-2 text-sm text-slate-400">Cloud and edge accelerators with published benchmark results</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-300">Comparison controls</div>
            <p className="mt-1 text-sm text-slate-500">
              Pick one model, refine high-frequency conditions in the core area, then use advanced filters only when you need deeper control.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-slate-800 bg-black/40 px-4 py-2 text-sm text-slate-400">
              Matching profiles {resolvedScenarioOptions.length}
            </div>
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200"
            >
              {copyState === 'copied'
                ? 'Link copied'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy Share Link'}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-white"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block text-sm text-slate-300 xl:col-span-3">
            Model
            <select
              value={activeModelId}
              onChange={(event) => {
                updateSearchParams((params) => {
                  params.set('model', event.target.value);
                  params.delete('profile');
                  params.delete('manufacturer');
                  for (const config of filterConfigs) {
                    params.delete(`f_${config.key}`);
                  }
                });
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
        </div>

        <div className="mt-6">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Core Conditions</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {coreFilters.map((config) => (
              <label key={config.key} className="block text-sm text-slate-300">
                {config.label}
                <select
                  value={selectedFilters[config.key] ?? ''}
                  onChange={(event) => handleFilterChange(config.key, event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="">All</option>
                  {(filterOptions[config.key] ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">Advanced Conditions</div>
              <p className="mt-1 text-sm text-slate-500">
                Expose lower-frequency benchmark knobs without crowding the default comparison flow.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced((current) => !current)}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-white"
            >
              {showAdvanced ? 'Hide advanced' : 'Show advanced'}
            </button>
          </div>

          {showAdvanced || hasActiveAdvancedFilters ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {advancedFilters.map((config) => (
                <label key={config.key} className="block text-sm text-slate-300">
                  {config.label}
                  <select
                    value={selectedFilters[config.key] ?? ''}
                    onChange={(event) => handleFilterChange(config.key, event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  >
                    <option value="">All</option>
                    {(filterOptions[config.key] ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resolvedScenarioOptions.length > 1 ? (
            <label className="block text-sm text-slate-300 xl:col-span-3">
              Resolved Profile
              <select
                value={activeScenarioId}
                onChange={(event) => {
                  updateSearchParams((params) => {
                    params.set('profile', event.target.value);
                    params.delete('manufacturer');
                  });
                }}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              >
                {resolvedScenarioOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm text-slate-300">
            Segment
            <select
              value={chipSource}
              onChange={(event) => {
                updateSearchParams((params) => {
                  const nextValue = event.target.value as 'all' | 'cloud' | 'edge';
                  if (nextValue === 'all') {
                    params.delete('segment');
                  } else {
                    params.set('segment', nextValue);
                  }
                });
              }}
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
              onChange={(event) => {
                updateSearchParams((params) => {
                  if (event.target.value === 'all') {
                    params.delete('manufacturer');
                  } else {
                    params.set('manufacturer', event.target.value);
                  }
                });
              }}
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

          <div className="rounded-xl border border-slate-800 bg-black/30 px-4 py-3 text-sm text-slate-400">
            Comparing {comparisonRows.length} chip results
          </div>
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
              {selectedFilterBadges.length > 0
                ? selectedFilterBadges.map((badge) => (
                    <span key={badge} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                      {badge}
                    </span>
                  ))
                : null}
              {scenarioConditions.map((condition) => (
                <span key={condition} className="rounded-full border border-slate-700 bg-black/30 px-3 py-1 text-xs text-slate-300">
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
            Try widening the selected conditions or reset the current filters to reopen more benchmark profiles.
          </p>
        </div>
      )}
    </div>
  );
}

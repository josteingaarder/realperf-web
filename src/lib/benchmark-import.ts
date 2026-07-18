import Papa from 'papaparse';
import { z } from 'zod';

export const BENCHMARK_IMPORT_HEADERS = [
  'chip_source',
  'chip_id',
  'chip_name',
  'chip_manufacturer',
  'model_name',
  'model_category',
  'model_vendor',
  'model_family',
  'parameter_size_b',
  'modality',
  'variant_name',
  'precision',
  'quantization',
  'context_length',
  'input_resolution',
  'weights_source_url',
  'task_type',
  'batch_size',
  'sequence_length',
  'input_shape',
  'dataset',
  'framework',
  'runtime',
  'compiler',
  'metric_name',
  'metric_unit',
  'primary_value',
  'secondary_value',
  'throughput',
  'latency_ms_p50',
  'latency_ms_p99',
  'power_watt',
  'memory_gb',
  'source_url',
  'result_notes',
  'evidence_kind',
  'evidence_file_path',
  'evidence_title',
  'evidence_description',
  'status',
] as const;

const benchmarkImportRowSchema = z.object({
  chip_source: z.enum(['cloud', 'edge']),
  chip_id: z.string().trim().optional().default(''),
  chip_name: z.string().trim().optional().default(''),
  chip_manufacturer: z.string().trim().optional().default(''),
  model_name: z.string().trim().min(1, 'model_name is required'),
  model_category: z.string().trim().min(1, 'model_category is required'),
  model_vendor: z.string().trim().optional().default(''),
  model_family: z.string().trim().optional().default(''),
  parameter_size_b: z.string().trim().optional().default(''),
  modality: z.string().trim().optional().default(''),
  variant_name: z.string().trim().min(1, 'variant_name is required'),
  precision: z.string().trim().optional().default(''),
  quantization: z.string().trim().optional().default(''),
  context_length: z.string().trim().optional().default(''),
  input_resolution: z.string().trim().optional().default(''),
  weights_source_url: z.string().trim().optional().default(''),
  task_type: z.string().trim().min(1, 'task_type is required'),
  batch_size: z.string().trim().optional().default(''),
  sequence_length: z.string().trim().optional().default(''),
  input_shape: z.string().trim().optional().default(''),
  dataset: z.string().trim().optional().default(''),
  framework: z.string().trim().min(1, 'framework is required'),
  runtime: z.string().trim().optional().default(''),
  compiler: z.string().trim().optional().default(''),
  metric_name: z.string().trim().min(1, 'metric_name is required'),
  metric_unit: z.string().trim().min(1, 'metric_unit is required'),
  primary_value: z.string().trim().min(1, 'primary_value is required'),
  secondary_value: z.string().trim().optional().default(''),
  throughput: z.string().trim().optional().default(''),
  latency_ms_p50: z.string().trim().optional().default(''),
  latency_ms_p99: z.string().trim().optional().default(''),
  power_watt: z.string().trim().optional().default(''),
  memory_gb: z.string().trim().optional().default(''),
  source_url: z.string().trim().optional().default(''),
  result_notes: z.string().trim().optional().default(''),
  evidence_kind: z.string().trim().optional().default('artifact'),
  evidence_file_path: z.string().trim().optional().default(''),
  evidence_title: z.string().trim().optional().default(''),
  evidence_description: z.string().trim().optional().default(''),
  status: z.string().trim().optional().default('draft'),
});

export type ParsedBenchmarkImportRow = z.infer<typeof benchmarkImportRowSchema> & {
  rowNumber: number;
};

function normalizeCsvCell(value: unknown) {
  if (value == null) {
    return '';
  }

  return String(value).trim();
}

export function parseBenchmarkImportCsv(csvText: string) {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    const firstError = parsed.errors[0];
    throw new Error(`CSV parse error on row ${firstError.row ?? '?'}: ${firstError.message}`);
  }

  const rows = parsed.data.map((rawRow, index) => {
    const normalizedRow = Object.fromEntries(
      BENCHMARK_IMPORT_HEADERS.map((header) => [header, normalizeCsvCell(rawRow[header])])
    );

    const validated = benchmarkImportRowSchema.safeParse(normalizedRow);

    if (!validated.success) {
      throw new Error(`CSV row ${index + 2}: ${validated.error.issues[0]?.message ?? 'Invalid row data.'}`);
    }

    if (!validated.data.chip_id && !validated.data.chip_name) {
      throw new Error(`CSV row ${index + 2}: chip_id or chip_name is required.`);
    }

    return {
      ...validated.data,
      rowNumber: index + 2,
    } satisfies ParsedBenchmarkImportRow;
  });

  if (rows.length === 0) {
    throw new Error('The CSV file is empty.');
  }

  return rows;
}

function parseOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
}

export function parseOptionalInteger(value: string) {
  const parsed = parseOptionalNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

export function parseOptionalDecimal(value: string) {
  return parseOptionalNumber(value);
}

export function parseOptionalText(value: string) {
  return value.trim() ? value.trim() : null;
}

// Generated by ts-to-zod
import { z } from 'zod';

export const histogramSchema = z.object({
  labels: z.array(z.string().nullable()),
  counts: z.array(z.number()),
  bin_edges: z.array(z.union([z.number(), z.string()])),
});

export const topkSchema = z.object({
  values: z.array(z.union([z.string(), z.number()])),
  counts: z.array(z.number()),
});

export const businessMetricSchema = z.object({
  name: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  grain: z.string().nullable(),
  dimensions: z.array(z.string()),
  headers: z.array(z.string()),
  data: z.array(z.array(z.union([z.string(), z.number()]).nullable())),
});

export const assertionTestSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  metric: z.string().optional().nullable(),
  table: z.string().nullable(),
  column: z.string().nullable(),
  tags: z.array(z.string()),
  status: z.union([z.literal('passed'), z.literal('failed')]),
  expected: z.unknown().optional(),
  actual: z.unknown().optional(),
  message: z.string().nullable(),
  display_name: z.string(),
  source: z.string(),
});

export const dataSourceSchema = z.object({
  name: z.string(),
  type: z.string(),
});

export const reconcileTableMetricsSchema = z.object({
  base_only: z.number(),
  target_only: z.number(),
  common: z.number(),
  status: z.boolean(),
});

export const reconcileColumnMetricsSchema = z.object({
  name: z.string(),
  generic_type: z.union([
    z.literal('string'),
    z.literal('numeric'),
    z.literal('integer'),
    z.literal('datetime'),
    z.literal('boolean'),
    z.literal('other'),
  ]),
  base_table: z.string(),
  base_column: z.string(),
  target_table: z.string(),
  target_column: z.string(),
  base_compare_key: z.string().optional(),
  target_compare_key: z.string().optional(),
  total: z.number().optional(),
  equal_raw: z.number().optional(),
  equal_raw_percentage: z.number().optional(),
  not_equal: z.number().optional(),
  not_equal_percentage: z.number().optional(),
  not_comparable: z.number().optional(),
  equal_case_insensitive: z.number().optional(),
  equal_case_insensitive_percentage: z.number().optional(),
  equal_trim_whitespace: z.number().optional(),
  equal_trim_whitespace_percentage: z.number().optional(),
  equal_within_5_difference: z.number().optional(),
  equal_within_10_difference: z.number().optional(),
  equal_within_1_day_difference: z.number().optional(),
  equal_within_1_week_difference: z.number().optional(),
  equal_within_1_month_difference: z.number().optional(),
});

export const columnSchemaSchema = z.object({
  total: z.number().optional(),
  samples: z.number().optional(),
  samples_p: z.number().optional(),
  nulls: z.number().optional(),
  nulls_p: z.number().optional(),
  non_nulls: z.number().optional(),
  non_nulls_p: z.number().optional(),
  distinct: z.number().optional(),
  distinct_p: z.number().optional(),
  duplicates: z.number().optional(),
  duplicates_p: z.number().optional(),
  non_duplicates: z.number().optional(),
  non_duplicates_p: z.number().optional(),
  histogram: histogramSchema.optional(),
  histogram_length: histogramSchema.optional(),
  topk: topkSchema.optional(),
  name: z.string(),
  description: z.string().optional(),
  type: z.union([
    z.literal('string'),
    z.literal('numeric'),
    z.literal('integer'),
    z.literal('datetime'),
    z.literal('boolean'),
    z.literal('other'),
  ]),
  schema_type: z.string(),
  valids: z.number().optional(),
  valids_p: z.number().optional(),
  invalids: z.number().optional(),
  invalids_p: z.number().optional(),
  zeros: z.number().optional(),
  zeros_p: z.number().optional(),
  negatives: z.number().optional(),
  negatives_p: z.number().optional(),
  positives: z.number().optional(),
  positives_p: z.number().optional(),
  zero_length: z.number().optional(),
  zero_length_p: z.number().optional(),
  non_zero_length: z.number().optional(),
  non_zero_length_p: z.number().optional(),
  trues: z.number().optional(),
  trues_p: z.number().optional(),
  falses: z.number().optional(),
  falses_p: z.number().optional(),
  profile_duration: z.string().optional(),
  elapsed_milli: z.number().optional(),
  sum: z.number().optional(),
  avg: z.number().optional(),
  avg_length: z.number().optional(),
  stddev: z.number().optional(),
  stddev_length: z.number().optional(),
  min: z.union([z.string(), z.number()]).optional(),
  min_length: z.number().optional(),
  max: z.union([z.string(), z.number()]).optional(),
  max_length: z.number().optional(),
  p5: z.number().optional(),
  p25: z.number().optional(),
  p50: z.number().optional(),
  p75: z.number().optional(),
  p95: z.number().optional(),
});

export const tableSchemaSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  row_count: z.number().optional(),
  duplicate_rows: z.number().optional(),
  duplicate_rows_p: z.number().optional(),
  samples: z.number().optional(),
  samples_p: z.number().optional(),
  created: z.string().optional(),
  last_altered: z.string().optional(),
  bytes: z.number().optional(),
  freshness: z.number().optional(),
  col_count: z.number().optional(),
  columns: z.record(columnSchemaSchema),
  profile_duration: z.string().optional(),
  elapsed_milli: z.number().optional(),
});

export const singleReportSchemaSchema = z.object({
  tables: z.record(tableSchemaSchema),
  metrics: z.array(businessMetricSchema).optional(),
  tests: z.array(assertionTestSchema).optional(),
  id: z.string(),
  project_id: z.string().optional(),
  user_id: z.string().optional(),
  version: z.string().optional(),
  metadata_version: z.string().optional(),
  created_at: z.string(),
  datasource: dataSourceSchema,
});

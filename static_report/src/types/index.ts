import { z } from 'zod';
import {
  columnSchemaSchema,
  singleReportSchemaSchema,
  tableSchemaSchema,
} from './../sdlc/single-report-schema.z';
import {
  ColumnSchema,
  SingleReportSchema,
  TableSchema,
} from '../sdlc/single-report-schema';
import { StringifyContext } from 'yaml/dist/stringify/stringify';

export * from '../sdlc';

export interface SaferSRSchema extends Omit<SingleReportSchema, 'tables'> {
  tables: { [k: string]: SaferTableSchema | undefined };
}
export interface SaferTableSchema extends Omit<TableSchema, 'columns'> {
  columns: { [k: string]: ColumnSchema | undefined };
}

export interface ReconcileColumnMetrics {
  name: string;
  generic_type:
    | 'string'
    | 'numeric'
    | 'integer'
    | 'datetime'
    | 'boolean'
    | 'other';
  /**
   * Metadata
   */
  description?: string;
  base_table: string;
  base_column: string;
  target_table: string;
  target_column: string;
  base_compare_key: string;
  target_compare_key: string;
  /**
   * Common statistics
   */
  total?: number;
  equal?: number;
  equal_percentage?: number;
  not_equal?: number;
  not_equal_percentage?: number;
  not_comparable?: number;
  /**
   * String type reconciliation statistics
   */
  equal_case_insensitive?: number;
  equal_case_insensitive_percentage?: string;
  equal_trim_whitespace?: number;
  equal_trim_whitespace_percentage?: string;
  /**
   * Number type reconciliation statistics
   */
  equal_within_5_difference?: number;
  equal_within_5_difference_percentage?: string;
  equal_within_10_difference_percentage?: string;
  equal_within_10_difference?: number;
  /**
   * Datetime type reconciliation statistics
   */
  equal_within_1_day_difference?: number;
  equal_within_1_week_difference?: number;
  equal_within_1_month_difference?: number;
  equal_within_1_day_difference_percentage?: string;
  equal_within_1_week_difference_percentage?: string;
  equal_within_1_month_difference_percentage?: string;
}

export interface ReconcileTableMetrics {
  base_only: number;
  target_only: number;
  common: number;
  not_comparable?: number;
  status?: boolean;
}

export interface ReconcileMetadata {
  name: string;
  description?: string;
  base_table: string;
  base_column: string;
  target_table: string;
  target_column: string;
}

export interface ReconcileResults {
  name: string;
  metadata: ReconcileMetadata;
  tables: ReconcileTableMetrics;
  columns: {
    [k: string]: ReconcileColumnMetrics;
  };
}

export interface ReconcileProfilingSchema {
  base: { [key: string]: TableSchema };
  target: { [key: string]: TableSchema };
}
export interface ReconcileReportSchema {
  // maps to reconcile.json structure
  id: string;
  project: string;
  created_at: string;
  description: string;
  profiling: ReconcileProfilingSchema; // table profiling result, same in run
  reconcile: ReconcileResults[]; // reconciliation result
}

export interface ComparisonReportSchema {
  base: SaferSRSchema;
  input: SaferSRSchema;
}

export type ComparsionSource = 'base' | 'target';

export type Selectable = {
  onSelect: ({
    tableName,
    columnName,
    reconcileName,
    ruleName,
  }: {
    tableName?: string;
    columnName?: string;
    reconcileName?: string;
    ruleName?: string;
  }) => void;
};

export type Comparable = {
  singleOnly?: boolean;
};

export type AssertionSource = 'piperider' | 'dbt';

export type ReportAssertionStatusCounts = {
  passed?: string | number;
  failed?: string | number;
  total?: string | number;
};
export interface ComparableData<T> {
  base?: T;
  target?: T;
  metadata?: {
    added?: number;
    deleted?: number;
    changed?: number;
  } & ComparableData<ReportAssertionStatusCounts>;
  reconcile?: ReconcileResults;
}

/**
 * console.warn only when error exists, for z.safeParse()
 * @param result Zod ReturnType
 */
export const zReport = (result) => {
  result.error && console.warn(result.error);
};

/**
 * This exists due to certain modifications needed on literal enum types (e.g. `type`); Also, for parts of the schema that are incorrect and need to be ignored
 * @param base the baseline value
 * @param target the `target` -- this value compared against your base
 * @param flag a flag that allows for escaping the newer `target`, and looking up with `input
 * @returns Zod validation object with {base, target}
 */
const zWrapForComparison = (base, target, flag?: boolean) =>
  z.object({ base, [flag ? 'input' : 'target']: target });

export const ZColSchema = columnSchemaSchema.optional();

export const ZTableSchema = tableSchemaSchema
  .merge(z.object({ columns: z.record(ZColSchema.optional()) }))
  .optional();

//TODO: temp bypass flag until `input` -> `target` on schema.json
export const ZComparisonTableSchema = (flag?: boolean) =>
  zWrapForComparison(ZTableSchema, ZTableSchema, flag);

export const ZSingleSchema = singleReportSchemaSchema.merge(
  z.object({ tables: z.record(ZTableSchema.optional()) }),
);

//TODO: temp bypass flag until `input` -> `target` on schema.json
export const ZComparisonSchema = (flag?: boolean) =>
  zWrapForComparison(ZSingleSchema, ZSingleSchema, flag);

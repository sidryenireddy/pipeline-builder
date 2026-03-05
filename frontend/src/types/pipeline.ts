export type TransformType =
  | "input"
  | "output"
  | "filter"
  | "join"
  | "union"
  | "aggregate"
  | "pivot"
  | "unpivot"
  | "rename"
  | "drop_columns"
  | "select_columns"
  | "cast"
  | "sort"
  | "deduplicate"
  | "expression"
  | "llm";

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  transforms: Transform[];
  edges: ApiEdge[];
}

export interface Transform {
  id: string;
  pipeline_id: string;
  type: TransformType;
  name: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
}

export interface ApiEdge {
  id: string;
  pipeline_id: string;
  source_transform_id: string;
  target_transform_id: string;
  source_port: string;
  target_port: string;
}

export interface Build {
  id: string;
  pipeline_id: string;
  branch_id: string;
  status: "pending" | "running" | "success" | "failed" | "canceled";
  triggered_by: string;
  started_at: string | null;
  finished_at: string | null;
  error: string;
}

export interface PreviewData {
  columns: string[];
  column_types: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  truncated: boolean;
}

export interface ColumnSchema {
  name: string;
  dtype: string;
}

export interface SchemaData {
  columns: ColumnSchema[];
}

export const FILTER_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "greater_equal", label: "Greater or Equal" },
  { value: "less_equal", label: "Less or Equal" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "is_null", label: "Is Null" },
  { value: "is_not_null", label: "Is Not Null" },
] as const;

export const AGG_FUNCTIONS = [
  { value: "sum", label: "Sum" },
  { value: "count", label: "Count" },
  { value: "mean", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "first", label: "First" },
  { value: "last", label: "Last" },
  { value: "count_distinct", label: "Count Distinct" },
] as const;

export const CAST_TYPES = [
  { value: "string", label: "String" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "timestamp", label: "Timestamp" },
] as const;

export const TRANSFORM_CATALOG: {
  type: TransformType;
  label: string;
  description: string;
  category: string;
}[] = [
  { type: "input", label: "Input Dataset", description: "Read a dataset from Data Connection", category: "Source" },
  { type: "output", label: "Output Dataset", description: "Write result as a new clean dataset", category: "Destination" },
  { type: "filter", label: "Filter", description: "Filter rows by condition", category: "Row" },
  { type: "sort", label: "Sort", description: "Sort rows", category: "Row" },
  { type: "deduplicate", label: "Deduplicate", description: "Remove duplicate rows", category: "Row" },
  { type: "join", label: "Join", description: "Join two datasets", category: "Combine" },
  { type: "union", label: "Union", description: "Stack datasets vertically", category: "Combine" },
  { type: "select_columns", label: "Select Columns", description: "Pick and reorder columns", category: "Column" },
  { type: "drop_columns", label: "Drop Columns", description: "Remove columns", category: "Column" },
  { type: "rename", label: "Rename", description: "Rename columns", category: "Column" },
  { type: "cast", label: "Cast", description: "Change column data types", category: "Column" },
  { type: "expression", label: "Add Column", description: "Add computed columns or case/when", category: "Column" },
  { type: "aggregate", label: "Aggregate", description: "Group and aggregate rows", category: "Reshape" },
  { type: "pivot", label: "Pivot", description: "Pivot rows into columns", category: "Reshape" },
  { type: "unpivot", label: "Unpivot", description: "Unpivot columns into rows", category: "Reshape" },
  { type: "llm", label: "LLM Transform", description: "AI-powered column generation", category: "AI" },
];

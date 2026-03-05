export type TransformType =
  | "input"
  | "output"
  | "filter"
  | "join"
  | "union"
  | "aggregate"
  | "pivot"
  | "rename"
  | "cast"
  | "sort"
  | "deduplicate"
  | "expression"
  | "llm";

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Transform {
  id: string;
  pipeline_id: string;
  branch_id: string;
  type: TransformType;
  name: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
}

export interface Edge {
  id: string;
  pipeline_id: string;
  branch_id: string;
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

export interface Schedule {
  id: string;
  pipeline_id: string;
  branch_id: string;
  cron: string;
  enabled: boolean;
}

export interface Branch {
  id: string;
  pipeline_id: string;
  name: string;
  parent_id: string | null;
  is_default: boolean;
}

export interface DataExpectation {
  id: string;
  transform_id: string;
  column: string;
  rule: string;
  config: Record<string, unknown>;
}

export interface PreviewData {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  truncated: boolean;
}

export const TRANSFORM_CATALOG: {
  type: TransformType;
  label: string;
  description: string;
  category: string;
}[] = [
  { type: "input", label: "Input Dataset", description: "Read a dataset from Data Connection", category: "Source" },
  { type: "output", label: "Output Dataset", description: "Write result as a new clean dataset", category: "Destination" },
  { type: "filter", label: "Filter", description: "Filter rows by condition", category: "Transform" },
  { type: "join", label: "Join", description: "Join two datasets", category: "Transform" },
  { type: "union", label: "Union", description: "Stack datasets vertically", category: "Transform" },
  { type: "aggregate", label: "Aggregate", description: "Group and aggregate rows", category: "Transform" },
  { type: "pivot", label: "Pivot", description: "Pivot rows into columns", category: "Transform" },
  { type: "rename", label: "Rename", description: "Rename columns", category: "Transform" },
  { type: "cast", label: "Cast", description: "Change column data types", category: "Transform" },
  { type: "sort", label: "Sort", description: "Sort rows", category: "Transform" },
  { type: "deduplicate", label: "Deduplicate", description: "Remove duplicate rows", category: "Transform" },
  { type: "expression", label: "Expression", description: "Add computed columns", category: "Transform" },
  { type: "llm", label: "LLM Transform", description: "AI-powered column generation", category: "AI" },
];

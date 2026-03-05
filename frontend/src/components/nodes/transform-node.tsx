"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TransformType } from "@/types/pipeline";

const TYPE_COLORS: Record<string, string> = {
  input: "border-l-green-600",
  output: "border-l-blue-600",
  filter: "border-l-amber-500",
  join: "border-l-purple-600",
  union: "border-l-purple-400",
  aggregate: "border-l-orange-500",
  pivot: "border-l-orange-400",
  unpivot: "border-l-orange-300",
  rename: "border-l-gray-500",
  drop_columns: "border-l-gray-400",
  select_columns: "border-l-gray-600",
  cast: "border-l-gray-400",
  sort: "border-l-cyan-500",
  deduplicate: "border-l-teal-500",
  expression: "border-l-indigo-500",
  llm: "border-l-rebel-red",
};

const TYPE_LABELS: Record<string, string> = {
  input: "INPUT",
  output: "OUTPUT",
  filter: "FILTER",
  join: "JOIN",
  union: "UNION",
  aggregate: "AGGREGATE",
  pivot: "PIVOT",
  unpivot: "UNPIVOT",
  rename: "RENAME",
  drop_columns: "DROP",
  select_columns: "SELECT",
  cast: "CAST",
  sort: "SORT",
  deduplicate: "DEDUP",
  expression: "EXPR",
  llm: "LLM",
};

function TransformNodeInner({ data, selected }: NodeProps) {
  const transformType = (data as any).transformType as TransformType;
  const label = (data as any).label as string;
  const borderClass = TYPE_COLORS[transformType] || "border-l-gray-400";
  const hasTarget = transformType !== "input";
  const hasSource = transformType !== "output";

  return (
    <div
      className={`min-w-[160px] rounded-lg border border-gray-200 border-l-4 bg-white px-3 py-2 shadow-sm transition-shadow ${borderClass} ${
        selected ? "ring-2 ring-rebel-red/20" : ""
      }`}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2.5 !w-2.5 !border-2 !border-gray-300 !bg-white"
        />
      )}

      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {TYPE_LABELS[transformType] || transformType}
      </div>
      <div className="mt-0.5 text-sm font-medium text-gray-900">
        {label}
      </div>

      {hasSource && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2.5 !w-2.5 !border-2 !border-gray-300 !bg-white"
        />
      )}
    </div>
  );
}

export const TransformNode = memo(TransformNodeInner);

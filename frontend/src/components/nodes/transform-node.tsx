"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TransformType } from "@/types/pipeline";

interface TransformNodeData {
  label: string;
  transformType: TransformType;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

const TYPE_COLORS: Record<string, string> = {
  input: "border-l-green-600",
  output: "border-l-blue-600",
  filter: "border-l-amber-500",
  join: "border-l-purple-600",
  union: "border-l-purple-400",
  aggregate: "border-l-orange-500",
  pivot: "border-l-orange-400",
  rename: "border-l-gray-500",
  cast: "border-l-gray-400",
  sort: "border-l-cyan-500",
  deduplicate: "border-l-teal-500",
  expression: "border-l-indigo-500",
  llm: "border-l-rebel-red",
};

export function TransformNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TransformNodeData;
  const borderClass = TYPE_COLORS[nodeData.transformType] || "border-l-gray-400";

  return (
    <div
      className={`min-w-[160px] rounded-lg border border-gray-200 border-l-4 bg-white px-3 py-2 shadow-sm transition-shadow ${borderClass} ${
        selected ? "ring-2 ring-rebel-red/20" : ""
      }`}
    >
      {nodeData.transformType !== "input" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2.5 !w-2.5 !border-2 !border-gray-300 !bg-white"
        />
      )}

      <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {nodeData.transformType}
      </div>
      <div className="mt-0.5 text-sm font-medium text-gray-900">
        {nodeData.label}
      </div>

      {nodeData.transformType !== "output" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2.5 !w-2.5 !border-2 !border-gray-300 !bg-white"
        />
      )}
    </div>
  );
}

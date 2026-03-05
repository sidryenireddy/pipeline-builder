"use client";

import { useEffect, useState, useCallback } from "react";
import { usePipelineStore, type TransformNodeData } from "@/hooks/use-pipeline-store";
import type {
  TransformType,
  ColumnSchema,
} from "@/types/pipeline";
import {
  FILTER_OPERATORS,
  AGG_FUNCTIONS,
  CAST_TYPES,
} from "@/types/pipeline";
import { api } from "@/lib/api";

// Shared input styles
const INPUT =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red";
const MONO_INPUT = INPUT + " font-mono";
const SELECT = INPUT;
const LABEL = "block text-xs font-medium text-gray-500";

function ColumnSelect({
  value,
  onChange,
  columns,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  columns: ColumnSchema[];
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
      <option value="">{placeholder || "Select column..."}</option>
      {columns.map((c) => (
        <option key={c.name} value={c.name}>
          {c.name} ({c.dtype})
        </option>
      ))}
    </select>
  );
}

function MultiColumnSelect({
  value,
  onChange,
  columns,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  columns: ColumnSchema[];
}) {
  return (
    <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-300 p-1">
      {columns.length === 0 && (
        <div className="px-2 py-1 text-xs text-gray-400">No columns available</div>
      )}
      {columns.map((c) => (
        <label key={c.name} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50">
          <input
            type="checkbox"
            checked={value.includes(c.name)}
            onChange={(e) => {
              if (e.target.checked) onChange([...value, c.name]);
              else onChange(value.filter((v) => v !== c.name));
            }}
            className="accent-rebel-red"
          />
          <span>{c.name}</span>
          <span className="ml-auto text-xs text-gray-400">{c.dtype}</span>
        </label>
      ))}
    </div>
  );
}

export function TransformPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const updateNode = usePipelineStore((s) => s.updateNode);
  const removeNode = usePipelineStore((s) => s.removeNode);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const setPreviewNodeId = usePipelineStore((s) => s.setPreviewNodeId);
  const setPreviewLoading = usePipelineStore((s) => s.setPreviewLoading);
  const setPreviewData = usePipelineStore((s) => s.setPreviewData);
  const pipelineId = usePipelineStore((s) => s.pipelineId);

  const [upstreamSchema, setUpstreamSchema] = useState<ColumnSchema[]>([]);
  const [secondInputSchema, setSecondInputSchema] = useState<ColumnSchema[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);

  const node = nodes.find((n) => n.id === selectedNodeId);

  // Fetch upstream schema when node is selected
  useEffect(() => {
    if (!node || !pipelineId) return;
    setLoadingSchema(true);

    // Get upstream nodes
    const upstreamEdges = edges.filter((e) => e.target === node.id);
    if (upstreamEdges.length === 0) {
      // For input nodes, check if they have data config
      if ((node.data as TransformNodeData).transformType === "input") {
        const config = (node.data as TransformNodeData).config;
        if (config.data && typeof config.data === "object") {
          const cols = Object.keys(config.data as Record<string, unknown>).map((k) => ({
            name: k,
            dtype: "string",
          }));
          setUpstreamSchema(cols);
        }
      }
      setLoadingSchema(false);
      return;
    }

    // Build DAG from current store state for engine schema call
    const dagTransforms = nodes.map((n) => ({
      id: n.id,
      type: (n.data as TransformNodeData).transformType,
      name: (n.data as TransformNodeData).label,
      config: (n.data as TransformNodeData).config,
    }));
    const dagEdges = edges.map((e) => ({
      source_id: e.source,
      target_id: e.target,
    }));
    const dag = {
      pipeline_id: pipelineId,
      branch_id: "main",
      transforms: dagTransforms,
      edges: dagEdges,
    };

    // Fetch schema of first upstream
    const firstUpstream = upstreamEdges[0];
    api.engine
      .schema(dag, firstUpstream.source)
      .then((res) => setUpstreamSchema(res.columns))
      .catch(() => setUpstreamSchema([]))
      .finally(() => setLoadingSchema(false));

    // For joins, fetch second input schema
    if (upstreamEdges.length >= 2) {
      api.engine
        .schema(dag, upstreamEdges[1].source)
        .then((res) => setSecondInputSchema(res.columns))
        .catch(() => setSecondInputSchema([]));
    } else {
      setSecondInputSchema([]);
    }
  }, [node?.id, pipelineId, edges.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreview = useCallback(() => {
    if (!node || !pipelineId) return;
    setPreviewNodeId(node.id);
    setPreviewLoading(true);
    setPreviewData(null);

    const dagTransforms = nodes.map((n) => ({
      id: n.id,
      type: (n.data as TransformNodeData).transformType,
      name: (n.data as TransformNodeData).label,
      config: (n.data as TransformNodeData).config,
    }));
    const dagEdges = edges.map((e) => ({
      source_id: e.source,
      target_id: e.target,
    }));

    api.engine
      .preview(
        { pipeline_id: pipelineId, branch_id: "main", transforms: dagTransforms, edges: dagEdges },
        node.id,
        50
      )
      .then((data) => setPreviewData(data))
      .catch((err) => setPreviewData({ columns: [], column_types: [], rows: [], row_count: 0, truncated: false }))
      .finally(() => setPreviewLoading(false));
  }, [node, pipelineId, nodes, edges, setPreviewNodeId, setPreviewLoading, setPreviewData]);

  if (!node) return null;

  const data = node.data as TransformNodeData;
  const config = data.config || {};
  const tType = data.transformType;

  function setConfig(patch: Record<string, unknown>) {
    updateNode(node!.id, { config: { ...config, ...patch } });
  }

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Configure Transform
        </h2>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          x
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Common: Type badge */}
          <div>
            <label className={LABEL}>Type</label>
            <div className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {tType}
            </div>
          </div>

          {/* Common: Name */}
          <div>
            <label className={LABEL}>Name</label>
            <input
              type="text"
              value={data.label}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
              className={INPUT}
            />
          </div>

          {loadingSchema && (
            <div className="text-xs text-gray-400">Loading schema...</div>
          )}

          {/* ---- FILTER ---- */}
          {tType === "filter" && (
            <>
              <div>
                <label className={LABEL}>Column</label>
                <ColumnSelect
                  value={(config.column as string) || ""}
                  onChange={(v) => setConfig({ column: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Operator</label>
                <select
                  value={(config.operator as string) || ""}
                  onChange={(e) => setConfig({ operator: e.target.value })}
                  className={SELECT}
                >
                  <option value="">Select operator...</option>
                  {FILTER_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              {config.operator &&
                config.operator !== "is_null" &&
                config.operator !== "is_not_null" && (
                  <div>
                    <label className={LABEL}>Value</label>
                    <input
                      type="text"
                      value={(config.value as string) ?? ""}
                      onChange={(e) => setConfig({ value: e.target.value })}
                      className={MONO_INPUT}
                      placeholder="Value..."
                    />
                  </div>
                )}
            </>
          )}

          {/* ---- JOIN ---- */}
          {tType === "join" && (
            <>
              <div>
                <label className={LABEL}>Join Type</label>
                <select
                  value={(config.how as string) || "inner"}
                  onChange={(e) => setConfig({ how: e.target.value })}
                  className={SELECT}
                >
                  <option value="inner">Inner</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="outer">Outer</option>
                  <option value="cross">Cross</option>
                </select>
              </div>
              {config.how !== "cross" && (
                <>
                  <div>
                    <label className={LABEL}>Left Join Keys</label>
                    <MultiColumnSelect
                      value={(config.left_on as string[]) || []}
                      onChange={(v) => setConfig({ left_on: v })}
                      columns={upstreamSchema}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Right Join Keys</label>
                    <MultiColumnSelect
                      value={(config.right_on as string[]) || []}
                      onChange={(v) => setConfig({ right_on: v })}
                      columns={secondInputSchema}
                    />
                  </div>
                </>
              )}
              <div>
                <label className={LABEL}>Conflict Suffixes</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={((config.suffixes as string[]) || ["_left", "_right"])[0]}
                    onChange={(e) =>
                      setConfig({
                        suffixes: [e.target.value, ((config.suffixes as string[]) || ["_left", "_right"])[1]],
                      })
                    }
                    className={MONO_INPUT + " w-1/2"}
                    placeholder="_left"
                  />
                  <input
                    type="text"
                    value={((config.suffixes as string[]) || ["_left", "_right"])[1]}
                    onChange={(e) =>
                      setConfig({
                        suffixes: [((config.suffixes as string[]) || ["_left", "_right"])[0], e.target.value],
                      })
                    }
                    className={MONO_INPUT + " w-1/2"}
                    placeholder="_right"
                  />
                </div>
              </div>
            </>
          )}

          {/* ---- UNION ---- */}
          {tType === "union" && (
            <div>
              <label className={LABEL}>Union Mode</label>
              <select
                value={(config.mode as string) || "by_name"}
                onChange={(e) => setConfig({ mode: e.target.value })}
                className={SELECT}
              >
                <option value="by_name">By Column Name</option>
                <option value="by_position">By Position</option>
              </select>
            </div>
          )}

          {/* ---- AGGREGATE ---- */}
          {tType === "aggregate" && (
            <>
              <div>
                <label className={LABEL}>Group By</label>
                <MultiColumnSelect
                  value={(config.group_by as string[]) || []}
                  onChange={(v) => setConfig({ group_by: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Aggregations</label>
                {((config.aggregations as any[]) || []).map((agg: any, i: number) => (
                  <div key={i} className="mt-1 flex items-center gap-1">
                    <ColumnSelect
                      value={agg.column || ""}
                      onChange={(v) => {
                        const aggs = [...((config.aggregations as any[]) || [])];
                        aggs[i] = { ...aggs[i], column: v };
                        setConfig({ aggregations: aggs });
                      }}
                      columns={upstreamSchema}
                      placeholder="Column..."
                    />
                    <select
                      value={agg.function || "count"}
                      onChange={(e) => {
                        const aggs = [...((config.aggregations as any[]) || [])];
                        aggs[i] = { ...aggs[i], function: e.target.value };
                        setConfig({ aggregations: aggs });
                      }}
                      className={SELECT + " w-28 flex-shrink-0"}
                    >
                      {AGG_FUNCTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const aggs = ((config.aggregations as any[]) || []).filter(
                          (_: any, j: number) => j !== i
                        );
                        setConfig({ aggregations: aggs });
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-rebel-red"
                    >
                      x
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setConfig({
                      aggregations: [
                        ...((config.aggregations as any[]) || []),
                        { column: "", function: "count" },
                      ],
                    })
                  }
                  className="mt-2 text-xs text-rebel-red hover:underline"
                >
                  + Add aggregation
                </button>
              </div>
            </>
          )}

          {/* ---- PIVOT ---- */}
          {tType === "pivot" && (
            <>
              <div>
                <label className={LABEL}>Group By (Index)</label>
                <MultiColumnSelect
                  value={(config.index as string[]) || []}
                  onChange={(v) => setConfig({ index: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Pivot Column</label>
                <ColumnSelect
                  value={(config.pivot_column as string) || ""}
                  onChange={(v) => setConfig({ pivot_column: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Value Column</label>
                <ColumnSelect
                  value={(config.value_column as string) || ""}
                  onChange={(v) => setConfig({ value_column: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Aggregation</label>
                <select
                  value={(config.aggfunc as string) || "mean"}
                  onChange={(e) => setConfig({ aggfunc: e.target.value })}
                  className={SELECT}
                >
                  {AGG_FUNCTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* ---- UNPIVOT ---- */}
          {tType === "unpivot" && (
            <>
              <div>
                <label className={LABEL}>ID Columns (keep)</label>
                <MultiColumnSelect
                  value={(config.id_columns as string[]) || []}
                  onChange={(v) => setConfig({ id_columns: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Value Columns (melt)</label>
                <MultiColumnSelect
                  value={(config.value_columns as string[]) || []}
                  onChange={(v) => setConfig({ value_columns: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Variable Name</label>
                <input
                  type="text"
                  value={(config.variable_name as string) || "variable"}
                  onChange={(e) => setConfig({ variable_name: e.target.value })}
                  className={MONO_INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Value Name</label>
                <input
                  type="text"
                  value={(config.value_name as string) || "value"}
                  onChange={(e) => setConfig({ value_name: e.target.value })}
                  className={MONO_INPUT}
                />
              </div>
            </>
          )}

          {/* ---- RENAME ---- */}
          {tType === "rename" && (
            <div>
              <label className={LABEL}>Renames</label>
              {((config.renames as any[]) || []).map((r: any, i: number) => (
                <div key={i} className="mt-1 flex items-center gap-1">
                  <ColumnSelect
                    value={r.from || ""}
                    onChange={(v) => {
                      const renames = [...((config.renames as any[]) || [])];
                      renames[i] = { ...renames[i], from: v };
                      setConfig({ renames });
                    }}
                    columns={upstreamSchema}
                    placeholder="From..."
                  />
                  <input
                    type="text"
                    value={r.to || ""}
                    onChange={(e) => {
                      const renames = [...((config.renames as any[]) || [])];
                      renames[i] = { ...renames[i], to: e.target.value };
                      setConfig({ renames });
                    }}
                    className={MONO_INPUT + " w-28 flex-shrink-0"}
                    placeholder="To..."
                  />
                  <button
                    onClick={() => {
                      const renames = ((config.renames as any[]) || []).filter(
                        (_: any, j: number) => j !== i
                      );
                      setConfig({ renames });
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-rebel-red"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setConfig({ renames: [...((config.renames as any[]) || []), { from: "", to: "" }] })
                }
                className="mt-2 text-xs text-rebel-red hover:underline"
              >
                + Add rename
              </button>
            </div>
          )}

          {/* ---- DROP COLUMNS ---- */}
          {tType === "drop_columns" && (
            <div>
              <label className={LABEL}>Columns to Drop</label>
              <MultiColumnSelect
                value={(config.columns as string[]) || []}
                onChange={(v) => setConfig({ columns: v })}
                columns={upstreamSchema}
              />
            </div>
          )}

          {/* ---- SELECT COLUMNS ---- */}
          {tType === "select_columns" && (
            <div>
              <label className={LABEL}>Columns to Keep (in order)</label>
              <MultiColumnSelect
                value={(config.columns as string[]) || []}
                onChange={(v) => setConfig({ columns: v })}
                columns={upstreamSchema}
              />
            </div>
          )}

          {/* ---- CAST ---- */}
          {tType === "cast" && (
            <div>
              <label className={LABEL}>Type Casts</label>
              {((config.casts as any[]) || []).map((c: any, i: number) => (
                <div key={i} className="mt-1 flex items-center gap-1">
                  <ColumnSelect
                    value={c.column || ""}
                    onChange={(v) => {
                      const casts = [...((config.casts as any[]) || [])];
                      casts[i] = { ...casts[i], column: v };
                      setConfig({ casts });
                    }}
                    columns={upstreamSchema}
                    placeholder="Column..."
                  />
                  <select
                    value={c.target_type || "string"}
                    onChange={(e) => {
                      const casts = [...((config.casts as any[]) || [])];
                      casts[i] = { ...casts[i], target_type: e.target.value };
                      setConfig({ casts });
                    }}
                    className={SELECT + " w-28 flex-shrink-0"}
                  >
                    {CAST_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const casts = ((config.casts as any[]) || []).filter(
                        (_: any, j: number) => j !== i
                      );
                      setConfig({ casts });
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-rebel-red"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setConfig({
                    casts: [...((config.casts as any[]) || []), { column: "", target_type: "string" }],
                  })
                }
                className="mt-2 text-xs text-rebel-red hover:underline"
              >
                + Add cast
              </button>
            </div>
          )}

          {/* ---- SORT ---- */}
          {tType === "sort" && (
            <div>
              <label className={LABEL}>Sort Rules</label>
              {((config.sorts as any[]) || []).map((s: any, i: number) => (
                <div key={i} className="mt-1 flex items-center gap-1">
                  <ColumnSelect
                    value={s.column || ""}
                    onChange={(v) => {
                      const sorts = [...((config.sorts as any[]) || [])];
                      sorts[i] = { ...sorts[i], column: v };
                      setConfig({ sorts });
                    }}
                    columns={upstreamSchema}
                    placeholder="Column..."
                  />
                  <select
                    value={s.ascending === false ? "desc" : "asc"}
                    onChange={(e) => {
                      const sorts = [...((config.sorts as any[]) || [])];
                      sorts[i] = { ...sorts[i], ascending: e.target.value === "asc" };
                      setConfig({ sorts });
                    }}
                    className={SELECT + " w-20 flex-shrink-0"}
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                  <button
                    onClick={() => {
                      const sorts = ((config.sorts as any[]) || []).filter(
                        (_: any, j: number) => j !== i
                      );
                      setConfig({ sorts });
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-rebel-red"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setConfig({
                    sorts: [...((config.sorts as any[]) || []), { column: "", ascending: true }],
                  })
                }
                className="mt-2 text-xs text-rebel-red hover:underline"
              >
                + Add sort column
              </button>
            </div>
          )}

          {/* ---- DEDUPLICATE ---- */}
          {tType === "deduplicate" && (
            <>
              <div>
                <label className={LABEL}>Deduplicate On (leave empty for all)</label>
                <MultiColumnSelect
                  value={(config.columns as string[]) || []}
                  onChange={(v) => setConfig({ columns: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Keep</label>
                <select
                  value={(config.keep as string) || "first"}
                  onChange={(e) => setConfig({ keep: e.target.value })}
                  className={SELECT}
                >
                  <option value="first">First</option>
                  <option value="last">Last</option>
                </select>
              </div>
            </>
          )}

          {/* ---- EXPRESSION / ADD COLUMN ---- */}
          {tType === "expression" && (
            <>
              <div>
                <label className={LABEL}>Output Column</label>
                <input
                  type="text"
                  value={(config.output_column as string) || ""}
                  onChange={(e) => setConfig({ output_column: e.target.value })}
                  className={MONO_INPUT}
                  placeholder="new_column"
                />
              </div>
              <div>
                <label className={LABEL}>Expression</label>
                <input
                  type="text"
                  value={(config.expression as string) || ""}
                  onChange={(e) => setConfig({ expression: e.target.value })}
                  className={MONO_INPUT}
                  placeholder="e.g. price * quantity"
                />
                <div className="mt-1 text-[10px] text-gray-400">
                  Available: {upstreamSchema.map((c) => c.name).join(", ") || "connect an input"}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <label className={LABEL}>Or use Case/When</label>
                {((config.case_when as any[]) || []).map((clause: any, i: number) => (
                  <div key={i} className="mt-1 flex items-center gap-1">
                    <input
                      type="text"
                      value={clause.condition || ""}
                      onChange={(e) => {
                        const cw = [...((config.case_when as any[]) || [])];
                        cw[i] = { ...cw[i], condition: e.target.value };
                        setConfig({ case_when: cw });
                      }}
                      className={MONO_INPUT + " w-1/2"}
                      placeholder={i === ((config.case_when as any[]) || []).length - 1 ? "else" : "condition"}
                    />
                    <input
                      type="text"
                      value={clause.value || ""}
                      onChange={(e) => {
                        const cw = [...((config.case_when as any[]) || [])];
                        cw[i] = { ...cw[i], value: e.target.value };
                        setConfig({ case_when: cw });
                      }}
                      className={MONO_INPUT + " w-1/2"}
                      placeholder="value"
                    />
                    <button
                      onClick={() => {
                        const cw = ((config.case_when as any[]) || []).filter(
                          (_: any, j: number) => j !== i
                        );
                        setConfig({ case_when: cw });
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-rebel-red"
                    >
                      x
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setConfig({
                      case_when: [...((config.case_when as any[]) || []), { condition: "", value: "" }],
                    })
                  }
                  className="mt-2 text-xs text-rebel-red hover:underline"
                >
                  + Add case
                </button>
              </div>
            </>
          )}

          {/* ---- LLM ---- */}
          {tType === "llm" && (
            <>
              <div>
                <label className={LABEL}>Prompt Template</label>
                <textarea
                  placeholder="Classify the following text: {description}"
                  value={(config.prompt_template as string) || ""}
                  onChange={(e) => setConfig({ prompt_template: e.target.value })}
                  rows={3}
                  className={INPUT}
                />
                <div className="mt-1 text-[10px] text-gray-400">
                  Use {"{column_name}"} to reference columns
                </div>
              </div>
              <div>
                <label className={LABEL}>Input Columns</label>
                <MultiColumnSelect
                  value={(config.input_columns as string[]) || []}
                  onChange={(v) => setConfig({ input_columns: v })}
                  columns={upstreamSchema}
                />
              </div>
              <div>
                <label className={LABEL}>Output Column</label>
                <input
                  type="text"
                  value={(config.output_column as string) || "llm_result"}
                  onChange={(e) => setConfig({ output_column: e.target.value })}
                  className={MONO_INPUT}
                />
              </div>
            </>
          )}

          {/* ---- INPUT ---- */}
          {tType === "input" && (
            <div>
              <label className={LABEL}>Dataset ID</label>
              <input
                type="text"
                value={(config.dataset_id as string) || ""}
                onChange={(e) => setConfig({ dataset_id: e.target.value })}
                className={INPUT}
                placeholder="From Data Connection..."
              />
            </div>
          )}

          {/* ---- OUTPUT ---- */}
          {tType === "output" && (
            <div>
              <label className={LABEL}>Output Dataset Name</label>
              <input
                type="text"
                value={(config.output_name as string) || ""}
                onChange={(e) => setConfig({ output_name: e.target.value })}
                className={INPUT}
                placeholder="clean_sales_data"
              />
            </div>
          )}
        </div>

        {/* Preview button */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <button
            onClick={handlePreview}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Preview Data
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => {
            removeNode(node.id);
            selectNode(null);
          }}
          className="w-full rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-rebel-red transition-colors hover:bg-red-50"
        >
          Remove Transform
        </button>
      </div>
    </div>
  );
}

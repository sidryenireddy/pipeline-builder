"use client";

import { usePipelineStore } from "@/hooks/use-pipeline-store";

export function TransformPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const updateNode = usePipelineStore((s) => s.updateNode);
  const removeNode = usePipelineStore((s) => s.removeNode);
  const selectNode = usePipelineStore((s) => s.selectNode);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const data = node.data as any;

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Configure Transform
        </h2>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          x
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">
              Type
            </label>
            <div className="mt-1 text-sm font-medium text-gray-900">
              {data.transformType}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500">
              Name
            </label>
            <input
              type="text"
              value={data.label}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
            />
          </div>

          {data.transformType === "filter" && (
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Condition
              </label>
              <input
                type="text"
                placeholder="e.g. age > 18"
                value={(data.config?.condition as string) || ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    config: { ...data.config, condition: e.target.value },
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
              />
            </div>
          )}

          {data.transformType === "join" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Join Type
                </label>
                <select
                  value={(data.config?.how as string) || "inner"}
                  onChange={(e) =>
                    updateNode(node.id, {
                      config: { ...data.config, how: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
                >
                  <option value="inner">Inner</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="outer">Outer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Join Columns (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. id, name"
                  value={(data.config?.on as string) || ""}
                  onChange={(e) =>
                    updateNode(node.id, {
                      config: { ...data.config, on: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
                />
              </div>
            </>
          )}

          {data.transformType === "expression" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Output Column
                </label>
                <input
                  type="text"
                  placeholder="new_column"
                  value={(data.config?.output_column as string) || ""}
                  onChange={(e) =>
                    updateNode(node.id, {
                      config: { ...data.config, output_column: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Expression
                </label>
                <input
                  type="text"
                  placeholder="e.g. price * quantity"
                  value={(data.config?.expression as string) || ""}
                  onChange={(e) =>
                    updateNode(node.id, {
                      config: { ...data.config, expression: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
                />
              </div>
            </>
          )}

          {data.transformType === "llm" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Prompt Template
                </label>
                <textarea
                  placeholder="Classify the following text: {description}"
                  value={(data.config?.prompt_template as string) || ""}
                  onChange={(e) =>
                    updateNode(node.id, {
                      config: {
                        ...data.config,
                        prompt_template: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Output Column
                </label>
                <input
                  type="text"
                  placeholder="llm_result"
                  value={(data.config?.output_column as string) || ""}
                  onChange={(e) =>
                    updateNode(node.id, {
                      config: {
                        ...data.config,
                        output_column: e.target.value,
                      },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
                />
              </div>
            </>
          )}

          {data.transformType === "sort" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Sort By (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. created_at, name"
                  value={(data.config?.by as string) || ""}
                  onChange={(e) =>
                    updateNode(node.id, {
                      config: { ...data.config, by: e.target.value },
                    })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-rebel-red focus:outline-none focus:ring-1 focus:ring-rebel-red"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(data.config?.ascending as boolean) ?? true}
                  onChange={(e) =>
                    updateNode(node.id, {
                      config: { ...data.config, ascending: e.target.checked },
                    })
                  }
                  className="accent-rebel-red"
                />
                <label className="text-sm text-gray-700">Ascending</label>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <button className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
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

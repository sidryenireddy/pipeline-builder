"use client";

import { TRANSFORM_CATALOG, type TransformType } from "@/types/pipeline";
import { usePipelineStore } from "@/hooks/use-pipeline-store";

export function Sidebar() {
  const addNode = usePipelineStore((s) => s.addNode);
  const pipelineName = usePipelineStore((s) => s.pipelineName);
  const undoStack = usePipelineStore((s) => s.undoStack);
  const redoStack = usePipelineStore((s) => s.redoStack);
  const undo = usePipelineStore((s) => s.undo);
  const redo = usePipelineStore((s) => s.redo);

  function handleAddTransform(type: TransformType, label: string) {
    const id = crypto.randomUUID();
    addNode({
      id,
      type: "transformNode",
      position: { x: 250 + Math.random() * 200, y: 100 + Math.random() * 300 },
      data: {
        label,
        transformType: type,
        config: {},
      },
    });
  }

  function handleDragStart(e: React.DragEvent, type: TransformType, label: string) {
    e.dataTransfer.setData("application/pipeline-transform", JSON.stringify({ type, label }));
    e.dataTransfer.effectAllowed = "move";
  }

  const categories = [...new Set(TRANSFORM_CATALOG.map((t) => t.category))];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-rebel-sidebar text-white">
      <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-rebel-red text-xs font-bold">
          R
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">
            {pipelineName}
          </div>
          <div className="text-[10px] text-gray-500">Pipeline Builder</div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-800 px-3 py-2">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="rounded p-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Cmd+Z)"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="rounded p-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Cmd+Shift+Z)"
        >
          Redo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-3 px-1 text-[10px] font-medium uppercase tracking-widest text-gray-600">
          Transforms
        </div>
        {categories.map((cat) => (
          <div key={cat} className="mb-3">
            <h3 className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
              {cat}
            </h3>
            <div className="space-y-0.5">
              {TRANSFORM_CATALOG.filter((t) => t.category === cat).map((t) => (
                <button
                  key={t.type}
                  draggable
                  onClick={() => handleAddTransform(t.type, t.label)}
                  onDragStart={(e) => handleDragStart(e, t.type, t.label)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white cursor-grab active:cursor-grabbing"
                  title={t.description}
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rebel-red" />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800 px-4 py-3">
        <button className="w-full rounded-md bg-rebel-red px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rebel-red-dark">
          Build Pipeline
        </button>
      </div>
    </aside>
  );
}

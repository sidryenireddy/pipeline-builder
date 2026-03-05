"use client";

import Image from "next/image";
import { TRANSFORM_CATALOG, type TransformType } from "@/types/pipeline";
import { usePipelineStore } from "@/hooks/use-pipeline-store";

export function Sidebar() {
  const addNode = usePipelineStore((s) => s.addNode);

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

  const categories = [...new Set(TRANSFORM_CATALOG.map((t) => t.category))];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-rebel-sidebar text-white">
      <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-4">
        <Image
          src="/rebelicon.png"
          alt="Rebel Inc."
          width={28}
          height={28}
          className="rounded"
        />
        <span className="text-sm font-semibold tracking-tight">
          Pipeline Builder
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {categories.map((cat) => (
          <div key={cat} className="mb-4">
            <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              {cat}
            </h3>
            <div className="space-y-1">
              {TRANSFORM_CATALOG.filter((t) => t.category === cat).map((t) => (
                <button
                  key={t.type}
                  onClick={() => handleAddTransform(t.type, t.label)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rebel-red" />
                  {t.label}
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

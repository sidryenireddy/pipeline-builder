"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { PipelineEditor } from "@/components/pipeline/pipeline-editor";
import { TransformPanel } from "@/components/panels/transform-panel";
import { usePipelineStore } from "@/hooks/use-pipeline-store";

export default function Home() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden">
        <PipelineEditor />
        {selectedNodeId && <TransformPanel />}
      </main>
    </div>
  );
}

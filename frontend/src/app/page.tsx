"use client";

import { useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PipelineEditor } from "@/components/pipeline/pipeline-editor";
import { TransformPanel } from "@/components/panels/transform-panel";
import { DataPreview } from "@/components/panels/data-preview";
import { usePipelineStore } from "@/hooks/use-pipeline-store";
import { api } from "@/lib/api";

export default function Home() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const previewNodeId = usePipelineStore((s) => s.previewNodeId);
  const pipelineId = usePipelineStore((s) => s.pipelineId);
  const loadPipeline = usePipelineStore((s) => s.loadPipeline);
  const setPipelineId = usePipelineStore((s) => s.setPipelineId);
  const undo = usePipelineStore((s) => s.undo);
  const redo = usePipelineStore((s) => s.redo);

  // Create or load pipeline on mount
  useEffect(() => {
    if (pipelineId) return;
    // Check URL for pipeline ID
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      loadPipeline(id);
    } else {
      // Create a new pipeline
      api.pipelines
        .create({ name: "Untitled Pipeline", description: "" })
        .then((p) => {
          setPipelineId(p.id);
          window.history.replaceState(null, "", `?id=${p.id}`);
        });
    }
  }, [pipelineId, loadPipeline, setPipelineId]);

  // Keyboard shortcuts: undo/redo
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    },
    [undo, redo]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <PipelineEditor />
          {selectedNodeId && <TransformPanel />}
        </div>
        {previewNodeId && <DataPreview />}
      </main>
    </div>
  );
}

"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeTypes,
  type NodeChange,
  type EdgeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TransformNode } from "@/components/nodes/transform-node";
import { usePipelineStore, type TransformNodeData } from "@/hooks/use-pipeline-store";
import type { TransformType } from "@/types/pipeline";

const nodeTypes: NodeTypes = {
  transformNode: TransformNode,
};

export function PipelineEditor() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const setNodes = usePipelineStore((s) => s.setNodes);
  const setEdges = usePipelineStore((s) => s.setEdges);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const addNode = usePipelineStore((s) => s.addNode);
  const pushSnapshot = usePipelineStore((s) => s.pushSnapshot);
  const triggerAutosave = usePipelineStore((s) => s.triggerAutosave);
  const removeNode = usePipelineStore((s) => s.removeNode);
  const removeEdge = usePipelineStore((s) => s.removeEdge);
  const reactFlowInstance = useRef<ReactFlowInstance<any, any> | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const hasRemove = changes.some((c) => c.type === "remove");
      if (hasRemove) {
        changes.forEach((c) => {
          if (c.type === "remove") removeNode(c.id);
        });
        return;
      }
      const updated = applyNodeChanges(changes, nodes);
      setNodes(updated as any);
      // Position changes should trigger autosave
      const hasPositionChange = changes.some((c) => c.type === "position" && c.dragging === false);
      if (hasPositionChange) {
        pushSnapshot();
        triggerAutosave();
      }
    },
    [nodes, setNodes, removeNode, pushSnapshot, triggerAutosave]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const hasRemove = changes.some((c) => c.type === "remove");
      if (hasRemove) {
        changes.forEach((c) => {
          if (c.type === "remove") removeEdge(c.id);
        });
        return;
      }
      const updated = applyEdgeChanges(changes, edges);
      setEdges(updated);
    },
    [edges, setEdges, removeEdge]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      pushSnapshot();
      const newEdges = addEdge(
        { ...params, type: "smoothstep", animated: true },
        edges
      );
      setEdges(newEdges);
      triggerAutosave();
    },
    [edges, setEdges, pushSnapshot, triggerAutosave]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Drop handler for drag from sidebar
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/pipeline-transform");
      if (!raw) return;

      const { type, label } = JSON.parse(raw) as { type: TransformType; label: string };
      const rfInstance = reactFlowInstance.current;
      if (!rfInstance) return;

      const position = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      addNode({
        id: crypto.randomUUID(),
        type: "transformNode",
        position,
        data: {
          label,
          transformType: type,
          config: {},
        },
      });
    },
    [addNode]
  );

  return (
    <div className="flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={(instance) => { reactFlowInstance.current = instance; }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        className="bg-white"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls
          className="rounded-lg border border-gray-200 bg-white shadow-sm"
          showInteractive={false}
        />
        <MiniMap
          className="rounded-lg border border-gray-200 shadow-sm"
          maskColor="rgba(0, 0, 0, 0.05)"
          nodeColor="#f3f4f6"
        />
      </ReactFlow>
    </div>
  );
}

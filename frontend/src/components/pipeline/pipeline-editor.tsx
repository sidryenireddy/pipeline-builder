"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TransformNode } from "@/components/nodes/transform-node";
import { usePipelineStore } from "@/hooks/use-pipeline-store";

const nodeTypes: NodeTypes = {
  transformNode: TransformNode,
};

export function PipelineEditor() {
  const storeNodes = usePipelineStore((s) => s.nodes);
  const storeEdges = usePipelineStore((s) => s.edges);
  const setNodes = usePipelineStore((s) => s.setNodes);
  const setEdges = usePipelineStore((s) => s.setEdges);
  const selectNode = usePipelineStore((s) => s.selectNode);

  const [nodes, , onNodesChange] = useNodesState(storeNodes);
  const [edges, , onEdgesChange] = useEdgesState(storeEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(
        { ...params, type: "smoothstep", animated: true },
        storeEdges
      );
      setEdges(newEdges);
    },
    [storeEdges, setEdges]
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

  return (
    <div className="flex-1">
      <ReactFlow
        nodes={storeNodes}
        edges={storeEdges}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          // Sync position changes back to store
          const updated = storeNodes.map((n) => {
            const change = changes.find(
              (c) => c.type === "position" && "id" in c && c.id === n.id
            );
            if (change && change.type === "position" && "position" in change && change.position) {
              return { ...n, position: change.position };
            }
            return n;
          });
          setNodes(updated);
        }}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-white"
      >
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls className="rounded-lg border border-gray-200 bg-white shadow-sm" />
        <MiniMap
          className="rounded-lg border border-gray-200 shadow-sm"
          maskColor="rgba(0, 0, 0, 0.05)"
          nodeColor="#f3f4f6"
        />
      </ReactFlow>
    </div>
  );
}

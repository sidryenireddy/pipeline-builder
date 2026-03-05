import { create } from "zustand";
import type { Node, Edge as FlowEdge } from "@xyflow/react";
import type { TransformType } from "@/types/pipeline";

interface TransformNodeData {
  label: string;
  transformType: TransformType;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

interface PipelineStore {
  nodes: Node<TransformNodeData>[];
  edges: FlowEdge[];
  selectedNodeId: string | null;

  setNodes: (nodes: Node<TransformNodeData>[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  addNode: (node: Node<TransformNodeData>) => void;
  updateNode: (id: string, data: Partial<TransformNodeData>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),

  updateNode: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),

  addEdge: (edge) => set((s) => ({ edges: [...s.edges, edge] })),
  removeEdge: (id) => set((s) => ({ edges: s.edges.filter((e) => e.id !== id) })),
  selectNode: (id) => set({ selectedNodeId: id }),
}));

import { create } from "zustand";
import type { Node, Edge as FlowEdge } from "@xyflow/react";
import type { TransformType, ColumnSchema } from "@/types/pipeline";
import { api } from "@/lib/api";

export interface TransformNodeData {
  label: string;
  transformType: TransformType;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

interface Snapshot {
  nodes: Node<TransformNodeData>[];
  edges: FlowEdge[];
}

interface PipelineStore {
  // Pipeline metadata
  pipelineId: string | null;
  pipelineName: string;
  setPipelineId: (id: string) => void;
  setPipelineName: (name: string) => void;

  // Graph state
  nodes: Node<TransformNodeData>[];
  edges: FlowEdge[];
  selectedNodeId: string | null;

  // Schema cache
  schemaCache: Record<string, ColumnSchema[]>;
  setSchema: (nodeId: string, cols: ColumnSchema[]) => void;
  getUpstreamSchema: (nodeId: string) => ColumnSchema[];

  // Preview state
  previewNodeId: string | null;
  previewLoading: boolean;
  previewData: { columns: string[]; column_types: string[]; rows: Record<string, unknown>[]; row_count: number; truncated: boolean } | null;
  setPreviewNodeId: (id: string | null) => void;
  setPreviewLoading: (loading: boolean) => void;
  setPreviewData: (data: any) => void;

  // Actions
  setNodes: (nodes: Node<TransformNodeData>[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  addNode: (node: Node<TransformNodeData>) => void;
  updateNode: (id: string, data: Partial<TransformNodeData>) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;

  // Undo/Redo
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // Autosave
  _saveTimer: ReturnType<typeof setTimeout> | null;
  triggerAutosave: () => void;

  // Load/save
  loadPipeline: (id: string) => Promise<void>;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  pipelineId: null,
  pipelineName: "Untitled Pipeline",
  setPipelineId: (id) => set({ pipelineId: id }),
  setPipelineName: (name) => set({ pipelineName: name }),

  nodes: [],
  edges: [],
  selectedNodeId: null,

  schemaCache: {},
  setSchema: (nodeId, cols) =>
    set((s) => ({ schemaCache: { ...s.schemaCache, [nodeId]: cols } })),
  getUpstreamSchema: (nodeId) => {
    const state = get();
    const upstreamEdge = state.edges.find((e) => e.target === nodeId);
    if (!upstreamEdge) return [];
    return state.schemaCache[upstreamEdge.source] || [];
  },

  previewNodeId: null,
  previewLoading: false,
  previewData: null,
  setPreviewNodeId: (id) => set({ previewNodeId: id }),
  setPreviewLoading: (loading) => set({ previewLoading: loading }),
  setPreviewData: (data) => set({ previewData: data }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => {
    get().pushSnapshot();
    set((s) => ({ nodes: [...s.nodes, node] }));
    get().triggerAutosave();
  },

  updateNode: (id, data) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
    get().triggerAutosave();
  },

  removeNode: (id) => {
    get().pushSnapshot();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }));
    get().triggerAutosave();
  },

  removeEdge: (id) => {
    get().pushSnapshot();
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }));
    get().triggerAutosave();
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  // Undo/Redo
  undoStack: [],
  redoStack: [],

  pushSnapshot: () => {
    const { nodes, edges, undoStack } = get();
    const snapshot: Snapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set({
      undoStack: [...undoStack.slice(-50), snapshot],
      redoStack: [],
    });
  },

  undo: () => {
    const { undoStack, nodes, edges } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
      nodes: prev.nodes,
      edges: prev.edges,
    }));
    get().triggerAutosave();
  },

  redo: () => {
    const { redoStack, nodes, edges } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
      nodes: next.nodes,
      edges: next.edges,
    }));
    get().triggerAutosave();
  },

  // Autosave with 1s debounce
  _saveTimer: null,
  triggerAutosave: () => {
    const state = get();
    if (state._saveTimer) clearTimeout(state._saveTimer);
    const timer = setTimeout(() => {
      const { pipelineId, nodes, edges } = get();
      if (!pipelineId) return;
      const transforms = nodes.map((n) => ({
        id: n.id,
        type: (n.data as TransformNodeData).transformType,
        name: (n.data as TransformNodeData).label,
        config: (n.data as TransformNodeData).config,
        position_x: n.position.x,
        position_y: n.position.y,
      }));
      const edgeData = edges.map((e) => ({
        id: e.id,
        source_transform_id: e.source,
        target_transform_id: e.target,
        source_port: "output",
        target_port: "input",
      }));
      api.pipelines.bulkSave(pipelineId, { transforms, edges: edgeData }).catch(() => {});
    }, 1000);
    set({ _saveTimer: timer });
  },

  loadPipeline: async (id: string) => {
    const pipeline = await api.pipelines.get(id);
    const nodes: Node<TransformNodeData>[] = (pipeline.transforms || []).map((t: any) => ({
      id: t.id,
      type: "transformNode",
      position: { x: t.position_x, y: t.position_y },
      data: {
        label: t.name,
        transformType: t.type as TransformType,
        config: t.config || {},
      },
    }));
    const edges: FlowEdge[] = (pipeline.edges || []).map((e: any) => ({
      id: e.id,
      source: e.source_transform_id,
      target: e.target_transform_id,
      type: "smoothstep",
      animated: true,
    }));
    set({
      pipelineId: id,
      pipelineName: pipeline.name,
      nodes,
      edges,
      undoStack: [],
      redoStack: [],
      selectedNodeId: null,
      previewNodeId: null,
      previewData: null,
      schemaCache: {},
    });
  },
}));

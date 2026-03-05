import type { Pipeline, PreviewData, SchemaData } from "@/types/pipeline";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8001";

async function request<T>(base: string, path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const apiReq = <T>(path: string, options?: RequestInit) => request<T>(API_URL, path, options);
const engineReq = <T>(path: string, options?: RequestInit) => request<T>(ENGINE_URL, path, options);

export const api = {
  pipelines: {
    list: () => apiReq<Pipeline[]>("/api/v1/pipelines"),
    create: (data: { name: string; description: string }) =>
      apiReq<Pipeline>("/api/v1/pipelines", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => apiReq<Pipeline>(`/api/v1/pipelines/${id}`),
    update: (id: string, data: any) =>
      apiReq<Pipeline>(`/api/v1/pipelines/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiReq<void>(`/api/v1/pipelines/${id}`, { method: "DELETE" }),
    bulkSave: (id: string, data: { transforms: any[]; edges: any[] }) =>
      apiReq<{ status: string }>(`/api/v1/pipelines/${id}/save`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  transforms: {
    list: (pipelineId: string) =>
      apiReq<any[]>(`/api/v1/pipelines/${pipelineId}/transforms`),
    create: (pipelineId: string, data: any) =>
      apiReq<any>(`/api/v1/pipelines/${pipelineId}/transforms`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    preview: (pipelineId: string, transformId: string) =>
      apiReq<PreviewData>(`/api/v1/pipelines/${pipelineId}/transforms/${transformId}/preview`, {
        method: "POST",
      }),
    schema: (pipelineId: string, transformId: string) =>
      apiReq<SchemaData>(`/api/v1/pipelines/${pipelineId}/transforms/${transformId}/schema`, {
        method: "POST",
      }),
  },
  engine: {
    preview: (dag: any, targetTransformId: string, limit = 50) =>
      engineReq<PreviewData>("/api/v1/preview", {
        method: "POST",
        body: JSON.stringify({ dag, target_transform_id: targetTransformId, limit }),
      }),
    schema: (dag: any, targetTransformId: string) =>
      engineReq<SchemaData>("/api/v1/schema", {
        method: "POST",
        body: JSON.stringify({ dag, target_transform_id: targetTransformId }),
      }),
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
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

export const api = {
  pipelines: {
    list: () => request<any[]>("/api/v1/pipelines"),
    create: (data: { name: string; description: string }) =>
      request<any>("/api/v1/pipelines", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => request<any>(`/api/v1/pipelines/${id}`),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/pipelines/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/v1/pipelines/${id}`, { method: "DELETE" }),
  },
  transforms: {
    list: (pipelineId: string) =>
      request<any[]>(`/api/v1/pipelines/${pipelineId}/transforms`),
    create: (pipelineId: string, data: any) =>
      request<any>(`/api/v1/pipelines/${pipelineId}/transforms`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (pipelineId: string, transformId: string, data: any) =>
      request<any>(`/api/v1/pipelines/${pipelineId}/transforms/${transformId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (pipelineId: string, transformId: string) =>
      request<void>(`/api/v1/pipelines/${pipelineId}/transforms/${transformId}`, {
        method: "DELETE",
      }),
    preview: (pipelineId: string, transformId: string) =>
      request<any>(`/api/v1/pipelines/${pipelineId}/transforms/${transformId}/preview`, {
        method: "POST",
      }),
  },
  edges: {
    list: (pipelineId: string) =>
      request<any[]>(`/api/v1/pipelines/${pipelineId}/edges`),
    create: (pipelineId: string, data: any) =>
      request<any>(`/api/v1/pipelines/${pipelineId}/edges`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (pipelineId: string, edgeId: string) =>
      request<void>(`/api/v1/pipelines/${pipelineId}/edges/${edgeId}`, {
        method: "DELETE",
      }),
  },
  builds: {
    list: () => request<any[]>("/api/v1/builds"),
    trigger: (data: { pipeline_id: string; branch_id: string }) =>
      request<any>("/api/v1/builds", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => request<any>(`/api/v1/builds/${id}`),
    cancel: (id: string) =>
      request<any>(`/api/v1/builds/${id}/cancel`, { method: "POST" }),
  },
};

from __future__ import annotations
import pandas as pd
from pipeline_engine.models import (
    ExecutePipelineRequest,
    PipelineDAG,
    PreviewRequest,
    PreviewResponse,
    TransformType,
)
from pipeline_engine.transforms import registry


def dtype_to_string(dtype) -> str:
    s = str(dtype)
    _map = {
        "object": "string",
        "str": "string",
        "int64": "integer",
        "int32": "integer",
        "float64": "float",
        "float32": "float",
        "bool": "boolean",
        "datetime64[ns]": "timestamp",
    }
    return _map.get(s, s)


class PipelineExecutor:
    def resolve_execution_order(self, dag: PipelineDAG) -> list[str]:
        adjacency: dict[str, list[str]] = {t.id: [] for t in dag.transforms}
        in_degree: dict[str, int] = {t.id: 0 for t in dag.transforms}

        for edge in dag.edges:
            adjacency[edge.source_id].append(edge.target_id)
            in_degree[edge.target_id] += 1

        queue = [nid for nid, deg in in_degree.items() if deg == 0]
        order = []

        while queue:
            node = queue.pop(0)
            order.append(node)
            for neighbor in adjacency[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(order) != len(dag.transforms):
            raise ValueError("Pipeline contains a cycle")

        return order

    def _get_inputs(self, dag: PipelineDAG, transform_id: str, results: dict[str, pd.DataFrame]) -> list[pd.DataFrame]:
        inputs = []
        for edge in dag.edges:
            if edge.target_id == transform_id:
                inputs.append(results[edge.source_id])
        return inputs

    def _run_transform(self, transform_type: TransformType, config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
        handler = registry.get(transform_type)
        if handler is None:
            raise ValueError(f"Unknown transform type: {transform_type}")
        return handler(config, inputs)

    def execute(self, req: ExecutePipelineRequest) -> dict:
        order = self.resolve_execution_order(req.dag)
        transforms_by_id = {t.id: t for t in req.dag.transforms}
        results: dict[str, pd.DataFrame] = {}

        for tid in order:
            t = transforms_by_id[tid]
            inputs = self._get_inputs(req.dag, tid, results)
            results[tid] = self._run_transform(t.type, t.config, inputs)

        return {"status": "success", "build_id": req.build_id}

    def preview(self, req: PreviewRequest) -> PreviewResponse:
        order = self.resolve_execution_order(req.dag)
        transforms_by_id = {t.id: t for t in req.dag.transforms}
        results: dict[str, pd.DataFrame] = {}

        for tid in order:
            t = transforms_by_id[tid]
            inputs = self._get_inputs(req.dag, tid, results)
            results[tid] = self._run_transform(t.type, t.config, inputs)
            if tid == req.target_transform_id:
                break

        df = results.get(req.target_transform_id, pd.DataFrame())
        truncated = len(df) > req.limit
        df_limited = df.head(req.limit)

        # Convert NaN/NaT to None for JSON serialization
        df_clean = df_limited.where(df_limited.notna(), None)

        return PreviewResponse(
            columns=list(df_clean.columns),
            column_types=[dtype_to_string(df_clean[c].dtype) for c in df_clean.columns],
            rows=df_clean.to_dict(orient="records"),
            row_count=len(df),
            truncated=truncated,
        )

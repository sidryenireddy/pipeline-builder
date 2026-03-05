"""Schema propagation: infer output schema at any node without executing."""
from __future__ import annotations
import pandas as pd
import numpy as np
from pipeline_engine.models import (
    PipelineDAG,
    TransformType,
    ColumnSchema,
)
from pipeline_engine.executor import PipelineExecutor

_DTYPE_MAP = {
    "object": "string",
    "str": "string",
    "int64": "integer",
    "int32": "integer",
    "float64": "float",
    "float32": "float",
    "bool": "boolean",
    "datetime64[ns]": "timestamp",
    "datetime64[ns, UTC]": "timestamp",
}


def dtype_to_string(dtype) -> str:
    s = str(dtype)
    return _DTYPE_MAP.get(s, s)


def infer_schema(dag: PipelineDAG, target_transform_id: str) -> list[ColumnSchema]:
    """Propagate schemas through the DAG up to target node.

    For correctness with all transform types, we run transforms on a
    small sample (0-1 rows) and inspect the resulting columns/types.
    This is fast because no real data processing happens.
    """
    executor = PipelineExecutor()
    order = executor.resolve_execution_order(dag)
    transforms_by_id = {t.id: t for t in dag.transforms}
    schemas: dict[str, list[ColumnSchema]] = {}
    results: dict[str, pd.DataFrame] = {}

    for tid in order:
        t = transforms_by_id[tid]
        inputs = executor._get_inputs(dag, tid, results)

        if t.type == TransformType.INPUT:
            config = t.config
            if "data" in config:
                sample = pd.DataFrame(config["data"]).head(0)
            elif "columns" in config:
                sample = pd.DataFrame(columns=config["columns"])
            else:
                sample = pd.DataFrame()
            results[tid] = sample
        else:
            sample_inputs = []
            for inp in inputs:
                if len(inp) == 0:
                    sample_inputs.append(inp)
                else:
                    sample_inputs.append(inp.head(2))

            try:
                from pipeline_engine.transforms import registry
                handler = registry.get(t.type)
                if handler:
                    result = handler(t.config, sample_inputs)
                    results[tid] = result
                else:
                    results[tid] = sample_inputs[0] if sample_inputs else pd.DataFrame()
            except Exception:
                results[tid] = sample_inputs[0] if sample_inputs else pd.DataFrame()

        if tid == target_transform_id:
            df = results[tid]
            return [
                ColumnSchema(name=str(col), dtype=dtype_to_string(df[col].dtype))
                for col in df.columns
            ]

    return []

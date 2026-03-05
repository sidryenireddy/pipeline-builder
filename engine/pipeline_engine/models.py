from __future__ import annotations
from enum import Enum
from pydantic import BaseModel


class TransformType(str, Enum):
    FILTER = "filter"
    JOIN = "join"
    UNION = "union"
    AGGREGATE = "aggregate"
    PIVOT = "pivot"
    UNPIVOT = "unpivot"
    RENAME = "rename"
    DROP_COLUMNS = "drop_columns"
    SELECT_COLUMNS = "select_columns"
    CAST = "cast"
    SORT = "sort"
    DEDUPLICATE = "deduplicate"
    EXPRESSION = "expression"
    LLM = "llm"
    INPUT = "input"
    OUTPUT = "output"


class TransformNode(BaseModel):
    id: str
    type: TransformType
    name: str
    config: dict


class EdgeDef(BaseModel):
    source_id: str
    target_id: str
    source_port: str = "output"
    target_port: str = "input"


class PipelineDAG(BaseModel):
    pipeline_id: str
    branch_id: str
    transforms: list[TransformNode]
    edges: list[EdgeDef]


class ExecutePipelineRequest(BaseModel):
    dag: PipelineDAG
    build_id: str


class PreviewRequest(BaseModel):
    dag: PipelineDAG
    target_transform_id: str
    limit: int = 50


class PreviewResponse(BaseModel):
    columns: list[str]
    column_types: list[str]
    rows: list[dict]
    row_count: int
    truncated: bool


class ColumnSchema(BaseModel):
    name: str
    dtype: str


class SchemaRequest(BaseModel):
    dag: PipelineDAG
    target_transform_id: str


class SchemaResponse(BaseModel):
    columns: list[ColumnSchema]

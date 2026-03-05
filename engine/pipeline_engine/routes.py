from fastapi import APIRouter
from pipeline_engine.models import (
    ExecutePipelineRequest,
    PreviewRequest,
    PreviewResponse,
    SchemaRequest,
    SchemaResponse,
)
from pipeline_engine.executor import PipelineExecutor
from pipeline_engine.schema import infer_schema

router = APIRouter()
executor = PipelineExecutor()


@router.post("/execute")
async def execute_pipeline(req: ExecutePipelineRequest):
    result = executor.execute(req)
    return result


@router.post("/preview", response_model=PreviewResponse)
async def preview_transform(req: PreviewRequest):
    result = executor.preview(req)
    return result


@router.post("/schema", response_model=SchemaResponse)
async def get_schema(req: SchemaRequest):
    columns = infer_schema(req.dag, req.target_transform_id)
    return SchemaResponse(columns=columns)

from fastapi import APIRouter
from pipeline_engine.models import ExecutePipelineRequest, PreviewRequest, PreviewResponse
from pipeline_engine.executor import PipelineExecutor

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

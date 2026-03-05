import pandas as pd
from pipeline_engine.executor import PipelineExecutor
from pipeline_engine.models import (
    PipelineDAG,
    TransformNode,
    EdgeDef,
    PreviewRequest,
    TransformType,
)


def make_dag(transforms, edges):
    return PipelineDAG(
        pipeline_id="test-pipeline",
        branch_id="test-branch",
        transforms=transforms,
        edges=edges,
    )


def test_resolve_execution_order():
    executor = PipelineExecutor()
    dag = make_dag(
        transforms=[
            TransformNode(id="a", type=TransformType.INPUT, name="A", config={}),
            TransformNode(id="b", type=TransformType.FILTER, name="B", config={}),
            TransformNode(id="c", type=TransformType.OUTPUT, name="C", config={}),
        ],
        edges=[
            EdgeDef(source_id="a", target_id="b"),
            EdgeDef(source_id="b", target_id="c"),
        ],
    )
    order = executor.resolve_execution_order(dag)
    assert order == ["a", "b", "c"]


def test_cycle_detection():
    executor = PipelineExecutor()
    dag = make_dag(
        transforms=[
            TransformNode(id="a", type=TransformType.FILTER, name="A", config={}),
            TransformNode(id="b", type=TransformType.FILTER, name="B", config={}),
        ],
        edges=[
            EdgeDef(source_id="a", target_id="b"),
            EdgeDef(source_id="b", target_id="a"),
        ],
    )
    try:
        executor.resolve_execution_order(dag)
        assert False, "Should have raised ValueError"
    except ValueError:
        pass

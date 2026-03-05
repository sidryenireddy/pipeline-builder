from pipeline_engine.models import TransformType
from pipeline_engine.transforms.core import (
    transform_filter,
    transform_join,
    transform_union,
    transform_aggregate,
    transform_pivot,
    transform_rename,
    transform_cast,
    transform_sort,
    transform_deduplicate,
    transform_expression,
    transform_input,
    transform_output,
)
from pipeline_engine.transforms.llm import transform_llm

registry = {
    TransformType.FILTER: transform_filter,
    TransformType.JOIN: transform_join,
    TransformType.UNION: transform_union,
    TransformType.AGGREGATE: transform_aggregate,
    TransformType.PIVOT: transform_pivot,
    TransformType.RENAME: transform_rename,
    TransformType.CAST: transform_cast,
    TransformType.SORT: transform_sort,
    TransformType.DEDUPLICATE: transform_deduplicate,
    TransformType.EXPRESSION: transform_expression,
    TransformType.LLM: transform_llm,
    TransformType.INPUT: transform_input,
    TransformType.OUTPUT: transform_output,
}

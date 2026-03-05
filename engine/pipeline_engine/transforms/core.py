from __future__ import annotations
import pandas as pd


def transform_input(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    """Load a dataset. Supports inline data via config for testing,
    or dataset_id for production Data Connection integration."""
    if "data" in config:
        return pd.DataFrame(config["data"])
    if "columns" in config and "rows" in config:
        return pd.DataFrame(config["rows"], columns=config["columns"])
    return pd.DataFrame()


def transform_output(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    """Write the result as a new clean dataset."""
    if not inputs:
        return pd.DataFrame()
    return inputs[0]


def transform_filter(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    condition = config.get("condition", "")
    if condition:
        df = df.query(condition)
    return df


def transform_join(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    if len(inputs) < 2:
        raise ValueError("Join requires exactly 2 inputs")
    left, right = inputs[0], inputs[1]
    on = config.get("on", [])
    how = config.get("how", "inner")
    return left.merge(right, on=on, how=how)


def transform_union(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    if not inputs:
        return pd.DataFrame()
    return pd.concat(inputs, ignore_index=True)


def transform_aggregate(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    group_by = config.get("group_by", [])
    agg = config.get("aggregations", {})
    if group_by:
        return df.groupby(group_by).agg(agg).reset_index()
    return df.agg(agg).to_frame().T


def transform_pivot(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    return df.pivot_table(
        index=config.get("index"),
        columns=config.get("columns"),
        values=config.get("values"),
        aggfunc=config.get("aggfunc", "mean"),
    ).reset_index()


def transform_rename(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    mapping = config.get("mapping", {})
    return df.rename(columns=mapping)


def transform_cast(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    types = config.get("types", {})
    return df.astype(types)


def transform_sort(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    by = config.get("by", [])
    ascending = config.get("ascending", True)
    return df.sort_values(by=by, ascending=ascending)


def transform_deduplicate(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    subset = config.get("subset")
    keep = config.get("keep", "first")
    return df.drop_duplicates(subset=subset, keep=keep)


def transform_expression(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0].copy()
    output_column = config.get("output_column", "result")
    expression = config.get("expression", "")
    if expression:
        df[output_column] = df.eval(expression)
    return df

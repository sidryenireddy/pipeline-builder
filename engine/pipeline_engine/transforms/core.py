from __future__ import annotations
import pandas as pd
import numpy as np


def transform_input(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    """Load a dataset. Supports inline data via config for testing,
    or dataset_id for production Data Connection integration."""
    if "data" in config:
        return pd.DataFrame(config["data"])
    if "columns" in config and "rows" in config:
        return pd.DataFrame(config["rows"], columns=config["columns"])
    return pd.DataFrame()


def transform_output(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    if not inputs:
        return pd.DataFrame()
    return inputs[0]


def transform_filter(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    column = config.get("column", "")
    operator = config.get("operator", "")
    value = config.get("value")
    condition = config.get("condition", "")

    if column and operator:
        if operator == "equals":
            df = df[df[column] == _cast_value(value, df[column].dtype)]
        elif operator == "not_equals":
            df = df[df[column] != _cast_value(value, df[column].dtype)]
        elif operator == "greater_than":
            df = df[df[column] > _cast_value(value, df[column].dtype)]
        elif operator == "less_than":
            df = df[df[column] < _cast_value(value, df[column].dtype)]
        elif operator == "greater_equal":
            df = df[df[column] >= _cast_value(value, df[column].dtype)]
        elif operator == "less_equal":
            df = df[df[column] <= _cast_value(value, df[column].dtype)]
        elif operator == "contains":
            df = df[df[column].astype(str).str.contains(str(value), na=False)]
        elif operator == "not_contains":
            df = df[~df[column].astype(str).str.contains(str(value), na=False)]
        elif operator == "is_null":
            df = df[df[column].isna()]
        elif operator == "is_not_null":
            df = df[df[column].notna()]
        elif operator == "starts_with":
            df = df[df[column].astype(str).str.startswith(str(value), na=False)]
        elif operator == "ends_with":
            df = df[df[column].astype(str).str.endswith(str(value), na=False)]
    elif condition:
        df = df.query(condition)

    return df


def _cast_value(value, dtype):
    if value is None:
        return None
    if pd.api.types.is_integer_dtype(dtype):
        return int(value)
    if pd.api.types.is_float_dtype(dtype):
        return float(value)
    return value


def transform_join(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    if len(inputs) < 2:
        raise ValueError("Join requires exactly 2 inputs")
    left, right = inputs[0], inputs[1]
    left_on = config.get("left_on", [])
    right_on = config.get("right_on", [])
    on = config.get("on", [])
    how = config.get("how", "inner")
    suffixes = config.get("suffixes", ["_left", "_right"])

    if on:
        return left.merge(right, on=on, how=how, suffixes=tuple(suffixes))
    if left_on and right_on:
        return left.merge(right, left_on=left_on, right_on=right_on, how=how, suffixes=tuple(suffixes))
    if how == "cross":
        return left.merge(right, how="cross", suffixes=tuple(suffixes))
    raise ValueError("Join requires 'on' or both 'left_on' and 'right_on'")


def transform_union(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    if not inputs:
        return pd.DataFrame()
    mode = config.get("mode", "by_name")
    if mode == "by_position":
        dfs = []
        for df in inputs:
            df_copy = df.copy()
            df_copy.columns = inputs[0].columns[: len(df_copy.columns)]
            dfs.append(df_copy)
        return pd.concat(dfs, ignore_index=True)
    return pd.concat(inputs, ignore_index=True)


def transform_aggregate(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    group_by = config.get("group_by", [])
    aggregations = config.get("aggregations", [])

    if not aggregations:
        return df

    agg_dict: dict[str, list] = {}
    for agg in aggregations:
        col = agg.get("column", "")
        func = agg.get("function", "count")
        if func == "count_distinct":
            func = "nunique"
        if col not in agg_dict:
            agg_dict[col] = []
        agg_dict[col].append(func)

    if group_by:
        result = df.groupby(group_by).agg(agg_dict)
        result.columns = [f"{col}_{func}" if func != "first" else col for col, func in result.columns]
        return result.reset_index()

    result = df.agg(agg_dict)
    result.columns = [f"{col}_{func}" for col, func in result.columns]
    return result.reset_index(drop=True).head(1)


def transform_pivot(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    index = config.get("index", [])
    pivot_column = config.get("pivot_column", "")
    value_column = config.get("value_column", "")
    aggfunc = config.get("aggfunc", "mean")

    if not pivot_column or not value_column:
        return df

    result = df.pivot_table(
        index=index or None,
        columns=pivot_column,
        values=value_column,
        aggfunc=aggfunc,
    )
    result.columns = [str(c) for c in result.columns]
    return result.reset_index()


def transform_unpivot(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    id_columns = config.get("id_columns", [])
    value_columns = config.get("value_columns", [])
    variable_name = config.get("variable_name", "variable")
    value_name = config.get("value_name", "value")

    if not value_columns:
        value_columns = [c for c in df.columns if c not in id_columns]

    return df.melt(
        id_vars=id_columns,
        value_vars=value_columns,
        var_name=variable_name,
        value_name=value_name,
    )


def transform_rename(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    mapping = config.get("mapping", {})
    renames = config.get("renames", [])
    if renames:
        mapping = {r["from"]: r["to"] for r in renames if r.get("from") and r.get("to")}
    return df.rename(columns=mapping)


def transform_drop_columns(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    columns = config.get("columns", [])
    return df.drop(columns=[c for c in columns if c in df.columns], errors="ignore")


def transform_select_columns(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    columns = config.get("columns", [])
    if not columns:
        return df
    return df[[c for c in columns if c in df.columns]]


def transform_cast(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0].copy()
    casts = config.get("casts", [])
    type_map = {
        "string": "str",
        "integer": "int64",
        "float": "float64",
        "boolean": "bool",
        "date": "datetime64[ns]",
        "timestamp": "datetime64[ns]",
    }
    for cast in casts:
        col = cast.get("column", "")
        target = cast.get("target_type", "")
        if col in df.columns and target in type_map:
            try:
                if target in ("date", "timestamp"):
                    df[col] = pd.to_datetime(df[col])
                else:
                    df[col] = df[col].astype(type_map[target])
            except (ValueError, TypeError):
                pass
    # Legacy support
    types = config.get("types", {})
    if types:
        df = df.astype(types)
    return df


def transform_sort(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    sorts = config.get("sorts", [])
    if sorts:
        by = [s["column"] for s in sorts if s.get("column")]
        ascending = [s.get("ascending", True) for s in sorts if s.get("column")]
        return df.sort_values(by=by, ascending=ascending, ignore_index=True)
    by = config.get("by", [])
    ascending = config.get("ascending", True)
    if by:
        return df.sort_values(by=by, ascending=ascending, ignore_index=True)
    return df


def transform_deduplicate(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0]
    subset = config.get("columns") or config.get("subset")
    keep = config.get("keep", "first")
    if subset:
        return df.drop_duplicates(subset=subset, keep=keep, ignore_index=True)
    return df.drop_duplicates(keep=keep, ignore_index=True)


def transform_expression(config: dict, inputs: list[pd.DataFrame]) -> pd.DataFrame:
    df = inputs[0].copy()
    output_column = config.get("output_column", "result")
    expression = config.get("expression", "")
    case_when = config.get("case_when", [])

    if case_when:
        result = pd.Series(np.nan, index=df.index, dtype=object)
        for clause in case_when:
            condition = clause.get("condition", "")
            value = clause.get("value", "")
            if condition == "else":
                result = result.fillna(value)
            elif condition:
                mask = df.eval(condition) & result.isna()
                result[mask] = value
        df[output_column] = result
    elif expression:
        df[output_column] = df.eval(expression)
    return df

import pandas as pd
import numpy as np
import glob
import os

""" Formatting utilities for the climate data files (4-slice system only)
    Slices:
      map1: 1981–2010 normals
      map2: 2011–2040 High Emissions normals
      map3: 2041–2070 High Emissions normals
      map4: 2071–2100 High Emissions normals
"""

def get_csv(filepath:str) -> pd.DataFrame:
    """Read a CSV file and return its contents as a DataFrame"""
    dframe: pd.DataFrame = pd.read_csv(filepath)  # type: ignore
    return dframe

def combine_my_codes(dframe: pd.DataFrame) -> pd.DataFrame:
    """Combine cold, arid, and warm codes into a single climate zone code in column 1.
       Zeros out columns 2 and 3 (arid, warm) after combining.
       (Unchanged utility; independent of time-slice count.)
    """
    for _, row in dframe.iterrows():
        if pd.isna(row[2]): 
            row[1] = str(row[1]) + str(row[3])  # cold + warm
        else: 
            row[1] = str(row[1]) + str(row[2]) + str(row[3])  # cold + arid + warm
    dframe.iloc[:, 2] = np.nan
    dframe.iloc[:, 3] = np.nan
    return dframe

def remove_spaces(dframe:pd.DataFrame, column:int) -> pd.DataFrame:
    dframe.iloc[:, column] = dframe.iloc[:, column].str.replace(' ', '', regex=True)
    return dframe

def remove_commas(dframe:pd.DataFrame, column:int) -> pd.DataFrame:
    dframe.iloc[:, column] = dframe.iloc[:, column].str.replace(',', '', regex=True)
    return dframe

def remove_parentheses_and_contents(dframe: pd.DataFrame, column:int) -> pd.DataFrame:
    """Strip any '(...)' substrings from a column."""
    dframe.iloc[:, column] = dframe.iloc[:, column].str.replace(r'\(.*?\)', '', regex=True)
    return dframe

def sort_alphabetically(dframe: pd.DataFrame, column:int) -> pd.DataFrame:
    return dframe.sort_values(by=dframe.columns[column], ignore_index=True)

def add_space_after_comma(dframe: pd.DataFrame, column: int) -> pd.DataFrame:
    dframe.iloc[:, column] = dframe.iloc[:, column].str.replace(',', ', ', regex=True)
    return dframe

def remove_trailing_spaces(dframe: pd.DataFrame, column: int) -> pd.DataFrame:
    dframe.iloc[:, column] = dframe.iloc[:, column].str.rstrip()
    return dframe

def merge_duplicate_locations(dframe: pd.DataFrame) -> pd.DataFrame:
    """Keep first non-NaN for duplicates of the first column (location)."""
    return dframe.groupby(dframe.columns[0], as_index=False).agg(
        lambda x: x.dropna().iloc[0] if not x.dropna().empty else np.nan  # type: ignore
    )

def remove_rows_with_missing_data(dframe: pd.DataFrame) -> pd.DataFrame:
    return dframe.dropna()  # type: ignore

def list_places_by_climate(dframe: pd.DataFrame, climate: str, column:int) -> set[str]:
    """Return set of place names where given climate appears in the specified time-slice column."""
    # Prefer explicit "Location" column name; fall back to col0 if not present.
    name_col = 'Location' if 'Location' in dframe.columns else dframe.columns[0]
    return set(dframe[dframe.iloc[:, column] == climate][name_col])

def list_places_by_climate_and_time(dframe: pd.DataFrame, climate: str) -> list[str]:
    """
    Return places matching `climate`, annotated by the new 4-slice labels only.
    Assumes column 0 is the location name and columns 1..4 are the climate codes.
    """
    labels = {
        1: "1981-2010 normals",
        2: "2011-2040 High Emissions normals",
        3: "2041-2070 High Emissions normals",
        4: "2071-2100 High Emissions normals",
    }
    # Prefer explicit "Location" column name; fall back to col0 if not present.
    name_col = 'Location' if 'Location' in dframe.columns else dframe.columns[0]

    places: list[str] = []
    for col_idx in (1, 2, 3, 4):
        if col_idx >= dframe.shape[1]:
            continue
        matches = dframe[dframe.iloc[:, col_idx] == climate][name_col].dropna().astype(str)
        label = labels[col_idx]
        for place in matches:
            places.append(f"{place} ({label})")
    return places

def list_landscapes(climate:str) -> list[str]:
    """List all landscape images for a given climate code (jpgs in images/landscapes/)"""
    landscape_dir = 'images/landscapes/'
    if not os.path.exists(landscape_dir):
        print(f"Error: Directory does not exist: {landscape_dir}")
        return []
    pattern = os.path.join(landscape_dir, f'{climate}*.jpg')
    return glob.glob(pattern)

def merge_dataframes(df1: pd.DataFrame, df2: pd.DataFrame, df3: pd.DataFrame, df4: pd.DataFrame) -> pd.DataFrame:
    """Merge four DataFrames on the first column (location), producing columns for map1..map4."""
    name_col = df1.columns[0]
    merged = df1.merge(df2, on=name_col, how='outer', suffixes=('', ''))  # we’ll overwrite values explicitly below
    merged = merged.merge(df3, on=name_col, how='outer', suffixes=('', ''))
    merged = merged.merge(df4, on=name_col, how='outer', suffixes=('', ''))
    return merged

def generate_cities_list(df1: pd.DataFrame, df2: pd.DataFrame, df3: pd.DataFrame, df4: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and combine 4 CSVs (map1..map4) into a single cities table:
      col0 = location, col1..col4 = climate codes for map1..map4.
    """
    dfs = [df1, df2, df3, df4]

    cleaned: list[pd.DataFrame] = []
    for df in dfs:
        df = sort_alphabetically(df, 0)
        df = remove_parentheses_and_contents(df, 0)
        df = remove_parentheses_and_contents(df, 1)
        df = remove_spaces(df, 0)
        df = add_space_after_comma(df, 0)
        df = remove_spaces(df, 1)
        df = remove_commas(df, 1)
        cleaned.append(df)

    # Start from map1 as base
    dfout = cleaned[0].copy()
    # Ensure the first column header is consistent
    name_col = dfout.columns[0]

    # Copy just the climate-code column (index 1) from each slice into col1..col4
    dfout.iloc[:, 1] = cleaned[0].iloc[:, 1]
    dfout[2] = cleaned[1].iloc[:, 1]
    dfout[3] = cleaned[2].iloc[:, 1]
    dfout[4] = cleaned[3].iloc[:, 1]

    # Deduplicate & drop incomplete rows
    dfout = merge_duplicate_locations(dfout)
    dfout = remove_rows_with_missing_data(dfout)

    # Make sure the columns are named sensibly (optional)
    col_names = list(dfout.columns)
    # Force names: [Location, map1, map2, map3, map4]
    col_names[0] = 'Location' if name_col != 'Location' else name_col
    # Keep existing header for col1 (often the code label); explicit names are optional in your pipeline
    dfout.columns = col_names

    return dfout

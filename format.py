import pandas as pd
import numpy as np
import glob
import os

""" Formatting utilities for the climate data files
"""

# if I get updated data in the future I should string these together
# to make a program that does it in one go

def get_csv(filepath:str) -> pd.DataFrame:
    """Read a CSV file and return its contents as a DataFrame

    Args:
        filepath (str): The path to the CSV file

    Returns:
        pd.DataFrame: The contents of the CSV file
    """
    df:pd.DataFrame = pd.read_csv(filepath) # type: ignore
    return df

def combine_my_codes(df: pd.DataFrame) -> pd.DataFrame:
    """Combine cold, arid, and warm codes into a single climate zone code

    Args:
        df (pd.DataFrame): The DataFrame containing climate zone codes separated in columns 2-4

    Returns:
        pd.DataFrame: The DataFrame with combined climate zone codes in column 2
        zeros out columns 3 and 4
    """
    for _, row in df.iterrows():
        if pd.isna(row[2]): row[1] = str(row[1]) + str(row[3])  # If arid is NaN, combine cold and warm only
        else: row[1] = str(row[1]) + str(row[2]) + str(row[3])  # Combine cold, arid, and warm codes
    df.iloc[:, 2] = np.nan
    df.iloc[:, 3] = np.nan
    return df

def remove_spaces(df:pd.DataFrame, column:int) -> pd.DataFrame:
    """Remove spaces from the climate zone codes in the DataFrame

    Args:
        df (pd.DataFrame): The DataFrame containing climate zone codes

    Returns:
        pd.DataFrame: The DataFrame with spaces removed from the climate zone codes
    """
    df.iloc[:, column] = df.iloc[:, column].str.replace(' ', '', regex=True)
    return df

def remove_commas(df:pd.DataFrame, column:int) -> pd.DataFrame:
    """Remove commas from the climate zone codes in the DataFrame

    Args:
        df (pd.DataFrame): The DataFrame containing climate zone codes

    Returns:
        pd.DataFrame: The DataFrame with spaces removed from the climate zone codes
    """
    df.iloc[:, column] = df.iloc[:, column].str.replace(',', '', regex=True)
    return df

def remove_parantheses_and_contents(df: pd.DataFrame, column:int) -> pd.DataFrame:
    """Clean the contents of the second column in the DataFrame

    I'm being sent csv's with very verbose climate classifications
    Here I simplify them into just the climate codes

    Args:
        df (pd.DataFrame): The DataFrame containing verbose data

    Returns:
        pd.DataFrame: The DataFrame with the second column simplified
    """
    df.iloc[:, column] = df.iloc[:, column].str.replace(r'\(.*?\)', '', regex=True)
    return df

def sort_alphabetically(df: pd.DataFrame) -> pd.DataFrame:
    """Sort the DataFrame alphabetically by the first column

    Args:
        df (pd.DataFrame): The DataFrame to be sorted

    Returns:
        pd.DataFrame: The sorted DataFrame
    """
    return df.sort_values(by=df.columns[0], ignore_index=True)

def merge_dataframes(df1: pd.DataFrame, df2: pd.DataFrame, df3: pd.DataFrame) -> pd.DataFrame:
    """Merge three DataFrames on the 'name' column

    Args:
        df1 (pd.DataFrame): The first DataFrame
        df2 (pd.DataFrame): The second DataFrame
        df3 (pd.DataFrame): The third DataFrame

    Returns:
        pd.DataFrame: The merged DataFrame
    """
    merged = df1.merge(df2, on='name', how='outer', suffixes=('_1900s', '_2025'))
    merged = merged.merge(df3, on='name', how='outer', suffixes=('', '_2100'))
    return merged

def add_space_after_comma(df: pd.DataFrame, column: int) -> pd.DataFrame:
    """Add a space after each comma in the specified column of the DataFrame

    Args:
        df (pd.DataFrame): The DataFrame to modify
        column (int): The index of the column to modify

    Returns:
        pd.DataFrame: The modified DataFrame
    """
    df.iloc[:, column] = df.iloc[:, column].str.replace(',', ', ', regex=True)
    return df

def remove_trailing_spaces(df: pd.DataFrame, column: int) -> pd.DataFrame:
    """Remove trailing spaces from the specified column of the DataFrame

    Args:
        df (pd.DataFrame): The DataFrame to modify
        column (int): The index of the column to modify

    Returns:
        pd.DataFrame: The modified DataFrame
    """
    df.iloc[:, column] = df.iloc[:, column].str.rstrip()
    return df

def merge_duplicate_locations(df: pd.DataFrame) -> pd.DataFrame:
    """Merge duplicate locations in the DataFrame

    Args:
        df (pd.DataFrame): The DataFrame containing location data

    Returns:
        pd.DataFrame: The DataFrame with duplicate locations merged
    """
    return df.groupby(df.columns[0], as_index=False).agg(lambda x: x.dropna().iloc[0] if not x.dropna().empty else np.nan) # type:ignore

def remove_rows_with_missing_data(df: pd.DataFrame) -> pd.DataFrame:
    """Remove rows with missing data from the DataFrame

    Args:
        df (pd.DataFrame): The DataFrame to modify

    Returns:
        pd.DataFrame: The modified DataFrame
    """
    return df.dropna() # type:ignore

def list_places_by_climate(df: pd.DataFrame, climate: str, column:int) -> set[str]:
    """List all places in the DataFrame that match the specified climate

    Args:
        df (pd.DataFrame): The DataFrame to search
        climate (str): The climate to filter by
        column (int): The index of the column to filter by

    Returns:
        set[str]: A set of all places with the specified climate
    """
    return set(df[df.iloc[:, column] == climate]['Location'])

def list_places_by_climate_and_time(df: pd.DataFrame, climate: str) -> list[str]:
    a1900s = list_places_by_climate(df, climate, 1)
    a2025 = list_places_by_climate(df, climate, 2)
    a2100 = list_places_by_climate(df, climate, 3)
    
    places:list[str] = []
    for place in a1900s: places.append(f"{place} (1961-1990 normals)")
    for place in a2025: places.append(f"{place} (2025)")
    for place in a2100: places.append(f"{place} (2100)")
    return places

def list_landscapes(climate:str) -> list[str]:
    """List all landscape images for a given climate code

    Args:
        climate (str): The climate code to filter by

    Returns:
        list[str]: A list of all landscape image paths for the specified climate
    """
    landscape_dir = 'climates/landscape/'
    if not os.path.exists(landscape_dir):
        print(f"Error: Directory does not exist: {landscape_dir}")
        return []
    pattern = os.path.join(landscape_dir, f'{climate}*.jpg')
    return glob.glob(pattern)



if __name__ == "__main__": # edit this to do whatever formatting you want
    df = get_csv("cities.csv")
    df = remove_rows_with_missing_data(df)
    df.to_csv("cities.csv", index=False)
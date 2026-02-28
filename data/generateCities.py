"""
generateCities.py

Generates cities.json from graphs.json.

HOW TO RUN:
From your project root (the folder that contains /data), run:

    python data/generateCities.py

This will overwrite data/cities.json automatically.
"""

import json
import os

# Paths relative to this file
BASE_DIR = os.path.dirname(__file__)
GRAPHS_PATH = os.path.join(BASE_DIR, "graphs.json")
OUTPUT_PATH = os.path.join(BASE_DIR, "cities.json")

# Load graphs.json
with open(GRAPHS_PATH, "r", encoding="utf-8") as f:
    graphs = json.load(f)

# Map period names → 1–4
period_index = {
    "1981-2010": "1",
    "2011-2040": "2",
    "2041-2070": "3",
    "2071-2100": "4"
}

cities = {}

# Build index
for city_obj in graphs.values():

    city_name = city_obj.get("city")
    if not city_name:
        continue

    periods = city_obj.get("periods", {})

    for period, pdata in periods.items():

        code = pdata.get("dickinson")
        idx = period_index.get(period)

        if not code or not idx:
            continue

        if code not in cities:
            cities[code] = {"1": [], "2": [], "3": [], "4": []}

        cities[code][idx].append(city_name)

# Deduplicate + sort
for code in cities:
    for p in ["1", "2", "3", "4"]:
        cities[code][p] = sorted(set(cities[code][p]))

# Write cities.json
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(cities, f, indent=2, ensure_ascii=False)

print("✔ cities.json successfully regenerated from graphs.json")
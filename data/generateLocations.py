"""
generateLocations.py

Generates locations.js from graphs.json.

HOW TO RUN:
From your project root (the folder that contains /data), run:

    python data/generateLocations.py

This will overwrite data/locations.js automatically.
"""

import json
import os

BASE_DIR = os.path.dirname(__file__)
GRAPHS_PATH = os.path.join(BASE_DIR, "graphs.json")
OUTPUT_PATH = os.path.join(BASE_DIR, "locations.js")

# Load graphs.json
with open(GRAPHS_PATH, "r", encoding="utf-8") as f:
    graphs = json.load(f)

lines = []

for coord_key, city_obj in graphs.items():

    city = city_obj.get("city")
    if not city:
        continue

    lat, lon = [c.strip() for c in coord_key.split(",")]

    lines.append(f"  {{name: '{city}', lat: {lat}, lon: {lon}}},")

# Write output
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:

    f.write("var CITIES = [\n")

    for line in lines:
        f.write(line + "\n")

    f.write("];\n")

print("✔ locations.js successfully generated from graphs.json")
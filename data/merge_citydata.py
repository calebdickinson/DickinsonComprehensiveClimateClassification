import csv, json, os

folder = os.path.expanduser("~/Documents")

files = {
    "citydata1.csv": "1",
    "citydata2.csv": "2",
    "citydata3.csv": "3",
    "citydata4.csv": "4"
}

data = {}

for fname, idx in files.items():
    path = os.path.join(folder, fname)
    if not os.path.exists(path):
        print(f"⚠️ Skipping missing file: {fname}")
        continue

    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            city = row["name"].strip()
            code = row["classification"].strip()

            data.setdefault(code, {"1": [], "2": [], "3": [], "4": []})
            data[code][idx].append(city)

out_path = os.path.join(folder, "cities.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ Created:", out_path)

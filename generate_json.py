import json
import glob
from climates import decode, codes, traverse_codes
from format import get_csv, list_places_by_climate

def generate_json() -> dict[str, dict]: #type:ignore
    data = {}
    for code in codes:
        data[code] = {
            'code': code,
            'name': decode(code),
            'cold': code[0],
            'arid': code[1:-1] if code[-1].isdigit() else code[1:],
            'warm': code[-2:] if code[-1].isdigit() else code[-1],
            'cold_plus': traverse_codes(code, 'cold', 1),
            'cold_minus': traverse_codes(code, 'cold', -1),
            'arid_plus': traverse_codes(code, 'arid', 1),
            'arid_minus': traverse_codes(code, 'arid', -1),
            'warm_plus': traverse_codes(code, 'warm', 1),
            'warm_minus': traverse_codes(code, 'warm', -1),
            'map_1900s': f'climates/map_1900s/{code}.png',
            'map_2025': f'climates/map_2025/{code}.png',
            'map_2100': f'climates/map_2100/{code}.png',
            'landscape': list(glob.glob(f'/climates/landscape/{code}*')),
            'cities_1900s': list(list_places_by_climate(get_csv("cities.csv"), code, 1)),
            'cities_2025': list(list_places_by_climate(get_csv("cities.csv"), code, 2)),
            'cities_2100': list(list_places_by_climate(get_csv("cities.csv"), code, 3)),
        }
    return data #type:ignore

if __name__ == "__main__":
    data = generate_json() #type:ignore
    with open("data.json", "w") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

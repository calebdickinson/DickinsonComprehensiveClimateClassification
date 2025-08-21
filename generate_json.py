import json
from climates import decode, codes, traverse_codes
from format import get_csv, list_places_by_climate_and_time, list_landscapes

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
            'landscape': f'climates/landscape/{code}.jpg',
            'cities': list_places_by_climate_and_time(get_csv("data/cities.csv"), code),
        }
    return data #type:ignore

if __name__ == "__main__":
    data = generate_json() #type:ignore
    with open("data/data.json", "w") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

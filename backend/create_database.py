import json

from . import climates
from . import format

def generate_json() -> dict[str, dict]: #type:ignore
    data = {}
    for code in climates.codes:
        data[code] = {
            'code': code,
            'name': climates.decode(code),
            'exists': climates.does_exist(code),
            'cold': climates.breakup(code)[0],
            'arid': climates.breakup(code)[1],
            'warm': climates.breakup(code)[2],
            'cold_plus': climates.traverse_codes(code, 'cold', -1),
            'cold_minus': climates.traverse_codes(code, 'cold', 1),
            'warm_plus': climates.traverse_codes(code, 'warm', -1),
            'warm_minus': climates.traverse_codes(code, 'warm', 1),
            'map_1900s': f'climates/map_1900s/{code}.png',
            'map_2025': f'climates/map_2025/{code}.png',
            'map_2100': f'climates/map_2100/{code}.png',
            'landscape': f'climates/landscape/{code}.jpg',
            'cities': format.list_places_by_climate_and_time(format.get_csv("data/cities.csv"), code),
        }
    return data #type:ignore

if __name__ == "__main__":
    data = generate_json() #type:ignore
    with open("data/data.json", "w") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

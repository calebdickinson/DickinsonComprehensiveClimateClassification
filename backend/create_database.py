import json

from . import climates
from . import format

def generate_json() -> dict[str, dict]: #type:ignore
    database = {}
    for code in climates.codes:
        database[code] = {
            'code': code,
            'name': climates.decode(code),
            'exists': climates.does_exist(code),
            'group': climates.is_code_group(code),
            'go_to_humid': climates.breakup_code_group(code)[0],
            'go_to_semihumid': climates.breakup_code_group(code)[1],
            'go_to_monsoon': climates.breakup_code_group(code)[2],
            'go_to_mediterranean': climates.breakup_code_group(code)[3],
            'go_to_semiarid': climates.breakup_code_group(code)[4],
            'go_to_arid_desert': climates.breakup_code_group(code)[5],
            'go_to_hotter_summer': climates.traverse_codes(code, 'cold', -1),
            'go_to_colder_summer': climates.traverse_codes(code, 'cold', 1),
            'go_to_hotter_winter': climates.traverse_codes(code, 'warm', -1),
            'go_to_colder_winter': climates.traverse_codes(code, 'warm', 1),
            'map_1900s': f'climates/map_1900s/{code}.png',
            'map_2025': f'climates/map_2025/{code}.png',
            'map_2100': f'climates/map_2100/{code}.png',
            'landscape': f'climates/landscape/{code}.jpg',
            'cities': format.list_places_by_climate_and_time(format.get_csv("data/cities.csv"), code),
        }
    return database #type:ignore

if __name__ == "__main__":
    data = generate_json() #type:ignore
    with open("data/data.json", "w") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

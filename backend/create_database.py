import json
from collections import OrderedDict

from backend import climates, format


def _domain_sort_key(code: str):
    """
    Sort codes in a stable, domain-aware way:
    cold (H→...→Y), then arid (H,G,W,M,S,D; '' comes before any arid),
    then warm (H, X, Z2, Z1, A2, A1, B2, B1, C2, C1, Y).
    Falls back gracefully if a code is a group or lacks aridity.
    """
    # Explicit orders (keep in sync with climates.*)
    cold_order = ['H','X','Z','A','B','C','D','E','F','G','Y']
    arid_order = ['', 'H','G','W','M','S','D']  # '' first so non-arid sorts before arid
    warm_order = ['H','X','Z2','Z1','A2','A1','B2','B1','C2','C1','Y']

    # Try to split; if it’s a group, climates.breakup returns [cold, '', warm_group]
    cold, arid, warm = climates.breakup(code)
    # Normalize for ordering
    if cold not in cold_order:
        cold_i = len(cold_order)
    else:
        cold_i = cold_order.index(cold)

    arid_norm = arid if arid in arid_order else ''
    arid_i = arid_order.index(arid_norm)

    warm_i = warm_order.index(warm) if warm in warm_order else len(warm_order)

    return (cold_i, arid_i, warm_i, code)  # final tiebreak on code string


def generate_json() -> dict[str, dict]:  # type: ignore
    # Load once
    cities_df = format.get_csv("data/cities.csv")

    # Stable, domain-aware ordering
    codes_sorted = sorted(climates.codes, key=_domain_sort_key)

    database: dict[str, dict] = OrderedDict()

    for code in codes_sorted:
        # Precompute once
        is_group = climates.is_code_group(code)
        group_parts = climates.breakup_code_group(code) if is_group else ["False"] * 6

        hotter_summer = climates.traverse_codes(code, 'warm', -1)
        colder_summer = climates.traverse_codes(code, 'warm',  1)
        hotter_winter = climates.traverse_codes(code, 'cold', -1)
        colder_winter = climates.traverse_codes(code, 'cold',  1)

        code_lower = code.lower()

        database[code] = {
            'code': code,
            'name': climates.decode(code),
            'exists': climates.does_exist(code),
            'group': is_group,
            'go_to_humid':         group_parts[0],
            'go_to_semihumid':     group_parts[1],
            'go_to_monsoon':       group_parts[2],
            'go_to_mediterranean': group_parts[3],
            'go_to_semiarid':      group_parts[4],
            'go_to_arid_desert':   group_parts[5],
            'go_to_hotter_summer': hotter_summer,
            'go_to_colder_summer': colder_summer,
            'go_to_hotter_winter': hotter_winter,
            'go_to_colder_winter': colder_winter,

            # use the LOWERCASE code in paths
            'map_1900s': f'images/maps/{code_lower}map.png',
            'map_2025':  f'images/maps/2025{code_lower}map.png',
            'map_2100':  f'images/maps/2100{code_lower}map.png',
            'landscape': f'images/landscapes/{code}.jpg',

            'cities': format.list_places_by_climate_and_time(cities_df, code),
        }

        return database


if __name__ == "__main__":
    data = generate_json()
    with open("data/data.json", "w", encoding="utf-8") as json_file:
        json.dump(
            data,
            json_file,
            indent=4,
            ensure_ascii=False,
        )

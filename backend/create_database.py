import json
from collections import OrderedDict
from typing import Dict, Any, Iterable, Set

from backend import climates


def _domain_sort_key(code: str):
    cold_order = ['H','X','Z','A','B','C','D','E','F','G','Y']
    arid_order = ['', 'h','g','w','m','s','d']
    warm_order = ['H','X','z2','z1','z2','z1','z2','z1','z2','z1','Y']

    cold, arid, warm = climates.breakup(code)
    cold_i = cold_order.index(cold) if cold in cold_order else len(cold_order)
    arid_norm = arid if arid in arid_order else ''
    arid_i = arid_order.index(arid_norm)
    warm_i = warm_order.index(warm) if warm in warm_order else len(warm_order)
    return (cold_i, arid_i, warm_i, code)


def _safe(fn, default):
    try:
        return fn()
    except Exception:
        return default


def _group_targets_from_backend(codes: Iterable[str]) -> Set[str]:
    targets: Set[str] = set()
    for code in codes:
        try:
            if climates.is_code_group(code):
                parts = climates.breakup_code_group(code)
                if isinstance(parts, (list, tuple)):
                    for p in parts:
                        if p and str(p).lower() != "false":
                            targets.add(str(p).strip())
        except Exception:
            pass
    return targets


def generate_json() -> Dict[str, Dict[str, Any]]:
    # 1) Start with backend codes only (no cities file)
    base_codes = set(_safe(lambda: set(climates.codes), set()))

    # 2) Include group target codes so navigation doesn't break
    group_targets = _group_targets_from_backend(base_codes)

    all_codes = base_codes | group_targets

    # Sort codes
    def _safe_sort_key(code: str):
        try:
            return _domain_sort_key(code)
        except Exception:
            return (999, 999, 999, code)

    codes_sorted = sorted(all_codes, key=_safe_sort_key)

    database: Dict[str, Dict[str, Any]] = OrderedDict()

    for code in codes_sorted:
        is_group = _safe(lambda: climates.is_code_group(code), False)
        group_parts = _safe(lambda: climates.breakup_code_group(code) if is_group else ["False"]*6,
                            ["False"]*6)
        if not isinstance(group_parts, (list, tuple)) or len(group_parts) != 6:
            group_parts = ["False"]*6

        hotter_summer = _safe(lambda: climates.traverse_codes(code, 'warm', -1), "False")
        colder_summer = _safe(lambda: climates.traverse_codes(code, 'warm',  1), "False")
        hotter_winter = _safe(lambda: climates.traverse_codes(code, 'cold', -1), "False")
        colder_winter = _safe(lambda: climates.traverse_codes(code, 'cold',  1), "False")
        exists        = _safe(lambda: climates.does_exist(code), True)
        decoded_name  = _safe(lambda: climates.decode(code), code)

        database[code] = {
            'code': code,
            'name': decoded_name,
            'exists': exists,
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

            # Exact case-sensitive filenames
            'landscape':    f'images/landscapes/{code}.jpg',
            'map1':         f'images/maps/{code}-map1.png',
            'map2':         f'images/maps/{code}-map2.png',
            'map3':         f'images/maps/{code}-map3.png',
            'map4':         f'images/maps/{code}-map4.png',
            'map1usa':      f'images/maps/{code}-map1usa.png',
            'map2usa':      f'images/maps/{code}-map2usa.png',
            'map3usa':      f'images/maps/{code}-map3usa.png',
            'map4usa':      f'images/maps/{code}-map4usa.png',
            'map1europe':   f'images/maps/{code}-map1europe.png',
            'map2europe':   f'images/maps/{code}-map2europe.png',
            'map3europe':   f'images/maps/{code}-map3europe.png',
            'map4europe':   f'images/maps/{code}-map4europe.png',

            # Cities disabled but structure remains to avoid frontend errors
            'cities': {"map1": [], "map2": [], "map3": [], "map4": []},
        }

    # Ensure nav targets exist
    link_keys = (
        "go_to_humid","go_to_semihumid","go_to_monsoon","go_to_mediterranean",
        "go_to_semiarid","go_to_arid_desert",
        "go_to_hotter_summer","go_to_colder_summer",
        "go_to_hotter_winter","go_to_colder_winter",
    )

    def _ensure_page(dest_code: str):
        if dest_code in database:
            return
        database[dest_code] = {
            'code': dest_code,
            'name': dest_code,
            'exists': True,
            'group': False,
            'go_to_humid': "False",
            'go_to_semihumid': "False",
            'go_to_monsoon': "False",
            'go_to_mediterranean': "False",
            'go_to_semiarid': "False",
            'go_to_arid_desert': "False",
            'go_to_hotter_summer': "False",
            'go_to_colder_summer': "False",
            'go_to_hotter_winter': "False",
            'go_to_colder_winter': "False",

            'landscape':  f'images/landscapes/{dest_code}.jpg',
            'map1':       f'images/maps/{dest_code}-map1.png',
            'map2':       f'images/maps/{dest_code}-map2.png',
            'map3':       f'images/maps/{dest_code}-map3.png',
            'map4':       f'images/maps/{dest_code}-map4.png',
            'map1usa':    f'images/maps/{dest_code}-map1usa.png',
            'map2usa':    f'images/maps/{dest_code}-map2usa.png',
            'map3usa':    f'images/maps/{dest_code}-map3usa.png',
            'map4usa':    f'images/maps/{dest_code}-map4usa.png',
            'map1europe': f'images/maps/{dest_code}-map1europe.png',
            'map2europe': f'images/maps/{dest_code}-map2europe.png',
            'map3europe': f'images/maps/{dest_code}-map3europe.png',
            'map4europe': f'images/maps/{dest_code}-map4europe.png',

            'cities': {"map1": [], "map2": [], "map3": [], "map4": []},
        }

    for _, row in list(database.items()):
        for key in link_keys:
            dest = row.get(key)
            if isinstance(dest, str):
                d = dest.strip()
                if d and d.lower() != "false" and d not in database:
                    _ensure_page(d)

    return database


if __name__ == "__main__":
    data = generate_json()
    with open("data/data.json", "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

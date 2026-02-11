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

# --- NEW: canonicalization helpers ---
def _build_canon_map(known_codes: Iterable[str]) -> Dict[str, str]:
    return {str(c).strip().lower(): str(c).strip() for c in known_codes}

def _canon(code: Any, canon_map: Dict[str, str]) -> str:
    if not isinstance(code, str):
        return "False"
    s = code.strip()
    if not s or s.lower() == "false":
        return "False"
    c = canon_map.get(s.lower(), s)
    return c if c in canon_map.values() else "False"


def _group_targets_from_backend(codes: Iterable[str], canon_map: Dict[str, str]) -> Set[str]:
    targets: Set[str] = set()
    for code in codes:
        try:
            if climates.is_code_group(code):
                parts = climates.breakup_code_group(code)
                if isinstance(parts, (list, tuple)):
                    for p in parts:
                        cp = _canon(p, canon_map)
                        if cp != "False":
                            targets.add(cp)
        except Exception:
            pass
    return targets
# --- end NEW ---

def generate_json() -> Dict[str, Dict[str, Any]]:
    # known codes with correct casing
    base_codes = set(_safe(lambda: set(climates.codes), set()))
    canon_map = _build_canon_map(base_codes)

    # include targets (canonicalized)
    group_targets = _group_targets_from_backend(base_codes, canon_map)
    all_codes = base_codes | group_targets

    def _safe_sort_key(code: str):
        try:
            return _domain_sort_key(code)
        except Exception:
            return (999, 999, 999, code)

    codes_sorted = sorted(all_codes, key=_safe_sort_key)
    database: Dict[str, Dict[str, Any]] = OrderedDict()

    for code in codes_sorted:
        is_group = _safe(lambda: climates.is_code_group(code), False)

        if is_group:
            group_parts = _safe(lambda: climates.breakup_code_group(code), ["False"]*6)

        else:
            # FIRST: try asking backend which group this climate belongs to
            parent_group = _safe(lambda: climates.get_code_group(code), None)

            if parent_group:
                group_parts = _safe(lambda: climates.breakup_code_group(parent_group), ["False"]*6)

            else:
                # FALLBACK: build siblings ourselves
                parts = _safe(lambda: climates.breakup(code), None)

                if parts and len(parts) == 3:
                    cold, arid, warm = parts

                    siblings = [
                        f"{cold}h{warm}",
                        f"{cold}g{warm}",
                        f"{cold}w{warm}",
                        f"{cold}m{warm}",
                        f"{cold}s{warm}",
                        f"{cold}d{warm}",
                    ]

                    group_parts = [
                        s if _safe(lambda s=s: climates.does_exist(s), False) else "False"
                        for s in siblings
                    ]
                else:
                    group_parts = ["False"]*6

        # final safety net
        if not isinstance(group_parts, (list, tuple)) or len(group_parts) != 6:
            group_parts = ["False"]*6

        # canonicalize everything that could be a code
        hotter_summer = _canon(_safe(lambda: climates.traverse_codes(code, 'warm', -1), "False"), canon_map)
        colder_summer = _canon(_safe(lambda: climates.traverse_codes(code, 'warm',  1), "False"), canon_map)
        hotter_winter = _canon(_safe(lambda: climates.traverse_codes(code, 'cold', -1), "False"), canon_map)
        colder_winter = _canon(_safe(lambda: climates.traverse_codes(code, 'cold',  1), "False"), canon_map)

        go_to_humid         = _canon(group_parts[0], canon_map)
        go_to_semihumid     = _canon(group_parts[1], canon_map)
        go_to_monsoon       = _canon(group_parts[2], canon_map)
        go_to_mediterranean = _canon(group_parts[3], canon_map)
        go_to_semiarid      = _canon(group_parts[4], canon_map)
        go_to_arid_desert   = _canon(group_parts[5], canon_map)

        exists       = _safe(lambda: climates.does_exist(code), True)
        decoded_name = _safe(lambda: climates.decode(code), code)

        database[code] = {
            'code': code,
            'name': decoded_name,
            'exists': exists,
            'group': is_group,

            'go_to_humid':         go_to_humid,
            'go_to_semihumid':     go_to_semihumid,
            'go_to_monsoon':       go_to_monsoon,
            'go_to_mediterranean': go_to_mediterranean,
            'go_to_semiarid':      go_to_semiarid,
            'go_to_arid_desert':   go_to_arid_desert,

            'go_to_hotter_summer': hotter_summer,
            'go_to_colder_summer': colder_summer,
            'go_to_hotter_winter': hotter_winter,
            'go_to_colder_winter': colder_winter,

            'landscape':  f'images/landscapes/{code}.jpg',
            'map1':       f'images/maps/{code}-map1.png',
            'map2':       f'images/maps/{code}-map2.png',
            'map3':       f'images/maps/{code}-map3.png',
            'map4':       f'images/maps/{code}-map4.png',
            'map1usa':    f'images/maps/usa/{code}-map1usa.png',
            'map2usa':    f'images/maps/usa/{code}-map2usa.png',
            'map3usa':    f'images/maps/usa/{code}-map3usa.png',
            'map4usa':    f'images/maps/usa/{code}-map4usa.png',

            'cities': {"map1": [], "map2": [], "map3": [], "map4": []},
        }

    link_keys = (
        "go_to_humid","go_to_semihumid","go_to_monsoon","go_to_mediterranean",
        "go_to_semiarid","go_to_arid_desert",
        "go_to_hotter_summer","go_to_colder_summer",
        "go_to_hotter_winter","go_to_colder_winter",
    )

    def _ensure_page(dest_code: str):
        dc = _canon(dest_code, canon_map)
        if dc in database or dc == "False":
            return
        database[dc] = {
            'code': dc,
            'name': dc,
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

            'landscape':  f'images/landscapes/{dc}.jpg',
            'map1':       f'images/maps/{dc}-map1.png',
            'map2':       f'images/maps/{dc}-map2.png',
            'map3':       f'images/maps/{dc}-map3.png',
            'map4':       f'images/maps/{dc}-map4.png',
            'map1usa':    f'images/maps/usa/{dc}-map1usa.png',
            'map2usa':    f'images/maps/usa/{dc}-map2usa.png',
            'map3usa':    f'images/maps/usa/{dc}-map3usa.png',
            'map4usa':    f'images/maps/usa/{dc}-map4usa.png',
            'cities': {"map1": [], "map2": [], "map3": [], "map4": []},
        }

    for _, row in list(database.items()):
        for key in link_keys:
            dest = row.get(key)
            if isinstance(dest, str) and dest.strip():
                _ensure_page(dest)

    return database

if __name__ == "__main__":
    data = generate_json()
    with open("data/data.json2", "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

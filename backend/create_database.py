import json
from collections import OrderedDict
from typing import Dict, Any, Iterable, Set

from backend import climates, format


def _domain_sort_key(code: str):
    """
    Sort codes in a stable, domain-aware way:
    cold (H→...→Y), then arid (H,G,W,M,S,D; '' comes before any arid),
    then warm (H, X, Z2, Z1, A2, A1, B2, B1, C2, C1, Y).
    Falls back gracefully if a code is a group or lacks aridity.
    """
    cold_order = ['H','X','Z','A','B','C','D','E','F','G','Y']
    arid_order = ['', 'H','G','W','M','S','D']  # '' first so non-arid sorts before arid
    warm_order = ['H','X','Z2','Z1','A2','A1','B2','B1','C2','C1','Y']

    cold, arid, warm = climates.breakup(code)  # may throw on unknowns (handled by safe wrapper below)
    cold_i = cold_order.index(cold) if cold in cold_order else len(cold_order)
    arid_norm = arid if arid in arid_order else ''
    arid_i = arid_order.index(arid_norm)
    warm_i = warm_order.index(warm) if warm in warm_order else len(warm_order)
    return (cold_i, arid_i, warm_i, code)


def _falsey(v) -> bool:
    return v in ("False", "false", False, "", None)


def _safe(fn, default):
    try:
        return fn()
    except Exception:
        return default


def _codes_from_cities_df(df) -> Set[str]:
    # Collect codes from 1900s/2025/2100 cols (1,2,3). Normalize to UPPER.
    cols = [1, 2, 3]
    out: Set[str] = set()
    for c in cols:
        if c >= df.shape[1]:
            continue
        s = df.iloc[:, c].dropna().astype(str).str.strip()
        out |= set(s[s != ""])
    return {c.upper() for c in out}


def _group_targets_from_backend(codes: Iterable[str]) -> Set[str]:
    targets: Set[str] = set()
    for code in codes:
        try:
            if climates.is_code_group(code):
                parts = climates.breakup_code_group(code)
                if isinstance(parts, (list, tuple)):
                    for p in parts:
                        if p and str(p).lower() != "false":
                            targets.add(str(p).strip().upper())
        except Exception:
            # If backend can't parse a code, skip it
            pass
    return targets


def generate_json() -> Dict[str, Dict[str, Any]]:  # type: ignore
    # Load once
    cities_df = format.get_csv("data/cities.csv")

    # 1) Start with backend codes
    base_codes = set(_safe(lambda: set(climates.codes), set()))

    # 2) Add any codes present in the CSV (e.g., ZSZ1, BSZ1, CSZ1...)
    csv_codes = _codes_from_cities_df(cities_df)

    # 3) Add any group targets referenced by backend group rows
    group_targets = _group_targets_from_backend(base_codes)

    # Union = everything we must generate so navigation never breaks
    all_codes = base_codes | csv_codes | group_targets

    # Sort with domain-aware key; unknowns go last but still get pages
    def _safe_sort_key(code: str):
        try:
            return _domain_sort_key(code)
        except Exception:
            return (999, 999, 999, code)

    codes_sorted = sorted(all_codes, key=_safe_sort_key)

    database: Dict[str, Dict[str, Any]] = OrderedDict()

    for code in codes_sorted:
        # Backend-derived facts with safe fallbacks so unknowns still render
        is_group = _safe(lambda: climates.is_code_group(code), False)

        group_parts = _safe(
            lambda: climates.breakup_code_group(code) if is_group else ["False"] * 6,
            ["False"] * 6,
        )
        if not isinstance(group_parts, (list, tuple)) or len(group_parts) != 6:
            group_parts = ["False"] * 6

        hotter_summer = _safe(lambda: climates.traverse_codes(code, 'warm', -1), "False")
        colder_summer = _safe(lambda: climates.traverse_codes(code, 'warm',  1), "False")
        hotter_winter = _safe(lambda: climates.traverse_codes(code, 'cold', -1), "False")
        colder_winter = _safe(lambda: climates.traverse_codes(code, 'cold',  1), "False")

        exists       = _safe(lambda: climates.does_exist(code), True)  # default True => render page
        decoded_name = _safe(lambda: climates.decode(code), code)

        database[code] = {
            'code': code,
            'name': decoded_name,
            'exists': exists,
            'group': is_group,

            'go_to_humid':           group_parts[0],
            'go_to_semihumid':       group_parts[1],
            'go_to_monsoon':         group_parts[2],
            'go_to_mediterranean':   group_parts[3],
            'go_to_semiarid':        group_parts[4],
            'go_to_arid_desert':     group_parts[5],

            'go_to_hotter_summer': hotter_summer,
            'go_to_colder_summer': colder_summer,
            'go_to_hotter_winter': hotter_winter,
            'go_to_colder_winter': colder_winter,

            'map_1900s': f'images/maps/{code}map.png',
            'map_2025':  f'images/maps/2025{code}map.png',
            'map_2100':  f'images/maps/2100{code}map.png',
            'landscape': f'images/landscapes/{code}.jpg',

            'cities': format.list_places_by_climate_and_time(cities_df, code),
        }

    # --- Guarantee: no go_to_* points at a missing page ---
    link_keys = (
        "go_to_humid", "go_to_semihumid", "go_to_monsoon", "go_to_mediterranean",
        "go_to_semiarid", "go_to_arid_desert",
        "go_to_hotter_summer", "go_to_colder_summer",
        "go_to_hotter_winter", "go_to_colder_winter",
    )

    def _ensure_page(dest_code: str):
        if dest_code in database:
            return
        # Minimal stub so navigation never breaks; you can fill assets later
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
            'map_1900s': f'images/maps/{dest_code}map.png',
            'map_2025':  f'images/maps/2025{dest_code}map.png',
            'map_2100':  f'images/maps/2100{dest_code}map.png',
            'landscape': f'images/landscapes/{dest_code}.jpg',
            'cities': format.list_places_by_climate_and_time(cities_df, dest_code),
        }

    missing = []
    for src_code, row in list(database.items()):
        for key in link_keys:
            dest = row.get(key)
            if isinstance(dest, str):
                d = dest.strip()
                if d and d.lower() != "false" and d not in database:
                    missing.append((src_code, key, d))
                    _ensure_page(d)

    if missing:
        print("WARNING: Auto-created stub pages for missing targets:")
        for src, key, dest in missing:
            print(f"  {src}.{key} -> {dest}")

    return database


if __name__ == "__main__":
    data = generate_json()
    with open("data/data.json", "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

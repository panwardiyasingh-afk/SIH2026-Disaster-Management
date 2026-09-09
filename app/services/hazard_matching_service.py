import math
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

HABITATIONS_CSV = DATA_DIR / "habitations.csv"
HAZARDS_CSV = DATA_DIR / "hazards.csv"

_habitations_df: Optional[pd.DataFrame] = None
_hazards_df: Optional[pd.DataFrame] = None


def normalize_string(val: Any) -> str:
    if pd.isna(val) or val is None:
        return ""
    text = str(val).strip().lower()
    text = re.sub(r"[^\w\s]", "", text)
    return " ".join(text.split())


def _find_column(df: pd.DataFrame, aliases: List[str]) -> Optional[str]:
    cleaned_aliases = {re.sub(r"[_\s\-]+", "", a.lower()): a for a in aliases}
    for col in df.columns:
        cleaned_col = re.sub(r"[_\s\-]+", "", str(col).lower())
        if cleaned_col in cleaned_aliases:
            return col
    return None


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def load_datasets() -> None:
    global _habitations_df, _hazards_df

    if _habitations_df is None:
        _habitations_df = pd.read_csv(HABITATIONS_CSV)
        id_col = _find_column(_habitations_df, ["habitation_id", "id", "hab_id"])
        dist_col = _find_column(_habitations_df, ["district", "district_name"])
        name_col = _find_column(_habitations_df, ["habitation_name", "habitation", "name"])
        lat_col = _find_column(_habitations_df, ["latitude", "lat"])
        lon_col = _find_column(_habitations_df, ["longitude", "long", "lon"])

        _habitations_df["_lookup_id"] = _habitations_df[id_col].astype(str).str.strip()
        _habitations_df["_norm_district"] = _habitations_df[dist_col].apply(normalize_string) if dist_col else ""
        _habitations_df["_norm_name"] = _habitations_df[name_col].apply(normalize_string) if name_col else ""
        _habitations_df["_lat"] = pd.to_numeric(_habitations_df[lat_col], errors="coerce") if lat_col else None
        _habitations_df["_lon"] = pd.to_numeric(_habitations_df[lon_col], errors="coerce") if lon_col else None

    if _hazards_df is None:
        _hazards_df = pd.read_csv(HAZARDS_CSV)
        hz_dist_col = _find_column(_hazards_df, ["district", "district_name"])
        hz_name_col = _find_column(_hazards_df, ["habitation_name", "village", "location", "hazard_location", "name"])
        hz_lat_col = _find_column(_hazards_df, ["latitude", "lat"])
        hz_lon_col = _find_column(_hazards_df, ["longitude", "long", "lon"])

        _hazards_df["_norm_district"] = _hazards_df[hz_dist_col].apply(normalize_string) if hz_dist_col else ""
        _hazards_df["_norm_name"] = _hazards_df[hz_name_col].apply(normalize_string) if hz_name_col else ""
        _hazards_df["_lat"] = pd.to_numeric(_hazards_df[hz_lat_col], errors="coerce") if hz_lat_col else None
        _hazards_df["_lon"] = pd.to_numeric(_hazards_df[hz_lon_col], errors="coerce") if hz_lon_col else None


def match_hazards_for_habitation(
    habitation_id: Any, max_radius_km: float = 60.0
) -> Dict[str, Any]:
    load_datasets()

    print(f"\n==================== CHECKING HABITATION {habitation_id} ====================")

    hab_subset = _habitations_df[_habitations_df["_lookup_id"] == str(habitation_id).strip()]
    if hab_subset.empty:
        print(f"Habitation {habitation_id} NOT found in habitations.csv")
        return {"status": "NO_CONFIRMED_MATCH", "habitation_id": habitation_id, "hazards": []}

    hab = hab_subset.iloc[0]
    h_dist = hab["_norm_district"]
    h_name = hab["_norm_name"]
    h_lat = hab["_lat"]
    h_lon = hab["_lon"]

    print(f"Habitation Details: Name='{h_name}', District='{h_dist}', Coords=({h_lat}, {h_lon})")

    # Filter hazards to the same district
    district_hazards = _hazards_df[_hazards_df["_norm_district"] == h_dist]
    print(f"Hazards available in district '{h_dist}': {len(district_hazards)} rows")

    if district_hazards.empty:
        return {"status": "NO_CONFIRMED_MATCH", "habitation_id": habitation_id, "hazards": []}

    # Calculate distance to every hazard in the district
    all_distances = []
    confirmed_hazards = []

    has_hab_coords = pd.notna(h_lat) and pd.notna(h_lon)

    for _, hz_row in district_hazards.iterrows():
        hz_lat = hz_row["_lat"]
        hz_lon = hz_row["_lon"]
        hz_loc_name = hz_row["_norm_name"]
        distance = None

        if has_hab_coords and pd.notna(hz_lat) and pd.notna(hz_lon):
            distance = round(haversine_distance(float(h_lat), float(h_lon), float(hz_lat), float(hz_lon)), 2)
            all_distances.append((hz_loc_name, distance))

        # Check radius match or fallback name match
        is_match = False
        if distance is not None and distance <= max_radius_km:
            is_match = True
        elif h_name and hz_loc_name and (h_name in hz_loc_name or hz_loc_name in h_name):
            is_match = True

        if is_match:
            clean_hazard = {
                k: (None if pd.isna(v) else v)
                for k, v in hz_row.items()
                if not k.startswith("_")
            }
            if distance is not None:
                clean_hazard["hazard_distance_km"] = distance
            confirmed_hazards.append(clean_hazard)

    all_distances.sort(key=lambda x: x[1])
    print(f"Top 3 closest hazards in '{h_dist}': {all_distances[:3]}")
    print(f"Hazards matched within {max_radius_km} km: {len(confirmed_hazards)}")

    if not confirmed_hazards:
        return {"status": "NO_CONFIRMED_MATCH", "habitation_id": habitation_id, "hazards": []}

    confirmed_hazards.sort(key=lambda x: x.get("hazard_distance_km", 999))

    return {
        "status": "CONFIRMED_MATCH",
        "habitation_id": habitation_id,
        "match_type": "GEOGRAPHIC_PROXIMITY",
        "matched_count": len(confirmed_hazards),
        "hazards": confirmed_hazards,
    }
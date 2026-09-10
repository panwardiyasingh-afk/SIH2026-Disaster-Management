import math
import re

from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DATA_DIR = BASE_DIR / "data"

HABITATIONS_CSV = DATA_DIR / "habitations.csv"

HAZARDS_CSV = DATA_DIR / "hazards.csv"


# ============================================================
# DATA CACHE
# ============================================================

_habitations_df: Optional[pd.DataFrame] = None
_hazards_df: Optional[pd.DataFrame] = None

# Pre-grouped hazards by district.
# This avoids filtering the complete hazards dataframe
# for every habitation.
_hazards_by_district: Dict[str, pd.DataFrame] = {}


# ============================================================
# STRING NORMALIZATION
# ============================================================

def normalize_string(val: Any) -> str:

    if pd.isna(val) or val is None:
        return ""

    text = str(val).strip().lower()

    text = re.sub(r"[^\w\s]", "", text)

    return " ".join(text.split())


# ============================================================
# COLUMN FINDER
# ============================================================

def _find_column(
    df: pd.DataFrame,
    aliases: List[str],
) -> Optional[str]:

    cleaned_aliases = {
        re.sub(r"[_\s\-]+", "", a.lower()): a
        for a in aliases
    }

    for col in df.columns:

        cleaned_col = re.sub(
            r"[_\s\-]+",
            "",
            str(col).lower(),
        )

        if cleaned_col in cleaned_aliases:
            return col

    return None


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:

    earth_radius_km = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    delta_phi = math.radians(
        lat2 - lat1
    )

    delta_lambda = math.radians(
        lon2 - lon1
    )

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1)
        * math.cos(phi2)
        * math.sin(delta_lambda / 2.0) ** 2
    )

    return (
        2.0
        * earth_radius_km
        * math.atan2(
            math.sqrt(a),
            math.sqrt(1.0 - a),
        )
    )


# ============================================================
# LOAD DATASETS
# ============================================================

def load_datasets() -> None:

    global _habitations_df
    global _hazards_df
    global _hazards_by_district

    # ========================================================
    # LOAD HABITATIONS
    # ========================================================

    if _habitations_df is None:

        _habitations_df = pd.read_csv(
            HABITATIONS_CSV
        )

        id_col = _find_column(
            _habitations_df,
            [
                "habitation_id",
                "id",
                "hab_id",
            ],
        )

        dist_col = _find_column(
            _habitations_df,
            [
                "district",
                "district_name",
            ],
        )

        name_col = _find_column(
            _habitations_df,
            [
                "habitation_name",
                "habitation",
                "name",
            ],
        )

        lat_col = _find_column(
            _habitations_df,
            [
                "latitude",
                "lat",
            ],
        )

        lon_col = _find_column(
            _habitations_df,
            [
                "longitude",
                "long",
                "lon",
            ],
        )

        if id_col is None:

            raise ValueError(
                "Could not find habitation ID column "
                "in habitations.csv"
            )

        _habitations_df["_lookup_id"] = (
            _habitations_df[id_col]
            .astype(str)
            .str.strip()
        )

        if dist_col:

            _habitations_df["_norm_district"] = (
                _habitations_df[dist_col]
                .apply(normalize_string)
            )

        else:

            _habitations_df["_norm_district"] = ""

        if name_col:

            _habitations_df["_norm_name"] = (
                _habitations_df[name_col]
                .apply(normalize_string)
            )

        else:

            _habitations_df["_norm_name"] = ""

        if lat_col:

            _habitations_df["_lat"] = pd.to_numeric(
                _habitations_df[lat_col],
                errors="coerce",
            )

        else:

            _habitations_df["_lat"] = None

        if lon_col:

            _habitations_df["_lon"] = pd.to_numeric(
                _habitations_df[lon_col],
                errors="coerce",
            )

        else:

            _habitations_df["_lon"] = None

    # ========================================================
    # LOAD HAZARDS
    # ========================================================

    if _hazards_df is None:

        _hazards_df = pd.read_csv(
            HAZARDS_CSV
        )

        hz_dist_col = _find_column(
            _hazards_df,
            [
                "district",
                "district_name",
            ],
        )

        hz_name_col = _find_column(
            _hazards_df,
            [
                "habitation_name",
                "village",
                "location",
                "hazard_location",
                "name",
            ],
        )

        hz_lat_col = _find_column(
            _hazards_df,
            [
                "latitude",
                "lat",
            ],
        )

        hz_lon_col = _find_column(
            _hazards_df,
            [
                "longitude",
                "long",
                "lon",
            ],
        )

        if hz_dist_col:

            _hazards_df["_norm_district"] = (
                _hazards_df[hz_dist_col]
                .apply(normalize_string)
            )

        else:

            _hazards_df["_norm_district"] = ""

        if hz_name_col:

            _hazards_df["_norm_name"] = (
                _hazards_df[hz_name_col]
                .apply(normalize_string)
            )

        else:

            _hazards_df["_norm_name"] = ""

        if hz_lat_col:

            _hazards_df["_lat"] = pd.to_numeric(
                _hazards_df[hz_lat_col],
                errors="coerce",
            )

        else:

            _hazards_df["_lat"] = None

        if hz_lon_col:

            _hazards_df["_lon"] = pd.to_numeric(
                _hazards_df[hz_lon_col],
                errors="coerce",
            )

        else:

            _hazards_df["_lon"] = None

        # ====================================================
        # PRE-GROUP HAZARDS BY DISTRICT
        # ====================================================

        _hazards_by_district = {
            district: group
            for district, group
            in _hazards_df.groupby(
                "_norm_district"
            )
        }

        print(
            f"Loaded {len(_hazards_df)} hazards "
            f"across "
            f"{len(_hazards_by_district)} districts."
        )


# ============================================================
# MATCH HAZARDS FOR HABITATION
# ============================================================

def match_hazards_for_habitation(
    habitation_id: Any,
    max_radius_km: float = 15.0,
    verbose: bool = False,
) -> Dict[str, Any]:

    load_datasets()

    habitation_id_string = str(
        habitation_id
    ).strip()

    # ========================================================
    # FIND HABITATION
    # ========================================================

    hab_subset = _habitations_df[
        _habitations_df["_lookup_id"]
        == habitation_id_string
    ]

    if hab_subset.empty:

        if verbose:

            print(
                f"Habitation {habitation_id} "
                f"NOT found in habitations.csv"
            )

        return {
            "status": "NO_CONFIRMED_MATCH",
            "habitation_id": habitation_id,
            "hazards": [],
        }

    hab = hab_subset.iloc[0]

    h_dist = hab["_norm_district"]

    h_name = hab["_norm_name"]

    h_lat = hab["_lat"]

    h_lon = hab["_lon"]

    # ========================================================
    # VERBOSE DEBUG
    # ========================================================

    if verbose:

        print(
            "\n==================== "
            f"CHECKING HABITATION {habitation_id} "
            "===================="
        )

        print(
            f"Habitation Details: "
            f"Name='{h_name}', "
            f"District='{h_dist}', "
            f"Coords=({h_lat}, {h_lon})"
        )

    # ========================================================
    # GET ONLY HAZARDS FROM SAME DISTRICT
    # ========================================================

    district_hazards = (
        _hazards_by_district.get(
            h_dist,
            pd.DataFrame()
        )
    )

    if verbose:

        print(
            f"Hazards available in district "
            f"'{h_dist}': "
            f"{len(district_hazards)} rows"
        )

    if district_hazards.empty:

        return {
            "status": "NO_CONFIRMED_MATCH",
            "habitation_id": habitation_id,
            "hazards": [],
        }

    # ========================================================
    # COORDINATE CHECK
    # ========================================================

    has_hab_coords = (
        pd.notna(h_lat)
        and pd.notna(h_lon)
    )

    confirmed_hazards = []

    all_distances = []

    # ========================================================
    # PROCESS ONLY SAME-DISTRICT HAZARDS
    # ========================================================

    for _, hz_row in district_hazards.iterrows():

        hz_lat = hz_row["_lat"]

        hz_lon = hz_row["_lon"]

        hz_loc_name = hz_row["_norm_name"]

        distance = None

        # ----------------------------------------------------
        # CALCULATE DISTANCE
        # ----------------------------------------------------

        if (
            has_hab_coords
            and pd.notna(hz_lat)
            and pd.notna(hz_lon)
        ):

            distance = round(
                haversine_distance(
                    float(h_lat),
                    float(h_lon),
                    float(hz_lat),
                    float(hz_lon),
                ),
                2,
            )

            if verbose:

                all_distances.append(
                    (
                        hz_loc_name,
                        distance,
                    )
                )

        # ----------------------------------------------------
        # MATCH
        # ----------------------------------------------------

        is_match = False

        # Primary:
        # geographic proximity.
        if (
            distance is not None
            and distance <= max_radius_km
        ):

            is_match = True

        # Fallback:
        # habitation/village name.
        elif (
            h_name
            and hz_loc_name
            and (
                h_name in hz_loc_name
                or hz_loc_name in h_name
            )
        ):

            is_match = True

        # ----------------------------------------------------
        # SAVE MATCH
        # ----------------------------------------------------

        if is_match:

            clean_hazard = {
                key: (
                    None
                    if pd.isna(value)
                    else value
                )
                for key, value
                in hz_row.items()
                if not key.startswith("_")
            }

            if distance is not None:

                clean_hazard[
                    "hazard_distance_km"
                ] = distance

            confirmed_hazards.append(
                clean_hazard
            )

    # ========================================================
    # DEBUG
    # ========================================================

    if verbose:

        all_distances.sort(
            key=lambda x: x[1]
        )

        print(
            f"Top 3 closest hazards in "
            f"'{h_dist}': "
            f"{all_distances[:3]}"
        )

        print(
            f"Hazards matched within "
            f"{max_radius_km} km: "
            f"{len(confirmed_hazards)}"
        )

    # ========================================================
    # NO MATCH
    # ========================================================

    if not confirmed_hazards:

        return {
            "status": "NO_CONFIRMED_MATCH",
            "habitation_id": habitation_id,
            "hazards": [],
        }

    # ========================================================
    # SORT NEAREST FIRST
    # ========================================================

    confirmed_hazards.sort(
        key=lambda x: x.get(
            "hazard_distance_km",
            999,
        )
    )

    # ========================================================
    # RETURN
    # ========================================================

    return {
        "status": "CONFIRMED_MATCH",
        "habitation_id": habitation_id,
        "match_type": "GEOGRAPHIC_PROXIMITY",
        "matched_count": len(
            confirmed_hazards
        ),
        "hazards": confirmed_hazards,
    }
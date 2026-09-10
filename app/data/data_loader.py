from pathlib import Path
from typing import Optional

import pandas as pd

from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.models.relocation_site import RelocationSite


# ============================================================
# DATA DIRECTORY
# ============================================================

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


# ============================================================
# IN-MEMORY CACHES
# ============================================================

_habitations_cache: Optional[list[Habitation]] = None
_hazards_cache: Optional[list[Hazard]] = None
_relocation_sites_cache: Optional[list[RelocationSite]] = None


# ============================================================
# HABITATIONS
# ============================================================

def load_habitations() -> list[Habitation]:
    """
    Load habitations from CSV.

    The CSV is read only once. Subsequent calls return
    the cached habitation list.
    """

    global _habitations_cache

    if _habitations_cache is not None:
        return _habitations_cache

    csv_path = DATA_DIR / "habitations.csv"

    dataframe = pd.read_csv(csv_path)

    habitations = []

    for _, row in dataframe.iterrows():

        habitation = Habitation(
            habitation_id=int(row["habitation_id"]),
            habitation_name=str(row["habitation_name"]),
            district=str(row["district"]),
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
        )

        habitations.append(habitation)

    _habitations_cache = habitations

    print(
        f"Loaded {len(habitations)} habitations."
    )

    return _habitations_cache


# ============================================================
# HAZARDS
# ============================================================

def load_hazards() -> list[Hazard]:
    """
    Load hazards from CSV.

    The CSV is read only once. Subsequent calls return
    the cached hazard list.
    """

    global _hazards_cache

    if _hazards_cache is not None:
        return _hazards_cache

    csv_path = DATA_DIR / "hazards.csv"

    dataframe = pd.read_csv(csv_path)

    hazards = []

    for _, row in dataframe.iterrows():

        hazard = Hazard(
            hazard_id=str(row["hazard_id"]),
            hazard_type=str(row["hazard_type"]),
            district=str(row["district"]),
            circle=str(row["circle"]),
            village=str(row["village"]),
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
            event_date=str(row["event_date"]),
            hazard_category=str(row["hazard_category"]),
            severity=str(row["severity"]),
            affected_area=str(row["affected_area"]),
            source=str(row["source"]),
        )

        hazards.append(hazard)

    _hazards_cache = hazards

    print(
        f"Loaded {len(hazards)} hazards."
    )

    return _hazards_cache


# ============================================================
# RELOCATION SITES
# ============================================================

def load_relocation_sites() -> list[RelocationSite]:
    """
    Load relocation sites from CSV.

    The CSV is read only once. Subsequent calls return
    the cached relocation-site list.
    """

    global _relocation_sites_cache

    if _relocation_sites_cache is not None:
        return _relocation_sites_cache

    csv_path = DATA_DIR / "relocation_sites.csv"

    dataframe = pd.read_csv(csv_path)

    relocation_sites = []

    for _, row in dataframe.iterrows():

        site = RelocationSite(
            site_id=str(row["site_id"]),
            site_name=str(row["site_name"]),
            district=str(row["district"]),
            village=str(row["village"]),
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
            site_type=str(row["site_type"]),
            capacity=int(row["capacity"]),
            toilets=int(row["toilets"]),
            child_friendly_space=str(
                row["child_friendly_space"]
            ),
            status=str(row["status"]),
            source=str(row["source"]),
        )

        relocation_sites.append(site)

    _relocation_sites_cache = relocation_sites

    print(
        f"Loaded {len(relocation_sites)} relocation sites."
    )

    return _relocation_sites_cache


# ============================================================
# OPTIONAL CACHE RESET
# ============================================================

def clear_data_cache() -> None:
    """
    Clear all in-memory datasets.

    Useful during development if a CSV file is replaced
    while the server is running.
    """

    global _habitations_cache
    global _hazards_cache
    global _relocation_sites_cache

    _habitations_cache = None
    _hazards_cache = None
    _relocation_sites_cache = None

    print("Data cache cleared.")
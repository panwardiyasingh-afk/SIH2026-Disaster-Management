from pathlib import Path

import pandas as pd

from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.models.relocation_site import RelocationSite


# Finds the project-root data folder regardless of where the server is started.
DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def load_habitations() -> list[Habitation]:
    dataframe = pd.read_csv(DATA_DIR / "habitations.csv")

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

    return habitations


def load_hazards() -> list[Hazard]:
    dataframe = pd.read_csv(DATA_DIR / "hazards.csv")

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

    return hazards


def load_relocation_sites() -> list[RelocationSite]:
    dataframe = pd.read_csv(DATA_DIR / "relocation_sites.csv")

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
            child_friendly_space=str(row["child_friendly_space"]),
            status=str(row["status"]),
            source=str(row["source"]),
        )

        relocation_sites.append(site)

    return relocation_sites
from math import asin, cos, radians, sin, sqrt

from app.models.habitation import Habitation
from app.models.relocation_site import RelocationSite
from app.services.capacity_service import (
    can_accommodate_population,
    get_site_capacity,
)


def calculate_distance_km(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    """
    Calculate geographic distance between two coordinates
    using the Haversine formula.
    """

    earth_radius_km = 6371

    latitude_difference = radians(latitude_2 - latitude_1)
    longitude_difference = radians(longitude_2 - longitude_1)

    a = (
        sin(latitude_difference / 2) ** 2
        + cos(radians(latitude_1))
        * cos(radians(latitude_2))
        * sin(longitude_difference / 2) ** 2
    )

    return round(
        2 * earth_radius_km * asin(sqrt(a)),
        2
    )


def calculate_suitability_score(
    site: RelocationSite,
    population: int,
    distance_km: float,
) -> float:
    """
    Calculate a transparent prototype suitability score
    using fields available in the real relocation dataset.
    """

    # Capacity score
    if population > 0:
        capacity_score = min(
            (site.capacity / population) * 100,
            100
        )
    else:
        capacity_score = 0

    # Toilet score
    toilet_score = min(
        (site.toilets / max(population, 1)) * 100,
        100
    )

    # Child-friendly facility score
    child_space_text = str(
        site.child_friendly_space
    ).strip().lower()

    child_space_score = (
        100
        if child_space_text in {
            "yes",
            "true",
            "available",
            "present",
        }
        else 0
    )

    # Distance score
    # Closer relocation sites receive a higher score.
    distance_score = max(
        0,
        100 - (distance_km * 5)
    )

    # Final suitability score
    suitability_score = (
        capacity_score * 0.45
        + toilet_score * 0.20
        + child_space_score * 0.10
        + distance_score * 0.25
    )

    return round(
        suitability_score,
        2
    )


def find_suitable_relocation_sites(
    habitation: Habitation,
    sites: list[RelocationSite],
    population: int = 0,
) -> list[dict]:
    """
    Find suitable relocation sites and rank them by suitability.

    Population is supplied separately because the current
    habitation dataset does not contain a population field.
    """

    suitable_sites = []

    for site in sites:

        # Skip only clearly unusable sites.
        status = str(site.status).strip().lower()

        if status in {
            "inactive",
            "closed",
            "unavailable",
            "not operational",
        }:
            continue

        # Capacity check
        if population > 0 and not can_accommodate_population(
            site,
            population
        ):
            continue

        # Calculate distance
        distance_km = calculate_distance_km(
            habitation.latitude,
            habitation.longitude,
            site.latitude,
            site.longitude,
        )

        # Calculate suitability score
        suitability_score = calculate_suitability_score(
            site,
            population,
            distance_km,
        )

        suitable_sites.append(
            {
                "site": site,
                "site_capacity": get_site_capacity(site),
                "distance_km": distance_km,
                "suitability_score": suitability_score,
            }
        )

    # Highest suitability score first
    return sorted(
        suitable_sites,
        key=lambda item: item["suitability_score"],
        reverse=True,
    )
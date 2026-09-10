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

    latitude_difference = radians(
        latitude_2 - latitude_1
    )

    longitude_difference = radians(
        longitude_2 - longitude_1
    )

    a = (
        sin(latitude_difference / 2) ** 2
        + cos(radians(latitude_1))
        * cos(radians(latitude_2))
        * sin(longitude_difference / 2) ** 2
    )

    return round(
        2
        * earth_radius_km
        * asin(sqrt(a)),
        2,
    )


def calculate_suitability_score(
    site: RelocationSite,
    population: int,
    distance_km: float,
) -> float:
    """
    Calculate a transparent relocation-site
    suitability score.

    Population is optional because the current
    habitation dataset does not contain population.
    """

    if population > 0:
        capacity_score = min(
            (site.capacity / population) * 100,
            100,
        )
    else:
        capacity_score = 0

    toilet_score = min(
        (site.toilets / max(population, 1)) * 100,
        100,
    )

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

    # Closer sites receive a higher distance score.
    distance_score = max(
        0,
        100 - (distance_km * 5),
    )

    suitability_score = (
        capacity_score * 0.45
        + toilet_score * 0.20
        + child_space_score * 0.10
        + distance_score * 0.25
    )

    return round(
        suitability_score,
        2,
    )


def find_suitable_relocation_sites(
    habitation: Habitation,
    sites: list[RelocationSite],
    population: int = 0,
    max_results: int = 5,
) -> list[dict]:
    """
    Find the nearest active relocation sites
    for an affected habitation.

    Process:
        1. Remove inactive/unavailable sites.
        2. Check population capacity only if
           population data is available.
        3. Calculate distance from the affected
           habitation to every relocation site.
        4. Calculate a suitability score.
        5. Sort primarily by geographic distance.
        6. Return only the nearest sites.

    Since the current habitation dataset does not
    contain population, population-based capacity
    filtering is not performed.
    """

    suitable_sites = []

    for site in sites:

        # Normalize site status.
        status = str(
            site.status
        ).strip().lower()

        # Ignore sites that are not operational.
        if status in {
            "inactive",
            "closed",
            "unavailable",
            "not operational",
        }:
            continue

        # Only perform capacity filtering when
        # actual population is provided.
        if population > 0:
            if not can_accommodate_population(
                site,
                population,
            ):
                continue

        # Calculate distance from the affected
        # habitation to the relocation site.
        distance_km = calculate_distance_km(
            habitation.latitude,
            habitation.longitude,
            site.latitude,
            site.longitude,
        )

        # Calculate additional site information.
        suitability_score = calculate_suitability_score(
            site,
            population,
            distance_km,
        )

        suitable_sites.append(
            {
                "site": site,
                "site_capacity": get_site_capacity(
                    site
                ),
                "distance_km": distance_km,
                "suitability_score": suitability_score,
            }
        )

    # IMPORTANT:
    # The user's requirement is to show sites
    # nearest to the affected area.
    suitable_sites.sort(
        key=lambda item: item["distance_km"]
    )

    # Return only the 5 nearest sites.
    return suitable_sites[:max_results]
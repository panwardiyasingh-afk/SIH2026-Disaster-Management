from app.models.relocation_site import RelocationSite


def get_site_capacity(site: RelocationSite) -> int:
    """
    Return the capacity directly provided by the
    real relocation-site dataset.
    """
    return site.capacity


def can_accommodate_population(
    site: RelocationSite,
    population: int,
) -> bool:
    """
    Check whether the relocation site has enough
    capacity for the given population.
    """
    return get_site_capacity(site) >= population
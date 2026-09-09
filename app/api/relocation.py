from fastapi import APIRouter, HTTPException

from app.data.data_loader import load_habitations, load_relocation_sites
from app.models.relocation_site import RelocationSite
from app.services.capacity_service import get_site_capacity
from app.services.relocation_service import find_suitable_relocation_sites


router = APIRouter(
    prefix="/api",
    tags=["Relocation"]
)


def find_site_or_404(site_id: str) -> RelocationSite:
    for site in load_relocation_sites():
        if site.site_id == site_id:
            return site

    raise HTTPException(
        status_code=404,
        detail="Relocation site not found"
    )


@router.get("/relocation-sites", response_model=list[RelocationSite])
def get_relocation_sites():
    return load_relocation_sites()


@router.get("/relocation-sites/{site_id}/capacity")
def get_relocation_site_capacity(site_id: str):
    site = find_site_or_404(site_id)

    return {
        "site_id": site.site_id,
        "site_name": site.site_name,
        "site_capacity": get_site_capacity(site),
    }


@router.get("/relocation-sites/{site_id}", response_model=RelocationSite)
def get_relocation_site(site_id: str):
    return find_site_or_404(site_id)


@router.get("/habitations/{habitation_id}/relocation-sites")
def get_relocation_sites_for_habitation(habitation_id: int):
    habitation = next(
        (
            habitation
            for habitation in load_habitations()
            if habitation.habitation_id == habitation_id
        ),
        None
    )

    if habitation is None:
        raise HTTPException(
            status_code=404,
            detail="Habitation not found"
        )

    ranked_sites = find_suitable_relocation_sites(
        habitation,
        load_relocation_sites(),
        population=0
    )

    return {
        "habitation_id": habitation.habitation_id,
        "habitation_name": habitation.habitation_name,
        "suitable_sites": ranked_sites,
    }
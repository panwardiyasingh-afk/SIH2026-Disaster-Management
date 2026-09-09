from fastapi import APIRouter, HTTPException

from app.data.data_loader import (
    load_habitations,
    load_relocation_sites,
)
from app.models.hazard import Hazard
from app.services.hazard_matching_service import (
    match_hazards_for_habitation,
)
from app.services.relocation_service import (
    find_suitable_relocation_sites,
)
from app.services.risk_service import (
    calculate_risk_score,
    get_relocation_priority,
    get_risk_level,
)

router = APIRouter(
    prefix="/api/habitations",
    tags=["Recommendations"],
)


def _get_hazards_as_models(
    raw_hazards: list[dict],
) -> list[Hazard]:
    """
    Convert raw hazard dictionaries returned by
    hazard_matching_service into Hazard models.
    """

    hazard_models = []

    for hazard in raw_hazards:
        try:
            hazard_data = {
                key: value
                for key, value in hazard.items()
                if key != "hazard_distance_km"
            }

            hazard_models.append(
                Hazard(**hazard_data)
            )

        except Exception:
            # Ignore malformed hazard records
            pass

    return hazard_models


@router.get("/{habitation_id}/recommendation")
def get_recommendation(habitation_id: int):

    # --------------------------------------------------
    # 1. Find habitation
    # --------------------------------------------------

    habitations = load_habitations()

    habitation = next(
        (
            h for h in habitations
            if h.habitation_id == habitation_id
        ),
        None,
    )

    if habitation is None:
        raise HTTPException(
            status_code=404,
            detail="Habitation not found",
        )

    # --------------------------------------------------
    # 2. Match hazards to habitation
    # --------------------------------------------------

    match_result = match_hazards_for_habitation(
        habitation.habitation_id
    )

    raw_hazards = match_result.get(
        "hazards",
        [],
    )

    # --------------------------------------------------
    # 3. Convert hazards to Hazard models
    # --------------------------------------------------

    hazard_models = _get_hazards_as_models(
        raw_hazards
    )

    # --------------------------------------------------
    # 4. Calculate risk
    # --------------------------------------------------

    risk_score = calculate_risk_score(
        habitation,
        hazard_models,
    )

    risk_level = get_risk_level(
        risk_score
    )

    relocation_priority = get_relocation_priority(
        risk_score
    )

    # --------------------------------------------------
    # 5. Get population
    # --------------------------------------------------

    population = (
        getattr(habitation, "population", 0)
        or 0
    )

    # --------------------------------------------------
    # 6. Find suitable relocation sites
    # --------------------------------------------------

    suitable_sites = find_suitable_relocation_sites(
        habitation,
        load_relocation_sites(),
        population=population,
    )

    # --------------------------------------------------
    # 7. No suitable site
    # --------------------------------------------------

    if not suitable_sites:

        return {
            "habitation_id": habitation.habitation_id,
            "habitation_name": habitation.habitation_name,
            "district": habitation.district,

            "match_status": match_result.get(
                "status"
            ),

            "matched_hazards_count": len(
                hazard_models
            ),

            "risk_score": risk_score,
            "risk_level": risk_level,
            "relocation_priority": relocation_priority,

            "recommended_site": None,
            "recommended_site_id": None,
            "distance_km": None,
            "suitability_score": None,

            "message": (
                "No suitable relocation site "
                "identified within search boundary."
            ),
        }

    # --------------------------------------------------
    # 8. Select best relocation site
    # --------------------------------------------------

    best_match = suitable_sites[0]

    site = best_match["site"]

    # --------------------------------------------------
    # 9. Final recommendation
    # --------------------------------------------------

    return {
        "habitation_id": habitation.habitation_id,
        "habitation_name": habitation.habitation_name,
        "district": habitation.district,

        "match_status": match_result.get(
            "status"
        ),

        "matched_hazards_count": len(
            hazard_models
        ),

        "risk_score": risk_score,
        "risk_level": risk_level,
        "relocation_priority": relocation_priority,

        "recommended_site": getattr(
            site,
            "site_name",
            "Unknown Site",
        ),

        "recommended_site_id": getattr(
            site,
            "site_id",
            None,
        ),

        "distance_km": best_match.get(
            "distance_km"
        ),

        "suitability_score": best_match.get(
            "suitability_score"
        ),

        "message": (
            "Immediate relocation recommended."
            if relocation_priority == "IMMEDIATE"
            else "Relocation planning recommended."
        ),
    }
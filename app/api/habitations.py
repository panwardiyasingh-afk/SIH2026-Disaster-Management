from fastapi import APIRouter, HTTPException

from app.data.data_loader import load_habitations
from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.services.hazard_matching_service import (
    match_hazards_for_habitation
)
from app.services.risk_service import (
    calculate_risk_score,
    get_relocation_priority,
    get_risk_level,
)

router = APIRouter(
    prefix="/api/habitations",
    tags=["Habitations"]
)


# ============================================================
# HAZARD MODEL CONVERSION
# ============================================================

def _get_hazards_as_models(
    raw_hazards: list[dict]
) -> list[Hazard]:

    """
    Convert raw hazard dictionaries returned by the
    hazard matching service into Hazard models.
    """

    hazard_models = []

    for hazard in raw_hazards:

        try:

            # Remove extra field added by matching service
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


# ============================================================
# GET ALL HABITATIONS
# ============================================================

@router.get(
    "",
    response_model=list[Habitation]
)
def get_habitations():

    # Return ALL habitations from the reduced dataset.
    return load_habitations()


# ============================================================
# GET RISK FOR ONE HABITATION
# ============================================================

@router.get("/{habitation_id}/risk")
def get_habitation_risk(
    habitation_id: int
):

    habitations = load_habitations()

    habitation = next(
        (
            h
            for h in habitations
            if h.habitation_id == habitation_id
        ),
        None
    )

    if habitation is None:

        raise HTTPException(
            status_code=404,
            detail="Habitation not found"
        )

    # --------------------------------------------------------
    # CONNECT HABITATION WITH HAZARDS
    # --------------------------------------------------------

    hazard_match_result = (
        match_hazards_for_habitation(
            habitation.habitation_id
        )
    )

    raw_hazards = hazard_match_result.get(
        "hazards",
        []
    )

    hazards = _get_hazards_as_models(
        raw_hazards
    )

    # --------------------------------------------------------
    # CALCULATE RISK
    # --------------------------------------------------------

    risk_score = calculate_risk_score(
        habitation,
        hazards
    )

    return {
        "habitation_id": habitation.habitation_id,
        "habitation_name": habitation.habitation_name,
        "district": habitation.district,
        "match_status": hazard_match_result.get(
            "status"
        ),
        "matched_hazards_count": len(hazards),
        "risk_score": risk_score,
        "risk_level": get_risk_level(
            risk_score
        ),
        "relocation_priority": get_relocation_priority(
            risk_score
        ),
    }


# ============================================================
# GET ONE HABITATION
# ============================================================

@router.get("/{habitation_id}")
def get_habitation(
    habitation_id: int
):

    habitations = load_habitations()

    habitation = next(
        (
            h
            for h in habitations
            if h.habitation_id == habitation_id
        ),
        None
    )

    if habitation is None:

        raise HTTPException(
            status_code=404,
            detail="Habitation not found"
        )

    # --------------------------------------------------------
    # CONVERT PYDANTIC MODEL TO DICTIONARY
    # --------------------------------------------------------

    habitation_data = (
        habitation.model_dump()
        if hasattr(habitation, "model_dump")
        else habitation.dict()
    )

    # --------------------------------------------------------
    # CONNECT HABITATION WITH HAZARDS
    # --------------------------------------------------------

    habitation_data["hazard_connection"] = (
        match_hazards_for_habitation(
            habitation.habitation_id
        )
    )

    return habitation_data
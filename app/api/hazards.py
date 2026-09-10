from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.data.data_loader import load_habitations, load_hazards
from app.models.hazard import Hazard
from app.services.hazard_matching_service import match_hazards_for_habitation
from app.services.hazard_service import get_overall_hazard_score
from app.services.risk_service import (
    calculate_risk_score,
    get_risk_level,
    get_risk_zone,
)

router = APIRouter(
    prefix="/api",
    tags=["Hazards"]
)


# ============================================================
# RISK ZONE CACHE
# ============================================================

_risk_zones_cache = None


# ============================================================
# HAZARD MODEL CONVERSION
# ============================================================

def _get_hazards_as_models(
    raw_hazards: list[dict]
) -> list[Hazard]:

    hazard_models = []

    for h in raw_hazards:
        try:
            hazard_models.append(
                Hazard(**h)
            )
        except Exception:
            pass

    return hazard_models


# ============================================================
# GET ALL HAZARDS
# ============================================================

@router.get(
    "/hazards",
    response_model=list[Hazard]
)
def get_hazards():

    return load_hazards()


# ============================================================
# GET HAZARDS FOR ONE HABITATION
# ============================================================

@router.get("/hazards/{habitation_id}")
def get_hazards_for_habitation(
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

    hazard_result = match_hazards_for_habitation(
        habitation.habitation_id
    )

    raw_hazards = hazard_result.get(
        "hazards",
        []
    )

    hazards = _get_hazards_as_models(
        raw_hazards
    )

    return {
        "habitation_id": habitation.habitation_id,
        "habitation_name": habitation.habitation_name,
        "match_status": hazard_result.get("status"),
        "hazards": hazards,
        "overall_hazard_score": get_overall_hazard_score(
            hazards
        ),
    }


# ============================================================
# CALCULATE ALL RISK ZONES
# ============================================================

def _calculate_all_risk_zones():

    global _risk_zones_cache

    # --------------------------------------------------------
    # RETURN CACHE IF ALREADY CALCULATED
    # --------------------------------------------------------

    if _risk_zones_cache is not None:
        return _risk_zones_cache

    habitations = load_habitations()

    total = len(habitations)

    print(
        f"\nStarting risk-zone calculation for "
        f"{total} habitations..."
    )

    risk_zones = []

    # --------------------------------------------------------
    # PROCESS HABITATIONS
    # --------------------------------------------------------

    for index, habitation in enumerate(
        habitations,
        start=1
    ):

        try:

            # Find nearby hazards
            hazard_result = match_hazards_for_habitation(
                habitation.habitation_id
            )

            raw_hazards = hazard_result.get(
                "hazards",
                []
            )

            hazards = _get_hazards_as_models(
                raw_hazards
            )

            # Calculate risk
            risk_score = calculate_risk_score(
                habitation,
                hazards
            )

            risk_zone = get_risk_zone(
                risk_score
            )

            risk_zones.append(
                {
                    "habitation_id": habitation.habitation_id,
                    "name": habitation.habitation_name,
                    "district": habitation.district,
                    "latitude": habitation.latitude,
                    "longitude": habitation.longitude,
                    "risk_score": risk_score,
                    "risk_level": get_risk_level(
                        risk_score
                    ),
                    "risk_zone": risk_zone,
                    "map_color": (
                        risk_zone.lower()
                        if risk_zone
                        else "green"
                    ),
                }
            )

        except Exception as error:

            # Don't allow one bad record to stop
            # the entire risk-zone calculation.
            print(
                f"Risk calculation failed for "
                f"{habitation.habitation_id}: {error}"
            )

            risk_zones.append(
                {
                    "habitation_id": habitation.habitation_id,
                    "name": habitation.habitation_name,
                    "district": habitation.district,
                    "latitude": habitation.latitude,
                    "longitude": habitation.longitude,
                    "risk_score": 0.0,
                    "risk_level": "LOW",
                    "risk_zone": "GREEN",
                    "map_color": "green",
                }
            )

        # ----------------------------------------------------
        # PROGRESS
        # ----------------------------------------------------

        if index % 500 == 0:

            print(
                f"Processed {index}/{total} habitations..."
            )

    # --------------------------------------------------------
    # SAVE TO CACHE
    # --------------------------------------------------------

    _risk_zones_cache = risk_zones

    print(
        f"Risk-zone calculation completed: "
        f"{len(risk_zones)} records."
    )

    return _risk_zones_cache


# ============================================================
# RED ZONES
# ============================================================

@router.get("/red-zones")
def get_red_zones(
    district: Optional[str] = None,
    limit: Optional[int] = Query(
        None,
        ge=1,
        description=(
            "Maximum RED-zone records to return. "
            "If omitted, all RED zones are returned."
        )
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Number of records to skip"
    )
):

    all_risk_zones = _calculate_all_risk_zones()

    filtered = all_risk_zones

    # --------------------------------------------------------
    # DISTRICT FILTER
    # --------------------------------------------------------

    if district:

        dist_lower = district.strip().lower()

        filtered = [
            zone
            for zone in filtered
            if str(
                zone["district"]
            ).strip().lower() == dist_lower
        ]

    # --------------------------------------------------------
    # RED ONLY
    # --------------------------------------------------------

    red_zones = [
        zone
        for zone in filtered
        if zone["risk_zone"] == "RED"
    ]

    # --------------------------------------------------------
    # PAGINATION
    # --------------------------------------------------------

    if limit is None:

        # No limit = return every RED zone.
        paginated_red_zones = (
            red_zones[offset:]
        )

    else:

        paginated_red_zones = (
            red_zones[
                offset:offset + limit
            ]
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "total_in_query": len(red_zones),
        "returned": len(paginated_red_zones),
        "limit": limit,
        "offset": offset,
        "data": paginated_red_zones
    }


# ============================================================
# ALL RISK ZONES
# ============================================================

@router.get("/risk-zones")
def get_risk_zones(
    district: Optional[str] = None,
    limit: Optional[int] = Query(
        None,
        ge=1,
        description=(
            "Maximum records to return. "
            "If omitted, all calculated risk zones are returned."
        )
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Number of records to skip"
    )
):

    # --------------------------------------------------------
    # GET CACHED RISK DATA
    # --------------------------------------------------------

    all_risk_zones = _calculate_all_risk_zones()

    filtered_risk_zones = all_risk_zones

    # --------------------------------------------------------
    # DISTRICT FILTER
    # --------------------------------------------------------

    if district:

        dist_lower = district.strip().lower()

        filtered_risk_zones = [
            zone
            for zone in filtered_risk_zones
            if str(
                zone["district"]
            ).strip().lower() == dist_lower
        ]

    # --------------------------------------------------------
    # PAGINATION
    # --------------------------------------------------------

    if limit is None:

        # No limit = return everything.
        paginated_risk_zones = (
            filtered_risk_zones[offset:]
        )

    else:

        paginated_risk_zones = (
            filtered_risk_zones[
                offset:offset + limit
            ]
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "total_in_query": len(
            filtered_risk_zones
        ),
        "returned": len(
            paginated_risk_zones
        ),
        "limit": limit,
        "offset": offset,
        "data": paginated_risk_zones
    }
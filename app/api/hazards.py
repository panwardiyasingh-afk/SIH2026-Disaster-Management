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


def _get_hazards_as_models(raw_hazards: list[dict]) -> list[Hazard]:
    """Convert raw hazard dictionaries from matching service to Hazard models."""
    hazard_models = []
    for h in raw_hazards:
        try:
            hazard_models.append(Hazard(**h))
        except Exception:
            # Fallback if any keys differ slightly from model schema
            pass
    return hazard_models


@router.get("/hazards", response_model=list[Hazard])
def get_hazards():
    return load_hazards()


@router.get("/hazards/{habitation_id}")
def get_hazards_for_habitation(habitation_id: int):
    habitations = load_habitations()

    habitation = next(
        (h for h in habitations if h.habitation_id == habitation_id),
        None
    )

    if habitation is None:
        raise HTTPException(
            status_code=404,
            detail="Habitation not found"
        )

    hazard_result = match_hazards_for_habitation(habitation.habitation_id)
    raw_hazards = hazard_result.get("hazards", [])
    hazards = _get_hazards_as_models(raw_hazards)

    return {
        "habitation_id": habitation.habitation_id,
        "habitation_name": habitation.habitation_name,
        "match_status": hazard_result.get("status"),
        "hazards": hazards,
        "overall_hazard_score": get_overall_hazard_score(hazards),
    }


@router.get("/red-zones")
def get_red_zones(
    district: Optional[str] = None,
    limit: int = Query(50, le=200, description="Max records to return at once"),
    offset: int = Query(0, description="Number of records to skip")
):
    habitations = load_habitations()
    
    # 1. Filter by district if provided
    if district:
        dist_lower = district.strip().lower()
        habitations = [h for h in habitations if getattr(h, "district", "").lower() == dist_lower]
        
    # 2. Paginate to prevent server timeouts
    paginated_habitations = habitations[offset : offset + limit]
    red_zones = []

    for habitation in paginated_habitations:
        hazard_result = match_hazards_for_habitation(habitation.habitation_id)
        raw_hazards = hazard_result.get("hazards", [])
        hazards = _get_hazards_as_models(raw_hazards)

        risk_score = calculate_risk_score(
            habitation,
            hazards
        )

        if get_risk_zone(risk_score) == "RED":
            red_zones.append(
                {
                    "habitation_id": habitation.habitation_id,
                    "name": habitation.habitation_name,
                    "district": habitation.district,
                    "latitude": habitation.latitude,
                    "longitude": habitation.longitude,
                    "risk_score": risk_score,
                    "risk_level": get_risk_level(risk_score),
                    "risk_zone": "RED",
                    "map_color": "red",
                }
            )

    return {
        "total_in_query": len(habitations),
        "limit": limit,
        "offset": offset,
        "data": red_zones
    }


@router.get("/risk-zones")
def get_risk_zones(
    district: Optional[str] = None,
    limit: int = Query(50, le=200, description="Max records to return at once"),
    offset: int = Query(0, description="Number of records to skip")
):
    habitations = load_habitations()
    
    # 1. Filter by district if provided
    if district:
        dist_lower = district.strip().lower()
        habitations = [h for h in habitations if getattr(h, "district", "").lower() == dist_lower]
        
    # 2. Paginate to prevent server timeouts
    paginated_habitations = habitations[offset : offset + limit]
    risk_zones = []

    for habitation in paginated_habitations:
        hazard_result = match_hazards_for_habitation(habitation.habitation_id)
        raw_hazards = hazard_result.get("hazards", [])
        hazards = _get_hazards_as_models(raw_hazards)

        risk_score = calculate_risk_score(
            habitation,
            hazards
        )

        risk_zone = get_risk_zone(risk_score)

        risk_zones.append(
            {
                "habitation_id": habitation.habitation_id,
                "name": habitation.habitation_name,
                "district": habitation.district,
                "latitude": habitation.latitude,
                "longitude": habitation.longitude,
                "risk_score": risk_score,
                "risk_level": get_risk_level(risk_score),
                "risk_zone": risk_zone,
                "map_color": risk_zone.lower() if risk_zone else "green",
            }
        )

    return {
        "total_in_query": len(habitations),
        "limit": limit,
        "offset": offset,
        "data": risk_zones
    }
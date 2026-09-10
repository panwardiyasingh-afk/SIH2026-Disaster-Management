from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.services.hazard_service import get_hazard_score


def calculate_risk_score(
    habitation: Habitation,
    hazards: list[Hazard],
) -> float:
    """
    Calculate a location-specific risk score.

    Nearby hazards have a stronger influence on the
    habitation's risk than hazards farther away.

    The current dataset does not contain population or
    vulnerability information, so the score is based
    only on hazard category and geographic distance.
    """

    if not hazards:
        return 0.0

    weighted_scores = []
    total_weight = 0.0

    for hazard in hazards:
        hazard_score = get_hazard_score(hazard)

        # Use the geographic distance calculated by
        # the hazard matching service.
        distance = hazard.hazard_distance_km

        if distance is None:
            # If distance is unavailable, give the hazard
            # a small default influence.
            weight = 0.25
        elif distance <= 5:
            weight = 1.00
        elif distance <= 10:
            weight = 0.80
        elif distance <= 20:
            weight = 0.60
        elif distance <= 40:
            weight = 0.35
        else:
            weight = 0.15

        weighted_scores.append(
            hazard_score * weight
        )

        total_weight += weight

    if total_weight == 0:
        return 0.0

    return round(
        sum(weighted_scores) / total_weight,
        2,
    )


def get_risk_level(
    risk_score: float,
) -> str:
    if risk_score >= 80:
        return "RED"

    if risk_score >= 60:
        return "HIGH"

    if risk_score >= 40:
        return "MODERATE"

    return "LOW"


def get_relocation_priority(
    risk_score: float,
) -> str:
    if risk_score >= 80:
        return "IMMEDIATE"

    if risk_score >= 60:
        return "SHORT_TERM"

    return "MEDIUM_TERM"


def get_risk_zone(
    risk_score: float,
) -> str:
    if risk_score >= 80:
        return "RED"

    if risk_score >= 60:
        return "ORANGE"

    if risk_score >= 40:
        return "YELLOW"

    return "GREEN"
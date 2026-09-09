from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.services.hazard_service import get_overall_hazard_score


def calculate_risk_score(
    habitation: Habitation,
    hazards: list[Hazard]
) -> float:
    """
    Calculate the current backend risk score from the
    real hazard dataset.

    Since the current habitation dataset does not contain
    vulnerability or disaster-history scores, the current
    risk score is based on the available hazard information.
    """

    return get_overall_hazard_score(hazards)


def get_risk_level(risk_score: float) -> str:
    if risk_score >= 80:
        return "RED"
    if risk_score >= 60:
        return "HIGH"
    if risk_score >= 40:
        return "MODERATE"
    return "LOW"


def get_relocation_priority(risk_score: float) -> str:
    if risk_score >= 80:
        return "IMMEDIATE"
    if risk_score >= 60:
        return "SHORT_TERM"
    return "MEDIUM_TERM"


def get_risk_zone(risk_score: float) -> str:
    if risk_score >= 80:
        return "RED"
    if risk_score >= 60:
        return "ORANGE"
    if risk_score >= 40:
        return "YELLOW"
    return "GREEN"
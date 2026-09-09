from app.models.hazard import Hazard


HAZARD_CATEGORY_SCORES = {
    "Very High": 100.0,
    "High": 80.0,
    "Moderate": 60.0,
    "Satellite Inundation Extent": 90.0,
    "Official Flood Memorandum": 100.0,
}


def get_hazard_score(hazard: Hazard) -> float:
    """
    Return the risk score for a single hazard.
    """

    category = str(
        hazard.hazard_category
    ).strip()

    return HAZARD_CATEGORY_SCORES.get(
        category,
        0.0
    )


def get_overall_hazard_score(
    hazards: list[Hazard],
) -> float:
    """
    Calculate the average risk score
    of all matched hazards.
    """

    if not hazards:
        return 0.0

    scores = [
        get_hazard_score(hazard)
        for hazard in hazards
    ]

    return round(
        sum(scores) / len(scores),
        2
    )
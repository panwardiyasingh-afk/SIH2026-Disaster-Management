from pathlib import Path

import joblib
import pandas as pd

from app.models.ml_prediction import FloodRiskInput


MODEL_PATH = (
    Path(__file__).resolve().parents[1]
    / "ml"
    / "flood_model.pkl"
)


# Load the trained pipeline once when the backend starts.
model = joblib.load(MODEL_PATH)


FEATURE_NAMES = [
    "district",
    "revenue_circle",
    "drainage_basin",
    "soil_type",
    "land_use",
    "latitude",
    "longitude",
    "elevation_m",
    "slope_deg",
    "topographic_wetness_index_twi",
    "rainfall_1day_mm",
    "rainfall_3day_mm",
    "rainfall_7day_mm",
    "distance_to_river_km",
    "distance_to_embankment_m",
]


def predict_flood_risk(
    input_data: FloodRiskInput,
) -> dict:

    # Convert Pydantic model into a dictionary.
    features = input_data.model_dump()

    # Create a DataFrame using the exact model feature order.
    dataframe = pd.DataFrame(
        [features],
        columns=FEATURE_NAMES,
    )

    # Run prediction.
    prediction = model.predict(dataframe)[0]

    # Get probabilities for classes 0 and 1.
    probabilities = model.predict_proba(dataframe)[0]

    class_probabilities = {
        int(class_label): float(probability)
        for class_label, probability
        in zip(model.classes_, probabilities)
    }

    # Highest probability = model confidence.
    confidence = max(class_probabilities.values())

    # Convert numerical class into a readable status.
    if int(prediction) == 1:
        risk_status = "FLOOD_PRONE"
    else:
        risk_status = "NOT_FLOOD_PRONE"

    return {
        "prediction": int(prediction),
        "risk_status": risk_status,
        "confidence": round(float(confidence), 4),
        "probabilities": {
            "class_0": round(
                class_probabilities.get(0, 0.0),
                4,
            ),
            "class_1": round(
                class_probabilities.get(1, 0.0),
                4,
            ),
        },
    }
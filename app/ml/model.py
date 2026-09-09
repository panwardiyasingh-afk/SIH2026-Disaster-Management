from pathlib import Path

import joblib


MODEL_PATH = Path(__file__).resolve().parent / "trained_risk_model.joblib"

# Update this list tomorrow to exactly match the ML team's training features.
FEATURE_ORDER = [
    "overall_hazard_score",
    "vulnerability_score",
    "disaster_history_score",
]


def load_trained_model():
    """Return the trained model if it exists; otherwise return None."""

    if not MODEL_PATH.exists():
        return None

    return joblib.load(MODEL_PATH)


def predict_risk(features: dict[str, float]) -> float | None:
    """
    Predict a risk score using the trained ML model.

    It returns None until trained_risk_model.joblib is added.
    """

    model = load_trained_model()

    if model is None:
        return None

    feature_values = [
        [features[feature_name] for feature_name in FEATURE_ORDER]
    ]

    prediction = model.predict(feature_values)[0]

    return round(float(prediction), 2)
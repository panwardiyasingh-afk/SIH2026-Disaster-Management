from fastapi import APIRouter

from app.models.ml_prediction import FloodRiskInput
from app.services.ml_service import predict_flood_risk


router = APIRouter(
    prefix="/api",
    tags=["ML Prediction"],
)


@router.post("/predict-risk")
def predict_risk(input_data: FloodRiskInput):
    return predict_flood_risk(input_data)
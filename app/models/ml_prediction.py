from pydantic import BaseModel


class FloodRiskInput(BaseModel):
    district: str
    revenue_circle: str
    drainage_basin: str
    soil_type: str
    land_use: str

    latitude: float
    longitude: float
    elevation_m: float
    slope_deg: float
    topographic_wetness_index_twi: float

    rainfall_1day_mm: float
    rainfall_3day_mm: float
    rainfall_7day_mm: float

    distance_to_river_km: float
    distance_to_embankment_m: float
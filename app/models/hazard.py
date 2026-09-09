from typing import Optional
from pydantic import BaseModel, ConfigDict


class Hazard(BaseModel):
    model_config = ConfigDict(extra="ignore")

    hazard_id: Optional[str] = None
    hazard_type: Optional[str] = None
    district: Optional[str] = None
    circle: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    event_date: Optional[str] = None
    hazard_category: Optional[str] = None
    severity: Optional[str] = None
    affected_area: Optional[str] = None
    source: Optional[str] = None
    hazard_distance_km: Optional[float] = None
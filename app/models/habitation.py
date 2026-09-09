from pydantic import BaseModel, Field


class Habitation(BaseModel):
    habitation_id: int
    habitation_name: str
    district: str
    latitude: float
    longitude: float
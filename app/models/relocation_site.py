from pydantic import BaseModel


class RelocationSite(BaseModel):
    site_id: str
    site_name: str
    district: str
    village: str
    latitude: float
    longitude: float
    site_type: str
    capacity: int
    toilets: int
    child_friendly_space: str
    status: str
    source: str
"""Local API for the SURAKSHIT decision-support dashboard.

The React app talks to this server through Vite's `/backend` proxy in
development.  The seed records keep the dashboard useful until a production
GIS/data pipeline is connected.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="SURAKSHIT API", version="1.0.0")

# The proxy avoids CORS locally, while this also supports a separately hosted
# frontend during demos/deployment. Restrict these origins in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


HABITATIONS: list[dict[str, Any]] = [
    {"habitation_id": "hab-001", "name": "Majuli Chapori", "district": "Majuli", "population": 1240, "latitude": 26.95, "longitude": 94.17},
    {"habitation_id": "hab-002", "name": "Bokakhat Riverside", "district": "Golaghat", "population": 860, "latitude": 26.64, "longitude": 93.60},
    {"habitation_id": "hab-003", "name": "Dhemaji Ghat", "district": "Dhemaji", "population": 1120, "latitude": 27.48, "longitude": 94.58},
    {"habitation_id": "hab-004", "name": "Silchar Hillside", "district": "Cachar", "population": 690, "latitude": 24.83, "longitude": 92.78},
    {"habitation_id": "hab-005", "name": "Barpeta Lowland", "district": "Barpeta", "population": 980, "latitude": 26.32, "longitude": 91.01},
]

RISK_ZONES: list[dict[str, Any]] = [
    {"habitation_id": "hab-001", "name": "Majuli Chapori", "district": "Majuli", "risk_score": 92.4, "risk_level": "Very High", "risk_zone": "RED", "latitude": 26.95, "longitude": 94.17},
    {"habitation_id": "hab-002", "name": "Bokakhat Riverside", "district": "Golaghat", "risk_score": 84.1, "risk_level": "High", "risk_zone": "RED", "latitude": 26.64, "longitude": 93.60},
    {"habitation_id": "hab-003", "name": "Dhemaji Ghat", "district": "Dhemaji", "risk_score": 76.8, "risk_level": "High", "risk_zone": "ORANGE", "latitude": 27.48, "longitude": 94.58},
    {"habitation_id": "hab-004", "name": "Silchar Hillside", "district": "Cachar", "risk_score": 62.3, "risk_level": "Moderate", "risk_zone": "YELLOW", "latitude": 24.83, "longitude": 92.78},
    {"habitation_id": "hab-005", "name": "Barpeta Lowland", "district": "Barpeta", "risk_score": 48.7, "risk_level": "Moderate", "risk_zone": "YELLOW", "latitude": 26.32, "longitude": 91.01},
]

HAZARDS: list[dict[str, Any]] = [
    {"hazard_id": "hz-001", "habitation_id": "hab-001", "district": "Majuli", "hazard_type": "Flood", "severity": "Very High", "intensity": 0.92, "latitude": 26.95, "longitude": 94.17},
    {"hazard_id": "hz-002", "habitation_id": "hab-002", "district": "Golaghat", "hazard_type": "Flood", "severity": "High", "intensity": 0.84, "latitude": 26.64, "longitude": 93.60},
    {"hazard_id": "hz-003", "habitation_id": "hab-003", "district": "Dhemaji", "hazard_type": "Erosion", "severity": "High", "intensity": 0.77, "latitude": 27.48, "longitude": 94.58},
    {"hazard_id": "hz-004", "habitation_id": "hab-004", "district": "Cachar", "hazard_type": "Landslide", "severity": "Moderate", "intensity": 0.62, "latitude": 24.83, "longitude": 92.78},
    {"hazard_id": "hz-005", "habitation_id": "hab-005", "district": "Barpeta", "hazard_type": "Flood", "severity": "Moderate", "intensity": 0.49, "latitude": 26.32, "longitude": 91.01},
]

RELOCATION_SITES: list[dict[str, Any]] = [
    {"site_id": "site-001", "site_name": "Kamalabari Relief Campus", "district": "Majuli", "village": "Kamalabari", "site_type": "Community campus", "capacity": 1500, "occupied_capacity": 320, "toilets": 28, "child_friendly_space": True, "status": "Available"},
    {"site_id": "site-002", "site_name": "Bokakhat Higher Ground", "district": "Golaghat", "village": "Bokakhat", "site_type": "Raised shelter site", "capacity": 1000, "occupied_capacity": 180, "toilets": 18, "child_friendly_space": True, "status": "Active"},
    {"site_id": "site-003", "site_name": "Dhemaji Transit Site", "district": "Dhemaji", "village": "Silapathar", "site_type": "Transit settlement", "capacity": 800, "occupied_capacity": 510, "toilets": 12, "child_friendly_space": False, "status": "Available"},
]


class FloodPredictionInput(BaseModel):
    rainfall_mm: float = Field(ge=0)
    river_level_m: float = Field(ge=0)
    soil_moisture: float = Field(ge=0, le=1)


def find_by_id(records: list[dict[str, Any]], field: str, value: str) -> dict[str, Any]:
    item = next((record for record in records if record[field] == value), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Record not found")
    return item


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/habitations")
def list_habitations() -> list[dict[str, Any]]:
    return HABITATIONS


@app.get("/api/habitations/{habitation_id}")
def get_habitation(habitation_id: str) -> dict[str, Any]:
    return find_by_id(HABITATIONS, "habitation_id", habitation_id)


@app.get("/api/habitations/{habitation_id}/risk")
def get_habitation_risk(habitation_id: str) -> dict[str, Any]:
    return find_by_id(RISK_ZONES, "habitation_id", habitation_id)


@app.get("/api/habitations/{habitation_id}/relocation-sites")
def sites_for_habitation(habitation_id: str) -> list[dict[str, Any]]:
    risk = find_by_id(RISK_ZONES, "habitation_id", habitation_id)
    district = risk["district"]
    local_sites = [site for site in RELOCATION_SITES if site["district"] == district]
    return local_sites or RELOCATION_SITES


@app.get("/api/habitations/{habitation_id}/recommendation")
def recommendation(habitation_id: str) -> dict[str, Any]:
    risk = find_by_id(RISK_ZONES, "habitation_id", habitation_id)
    sites = sites_for_habitation(habitation_id)
    preferred_site = max(sites, key=lambda site: site["capacity"] - site["occupied_capacity"])
    return {
        "habitation_id": habitation_id,
        "habitation": risk["name"],
        "risk_zone": risk["risk_zone"],
        "risk_score": risk["risk_score"],
        "priority": "Immediate" if risk["risk_score"] >= 80 else "Short-term",
        "recommended_site": preferred_site["site_name"],
        "available_capacity": preferred_site["capacity"] - preferred_site["occupied_capacity"],
        "rationale": "Recommendation is based on the current risk score and available carrying capacity.",
    }


@app.get("/api/hazards")
def list_hazards() -> list[dict[str, Any]]:
    return HAZARDS


@app.get("/api/hazards/{habitation_id}")
def hazards_for_habitation(habitation_id: str) -> list[dict[str, Any]]:
    find_by_id(HABITATIONS, "habitation_id", habitation_id)
    return [hazard for hazard in HAZARDS if hazard["habitation_id"] == habitation_id]


@app.get("/api/risk-zones")
def list_risk_zones(district: str = "", limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0)) -> list[dict[str, Any]]:
    records = RISK_ZONES
    if district.strip():
        records = [record for record in records if record["district"].casefold() == district.strip().casefold()]
    return records[offset : offset + limit]


@app.get("/api/red-zones")
def list_red_zones(district: str = "", limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0)) -> list[dict[str, Any]]:
    records = [record for record in RISK_ZONES if record["risk_zone"] == "RED"]
    if district.strip():
        records = [record for record in records if record["district"].casefold() == district.strip().casefold()]
    return records[offset : offset + limit]


@app.get("/api/relocation-sites")
def list_relocation_sites() -> list[dict[str, Any]]:
    return RELOCATION_SITES


@app.get("/api/relocation-sites/{site_id}")
def get_relocation_site(site_id: str) -> dict[str, Any]:
    return find_by_id(RELOCATION_SITES, "site_id", site_id)


@app.get("/api/relocation-sites/{site_id}/capacity")
def site_capacity(site_id: str) -> dict[str, Any]:
    site = find_by_id(RELOCATION_SITES, "site_id", site_id)
    return {"site_id": site_id, "capacity": site["capacity"], "occupied_capacity": site["occupied_capacity"], "available_capacity": site["capacity"] - site["occupied_capacity"]}


@app.post("/api/predict-risk")
def predict_risk(values: FloodPredictionInput) -> dict[str, Any]:
    score = min(100, round(values.rainfall_mm * 0.25 + values.river_level_m * 9 + values.soil_moisture * 35, 1))
    zone = "RED" if score >= 80 else "ORANGE" if score >= 65 else "YELLOW" if score >= 40 else "GREEN"
    return {"risk_score": score, "risk_zone": zone, "risk_level": {"RED": "Very High", "ORANGE": "High", "YELLOW": "Moderate", "GREEN": "Low"}[zone]}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.habitations import router as habitations_router
from app.api.hazards import router as hazards_router
from app.api.relocation import router as relocation_router
from app.api.recommendations import router as recommendations_router
from app.api.predict import router as predict_router


# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title="SIH Disaster Management API",
    version="0.1.0",
    description=(
        "Backend API for the SIH Disaster Management System. "
        "Provides habitation, hazard, risk-zone, relocation, "
        "recommendation, and ML flood-risk prediction services."
    ),
)


# =========================================================
# CORS Configuration
# =========================================================
# Allows the frontend application to communicate with
# the FastAPI backend from a different port/domain.
#
# Example:
# Frontend -> http://localhost:5173
# Backend  -> http://127.0.0.1:8000
#
# For development, all origins are allowed.
# This can be restricted to the actual frontend URL
# before production deployment.
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API Routers
# =========================================================

# Habitation APIs
app.include_router(habitations_router)

# Hazard and risk-zone APIs
app.include_router(hazards_router)

# Relocation-site APIs
app.include_router(relocation_router)

# Recommendation APIs
app.include_router(recommendations_router)

# ML flood-risk prediction API
app.include_router(predict_router)


# =========================================================
# Root Endpoint
# =========================================================

@app.get("/")
def root():
    return {
        "message": "SIH Disaster Management backend is running"
    }


# =========================================================
# Health Check
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
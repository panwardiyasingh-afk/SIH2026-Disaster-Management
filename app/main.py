from fastapi import FastAPI

from app.api.habitations import router as habitations_router
from app.api.hazards import router as hazards_router
from app.api.relocation import router as relocation_router
from app.api.recommendations import router as recommendations_router
from app.api.predict import router as predict_router


app = FastAPI(
    title="SIH Disaster Management API",
    version="0.1.0",
)


# ---------------------------------------------------------
# API Routers
# ---------------------------------------------------------

app.include_router(habitations_router)
app.include_router(hazards_router)
app.include_router(relocation_router)
app.include_router(recommendations_router)
app.include_router(predict_router)


# ---------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "SIH Disaster Management backend is running"
    }


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
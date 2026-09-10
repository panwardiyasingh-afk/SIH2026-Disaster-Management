# SIH2026-Disaster-Management
An AI-driven, GIS-enabled decision support platform for identifying multi-hazard Red Zones, assessing the  carrying capacity of safer relocation sites, and prioritizing vulnerable habitations for immediate, short-term, and medium-term relocation

## Run locally

Start the backend from the repository root:

```powershell
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload --port 8000
```

In a second terminal, start the frontend:

```powershell
cd FRONTEND\surakshit-assam-gis\surakshit
npm install
npm run dev
```

Vite forwards `/backend/*` requests to `http://127.0.0.1:8000`, so no frontend code changes or CORS configuration are needed for local development. API documentation is available at `http://127.0.0.1:8000/docs`.

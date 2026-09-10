# SURAKSHIT — Assam GIS Decision-Support Platform

A premium, GIS-focused frontend prototype built for **Smart India Hackathon 2026**, addressing
the problem statement: *proactive, evidence-based relocation planning for disaster-prone
habitations in Assam.*

> AI-driven GIS decision support for identifying hazardous zones, assessing safer relocation
> sites, and prioritizing vulnerable habitations across Assam.

## What's inside

- **Multi-Hazard Red Zone Map** — an Assam-only, district-level GIS console (React Leaflet)
  with Red / Orange / Yellow / Green risk-zone shading and four hazard layers (Flood, Landslide,
  Coastal Erosion, Cloudburst).
- **Hazard & Vulnerability Analysis** — hazard intensity, population vulnerability, and disaster
  history, visualized as gauges and a ranked district comparison.
- **Safe Relocation Site Assessment** — candidate site cards showing suitability, carrying
  capacity, and utilization.
- **Relocation Priority** — a three-column board (Immediate / Short-term / Medium-term).
- **Relocation Planner** — the six-step decision workflow, presented as an interactive stepper.
- **Decision Support** — analytical summary cards for State Disaster Management Authorities.

All figures are clearly-separated **demo/placeholder data** (`src/data/mockData.js`) — the
architecture is ready to be pointed at real GIS/AI/backend APIs.

## Tech stack

React 18 · Vite · Tailwind CSS · Framer Motion · Lucide React · React Leaflet

The Assam district boundaries (`src/data/assam-districts.geojson`) are simplified, public
2011 administrative boundary data.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Backend connection

The frontend calls the backend endpoints defined in `src/services/api.js`, including
`/api/risk-zones`, `/api/hazards`, `/api/relocation-sites`, and the relocation
recommendation endpoint. During development, Vite forwards requests from
`/backend/*` to `http://127.0.0.1:8000/*`, avoiding browser CORS issues.

1. Copy `.env.example` to `.env`.
2. Set `VITE_BACKEND_TARGET` to the URL where your backend is running.
3. Start the backend, then run `npm run dev` in this frontend directory.

For a production build, set `VITE_API_BASE_URL` to the public backend URL. If the
frontend and backend are on different origins in production, the backend must allow
the frontend origin through CORS.

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/       Reusable UI: Sidebar, Header, HeroSection, AssamMap,
                     HazardLegend, HazardLayerControl, RiskAnalysis,
                     RelocationSiteAssessment, RelocationPriority,
                     DecisionSupport, RelocationPlanner
  data/
    mockData.js               demo data layer (swap for real APIs here)
    assam-districts.geojson   Assam district boundaries
  App.jsx            page composition + section navigation
  main.jsx           app entry point
  index.css          Tailwind base + global styles
```

## Notes

- Navigation (Dashboard / Hazard Map / Risk Analysis / Relocation Planner) smooth-scrolls to the
  corresponding dashboard section — the whole platform is a single connected workflow, per the
  brief.
- The map intentionally renders no external basemap tiles; the Assam boundary is the only
  geographic element rendered in full detail, in keeping with the "Assam as sole active focus"
  requirement.
- Reduced-motion preferences are respected globally.

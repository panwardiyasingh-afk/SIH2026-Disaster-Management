# SIH2026 Disaster Management — Frontend API Integration Guide

## 1. Overview

This document explains how the frontend should communicate with the SIH2026 Disaster Management backend.

The backend is built using:

- Python
- FastAPI
- Pandas
- Pydantic
- Scikit-learn
- Joblib

The backend provides APIs for:

- Habitations
- Hazards
- Hazard-to-habitation matching
- Risk calculation
- Risk-zone classification
- Red-zone identification
- Relocation sites
- Relocation-site capacity
- Relocation-site suitability
- Relocation recommendations
- Flood-risk ML prediction

The frontend is responsible for displaying the data, maps, dashboards, charts, markers, filters, and user interface.

---

## 2. Backend Base URL

### Local Development

```text
http://127.0.0.1:8000
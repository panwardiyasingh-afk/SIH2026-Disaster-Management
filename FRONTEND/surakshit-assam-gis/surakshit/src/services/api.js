// In development, requests go through Vite's proxy (`/backend`) so the
// browser does not need cross-origin access to the API. For a deployed app,
// set VITE_API_BASE_URL to the public backend URL (for example,
// https://api.example.gov.in).
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/backend"
).replace(/\/$/, "");

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(errorMessage);
  }

  // Some mutation endpoints can legitimately return no body.
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// -----------------------------
// Habitations
// -----------------------------

export async function getHabitations() {
  return apiRequest("/api/habitations");
}

export async function getHabitation(habitationId) {
  return apiRequest(`/api/habitations/${encodeURIComponent(habitationId)}`);
}

export async function getHabitationRisk(habitationId) {
  return apiRequest(
    `/api/habitations/${encodeURIComponent(habitationId)}/risk`
  );
}

// -----------------------------
// Hazards
// -----------------------------

export async function getHazards() {
  return apiRequest("/api/hazards");
}

export async function getHazardsForHabitation(habitationId) {
  return apiRequest(`/api/hazards/${encodeURIComponent(habitationId)}`);
}

// -----------------------------
// Risk Zones
// -----------------------------

export async function getRiskZones({
  district = "",
  limit = 50,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();

  if (district) {
    params.append("district", district);
  }

  params.append("limit", limit);
  params.append("offset", offset);

  return apiRequest(`/api/risk-zones?${params.toString()}`);
}

export async function getRedZones({
  district = "",
  limit = 50,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();

  if (district) {
    params.append("district", district);
  }

  params.append("limit", limit);
  params.append("offset", offset);

  return apiRequest(`/api/red-zones?${params.toString()}`);
}

// -----------------------------
// Relocation Sites
// -----------------------------

export async function getRelocationSites() {
  return apiRequest("/api/relocation-sites");
}

export async function getRelocationSite(siteId) {
  return apiRequest(`/api/relocation-sites/${encodeURIComponent(siteId)}`);
}

export async function getRelocationSiteCapacity(siteId) {
  return apiRequest(
    `/api/relocation-sites/${encodeURIComponent(siteId)}/capacity`
  );
}

export async function getRelocationSitesForHabitation(habitationId) {
  return apiRequest(
    `/api/habitations/${encodeURIComponent(habitationId)}/relocation-sites`
  );
}

// -----------------------------
// Recommendation
// -----------------------------

export async function getRecommendation(habitationId) {
  return apiRequest(
    `/api/habitations/${encodeURIComponent(habitationId)}/recommendation`
  );
}

// -----------------------------
// ML Flood Prediction
// -----------------------------

export async function predictFloodRisk(inputData) {
  return apiRequest("/api/predict-risk", {
    method: "POST",
    body: JSON.stringify(inputData),
  });
}

// -----------------------------
// Backend Health
// -----------------------------

export async function checkBackendHealth() {
  return apiRequest("/health");
}

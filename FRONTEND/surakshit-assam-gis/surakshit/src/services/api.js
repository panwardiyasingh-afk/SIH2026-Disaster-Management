// ============================================================
// SURAKSHIT - API SERVICE
// Frontend: React + Vite
// Backend: FastAPI
// ============================================================

// In development, Vite proxies /backend → http://127.0.0.1:8000
// For production, set VITE_API_BASE_URL in .env

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/backend"
).replace(/\/$/, "");

// ============================================================
// Generic API Request
// ============================================================

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        message =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(message);
  }

  // No content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ============================================================
// HEALTH
// ============================================================

export async function checkBackendHealth() {
  return apiRequest("/health");
}

// ============================================================
// HABITATIONS
// ============================================================

export async function getHabitations() {
  return apiRequest("/api/habitations");
}

export async function getHabitation(habitationId) {
  return apiRequest(
    `/api/habitations/${encodeURIComponent(habitationId)}`
  );
}

export async function getHabitationRisk(habitationId) {
  return apiRequest(
    `/api/habitations/${encodeURIComponent(habitationId)}/risk`
  );
}

export async function getRelocationSitesForHabitation(
  habitationId
) {
  return apiRequest(
    `/api/habitations/${encodeURIComponent(
      habitationId
    )}/relocation-sites`
  );
}

export async function getRecommendation(habitationId) {
  return apiRequest(
    `/api/habitations/${encodeURIComponent(
      habitationId
    )}/recommendation`
  );
}

// ============================================================
// HAZARDS
// ============================================================

export async function getHazards() {
  return apiRequest("/api/hazards");
}

export async function getHazardsForHabitation(habitationId) {
  return apiRequest(
    `/api/hazards/${encodeURIComponent(habitationId)}`
  );
}

// ============================================================
// RISK ZONES
// ============================================================

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

// ============================================================
// RED ZONES
// ============================================================

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

// ============================================================
// RELOCATION SITES
// ============================================================

export async function getRelocationSites() {
  return apiRequest("/api/relocation-sites");
}

export async function getRelocationSite(siteId) {
  return apiRequest(
    `/api/relocation-sites/${encodeURIComponent(siteId)}`
  );
}

export async function getRelocationSiteCapacity(siteId) {
  return apiRequest(
    `/api/relocation-sites/${encodeURIComponent(
      siteId
    )}/capacity`
  );
}

// ============================================================
// FLOOD / RISK PREDICTION
// ============================================================

export async function predictFloodRisk(inputData) {
  return apiRequest("/api/predict-risk", {
    method: "POST",
    body: JSON.stringify(inputData),
  });
}

// ============================================================
// OPTIONAL GENERIC HELPERS
// ============================================================

// GET request helper
export async function apiGet(endpoint) {
  return apiRequest(endpoint);
}

// POST request helper
export async function apiPost(endpoint, data) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

const api = {
  checkBackendHealth,

  getHabitations,
  getHabitation,
  getHabitationRisk,
  getRelocationSitesForHabitation,
  getRecommendation,

  getHazards,
  getHazardsForHabitation,

  getRiskZones,
  getRedZones,

  getRelocationSites,
  getRelocationSite,
  getRelocationSiteCapacity,

  predictFloodRisk,

  apiGet,
  apiPost,
};

export default api;
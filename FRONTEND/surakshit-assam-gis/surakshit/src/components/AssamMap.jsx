import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
  CircleMarker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Maximize2,
  Minus,
  Plus,
  Loader2,
  MapPin,
} from "lucide-react";

import { motion } from "framer-motion";

import {
  assamDistrictsGeoJSON,
} from "../data/mockData";

import {
  getRiskZones,
  getHazards,
} from "../services/api";

import HazardLegend from "./HazardLegend";
import HazardLayerControl from "./HazardLayerControl";

const INDIA_GEOJSON_URL =
  "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/india.geojson";

const ASSAM_DISTRICTS_GEOJSON_URL =
  "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/states/assam.geojson";

const ASSAM_VILLAGES_URL =
  "/data/assam-villages.geojson";

const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const SATELLITE_ATTRIBUTION =
  "Tiles &copy; Esri";

const ASSAM_CENTER = [26.2, 92.9];

const INDIA_CENTER = [22.9, 82.5];

const ASSAM_BOUNDS = [
  [24.1, 89.5],
  [28.5, 96.1],
];

const normalizeName = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/district$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getProperty = (
  properties = {},
  keys = []
) => {
  for (const key of keys) {
    if (
      properties[key] !== undefined &&
      properties[key] !== null &&
      String(properties[key]).trim() !== ""
    ) {
      return properties[key];
    }
  }

  return "";
};

const getDistrictName = (
  properties = {}
) =>
  getProperty(properties, [
    "district",
    "DISTRICT",
    "District",
    "dtname",
    "DTNAME",
    "district_name",
    "DISTRICT_NAME",
    "name",
    "NAME",
  ]);

const getVillageName = (
  properties = {}
) =>
  getProperty(properties, [
    "village",
    "VILLAGE",
    "Village",
    "village_name",
    "VILLAGE_NAME",
    "vill_name",
    "VILL_NAME",
    "name",
    "NAME",
    "villname",
    "VILLNAME",
  ]);

const intensityColor = (value = 0) => {
  if (value >= 0.8) return "#ef4444";
  if (value >= 0.6) return "#f97316";
  if (value >= 0.4) return "#14b8a6";
  if (value >= 0.2) return "#2563eb";
  return "#163b5c";
};

/*
  ============================================================
  BACKEND RISK MARKER COLOR
  ============================================================
*/

const getRiskMarkerColor = (
  riskZone
) => {
  switch (
    String(riskZone || "").toUpperCase()
  ) {
    case "RED":
      return "#ef4444";

    case "ORANGE":
      return "#f97316";

    case "YELLOW":
      return "#eab308";

    case "GREEN":
      return "#22c55e";

    default:
      return "#64748b";
  }
};

/*
  ============================================================
  FLOOD HAZARD MARKER COLOR
  ============================================================
*/

const getFloodMarkerColor = (
  category
) => {
  const value = String(
    category || ""
  ).toLowerCase();

  if (value.includes("very high")) {
    return "#dc2626";
  }

  if (value.includes("high")) {
    return "#f97316";
  }

  if (value.includes("moderate")) {
    return "#eab308";
  }

  return "#38bdf8";
};

function MapZoomWatcher({
  onZoomChange,
}) {
  useMapEvents({
    zoomend(event) {
      onZoomChange(
        event.target.getZoom()
      );
    },
  });

  return null;
}

function VillageDotLayer({
  geojson,
  visible,
}) {
  const map = useMap();

  useEffect(() => {
    if (!geojson || !visible) return;

    const dots = L.layerGroup();

    geojson.features?.forEach(
      (feature) => {
        try {
          const bounds =
            L.geoJSON(
              feature
            ).getBounds();

          const center =
            bounds.getCenter();

          const name =
            getVillageName(
              feature.properties
            );

          const district =
            getDistrictName(
              feature.properties
            );

          const zone =
            getProperty(
              feature.properties,
              [
                "zone",
                "ZONE",
                "risk_zone",
                "RISK_ZONE",
              ]
            ) || "unclassified";

          const zoneLabel = `${
            String(zone)
              .charAt(0)
              .toUpperCase()
          }${String(zone).slice(1)} Zone`;

          if (!name) return;

          dots.addLayer(
            L.marker(center, {
              interactive: false,
              icon: L.divIcon({
                className:
                  "assam-village-name",
                html: `
                  <span style="
                    color:#ffffff;
                    font:600 12px/1.2 Inter,system-ui,sans-serif;
                    letter-spacing:.01em;
                    text-shadow:
                      -1px -1px 1px rgba(0,0,0,.9),
                      1px -1px 1px rgba(0,0,0,.9),
                      -1px 1px 1px rgba(0,0,0,.9),
                      1px 1px 1px rgba(0,0,0,.9);
                    white-space:nowrap;
                    transform:translate(-50%,-50%);
                    display:block
                  ">
                    <i style="
                      display:inline-block;
                      width:5px;
                      height:5px;
                      margin:0 5px 1px 0;
                      background:#fff;
                      border-radius:50%;
                      box-shadow:0 0 0 1px rgba(0,0,0,.7)
                    "></i>
                    ${name} · ${zoneLabel}
                  </span>
                `,
                iconSize: [0, 0],
              }),
            })
          );
        } catch {
          // Ignore malformed village geometry.
        }
      }
    );

    dots.addTo(map);

    return () =>
      map.removeLayer(dots);
  }, [
    geojson,
    map,
    visible,
  ]);

  return null;
}

function FitIndia({
  geojson,
}) {
  const map = useMap();
  const didFit =
    useRef(false);

  useEffect(() => {
    if (
      !geojson ||
      didFit.current
    ) {
      return;
    }

    try {
      const layer =
        L.geoJSON(geojson);

      const bounds =
        layer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(
          bounds.pad(0.05),
          {
            animate: false,
            maxZoom: 5,
          }
        );

        didFit.current = true;
      }
    } catch {
      // Keep default map position.
    }
  }, [
    geojson,
    map,
  ]);

  return null;
}

function AssamView({
  shouldFit,
}) {
  const map = useMap();

  useEffect(() => {
    if (!shouldFit) return;

    map.fitBounds(
      ASSAM_BOUNDS,
      {
        animate: true,
        duration: 0.8,
        maxZoom: 8,
      }
    );
  }, [
    map,
    shouldFit,
  ]);

  return null;
}

function ZoomControls() {
  const map = useMap();

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur">
      <button
        type="button"
        title="Zoom in"
        onClick={() =>
          map.zoomIn()
        }
        className="flex h-10 w-10 items-center justify-center border-b border-white/10 text-white hover:bg-white/10"
      >
        <Plus size={18} />
      </button>

      <button
        type="button"
        title="Zoom out"
        onClick={() =>
          map.zoomOut()
        }
        className="flex h-10 w-10 items-center justify-center text-white hover:bg-white/10"
      >
        <Minus size={18} />
      </button>
    </div>
  );
}

function FullscreenButton() {
  const map = useMap();

  const handleFullscreen =
    () => {
      const container =
        map.getContainer();

      if (
        document.fullscreenElement
      ) {
        document.exitFullscreen?.();
        return;
      }

      container.requestFullscreen?.();
    };

  return (
    <button
      type="button"
      title="Fullscreen"
      onClick={
        handleFullscreen
      }
      className="absolute right-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/90 text-white shadow-2xl backdrop-blur hover:bg-white/10"
    >
      <Maximize2 size={17} />
    </button>
  );
}

function DistrictLabelLayer({
  geojson,
  visible,
}) {
  const map = useMap();

  const layerRef =
    useRef(null);

  useEffect(() => {
    if (
      !geojson ||
      !visible
    ) {
      if (layerRef.current) {
        map.removeLayer(
          layerRef.current
        );

        layerRef.current = null;
      }

      return;
    }

    const group =
      L.layerGroup();

    geojson.features?.forEach(
      (feature) => {
        const districtName =
          getDistrictName(
            feature.properties
          );

        if (!districtName)
          return;

        try {
          const bounds =
            L.geoJSON(
              feature
            ).getBounds();

          if (!bounds.isValid())
            return;

          const center =
            bounds.getCenter();

          const marker =
            L.marker(center, {
              interactive: false,
              icon: L.divIcon({
                className:
                  "assam-district-label",
                html: `
                  <div style="
                    width:8px;
                    height:8px;
                    background:#ffffff;
                    border:2px solid #0f4c5c;
                    border-radius:50%;
                    box-shadow:0 1px 4px rgba(0,0,0,.45);
                    transform:translate(-50%,-50%);
                  "></div>
                `,
                iconSize: [0, 0],
              }),
            });

          group.addLayer(
            marker
          );
        } catch {
          // Ignore malformed district features.
        }
      }
    );

    group.addTo(map);

    layerRef.current =
      group;

    return () => {
      map.removeLayer(group);

      if (
        layerRef.current ===
        group
      ) {
        layerRef.current =
          null;
      }
    };
  }, [
    geojson,
    map,
    visible,
  ]);

  return null;
}

/*
  ============================================================
  REAL FLOOD HAZARD LAYER
  ============================================================
*/

function FloodHazardLayer({
  hazards,
  visible,
  selectedDistrict,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !visible ||
      !hazards?.length
    ) {
      return;
    }

    const layerGroup =
      L.layerGroup();

    hazards.forEach(
      (hazard) => {
        const latitude =
          Number(
            hazard.latitude
          );

        const longitude =
          Number(
            hazard.longitude
          );

        if (
          !Number.isFinite(
            latitude
          ) ||
          !Number.isFinite(
            longitude
          )
        ) {
          return;
        }

        if (
          selectedDistrict &&
          normalizeName(
            hazard.district
          ) !==
            normalizeName(
              selectedDistrict
            )
        ) {
          return;
        }

        const markerColor =
          getFloodMarkerColor(
            hazard.hazard_category
          );

        const marker =
          L.circleMarker(
            [latitude, longitude],
            {
              radius: 5,
              color: "#ffffff",
              weight: 1,
              fillColor:
                markerColor,
              fillOpacity: 0.85,
            }
          );

        marker.bindPopup(`
          <div style="
            min-width:220px;
            font-family:Inter,system-ui,sans-serif;
          ">
            <div style="
              font-size:15px;
              font-weight:800;
              margin-bottom:7px;
              color:#0f172a;
            ">
              Flood Hazard
            </div>

            <div style="
              font-size:12px;
              line-height:1.75;
              color:#334155;
            ">
              <strong>Hazard ID:</strong>
              ${hazard.hazard_id || "N/A"}
              <br />

              <strong>District:</strong>
              ${hazard.district || "N/A"}
              <br />

              <strong>Circle:</strong>
              ${hazard.circle || "N/A"}
              <br />

              <strong>Village:</strong>
              ${hazard.village || "N/A"}
              <br />

              <strong>Category:</strong>
              ${hazard.hazard_category || "N/A"}
              <br />

              <strong>Severity:</strong>
              ${hazard.severity || "N/A"}
              <br />

              <strong>Event:</strong>
              ${hazard.event_date || "N/A"}
              <br />

              <strong>Affected area:</strong>
              ${hazard.affected_area || "N/A"}
              <br />

              <strong>Source:</strong>
              ${hazard.source || "N/A"}
            </div>
          </div>
        `);

        layerGroup.addLayer(
          marker
        );
      }
    );

    layerGroup.addTo(map);

    return () => {
      map.removeLayer(
        layerGroup
      );
    };
  }, [
    hazards,
    visible,
    selectedDistrict,
    map,
  ]);

  return null;
}

export default function AssamMap({
  selectedDistrict,
  onSelectDistrict,
}) {
  const [mode, setMode] =
    useState("zones");

  const [activeHazard, setActiveHazard] =
    useState("flood");

  const [baseMap, setBaseMap] =
    useState("satellite");

  const [indiaGeoJSON, setIndiaGeoJSON] =
    useState(null);

  const [
    assamDistrictGeoJSON,
    setAssamDistrictGeoJSON,
  ] = useState(
    assamDistrictsGeoJSON || null
  );

  const [
    villageGeoJSON,
    setVillageGeoJSON,
  ] = useState(null);

  const [zoom, setZoom] =
    useState(5);

  const [loading, setLoading] =
    useState(true);

  const [
    villageLoading,
    setVillageLoading,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    showAssamOnly,
    setShowAssamOnly,
  ] = useState(false);

  const districtLayerRef =
    useRef(null);

  /*
    ============================================================
    BACKEND RISK DATA
    ============================================================
  */

  const [
    riskZones,
    setRiskZones,
  ] = useState([]);

  const [
    riskZonesLoading,
    setRiskZonesLoading,
  ] = useState(true);

  const [
    riskZonesError,
    setRiskZonesError,
  ] = useState("");

  /*
    ============================================================
    BACKEND FLOOD HAZARD DATA
    ============================================================
  */

  const [
    floodHazards,
    setFloodHazards,
  ] = useState([]);

  const [
    floodHazardsLoading,
    setFloodHazardsLoading,
  ] = useState(true);

  const [
    floodHazardsError,
    setFloodHazardsError,
  ] = useState("");

  /*
    ------------------------------------------------------------
    Load real risk data
    ------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    async function loadRiskZones() {
      try {
        setRiskZonesLoading(
          true
        );

        setRiskZonesError("");

        const result =
          await getRiskZones({
            district:
              selectedDistrict ||
              "",
            limit: 50,
            offset: 0,
          });

        if (!cancelled) {
          setRiskZones(
            Array.isArray(
              result
            )
              ? result
              : Array.isArray(
                  result?.data
                )
              ? result.data
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load risk zones:",
            error
          );

          setRiskZonesError(
            error.message ||
              "Failed to load risk zones"
          );

          setRiskZones([]);
        }
      } finally {
        if (!cancelled) {
          setRiskZonesLoading(
            false
          );
        }
      }
    }

    loadRiskZones();

    return () => {
      cancelled = true;
    };
  }, [
    selectedDistrict,
  ]);

  /*
    ------------------------------------------------------------
    Load real flood hazard data
    ------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    async function loadFloodHazards() {
      try {
        setFloodHazardsLoading(
          true
        );

        setFloodHazardsError("");

        const result =
          await getHazards();

        const hazardData =
          Array.isArray(result)
            ? result
            : Array.isArray(
                result?.data
              )
            ? result.data
            : [];

        if (!cancelled) {
          const floodOnly =
            hazardData.filter(
              (hazard) =>
                String(
                  hazard.hazard_type ||
                    ""
                )
                  .trim()
                  .toLowerCase() ===
                "flood"
            );

          setFloodHazards(
            floodOnly
          );
        }
      } catch (error) {
        console.error(
          "Failed to load flood hazards:",
          error
        );

        if (!cancelled) {
          setFloodHazards([]);

          setFloodHazardsError(
            error.message ||
              "Failed to load flood hazards"
          );
        }
      } finally {
        if (!cancelled) {
          setFloodHazardsLoading(
            false
          );
        }
      }
    }

    loadFloodHazards();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
    ------------------------------------------------------------
    Load India + Assam districts
    ------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const loadMaps =
      async () => {
        setLoading(true);
        setLoadError("");

        try {
          const [
            indiaResponse,
            districtResponse,
          ] = await Promise.all([
            fetch(
              INDIA_GEOJSON_URL
            ),
            fetch(
              ASSAM_DISTRICTS_GEOJSON_URL
            ),
          ]);

          if (
            !indiaResponse.ok
          ) {
            throw new Error(
              "India map could not be loaded."
            );
          }

          const india =
            await indiaResponse.json();

          if (!cancelled) {
            setIndiaGeoJSON(
              india
            );
          }

          if (
            districtResponse.ok
          ) {
            const districts =
              await districtResponse.json();

            if (
              !cancelled &&
              districts?.features
                ?.length
            ) {
              setAssamDistrictGeoJSON(
                districts
              );
            }
          }
        } catch (error) {
          if (!cancelled) {
            setLoadError(
              "The online map data could not be loaded. The existing Assam map will still be used."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadMaps();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
    ------------------------------------------------------------
    Load villages after zooming into Assam
    ------------------------------------------------------------
  */

  useEffect(() => {
    if (
      zoom < 8 ||
      villageGeoJSON ||
      villageLoading
    ) {
      return;
    }

    let cancelled = false;

    const loadVillages =
      async () => {
        setVillageLoading(
          true
        );

        try {
          const response =
            await fetch(
              ASSAM_VILLAGES_URL
            );

          if (!response.ok) {
            throw new Error(
              "Village GeoJSON not found."
            );
          }

          const villages =
            await response.json();

          if (!cancelled) {
            setVillageGeoJSON(
              villages
            );
          }
        } catch {
          // Do not break the whole map.
        } finally {
          if (!cancelled) {
            setVillageLoading(
              false
            );
          }
        }
      };

    loadVillages();

    return () => {
      cancelled = true;
    };
  }, [
    zoom,
    villageGeoJSON,
    villageLoading,
  ]);

  /*
    ------------------------------------------------------------
    Determine Assam features
    ------------------------------------------------------------
  */

  const isAssam = (
    feature
  ) => {
    const properties =
      feature?.properties ||
      {};

    const state =
      getProperty(
        properties,
        [
          "st_nm",
          "ST_NM",
          "state",
          "STATE",
          "State",
          "state_name",
          "STATE_NAME",
        ]
      );

    return (
      normalizeName(state) ===
      "assam"
    );
  };

  const assamFromIndia =
    useMemo(() => {
      if (
        !indiaGeoJSON?.features
      ) {
        return null;
      }

      const features =
        indiaGeoJSON.features.filter(
          isAssam
        );

      if (!features.length)
        return null;

      return {
        type: "FeatureCollection",
        features,
      };
    }, [
      indiaGeoJSON,
    ]);

  const assamOutlineGeoJSON =
    assamFromIndia ||
    assamDistrictGeoJSON;

  /*
    ------------------------------------------------------------
    District styling
    ------------------------------------------------------------
  */

  const styleForDistrict =
    (feature) => {
      const properties =
        feature?.properties ||
        {};

      const name =
        getDistrictName(
          properties
        );

      const normalizedDistrict =
        normalizeName(name);

      /*
        Use the highest REAL backend
        risk score available in this
        district.
      */

      const districtRiskItems =
        riskZones.filter(
          (item) =>
            normalizeName(
              item.district
            ) ===
            normalizedDistrict
        );

      const districtRiskScore =
        districtRiskItems.length
          ? Math.max(
              ...districtRiskItems.map(
                (item) =>
                  Number(
                    item.risk_score
                  ) || 0
              )
            )
          : 0;

      /*
        Backend score is 0-100.
        Existing intensityColor()
        expects 0-1.
      */

      const riskValue =
        districtRiskScore / 100;

      /*
        Real flood hazard intensity
        for this district.
      */

      const districtHazards =
        floodHazards.filter(
          (hazard) =>
            normalizeName(
              hazard.district
            ) ===
            normalizedDistrict
        );

      /*
        Scale the number of actual
        flood records into 0-1.

        This is only used to visually
        represent the density of the
        backend flood records.
      */

      const hazardIntensity =
        districtHazards.length
          ? Math.min(
              districtHazards.length /
                20,
              1
            )
          : 0;

      const selected =
        normalizedDistrict ===
        normalizeName(
          selectedDistrict
        );

      return {
        color: selected
          ? "#0f172a"
          : "#ffffff",

        weight: selected
          ? 3
          : 1.2,

        opacity: 1,

        fillColor:
          mode === "zones"
            ? intensityColor(
                riskValue
              )
            : activeHazard ===
              "flood"
            ? intensityColor(
                hazardIntensity
              )
            : "#163b5c",

        fillOpacity: selected
          ? 0.86
          : 0.68,
      };
    };

  /*
    ------------------------------------------------------------
    District interaction
    ------------------------------------------------------------
  */

  const districtHandlers = {
    mouseover: (
      event
    ) => {
      event.target.setStyle({
        weight: 3,
        color: "#ffffff",
        fillOpacity: 0.75,
      });

      event.target.bringToFront();
    },

    mouseout: (
      event
    ) => {
      if (
        districtLayerRef.current
      ) {
        districtLayerRef.current.resetStyle(
          event.target
        );
      }
    },

    click: (event) => {
      const feature =
        event.target.feature;

      const name =
        getDistrictName(
          feature?.properties
        );

      if (
        name &&
        onSelectDistrict
      ) {
        onSelectDistrict(
          name
        );
      }
    },
  };

  /*
    ------------------------------------------------------------
    Village layer
    ------------------------------------------------------------
  */

  const villageLabelEnabled =
    zoom >= 8;

  /*
    ------------------------------------------------------------
    District tooltip
    ------------------------------------------------------------
  */

  const districtOnEachFeature =
    (
      feature,
      layer
    ) => {
      const districtName =
        getDistrictName(
          feature?.properties
        );

      if (districtName) {
        layer.bindTooltip(
          districtName,
          {
            sticky: true,
            direction: "center",
            className:
              "assam-district-tooltip",
            opacity: 0.95,
          }
        );
      }

      layer.on(
        districtHandlers
      );
    };

  return (
    <div className="relative h-full min-h-[600px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950">

      <style>{`
        .assam-district-tooltip,
        .assam-village-tooltip {
          background: rgba(7, 25, 42, 0.94) !important;
          border: 1px solid rgba(99, 244, 250, 0.65) !important;
          color: #ffffff !important;
          border-radius: 7px !important;
          box-shadow: 0 4px 14px rgba(0,0,0,.45) !important;
          font-weight: 700 !important;
          padding: 4px 7px !important;
        }

        .assam-district-tooltip::before,
        .assam-village-tooltip::before {
          border-top-color: rgba(99,244,250,.65) !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }

        .leaflet-container {
          background: #071827;
          font-family: Inter, system-ui, sans-serif;
        }
      `}</style>

      {/* =====================================================
          MAP HEADER
          ===================================================== */}

      <div className="absolute left-3 top-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-xl border border-emerald-300/20 bg-gradient-to-br from-navy-950/95 via-navy-900/95 to-[#075E46]/95 p-3 text-white shadow-2xl backdrop-blur sm:left-4 sm:top-4 sm:max-w-[430px] sm:rounded-2xl sm:p-4">

        <div className="flex items-center gap-2">
          <MapPin
            size={17}
            className="text-gold-300"
          />

          <h2 className="font-display text-base font-extrabold text-amber-300">
            Assam Disaster Risk Map
          </h2>
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-300">
          India → Assam → District → Village GIS view
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          Real roads, rivers, towns and place names • Satellite
        </p>

        <div className="mt-3 flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setShowAssamOnly(
                false
              )
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              !showAssamOnly
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            🇮🇳 India
          </button>

          <button
            type="button"
            onClick={() =>
              setShowAssamOnly(
                true
              )
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              showAssamOnly
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            Assam
          </button>

        </div>

        <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[11px] text-emerald-50">
          {zoom < 7
            ? "Zoom into Assam to see district names."
            : zoom < 10
            ? "District names are visible. Zoom further for villages."
            : "Village names are visible at this zoom level."}
        </div>

        {/* Backend risk status */}

        <div className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[10px]">

          {riskZonesLoading ? (
            <span className="text-cyan-200">
              Loading backend risk data...
            </span>
          ) : riskZonesError ? (
            <span className="text-orange-200">
              Backend risk data unavailable
            </span>
          ) : (
            <span className="text-emerald-200">
              ✓ {riskZones.length} backend risk locations loaded
            </span>
          )}

        </div>

        {/* Flood status */}

        {activeHazard ===
          "flood" &&
          mode === "hazard" && (
            <div className="mt-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px]">

              {floodHazardsLoading ? (
                <span className="text-cyan-200">
                  Loading flood hazards...
                </span>
              ) : floodHazardsError ? (
                <span className="text-orange-200">
                  Flood hazard data unavailable
                </span>
              ) : (
                <span className="text-cyan-100">
                  ✓ {floodHazards.length} flood hazard records
                </span>
              )}

            </div>
          )}

      </div>

      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading && (
        <div className="absolute right-4 top-4 z-[1001] flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-white shadow-xl backdrop-blur">

          <Loader2
            size={15}
            className="animate-spin text-cyan-300"
          />

          Loading GIS data...

        </div>
      )}

      {villageLoading && (
        <div className="absolute bottom-4 right-4 z-[1001] flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-white shadow-xl backdrop-blur">

          <Loader2
            size={15}
            className="animate-spin text-cyan-300"
          />

          Loading Assam villages...

        </div>
      )}

      {loadError && (
        <div className="absolute bottom-4 left-1/2 z-[1001] -translate-x-1/2 rounded-xl border border-orange-400/30 bg-slate-950/95 px-4 py-2 text-xs text-orange-100 shadow-xl">
          {loadError}
        </div>
      )}

      {/* =====================================================
          MAP
          ===================================================== */}

      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        minZoom={4}
        maxZoom={16}
        zoomControl={false}
        scrollWheelZoom
        attributionControl
        className="h-full min-h-[600px] w-full"
      >

        <TileLayer
          url={SATELLITE_TILES}
          attribution={
            SATELLITE_ATTRIBUTION
          }
          maxZoom={19}
        />

        <MapZoomWatcher
          onZoomChange={
            setZoom
          }
        />

        <FitIndia
          geojson={
            indiaGeoJSON
          }
        />

        <AssamView
          shouldFit={
            showAssamOnly
          }
        />

        {/* Assam outline */}

        {assamOutlineGeoJSON && (
          <GeoJSON
            key="assam-outline"
            data={
              assamOutlineGeoJSON
            }
            style={{
              color: "#ffffff",
              weight: 2.5,
              fillOpacity: 0,
              fillColor:
                "transparent",
              opacity: 1,
            }}
          />
        )}

        {/* Districts */}

        {assamDistrictGeoJSON && (
          <GeoJSON
            key={`assam-districts-${
              selectedDistrict ||
              "none"
            }-${mode}-${activeHazard}-${riskZones.length}-${floodHazards.length}`}
            data={
              assamDistrictGeoJSON
            }
            ref={
              districtLayerRef
            }
            style={
              styleForDistrict
            }
            onEachFeature={
              districtOnEachFeature
            }
          />
        )}

        {/* =================================================
            REAL FLOOD HAZARD DATA
            ================================================= */}

        <FloodHazardLayer
          hazards={
            floodHazards
          }
          visible={
            mode === "hazard" &&
            activeHazard ===
              "flood"
          }
          selectedDistrict={
            selectedDistrict
          }
        />

        {/* =================================================
            REAL BACKEND RISK MARKERS
            ================================================= */}

        {mode ===
          "zones" &&
          riskZones.map(
            (item) => {
              const latitude =
                Number(
                  item.latitude
                );

              const longitude =
                Number(
                  item.longitude
                );

              if (
                !Number.isFinite(
                  latitude
                ) ||
                !Number.isFinite(
                  longitude
                )
              ) {
                return null;
              }

              const markerColor =
                getRiskMarkerColor(
                  item.risk_zone
                );

              const radius =
                String(
                  item.risk_zone
                ).toUpperCase() ===
                "RED"
                  ? 8
                  : 6;

              return (
                <CircleMarker
                  key={
                    item.habitation_id
                  }
                  center={[
                    latitude,
                    longitude,
                  ]}
                  radius={
                    radius
                  }
                  pathOptions={{
                    color:
                      "#ffffff",
                    weight: 1.5,
                    fillColor:
                      markerColor,
                    fillOpacity:
                      0.9,
                  }}
                >
                  <Popup>
                    <div
                      style={{
                        minWidth:
                          "190px",
                        fontFamily:
                          "Inter, system-ui, sans-serif",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "15px",
                          fontWeight:
                            "800",
                          marginBottom:
                            "6px",
                        }}
                      >
                        {item.name ||
                          item.habitation_name ||
                          `Habitation ${item.habitation_id}`}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          lineHeight:
                            "1.7",
                        }}
                      >
                        <strong>
                          Habitation ID:
                        </strong>{" "}
                        {
                          item.habitation_id
                        }

                        <br />

                        <strong>
                          District:
                        </strong>{" "}
                        {
                          item.district
                        }

                        <br />

                        <strong>
                          Risk Score:
                        </strong>{" "}
                        {
                          item.risk_score
                        }

                        <br />

                        <strong>
                          Risk Level:
                        </strong>{" "}
                        {
                          item.risk_level
                        }

                        <br />

                        <strong>
                          Risk Zone:
                        </strong>{" "}
                        {
                          item.risk_zone
                        }
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            }
          )}

        {/* Villages */}

        {villageGeoJSON &&
          zoom >= 8 && (
            <VillageDotLayer
              geojson={
                villageGeoJSON
              }
              visible={
                villageLabelEnabled
              }
            />
          )}

        <ZoomControls />

        <FullscreenButton />

      </MapContainer>

      {/* =====================================================
          BOTTOM STATUS
          ===================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="absolute bottom-3 left-1/2 z-[1000] max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full border border-cyan-300/30 bg-slate-950/90 px-3 py-2 text-[10px] font-semibold text-cyan-100 shadow-2xl backdrop-blur sm:bottom-4 sm:px-4 sm:text-xs"
      >
        🇮🇳 India →{" "}
        <span className="text-cyan-300">
          Assam Highlighted
        </span>

        {zoom >= 7 &&
          " → Districts"}

        {zoom >= 8 &&
          " → Villages"}
      </motion.div>

      {/* =====================================================
          HAZARD CONTROLS
          ===================================================== */}

      <div className="absolute right-3 top-[232px] z-[1000] origin-top-right scale-90 sm:right-4 sm:bottom-16 sm:top-auto sm:scale-100">

        <HazardLayerControl
          mode={mode}
          onSetZones={() =>
            setMode("zones")
          }
          activeHazard={
            activeHazard
          }
          onSetHazard={(
            hazard
          ) => {
            setActiveHazard(
              hazard
            );

            setMode(
              "hazard"
            );
          }}
        />

      </div>

      {/* =====================================================
          LEGEND
          ===================================================== */}

      <div className="absolute bottom-16 left-3 z-[1000] origin-bottom-left scale-90 sm:left-4 sm:scale-100">

        <HazardLegend
          mode={mode}
          activeHazard={
            activeHazard
          }
        />

      </div>

    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, MapPin, AlertTriangle } from "lucide-react";

import { getRiskZones } from "../services/api";

function FactorGauge({
  icon: Icon,
  label,
  value,
  tone,
  suffix = "%",
}) {
  const numericValue = Number(value) || 0;

  return (
    <div
      className="overflow-hidden rounded-xl border bg-white shadow-card transition-all duration-200 hover:-translate-y-1"
      style={{
        borderColor: `${tone}55`,
        boxShadow: `0 5px 18px ${tone}18`,
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3 text-white"
        style={{
          background: `linear-gradient(110deg, ${tone}, #0B6B4D)`,
        }}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15">
          <Icon size={15} />
        </div>

        <p className="text-[12.5px] font-bold">
          {label}
        </p>
      </div>

      <div className="p-4">
        <p className="font-display font-extrabold text-[28px] text-ink-900 leading-none">
          {value}

          {suffix && (
            <span className="ml-0.5 text-[14px] font-medium text-ink-900/35">
              {suffix}
            </span>
          )}
        </p>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas-100">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{
              width: `${Math.min(numericValue, 100)}%`,
            }}
            viewport={{ once: true }}
            transition={{
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="h-full rounded-full"
            style={{
              backgroundColor: tone,
              boxShadow: `0 0 10px ${tone}88`,
            }}
          />
        </div>

        <p className="mt-2.5 text-[11px] font-medium text-ink-900/45">
          Based on real backend risk data
        </p>
      </div>
    </div>
  );
}

const getZoneColor = (zone) => {
  switch (String(zone || "").toUpperCase()) {
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

const getPriorityLabel = (zone) => {
  switch (String(zone || "").toUpperCase()) {
    case "RED":
      return "Immediate";

    case "ORANGE":
      return "Short-term";

    case "YELLOW":
      return "Medium-term";

    case "GREEN":
      return "Low";

    default:
      return "Unclassified";
  }
};

export default function RiskAnalysis({
  selectedDistrict,
  onSelectDistrict,
}) {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD REAL RISK DATA
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadRiskData() {
      try {
        setLoading(true);
        setError("");

        const result = await getRiskZones({
          district: "",
          limit: 50,
          offset: 0,
        });

        if (cancelled) return;

        // Backend can return:
        // [ ... ]
        // OR
        // { data: [ ... ] }

        const data = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        setRiskData(data);
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Failed to load risk analysis:",
            err
          );

          setError(
            err.message ||
              "Failed to load risk analysis data"
          );

          setRiskData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRiskData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // AVERAGE RISK SCORE
  // ============================================================

  const averageRiskScore = useMemo(() => {
    if (!riskData.length) return 0;

    const total = riskData.reduce(
      (sum, item) =>
        sum + Number(item.risk_score || 0),
      0
    );

    return Number(
      (total / riskData.length).toFixed(1)
    );
  }, [riskData]);

  // ============================================================
  // RED ZONE COUNT
  // ============================================================

  const redZoneCount = useMemo(() => {
    return riskData.filter(
      (item) =>
        String(item.risk_zone || "").toUpperCase() ===
        "RED"
    ).length;
  }, [riskData]);

  // ============================================================
  // ORANGE ZONE COUNT
  // ============================================================

  const orangeZoneCount = useMemo(() => {
    return riskData.filter(
      (item) =>
        String(item.risk_zone || "").toUpperCase() ===
        "ORANGE"
    ).length;
  }, [riskData]);

  // Prevent unused-variable warning while keeping
  // this calculated value available for future UI.
  void orangeZoneCount;

  // ============================================================
  // TOP RISK LOCATIONS
  // ============================================================

  const topRiskLocations = useMemo(() => {
    return [...riskData]
      .sort(
        (a, b) =>
          Number(b.risk_score || 0) -
          Number(a.risk_score || 0)
      )
      .slice(0, 10);
  }, [riskData]);

  // ============================================================
  // SELECTED DISTRICT
  // ============================================================

  const selectedDistrictData = useMemo(() => {
    if (!selectedDistrict) {
      return null;
    }

    const selectedName = String(
      selectedDistrict || ""
    )
      .trim()
      .toLowerCase();

    const districtItems = riskData.filter(
      (item) =>
        String(item.district || "")
          .trim()
          .toLowerCase() === selectedName
    );

    if (!districtItems.length) {
      return null;
    }

    const total = districtItems.reduce(
      (sum, item) =>
        sum + Number(item.risk_score || 0),
      0
    );

    const average =
      total / districtItems.length;

    return {
      count: districtItems.length,

      averageRisk: Number(
        average.toFixed(1)
      ),

      redCount: districtItems.filter(
        (item) =>
          String(item.risk_zone || "").toUpperCase() ===
          "RED"
      ).length,
    };
  }, [riskData, selectedDistrict]);

  return (
    <section className="overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-card">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-navy-950 via-navy-900 to-[#0B5E45] px-6 py-6 sm:px-8">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
            Decision intelligence
          </p>

          <h2 className="mt-1 font-display font-extrabold text-[25px] tracking-tight text-white">
            Risk Vulnerability Dashboard
          </h2>

          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-white/70">
            Real-time risk assessment of monitored
            habitations using hazard-derived risk scores
            from the disaster management backend.
          </p>
        </div>

        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-teal-100">
          Backend risk analysis
        </span>

      </div>

      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading && (
        <div className="px-6 pt-6 sm:px-8">
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            Loading real risk data from backend...
          </div>
        </div>
      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {!loading && error && (
        <div className="px-6 pt-6 sm:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load risk analysis data:

            <span className="ml-1 font-semibold">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          RISK METRIC CARDS
          ===================================================== */}

      <div className="grid grid-cols-1 gap-4 px-6 pt-6 sm:grid-cols-3 sm:px-8">

        <FactorGauge
          icon={Activity}
          label="Average risk score"
          value={averageRiskScore}
          tone="#178A61"
          suffix=""
        />

        <FactorGauge
          icon={MapPin}
          label="Monitored habitations"
          value={riskData.length}
          tone="#119B70"
          suffix=""
        />

        <FactorGauge
          icon={AlertTriangle}
          label="Red-zone habitations"
          value={redZoneCount}
          tone="#0B6B4D"
          suffix=""
        />

      </div>

      {/* =====================================================
          SELECTED DISTRICT
          ===================================================== */}

      {selectedDistrict && (
        <div className="mx-6 mt-6 rounded-xl border border-navy-100 bg-canvas-50 p-4 sm:mx-8">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-900/40">
                Selected district
              </p>

              <p className="mt-1 font-display text-[18px] font-extrabold text-ink-900">
                {selectedDistrict}
              </p>
            </div>

            {selectedDistrictData ? (

              <div className="flex flex-wrap gap-2">

                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-900 shadow-sm">
                  {selectedDistrictData.count} monitored
                  habitations
                </span>

                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-900 shadow-sm">
                  Avg. risk{" "}
                  {selectedDistrictData.averageRisk}
                </span>

                <span className="rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 shadow-sm">
                  {selectedDistrictData.redCount} red
                  zone
                </span>

              </div>

            ) : (

              <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-900/50 shadow-sm">
                No monitored risk records in current
                dataset
              </span>

            )}

          </div>

        </div>
      )}

      {/* =====================================================
          TOP RISK LOCATIONS
          ===================================================== */}

      <div className="mt-8 px-6 pb-6 sm:px-8 sm:pb-8">

        <p className="mb-3 font-display text-[17px] font-bold text-ink-900">
          Highest-risk monitored habitations
        </p>

        {loading ? (

          <div className="rounded-xl border border-line-200 bg-canvas-50 px-4 py-6 text-center text-sm text-ink-900/50">
            Loading risk rankings...
          </div>

        ) : topRiskLocations.length === 0 ? (

          <div className="rounded-xl border border-line-200 bg-canvas-50 px-4 py-6 text-center text-sm text-ink-900/50">
            No risk records available.
          </div>

        ) : (

          <div className="space-y-2.5">

            {topRiskLocations.map((item, index) => {

              const zone = String(
                item.risk_zone || ""
              ).toUpperCase();

              const color =
                getZoneColor(zone);

              const riskScore = Number(
                item.risk_score || 0
              );

              const districtName =
                item.district ||
                "Unknown district";

              const habitationName =
                item.name ||
                item.habitation_name ||
                `Habitation ${item.habitation_id}`;

              const active =
                selectedDistrict &&
                String(item.district || "")
                  .trim()
                  .toLowerCase() ===
                  String(selectedDistrict || "")
                    .trim()
                    .toLowerCase();

              return (

                <button
                  key={
                    item.habitation_id ||
                    `${districtName}-${index}`
                  }
                  type="button"
                  onClick={() =>
                    onSelectDistrict?.(
                      districtName
                    )
                  }
                  className={`w-full flex items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-hazard-red/50 bg-hazard-redSoft shadow-[0_0_18px_rgba(229,57,53,0.18)]"
                      : "border-line-200 hover:bg-canvas-50 hover:border-hazard-orange/40"
                  }`}
                >

                  {/* Rank */}

                  <span className="w-4 shrink-0 text-[11px] font-medium text-ink-900/35">
                    {index + 1}
                  </span>

                  {/* Habitation */}

                  <div className="w-40 shrink-0">

                    <p className="truncate text-[13px] font-semibold text-ink-900">
                      {habitationName}
                    </p>

                    <p className="truncate text-[10px] text-ink-900/45">
                      {districtName}
                    </p>

                  </div>

                  {/* Risk bar */}

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas-100">

                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{
                        width: `${Math.min(
                          riskScore,
                          100
                        )}%`,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: [
                          0.16,
                          1,
                          0.3,
                          1,
                        ],
                      }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: color,
                      }}
                    />

                  </div>

                  {/* Score */}

                  <span
                    className="shrink-0 text-[12px] font-bold"
                    style={{
                      color,
                    }}
                  >
                    {riskScore}
                  </span>

                  {/* Zone */}

                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
                    style={{
                      backgroundColor: `${color}1a`,
                      color,
                    }}
                  >
                    {zone || "Unknown"}
                  </span>

                  {/* Priority */}

                  <span className="hidden w-20 shrink-0 text-right text-[10px] font-semibold text-ink-900/45 sm:inline">
                    {getPriorityLabel(zone)}
                  </span>

                </button>

              );
            })}

          </div>

        )}

        {/* ===================================================
            BACKEND INFORMATION
            =================================================== */}

        {!loading && riskData.length > 0 && (
          <p className="mt-4 text-[10px] text-ink-900/35">
            Showing the highest-risk records from the
            backend risk-zone dataset.
          </p>
        )}

      </div>

    </section>
  );
}
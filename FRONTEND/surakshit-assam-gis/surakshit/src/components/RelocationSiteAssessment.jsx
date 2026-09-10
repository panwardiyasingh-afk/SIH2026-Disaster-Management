import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  MapPin,
  Users,
  Building2,
  Baby,
  Loader2,
} from "lucide-react";

import { getRelocationSites } from "../services/api";

const statusTone = {
  Active: "#2F8F5B",
  Available: "#2F8F5B",
  Inactive: "#C6362F",
  Closed: "#C6362F",
};

function getStatusTone(status) {
  return (
    statusTone[String(status || "").trim()] ||
    "#B8932A"
  );
}

function SiteCard({ site, index }) {
  const tone = getStatusTone(site.status);

  const capacity = Number(site.capacity || 0);
  const toilets = Number(site.toilets || 0);

  const childFriendly =
    String(site.child_friendly_space || "").toLowerCase() ===
      "yes" ||
    String(site.child_friendly_space || "").toLowerCase() ===
      "true" ||
    site.child_friendly_space === true;

  const isAvailable =
    String(site.status || "").toLowerCase() ===
      "active" ||
    String(site.status || "").toLowerCase() ===
      "available";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -6,
        boxShadow: `0 18px 38px ${tone}38`,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative overflow-hidden rounded-xl border bg-white p-5 transition-colors duration-200"
      style={{
        borderColor: `${tone}55`,
      }}
    >
      {/* Top accent */}

      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${tone}, ${tone}55)`,
        }}
        aria-hidden="true"
      />

      {/* Glow */}

      <div
        className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
        style={{
          backgroundColor: tone,
        }}
        aria-hidden="true"
      />

      {/* Header */}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display font-semibold text-[15px] text-ink-900">
            {site.site_name ||
              `Site ${site.site_id}`}
          </h4>

          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-900/45">
            <MapPin size={11} />

            {site.district || "Unknown district"}
          </p>

          {site.village && (
            <p className="mt-0.5 text-[10.5px] text-ink-900/40">
              {site.village}
            </p>
          )}
        </div>

        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold shadow-sm"
          style={{
            backgroundColor: `${tone}1f`,
            color: tone,
            boxShadow: `0 0 14px ${tone}25`,
          }}
        >
          {site.status || "Unknown status"}
        </span>
      </div>

      {/* Site type */}

      <div className="mt-3">
        <span className="rounded-full bg-canvas-100 px-2.5 py-1 text-[10.5px] font-semibold text-ink-900/55">
          {site.site_type || "Relocation site"}
        </span>
      </div>

      {/* Capacity */}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10.5px] text-ink-900/40">
            Carrying capacity
          </p>

          <p className="mt-0.5 text-[15px] font-semibold text-ink-900">
            {capacity.toLocaleString("en-IN")} people
          </p>
        </div>

        <div>
          <p className="text-[10.5px] text-ink-900/40">
            Toilets
          </p>

          <p className="mt-0.5 text-[15px] font-semibold text-ink-900">
            {toilets.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Facilities */}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-canvas-50 px-3 py-2">
          <Users
            size={14}
            className="text-emerald-600"
          />

          <div>
            <p className="text-[9.5px] text-ink-900/40">
              Capacity
            </p>

            <p className="text-[11px] font-semibold text-ink-900">
              {capacity.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-canvas-50 px-3 py-2">
          <Building2
            size={14}
            className="text-cyan-600"
          />

          <div>
            <p className="text-[9.5px] text-ink-900/40">
              Toilets
            </p>

            <p className="text-[11px] font-semibold text-ink-900">
              {toilets}
            </p>
          </div>
        </div>
      </div>

      {/* Child friendly space */}

      <div className="mt-2 flex items-center gap-2 rounded-lg bg-canvas-50 px-3 py-2">
        <Baby
          size={14}
          className={
            childFriendly
              ? "text-emerald-600"
              : "text-ink-900/25"
          }
        />

        <div>
          <p className="text-[9.5px] text-ink-900/40">
            Child-friendly space
          </p>

          <p className="text-[11px] font-semibold text-ink-900">
            {childFriendly
              ? "Available"
              : "Not specified"}
          </p>
        </div>
      </div>

      {/* Recommendation/status */}

      <div className="mt-4 flex items-start gap-2 border-t border-line-200 pt-3.5">
        <CheckCircle2
          size={14}
          className="mt-0.5 shrink-0"
          style={{
            color: tone,
          }}
        />

        <p className="text-[12px] leading-snug text-ink-900/60">
          {isAvailable
            ? "This relocation site is currently marked as available in the backend dataset."
            : `Current backend status: ${
                site.status || "not specified"
              }.`}
        </p>
      </div>
    </motion.div>
  );
}

export default function RelocationSiteAssessment() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
    ============================================================
    LOAD REAL RELOCATION SITES
    ============================================================
  */

  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      try {
        setLoading(true);
        setError("");

        const result = await getRelocationSites();

        if (!cancelled) {
          /*
            Backend may return either:

            1. Direct array:
               [ ... ]

            2. Wrapped response:
               { data: [ ... ] }

            Handle both formats.
          */

          const siteData = Array.isArray(result)
            ? result
            : Array.isArray(result?.data)
              ? result.data
              : [];

          setSites(siteData);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Failed to load relocation sites:",
            err
          );

          setError(
            err.message ||
              "Failed to load relocation sites"
          );

          setSites([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSites();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-line-200 bg-white p-6 shadow-card sm:p-8">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>
          <h2 className="font-display text-[22px] font-bold tracking-tight text-ink-900">
            Safe Relocation Site Assessment
          </h2>

          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink-900/55">
            Assess safer alternative locations and their
            carrying capacity using verified relocation-site
            data from the backend.
          </p>
        </div>

        <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-medium text-teal-700">
          Backend Site Data
        </span>

      </div>

      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading && (
        <div className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-6 text-sm text-cyan-800">

          <Loader2
            size={17}
            className="animate-spin"
          />

          Loading relocation sites...

        </div>
      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {!loading && error && (
        <div className="mt-7 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">

          Unable to load relocation sites:

          <span className="ml-1 font-semibold">
            {error}
          </span>

        </div>
      )}

      {/* =====================================================
          SITE COUNT
          ===================================================== */}

      {!loading &&
        !error &&
        sites.length > 0 && (

          <div className="mt-5 flex flex-wrap gap-2">

            <span className="rounded-full bg-canvas-100 px-3 py-1.5 text-[11px] font-semibold text-ink-900/60">
              {sites.length} relocation sites
            </span>

            <span className="rounded-full bg-canvas-100 px-3 py-1.5 text-[11px] font-semibold text-ink-900/60">
              Real backend data
            </span>

          </div>

        )}

      {/* =====================================================
          SITE CARDS
          ===================================================== */}

      {!loading &&
        !error &&
        sites.length > 0 && (

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

            {sites.map((site, index) => (

              <SiteCard
                key={
                  site.site_id ||
                  `${site.site_name}-${index}`
                }
                site={site}
                index={index}
              />

            ))}

          </div>

        )}

      {/* =====================================================
          NO DATA
          ===================================================== */}

      {!loading &&
        !error &&
        sites.length === 0 && (

          <div className="mt-7 rounded-xl border border-line-200 bg-canvas-50 px-4 py-8 text-center text-sm text-ink-900/50">
            No relocation sites were returned by the
            backend.
          </div>

        )}

    </section>
  );
}
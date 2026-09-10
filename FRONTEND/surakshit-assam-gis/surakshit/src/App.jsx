import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  CloudRain,
  Mountain,
  Waves,
  Loader2,
} from 'lucide-react'

import Sidebar from './components/Sidebar'
import Header from './components/Header'
import AssamMap from './components/AssamMap'
import RiskAnalysis from './components/RiskAnalysis'
import RelocationSiteAssessment from './components/RelocationSiteAssessment'
import RelocationPriority from './components/RelocationPriority'
import RelocationPlanner from './components/RelocationPlanner'

import {
  getRiskZones,
  getHazards,
} from './services/api'

import { assamDistrictsGeoJSON } from './data/mockData'

export default function App() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  const [selectedDistrict, setSelectedDistrict] =
    useState(null)

  const [activeSection, setActiveSection] =
    useState('dashboard')

  /*
    ============================================================
    BACKEND DASHBOARD DATA
    ============================================================
  */

  const [riskZones, setRiskZones] =
    useState([])

  const [hazards, setHazards] =
    useState([])

  const [dashboardLoading, setDashboardLoading] =
    useState(true)

  const [dashboardError, setDashboardError] =
    useState('')

  /*
    ============================================================
    SECTION REFERENCES
    ============================================================
  */

  const refs = {
    dashboard: useRef(null),
    'hazard-map': useRef(null),
    'risk-analysis': useRef(null),
    'relocation-planner': useRef(null),
  }

  /*
    ============================================================
    LOAD BACKEND DATA
    ============================================================
  */

  useEffect(() => {
    let cancelled = false

    async function loadDashboardData() {
      try {
        setDashboardLoading(true)
        setDashboardError('')

        const [
          riskResult,
          hazardResult,
        ] = await Promise.all([
          getRiskZones({
            limit: 200,
            offset: 0,
          }),
          getHazards(),
        ])

        if (cancelled) return

        const riskData =
          Array.isArray(riskResult)
            ? riskResult
            : Array.isArray(riskResult?.data)
              ? riskResult.data
              : []

        const hazardData =
          Array.isArray(hazardResult)
            ? hazardResult
            : Array.isArray(hazardResult?.data)
              ? hazardResult.data
              : []

        setRiskZones(riskData)
        setHazards(hazardData)
      } catch (error) {
        console.error(
          'Failed to load dashboard data:',
          error
        )

        if (!cancelled) {
          setDashboardError(
            error.message ||
              'Failed to load dashboard data'
          )

          setRiskZones([])
          setHazards([])
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      cancelled = true
    }
  }, [])

  /*
    ============================================================
    DASHBOARD STATISTICS
    ============================================================
  */

  const dashboardStats = useMemo(() => {
    /*
      ----------------------------------------------------------
      DISTRICTS MONITORED
      ----------------------------------------------------------

      Count districts from the complete Assam GeoJSON,
      not from the limited backend risk-zone sample.
    */

    const districtNames = new Set()

    const districtFeatures =
      assamDistrictsGeoJSON?.features || []

    districtFeatures.forEach((feature) => {
      const properties =
        feature?.properties || {}

      const district =
        properties.district ||
        properties.DISTRICT ||
        properties.District ||
        properties.dtname ||
        properties.DTNAME ||
        properties.district_name ||
        properties.DISTRICT_NAME ||
        properties.name ||
        properties.NAME

      if (district) {
        districtNames.add(
          String(district)
            .trim()
            .toLowerCase()
        )
      }
    })

    const districtCount =
      districtNames.size

    /*
      ----------------------------------------------------------
      RED-ZONE DISTRICTS
      ----------------------------------------------------------

      Based on actual backend risk records.
    */

    const redDistrictSet =
      new Set()

    riskZones.forEach((item) => {
      const zone =
        String(
          item.risk_zone ??
            item.riskZone ??
            item.zone ??
            ''
        ).toUpperCase()

      const score =
        Number(
          item.risk_score ??
            item.riskScore ??
            item.score ??
            0
        )

      if (
        zone === 'RED' ||
        score >= 80
      ) {
        const district =
          String(
            item.district ??
              item.District ??
              ''
          ).trim()

        if (district) {
          redDistrictSet.add(
            district.toLowerCase()
          )
        }
      }
    })

    /*
      ----------------------------------------------------------
      AVERAGE RISK
      ----------------------------------------------------------
    */

    const validScores =
      riskZones
        .map((item) =>
          Number(
            item.risk_score ??
              item.riskScore ??
              item.score
          )
        )
        .filter((score) =>
          Number.isFinite(score)
        )

    const averageRisk =
      validScores.length > 0
        ? validScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
          validScores.length
        : 0

    /*
      ----------------------------------------------------------
      FLOOD HAZARDS
      ----------------------------------------------------------
    */

    const floodHazards =
      hazards.filter(
        (hazard) =>
          String(
            hazard.hazard_type || ''
          )
            .trim()
            .toLowerCase() ===
          'flood'
      )

    return {
      districtsMonitored:
        districtCount,

      redZoneDistricts:
        redDistrictSet.size,

      averageRisk,

      floodHazards:
        floodHazards.length,

      riskLocations:
        riskZones.length,
    }
  }, [
    riskZones,
    hazards,
  ])

  /*
    ============================================================
    NAVIGATION
    ============================================================
  */

  const handleNavigate = (id) => {
    setActiveSection(id)
    setSidebarOpen(false)

    refs[id]?.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  /*
    ============================================================
    RENDER
    ============================================================
  */

  return (
    <div className="min-h-screen bg-canvas-50">

      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="lg:pl-64">

        <Header
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onNavigate={handleNavigate}
          onSelectDistrict={(district) => {
            setSelectedDistrict(
              district
            )

            handleNavigate(
              'hazard-map'
            )
          }}
        />

        <main
          id="dashboard"
          ref={refs.dashboard}
          className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >

          {/* ==================================================
              HERO
              ================================================== */}

          <section className="relative isolate overflow-hidden rounded-2xl bg-navy-950 shadow-card">

            <img
              src="/assam-hazards-overview.png"
              alt="Flooded Assam villages beside a river, with landslide and erosion risks visible along the hills"
              className="absolute inset-0 -z-20 h-full w-full object-cover"
            />

            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-900/90 to-navy-950/15" />

            <div className="relative grid min-h-[350px] items-end gap-7 px-6 py-7 sm:min-h-[390px] sm:px-10 sm:py-9 lg:grid-cols-[1fr_auto]">

              <div className="max-w-2xl">

                <p className="inline-flex rounded-full border border-white/70 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
                  Assam State Disaster Management Authority
                </p>

                <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.04] tracking-tight text-white sm:text-[45px]">
                  See the risk.
                  <br />
                  Plan before disaster strikes.
                </h1>

                <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/80 sm:text-[16px]">
                  SURAKSHIT brings flood,
                  landslide, and erosion risk
                  into one decision-ready
                  view—helping authorities
                  protect vulnerable communities
                  and plan safer relocation.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleNavigate(
                      'hazard-map'
                    )
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#FFD600] px-4 py-2.5 text-[13px] font-extrabold text-navy-950 shadow-lg shadow-black/25 transition-colors hover:bg-[#FFE45C]"
                >
                  Explore hazard map
                  <ArrowRight size={16} />
                </button>

              </div>

              {/* ==================================================
                  STATISTICS
                  ================================================== */}

              <div className="grid grid-cols-3 divide-x divide-white/15 rounded-xl border border-white/20 bg-navy-950/65 text-white backdrop-blur-sm lg:w-[390px]">

                {/* DISTRICTS */}

                <div className="px-3 py-3 text-center sm:px-4">

                  {dashboardLoading ? (
                    <Loader2
                      size={20}
                      className="mx-auto animate-spin text-gold-300"
                    />
                  ) : (
                    <p className="font-display text-[22px] font-extrabold text-gold-300">
                      {
                        dashboardStats.districtsMonitored
                      }
                    </p>
                  )}

                  <p className="mt-0.5 text-[10px] font-medium text-white/65">
                    Districts monitored
                  </p>

                </div>

                {/* RED ZONES */}

                <div className="px-3 py-3 text-center sm:px-4">

                  {dashboardLoading ? (
                    <Loader2
                      size={20}
                      className="mx-auto animate-spin text-red-300"
                    />
                  ) : (
                    <p className="font-display text-[22px] font-extrabold text-red-300">
                      {
                        dashboardStats.redZoneDistricts
                      }
                    </p>
                  )}

                  <p className="mt-0.5 text-[10px] font-medium text-white/65">
                    Red zones
                  </p>

                </div>

                {/* AVERAGE RISK */}

                <div className="px-3 py-3 text-center sm:px-4">

                  {dashboardLoading ? (
                    <Loader2
                      size={20}
                      className="mx-auto animate-spin text-teal-200"
                    />
                  ) : (
                    <p className="font-display text-[22px] font-extrabold text-teal-200">
                      {dashboardStats.averageRisk.toFixed(
                        1
                      )}
                    </p>
                  )}

                  <p className="mt-0.5 text-[10px] font-medium text-white/65">
                    Average risk
                  </p>

                </div>

              </div>

            </div>

            {/* ==================================================
                DATA STRIP
                ================================================== */}

            <div className="relative flex flex-wrap gap-2 border-t border-white/15 bg-navy-950/80 px-6 py-3 text-[11px] font-semibold text-white/80 sm:px-10">

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                <CloudRain
                  size={13}
                  className="text-cyan-300"
                />

                {dashboardLoading
                  ? 'Loading flood monitoring'
                  : `${dashboardStats.floodHazards.toLocaleString(
                      'en-IN'
                    )} flood hazards`}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                <Mountain
                  size={13}
                  className="text-gold-300"
                />

                Landslide alerts
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                <Waves
                  size={13}
                  className="text-teal-200"
                />

                Erosion planning
              </span>

            </div>

            {dashboardError && (
              <div className="border-t border-orange-300/20 bg-orange-950/60 px-6 py-2 text-[10px] text-orange-200 sm:px-10">
                Dashboard backend data unavailable:
                {' '}
                {dashboardError}
              </div>
            )}

          </section>

          {/* ==================================================
              HAZARD MAP
              ================================================== */}

          <div
            ref={refs['hazard-map']}
            className="scroll-mt-20"
          >
            <AssamMap
              selectedDistrict={
                selectedDistrict
              }
              onSelectDistrict={
                setSelectedDistrict
              }
            />
          </div>

          {/* ==================================================
              RISK ANALYSIS
              ================================================== */}

          <div
            ref={refs['risk-analysis']}
            className="scroll-mt-20"
          >
            <RiskAnalysis
              selectedDistrict={
                selectedDistrict
              }
              onSelectDistrict={
                setSelectedDistrict
              }
            />
          </div>

          {/* ==================================================
              RELOCATION SITE ASSESSMENT
              ================================================== */}

          <RelocationSiteAssessment />

          {/* ==================================================
              RELOCATION PRIORITY
              ================================================== */}

          <RelocationPriority />

          {/* ==================================================
              RELOCATION PLANNER
              ================================================== */}

          <div
            ref={
              refs[
                'relocation-planner'
              ]
            }
            className="scroll-mt-20"
          >
            <RelocationPlanner />
          </div>

          {/* ==================================================
              FOOTER
              ================================================== */}

          <footer className="pb-10 pt-4 text-center">

            <p className="text-[11.5px] text-ink-900/35">
              SURAKSHIT — Smart India Hackathon
              2026 prototype. Dashboard risk
              statistics and hazard counts are
              loaded from the connected backend.
            </p>

          </footer>

        </main>

      </div>

    </div>
  )
}
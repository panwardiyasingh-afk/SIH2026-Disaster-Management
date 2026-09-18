import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  UserRound,
  LayoutDashboard,
  MapPinned,
  Activity,
  Route,
  Loader2,
} from 'lucide-react'

import { getRiskZones } from '../services/api'
import { assamDistrictsGeoJSON } from "../data/mockData";

export default function Header({
  onMenuClick,
  onSelectDistrict,
  onNavigate,
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const [riskZones, setRiskZones] = useState([])
  const [loading, setLoading] = useState(true)

  /*
    ============================================================
    LOAD BACKEND RISK DATA
    ============================================================
  */

  useEffect(() => {
    let cancelled = false

    async function loadRiskZones() {
      try {
        setLoading(true)

        const result = await getRiskZones({
          limit: 200,
          offset: 0,
        })

        if (!cancelled) {
          const data = Array.isArray(result)
            ? result
            : Array.isArray(result?.data)
              ? result.data
              : []

          setRiskZones(data)
        }
      } catch (error) {
        console.error(
          'Failed to load district risk data:',
          error
        )

        if (!cancelled) {
          setRiskZones([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRiskZones()

    return () => {
      cancelled = true
    }
  }, [])

  /*
    ============================================================
    NORMALIZE DISTRICT NAME
    ============================================================
  */

  function normalizeDistrictName(name) {
    return String(name || '')
      .trim()
      .toLowerCase()
      .replace(/district$/i, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /*
    ============================================================
    BUILD RISK LOOKUP FROM BACKEND
    ============================================================
  */

  const riskByDistrict = useMemo(() => {
    const map = new Map()

    riskZones.forEach((item) => {
      const district = String(
        item.district || ''
      ).trim()

      if (!district) return

      const key =
        normalizeDistrictName(district)

      const score = Number(
        item.risk_score ??
          item.riskScore ??
          item.score ??
          0
      )

      const zone = String(
        item.risk_zone ??
          item.riskZone ??
          item.zone ??
          ''
      ).toUpperCase()

      const existing = map.get(key)

      if (!existing) {
        map.set(key, {
          highestRisk: score,
          riskZone: zone,
        })
      } else if (
        score > existing.highestRisk
      ) {
        existing.highestRisk = score
        existing.riskZone = zone
      }
    })

    return map
  }, [riskZones])

  /*
    ============================================================
    GET DISTRICT NAME FROM GEOJSON
    ============================================================
  */

  function getDistrictName(properties = {}) {
    return (
      properties.district ||
      properties.DISTRICT ||
      properties.District ||
      properties.dtname ||
      properties.DTNAME ||
      properties.district_name ||
      properties.DISTRICT_NAME ||
      properties.name ||
      properties.NAME ||
      ''
    )
  }

  /*
    ============================================================
    COMPLETE ASSAM DISTRICT LIST
    ============================================================
  */

  const districts = useMemo(() => {
    const districtMap = new Map()

    const features =
      assamDistrictsGeoJSON?.features || []

    features.forEach((feature) => {
      const district =
        String(
          getDistrictName(
            feature?.properties || {}
          )
        ).trim()

      if (!district) return

      const key =
        normalizeDistrictName(district)

      if (!districtMap.has(key)) {
        const backendRisk =
          riskByDistrict.get(key)

        districtMap.set(key, {
          district,
          highestRisk:
            backendRisk?.highestRisk ?? null,
          riskZone:
            backendRisk?.riskZone || '',
        })
      }
    })

    return Array.from(
      districtMap.values()
    ).sort((a, b) =>
      a.district.localeCompare(
        b.district
      )
    )
  }, [riskByDistrict])

  /*
    ============================================================
    SEARCH RESULTS
    ============================================================
  */

  const results = useMemo(() => {
    if (!query.trim()) return []

    const q = query
      .trim()
      .toLowerCase()

    return districts
      .filter((district) =>
        district.district
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 6)
  }, [
    query,
    districts,
  ])

  /*
    ============================================================
    RISK ZONE DISPLAY
    ============================================================
  */

  function getZoneInfo(
    zone,
    score
  ) {
    const normalized =
      String(zone || '')
        .toUpperCase()

    const numericScore =
      Number(score)

    if (
      normalized === 'RED' ||
      numericScore >= 80
    ) {
      return {
        label: 'Red Zone',
        color: '#C6362F',
      }
    }

    if (
      normalized === 'ORANGE' ||
      numericScore >= 60
    ) {
      return {
        label: 'Orange Zone',
        color: '#C97A2E',
      }
    }

    if (
      normalized === 'YELLOW' ||
      numericScore >= 40
    ) {
      return {
        label: 'Yellow Zone',
        color: '#B8932A',
      }
    }

    return {
      label: 'Safer Zone',
      color: '#2F8F5B',
    }
  }

  return (
    <header className="sticky top-0 z-[2000] isolate border-b border-line-200 bg-white">

      {/* =====================================================
          GOVERNMENT HEADER
          ===================================================== */}

      <div className="flex min-h-[72px] items-center px-3 sm:min-h-[88px] sm:px-4 lg:px-8">

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">

          <img
            src="/amblem.jpg.jpg"
            alt="National Emblem of India"
            className="h-12 w-10 shrink-0 object-contain sm:h-[74px] sm:w-[58px]"
          />

          <div className="min-w-0 leading-tight">

            <p className="truncate text-[13px] font-medium tracking-wide text-gray-800 sm:text-[16px] lg:text-[18px]">
              GOVERNMENT OF INDIA
            </p>

            <p className="truncate text-[10px] font-bold tracking-wide text-navy-600 sm:mt-1 sm:text-[13px] lg:text-[16px]">

              <span className="sm:hidden">
                IDMA
              </span>

              <span className="hidden sm:inline">
                INDIAN DISASTER MANAGEMENT AUTHORITY
              </span>

            </p>

          </div>

        </div>

        {/* =================================================
            RIGHT SIDE
            ================================================= */}

        <div className="ml-auto flex shrink-0 items-center gap-4 lg:gap-6">

          {/* ================= SEARCH ================= */}

          <div className="relative hidden w-[230px] sm:block lg:w-[300px]">

            <div
              className="
                flex
                h-[38px]
                items-center
                overflow-hidden
                rounded-none
                border
                border-line-300
                bg-white
                focus-within:border-navy-600
              "
            >

              <Search
                size={16}
                className="ml-3 shrink-0 text-gray-500"
              />

              <input
                value={query}
                onChange={(e) =>
                  setQuery(
                    e.target.value
                  )
                }
                onFocus={() =>
                  setFocused(true)
                }
                onBlur={() =>
                  setTimeout(
                    () =>
                      setFocused(false),
                    150
                  )
                }
                placeholder={
                  loading
                    ? 'Loading risk data...'
                    : 'Search district'
                }
                className="
                  h-full
                  flex-1
                  bg-transparent
                  px-2
                  text-[13px]
                  text-gray-800
                  outline-none
                  placeholder:text-gray-400
                "
              />

              <div className="flex h-full w-[42px] items-center justify-center bg-navy-600">

                {loading ? (
                  <Loader2
                    size={17}
                    className="animate-spin text-white"
                  />
                ) : (
                  <Search
                    size={18}
                    className="text-white"
                  />
                )}

              </div>

            </div>

            {/* =================================================
                SEARCH RESULTS
                ================================================= */}

            {focused &&
              query.trim() &&
              results.length > 0 && (

                <div
                  className="
                    absolute
                    left-0
                    right-0
                    top-[42px]
                    z-50
                    overflow-hidden
                    border
                    border-line-200
                    bg-white
                    shadow-cardHover
                  "
                >

                  {results.map((result) => {

                    const hasRiskData =
                      result.highestRisk !== null

                    const zone =
                      getZoneInfo(
                        result.riskZone,
                        result.highestRisk
                      )

                    return (
                      <button
                        key={
                          result.district
                        }
                        type="button"
                        onMouseDown={() => {

                          onSelectDistrict?.(
                            result.district
                          )

                          setQuery(
                            result.district
                          )

                          setFocused(
                            false
                          )
                        }}
                        className="
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3
                          border-b
                          border-line-100
                          px-3
                          py-2.5
                          text-left
                          transition-colors
                          last:border-b-0
                          hover:bg-navy-50
                        "
                      >

                        <div className="min-w-0">

                          <span className="block truncate text-[13px] text-ink-900">
                            {
                              result.district
                            }
                          </span>

                          {hasRiskData ? (
                            <span className="text-[9.5px] text-ink-900/40">
                              Highest risk:{' '}
                              {result.highestRisk.toFixed(
                                1
                              )}
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-ink-900/40">
                              Risk data not in current sample
                            </span>
                          )}

                        </div>

                        {hasRiskData ? (
                          <span
                            className="shrink-0 rounded-sm px-2 py-1 text-[10px] font-medium"
                            style={{
                              backgroundColor:
                                `${zone.color}1a`,
                              color:
                                zone.color,
                            }}
                          >
                            {zone.label}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-sm bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                            Monitored
                          </span>
                        )}

                      </button>
                    )
                  })}

                </div>
              )}

            {/* =================================================
                NO RESULTS
                ================================================= */}

            {focused &&
              query.trim() &&
              !loading &&
              results.length === 0 && (

                <div
                  className="
                    absolute
                    left-0
                    right-0
                    top-[42px]
                    z-50
                    border
                    border-line-200
                    bg-white
                    px-4
                    py-4
                    shadow-cardHover
                  "
                >

                  <p className="text-[12px] text-ink-900/50">
                    No matching district found.
                  </p>

                </div>
              )}

          </div>

          {/* =================================================
              OFFICER
              ================================================= */}

          <div className="hidden items-center gap-2 border-l border-line-200 pl-4 md:flex">

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-sm
                bg-navy-600
              "
            >
              <UserRound
                size={17}
                className="text-white"
              />
            </div>

            <div className="leading-tight">

              <p className="text-[12.5px] font-semibold text-ink-900">
                IDMA Officer
              </p>

              <p className="text-[10.5px] text-gray-500">
                Duty Desk
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          BLUE NAVIGATION
          ===================================================== */}

      <div className="h-[5px] bg-navy-600" />

      <nav
        className="flex min-h-[66px] items-center justify-end gap-6 bg-[#2F66B0] px-5 py-3 text-white sm:px-8 lg:px-12"
        aria-label="National disaster portal"
      >

        <div className="hidden items-center gap-6 text-[15px] font-semibold lg:flex">

          <button
            type="button"
            onClick={() =>
              onNavigate?.(
                'dashboard'
              )
            }
            className="flex items-center gap-1.5 text-[#F2FF00] transition-colors hover:text-white"
          >
            <LayoutDashboard size={16} />
            DASHBOARD
          </button>

          <button
            type="button"
            onClick={() =>
              onNavigate?.(
                'hazard-map'
              )
            }
            className="flex items-center gap-1.5 transition-colors hover:text-[#F2FF00]"
          >
            <MapPinned size={16} />
            HAZARD MAP
          </button>

          <button
            type="button"
            onClick={() =>
              onNavigate?.(
                'risk-analysis'
              )
            }
            className="flex items-center gap-1.5 transition-colors hover:text-[#F2FF00]"
          >
            <Activity size={16} />
            RISK ANALYSIS
          </button>

          <button
            type="button"
            onClick={() =>
              onNavigate?.(
                'relocation-planner'
              )
            }
            className="flex items-center gap-1.5 transition-colors hover:text-[#F2FF00]"
          >
            <Route size={16} />
            RELOCATION PLANNER
          </button>

        </div>

      </nav>

      <div
        className="hidden"
        role="status"
        aria-label="NDRF emergency helpline"
      />

    </header>
  )
}

import { useEffect, useState } from 'react'
import { ArrowRight, MapPinned, Route, ShieldCheck } from 'lucide-react'
import { getRiskZones } from '../services/api'
import assamDistrictsGeoJSON from '../data/assamDistrictsGeoJSON'

export default function HeroSection({ onExploreMap, onPlanRelocation }) {
  const [stats, setStats] = useState([
    { label: 'Districts monitored', value: '—' },
    { label: 'Red zones', value: '—' },
    { label: 'Average risk', value: '—' },
  ])

  useEffect(() => {
    let mounted = true

    async function loadHeroStats() {
      try {
        const result = await getRiskZones({
          limit: 200,
          offset: 0,
        })

        if (!mounted) return

        const riskZones = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : []

        // ---------------------------------------------------------
        // 1. Count Assam districts from the GeoJSON
        // ---------------------------------------------------------
        const districtNames = new Set()

        const districtFeatures =
          assamDistrictsGeoJSON?.features || []

        districtFeatures.forEach((feature) => {
          const properties = feature?.properties || {}

          const district =
            properties.district ||
            properties.DISTRICT ||
            properties.District ||
            properties.name ||
            properties.NAME

          if (district) {
            districtNames.add(
              String(district).trim().toLowerCase()
            )
          }
        })

        const districtCount = districtNames.size

        // ---------------------------------------------------------
        // 2. Find districts that have RED risk
        // ---------------------------------------------------------
        const redDistricts = new Set()

        riskZones.forEach((item) => {
          const riskScore = Number(
            item.risk_score ??
            item.riskScore ??
            item.score ??
            0
          )

          const riskZone = String(
            item.risk_zone ??
            item.riskZone ??
            item.zone ??
            ''
          ).toUpperCase()

          const district =
            item.district ||
            item.District

          if (
            district &&
            (riskScore >= 80 || riskZone === 'RED')
          ) {
            redDistricts.add(
              String(district).trim().toLowerCase()
            )
          }
        })

        // ---------------------------------------------------------
        // 3. Calculate average risk from backend risk_score
        // ---------------------------------------------------------
        const riskScores = riskZones
          .map((item) =>
            Number(
              item.risk_score ??
              item.riskScore ??
              item.score
            )
          )
          .filter(
            (score) => Number.isFinite(score)
          )

        const averageRisk =
          riskScores.length > 0
            ? (
                riskScores.reduce(
                  (sum, score) => sum + score,
                  0
                ) / riskScores.length
              ).toFixed(1)
            : '—'

        if (!mounted) return

        setStats([
          {
            label: 'Districts monitored',
            value: districtCount || '—',
          },
          {
            label: 'Red zones',
            value: redDistricts.size,
          },
          {
            label: 'Average risk',
            value:
              averageRisk !== '—'
                ? averageRisk
                : '—',
          },
        ])
      } catch (error) {
        console.error(
          'Failed to load hero statistics:',
          error
        )
      }
    }

    loadHeroStats()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="relative overflow-hidden rounded-2xl border border-navy-800 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-5 py-8 shadow-card sm:px-10 sm:py-12">
      <img
        src="/flood-response-hero.png"
        alt="Relief workers transporting supplies through floodwater in Assam"
        className="absolute inset-0 h-full w-full object-cover object-right opacity-40"
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900/90 to-navy-900/35"
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 opacity-[0.22] bg-grid bg-grid pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-2xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-gold-400/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-200">
          <ShieldCheck size={14} aria-hidden="true" />
          Preparedness dashboard · Assam
        </div>

        <h1 className="font-display font-extrabold text-white text-[29px] sm:text-[42px] leading-[1.08] tracking-tight">
          Proactive disaster risk planning for Assam
        </h1>

        <p className="mt-4 text-[14.5px] sm:text-[16px] leading-relaxed text-white/75 max-w-xl">
          AI-driven GIS decision support for identifying hazardous
          zones, assessing safer relocation sites, and prioritizing
          vulnerable habitations before disasters strike — not after.
        </p>

        <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <button
            onClick={onExploreMap}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-gold-200 bg-[#FFD600] text-[#05263D] text-[13.5px] font-extrabold shadow-lg shadow-black/25 hover:bg-[#FFE45C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors duration-150"
          >
            <MapPinned size={16} />
            Explore hazard map
          </button>

          <button
            onClick={onPlanRelocation}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-white/70 bg-white/20 text-white text-[13.5px] font-bold shadow-lg shadow-navy-950/20 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors duration-150"
          >
            <Route size={16} />
            Plan relocation
            <ArrowRight size={14} className="opacity-60" />
          </button>
        </div>

        <div className="mt-9 grid grid-cols-3 gap-2 sm:gap-4 max-w-md">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3 backdrop-blur-sm"
            >
              <p className="font-display font-bold text-white text-[22px] sm:text-[26px] leading-none">
                {s.value}
              </p>

              <p className="mt-1.5 text-[10px] sm:text-[11.5px] text-white/60 leading-snug">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
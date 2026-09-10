import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Compass,
  ShieldAlert,
  MapPinned,
  ListChecks,
} from 'lucide-react'

import {
  getRiskZones,
  getHazards,
  getRelocationSites,
} from '../services/api'

const TAG_ICON = {
  'Red Zone': ShieldAlert,
  'Safer Sites': MapPinned,
  Priority: ListChecks,
  Planning: Compass,
}

export default function DecisionSupport() {
  const [insights, setInsights] = useState([
    {
      id: 1,
      tag: 'Red Zone',
      title: 'Loading risk information...',
      body: 'Fetching current risk information from the backend.',
    },
    {
      id: 2,
      tag: 'Safer Sites',
      title: 'Loading relocation sites...',
      body: 'Fetching available relocation-site information.',
    },
    {
      id: 3,
      tag: 'Priority',
      title: 'Loading priority information...',
      body: 'Analyzing current risk scores.',
    },
    {
      id: 4,
      tag: 'Planning',
      title: 'Loading hazard information...',
      body: 'Fetching current hazard records.',
    },
  ])

  useEffect(() => {
    let mounted = true

    async function loadDecisionSupport() {
      try {
        const [
          riskResult,
          hazardResult,
          relocationResult,
        ] = await Promise.all([
          getRiskZones({
            limit: 200,
            offset: 0,
          }),
          getHazards(),
          getRelocationSites(),
        ])

        if (!mounted) return

        // Backend can return either:
        // [ ... ]
        // or
        // { data: [ ... ] }

        const riskZones = Array.isArray(riskResult)
          ? riskResult
          : Array.isArray(riskResult?.data)
            ? riskResult.data
            : []

        const hazards = Array.isArray(hazardResult)
          ? hazardResult
          : Array.isArray(hazardResult?.data)
            ? hazardResult.data
            : []

        const relocationSites = Array.isArray(
          relocationResult
        )
          ? relocationResult
          : Array.isArray(relocationResult?.data)
            ? relocationResult.data
            : []

        // ---------------------------------------------------------
        // Convert risk scores to numbers
        // ---------------------------------------------------------

        const scoredRiskZones = riskZones
          .map((item) => {
            const score = Number(
              item.risk_score ??
                item.riskScore ??
                item.score
            )

            return {
              ...item,
              score,
            }
          })
          .filter((item) =>
            Number.isFinite(item.score)
          )

        // ---------------------------------------------------------
        // Find red-risk districts
        // ---------------------------------------------------------

        const redDistricts = new Set()

        scoredRiskZones.forEach((item) => {
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
            (item.score >= 80 ||
              riskZone === 'RED')
          ) {
            redDistricts.add(
              String(district).trim()
            )
          }
        })

        // ---------------------------------------------------------
        // Find highest-risk habitation
        // ---------------------------------------------------------

        const highestRisk = [
          ...scoredRiskZones,
        ].sort(
          (a, b) => b.score - a.score
        )[0]

        const highestRiskName =
          highestRisk?.name ||
          highestRisk?.habitation_name ||
          'Highest-risk habitation'

        const highestRiskDistrict =
          highestRisk?.district ||
          highestRisk?.District ||
          'Assam'

        const highestRiskScore =
          highestRisk?.score ?? null

        // ---------------------------------------------------------
        // Calculate average risk
        // ---------------------------------------------------------

        const averageRisk =
          scoredRiskZones.length > 0
            ? (
                scoredRiskZones.reduce(
                  (sum, item) =>
                    sum + item.score,
                  0
                ) / scoredRiskZones.length
              ).toFixed(1)
            : null

        // ---------------------------------------------------------
        // Create backend-driven insights
        // ---------------------------------------------------------

        const backendInsights = [
          {
            id: 1,
            tag: 'Red Zone',

            title:
              redDistricts.size > 0
                ? `${redDistricts.size} district${
                    redDistricts.size === 1
                      ? ''
                      : 's'
                  } with red-level risk`
                : 'No red-level district detected',

            body:
              redDistricts.size > 0
                ? `Backend risk analysis identifies red-level risk in ${
                    redDistricts.size
                  } district${
                    redDistricts.size === 1
                      ? ''
                      : 's'
                  } within the current risk dataset.`
                : 'No district in the current backend risk dataset meets the red-zone threshold.',
          },

          {
            id: 2,
            tag: 'Safer Sites',

            title:
              relocationSites.length > 0
                ? `${relocationSites.length} relocation sites available`
                : 'No relocation sites loaded',

            body:
              relocationSites.length > 0
                ? 'Available relocation sites are provided by the backend for authority planning and site assessment.'
                : 'The backend did not return any relocation-site records.',
          },

          {
            id: 3,
            tag: 'Priority',

            title:
              highestRiskScore !== null
                ? `${highestRiskName} has the highest current risk`
                : 'Risk priority unavailable',

            body:
              highestRiskScore !== null
                ? `Highest current risk score is ${highestRiskScore.toFixed(
                    1
                  )} in ${highestRiskDistrict}. This location should receive attention during priority planning.`
                : 'No valid risk scores were returned by the backend.',
          },

          {
            id: 4,
            tag: 'Planning',

            title:
              hazards.length > 0
                ? `${hazards.length.toLocaleString()} hazard records loaded`
                : 'Hazard information unavailable',

            body:
              hazards.length > 0
                ? `The connected hazard dataset currently contains ${hazards.length.toLocaleString()} hazard records.${
                    averageRisk !== null
                      ? ` The current risk-zone sample has an average risk score of ${averageRisk}.`
                      : ''
                  }`
                : 'No hazard records were returned by the backend.',
          },
        ]

        setInsights(backendInsights)
      } catch (error) {
        console.error(
          'Failed to load decision support:',
          error
        )

        if (!mounted) return

        setInsights([
          {
            id: 1,
            tag: 'Red Zone',
            title: 'Risk data unavailable',
            body: 'Could not load current risk information from the backend.',
          },
          {
            id: 2,
            tag: 'Safer Sites',
            title: 'Relocation data unavailable',
            body: 'Could not load relocation-site information from the backend.',
          },
          {
            id: 3,
            tag: 'Priority',
            title: 'Priority data unavailable',
            body: 'Could not calculate current priority information.',
          },
          {
            id: 4,
            tag: 'Planning',
            title: 'Hazard data unavailable',
            body: 'Could not load current hazard information from the backend.',
          },
        ])
      }
    }

    loadDecisionSupport()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="rounded-2xl bg-navy-900 p-6 sm:p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-grid bg-grid opacity-[0.18] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-[22px] text-white tracking-tight">
            Decision Support
          </h2>

          <p className="mt-1.5 text-[13.5px] text-white/55 max-w-xl leading-relaxed">
            Actionable insight for State Disaster Management
            Authorities — supporting proactive planning before
            disasters cause repeated loss.
          </p>
        </div>

        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-teal-200">
          Analytical summary
        </span>
      </div>

      <div className="relative mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {insights.map((item, i) => {
          const Icon =
            TAG_ICON[item.tag] ?? Compass

          return (
            <motion.div
              key={item.id}
              initial={{
                opacity: 0,
                y: 10,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.06,
              }}
              className="rounded-xl bg-white/[0.05] border border-white/10 p-5 hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                  <Icon
                    size={14}
                    className="text-teal-300"
                  />
                </div>

                <span className="text-[10.5px] font-medium text-teal-300/80 px-2 py-0.5 rounded-full bg-teal-500/10">
                  {item.tag}
                </span>
              </div>

              <p className="mt-3.5 text-[14px] font-semibold text-white">
                {item.title}
              </p>

              <p className="mt-1.5 text-[12.5px] text-white/55 leading-relaxed">
                {item.body}
              </p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
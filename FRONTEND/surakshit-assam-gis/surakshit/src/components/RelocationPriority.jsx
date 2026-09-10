import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Clock3,
  CalendarClock,
  Loader2,
} from 'lucide-react'

import { getRiskZones } from '../services/api'

const COLUMN_CONFIG = [
  {
    id: 'immediate',
    title: 'Immediate',
    caption: 'Highest priority',
    icon: AlertTriangle,
    tone: '#C6362F',
  },
  {
    id: 'shortTerm',
    title: 'Short-term',
    caption: 'Medium priority',
    icon: Clock3,
    tone: '#C97A2E',
  },
  {
    id: 'mediumTerm',
    title: 'Medium-term',
    caption: 'Planned relocation',
    icon: CalendarClock,
    tone: '#0E7C86',
  },
]

/*
  ============================================================
  DETERMINE PRIORITY FROM BACKEND RISK SCORE
  ============================================================
*/

function getPriority(item) {
  const riskScore = Number(item.risk_score) || 0

  if (riskScore >= 80) {
    return 'immediate'
  }

  if (riskScore >= 60) {
    return 'shortTerm'
  }

  return 'mediumTerm'
}

/*
  ============================================================
  PRIORITY LABEL
  ============================================================
*/

function getPriorityLabel(priority) {
  switch (priority) {
    case 'immediate':
      return 'Immediate'

    case 'shortTerm':
      return 'Short-term'

    default:
      return 'Medium-term'
  }
}

/*
  ============================================================
  RISK ZONE LABEL
  ============================================================
*/

function getRiskZoneLabel(riskZone) {
  if (!riskZone) {
    return 'Unknown'
  }

  return String(riskZone)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/*
  ============================================================
  HABITATION CARD
  ============================================================
*/

function HabitationCard({
  item,
  tone,
  index,
}) {
  const riskScore =
    Number(item.risk_score) || 0

  const priority =
    getPriority(item)

  const habitationName =
    item.name ||
    item.habitation_name ||
    `Habitation ${item.habitation_id}`

  const district =
    item.district ||
    'Unknown'

  return (
    <motion.div
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
        duration: 0.45,
        delay: index * 0.05,
      }}
      whileHover={{
        y: -3,
        boxShadow: `0 10px 24px ${tone}26`,
      }}
      className="rounded-lg border bg-white p-4 transition-colors"
      style={{
        borderColor: `${tone}45`,
      }}
    >

      {/* ======================================================
          CARD HEADER
          ====================================================== */}

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="font-display text-[13px] font-bold tracking-tight text-ink-900">
            {habitationName}
          </p>

          <p className="mt-0.5 text-[11px] font-medium text-ink-700">
            {district} district
          </p>

        </div>

        <span
          className="shrink-0 rounded-full px-2 py-1 text-[9.5px] font-bold"
          style={{
            backgroundColor: `${tone}14`,
            color: tone,
          }}
        >
          {getPriorityLabel(priority)}
        </span>

      </div>

      {/* ======================================================
          RISK INFORMATION
          ====================================================== */}

      <div className="mt-3 grid grid-cols-2 gap-2">

        <div className="rounded-md bg-canvas-100/70 px-2.5 py-2">

          <p className="text-[9.5px] text-ink-900/40">
            Risk score
          </p>

          <p
            className="mt-0.5 text-[14px] font-bold"
            style={{
              color: tone,
            }}
          >
            {riskScore.toFixed(1)}
          </p>

        </div>

        <div className="rounded-md bg-canvas-100/70 px-2.5 py-2">

          <p className="text-[9.5px] text-ink-900/40">
            Risk zone
          </p>

          <p className="mt-0.5 text-[12px] font-bold text-ink-900">
            {getRiskZoneLabel(
              item.risk_zone
            )}
          </p>

        </div>

      </div>

      {/* ======================================================
          RISK LEVEL + PRIORITY
          ====================================================== */}

      <div className="mt-3 flex items-center justify-between gap-3 text-[10.5px] font-medium text-ink-600">

        <span>
          Risk level{' '}

          <b className="font-bold text-ink-900">
            {item.risk_level ||
              'Unknown'}
          </b>
        </span>

        <span>
          Priority{' '}

          <b
            className="font-bold"
            style={{
              color: tone,
            }}
          >
            {getPriorityLabel(
              priority
            )}
          </b>
        </span>

      </div>

    </motion.div>
  )
}

/*
  ============================================================
  MAIN COMPONENT
  ============================================================
*/

export default function RelocationPriority() {
  const [riskZones, setRiskZones] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  /*
    ==========================================================
    LOAD REAL BACKEND RISK DATA
    ==========================================================
  */

  useEffect(() => {
    let cancelled = false

    async function loadRiskZones() {
      try {
        setLoading(true)
        setError('')

        const result =
          await getRiskZones({
            limit: 50,
            offset: 0,
          })

        if (!cancelled) {

          /*
            Backend may return either:

            1. Direct array
               [ ... ]

            2. Wrapped response
               { data: [ ... ] }

            Handle both.
          */

          const data =
            Array.isArray(result)
              ? result
              : Array.isArray(result?.data)
                ? result.data
                : []

          setRiskZones(data)
        }

      } catch (err) {

        console.error(
          'Failed to load relocation priorities:',
          err
        )

        if (!cancelled) {

          setError(
            err.message ||
              'Failed to load relocation priorities'
          )

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
    GROUP HABITATIONS BY PRIORITY
    ============================================================
  */

  const groupedPriorities =
    useMemo(() => {

      const groups = {
        immediate: [],
        shortTerm: [],
        mediumTerm: [],
      }

      riskZones.forEach(
        (item) => {

          const priority =
            getPriority(item)

          groups[priority].push(item)

        }
      )

      /*
        Highest-risk locations first
      */

      Object.keys(groups).forEach(
        (key) => {

          groups[key].sort(
            (a, b) =>
              Number(
                b.risk_score || 0
              ) -
              Number(
                a.risk_score || 0
              )
          )

        }
      )

      return groups

    }, [riskZones])

  /*
    ============================================================
    COLUMN DATA
    ============================================================
  */

  const columns =
    COLUMN_CONFIG.map(
      (column) => ({
        ...column,
        data:
          groupedPriorities[
            column.id
          ],
      })
    )

  return (
    <section className="rounded-2xl border border-line-200 bg-white p-6 shadow-card sm:p-8">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <h2 className="font-display text-[22px] font-bold tracking-tight text-ink-900">
            Relocation Priority
          </h2>

          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink-900/55">
            Vulnerable habitations prioritized using their
            backend-calculated flood risk score, risk level and
            risk zone.
          </p>

        </div>

        <span className="rounded-full bg-hazard-orangeSoft px-2.5 py-1 text-[11px] font-bold text-hazard-orange shadow-sm">
          AI Relocation Prioritization
        </span>

      </div>

      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading && (

        <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-line-200 bg-canvas-100/40 py-10">

          <Loader2
            size={18}
            className="animate-spin text-ink-700"
          />

          <span className="text-[13px] font-medium text-ink-700">
            Loading relocation priorities...
          </span>

        </div>

      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {!loading && error && (

        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4">

          <div className="flex items-center gap-2">

            <AlertTriangle
              size={16}
              className="text-red-600"
            />

            <p className="text-[13px] font-semibold text-red-700">
              Unable to load relocation priorities
            </p>

          </div>

          <p className="mt-1 text-[11.5px] text-red-600">
            {error}
          </p>

        </div>

      )}

      {/* =====================================================
          DATA
          ===================================================== */}

      {!loading && !error && (

        <>

          {/* ==================================================
              SUMMARY COUNTS
              ================================================== */}

          <div className="mt-5 flex flex-wrap items-center gap-2">

            <span className="rounded-full bg-ink-900/5 px-2.5 py-1 text-[10.5px] font-medium text-ink-700">
              {riskZones.length} monitored habitations
            </span>

            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10.5px] font-medium text-red-700">
              {groupedPriorities.immediate.length} immediate
            </span>

            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10.5px] font-medium text-orange-700">
              {groupedPriorities.shortTerm.length} short-term
            </span>

            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10.5px] font-medium text-teal-700">
              {groupedPriorities.mediumTerm.length} medium-term
            </span>

          </div>

          {/* ==================================================
              PRIORITY COLUMNS
              ================================================== */}

          <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-3">

            {columns.map(
              (col) => (

                <div
                  key={col.id}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor:
                      `${col.tone}0c`,
                    borderColor:
                      `${col.tone}45`,
                  }}
                >

                  {/* COLUMN HEADER */}

                  <div className="flex items-center gap-2.5 px-1">

                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor:
                          `${col.tone}14`,
                      }}
                    >

                      <col.icon
                        size={14}
                        style={{
                          color: col.tone,
                        }}
                      />

                    </div>

                    <div>

                      <p className="text-[13px] font-semibold text-ink-900">
                        {col.title}
                      </p>

                      <p className="text-[10.5px] text-ink-900/45">
                        {col.caption}
                      </p>

                    </div>

                    <span className="ml-auto text-[11px] font-medium text-ink-900/40">
                      {col.data.length}
                    </span>

                  </div>

                  {/* HABITATION CARDS */}

                  <div className="mt-3.5 space-y-2.5">

                    {col.data.length === 0 ? (

                      <div className="rounded-lg border border-dashed border-ink-900/10 bg-white/60 px-4 py-6 text-center">

                        <p className="text-[11px] text-ink-900/40">
                          No habitations in this priority group.
                        </p>

                      </div>

                    ) : (

                      col.data.map(
                        (item, index) => (

                          <HabitationCard
                            key={
                              item.habitation_id ||
                              `${item.district}-${index}`
                            }
                            item={item}
                            tone={col.tone}
                            index={index}
                          />

                        )
                      )

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        </>

      )}

    </section>
  )
}
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  MapPin,
  AlertTriangle,
  Search,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

import {
  getRiskZones,
  getRecommendation,
} from '../services/api'

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: 'Identify vulnerable habitation',
    description:
      'Select a monitored habitation from the backend risk dataset to begin the relocation planning workflow.',
  },
  {
    id: 2,
    title: 'Assess flood risk',
    description:
      'Review the habitation risk score, risk level and risk zone calculated by the backend.',
  },
  {
    id: 3,
    title: 'Generate recommendation',
    description:
      'Request the backend relocation recommendation for the selected habitation.',
  },
  {
    id: 4,
    title: 'Authority decision support',
    description:
      'Use the available risk and recommendation information to support relocation planning decisions.',
  },
]

function formatKey(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function RecommendationValue({ value }) {
  if (value === null || value === undefined) {
    return (
      <span className="text-ink-900/40">
        Not specified
      </span>
    )
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return <span>{String(value)}</span>
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-1.5">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-md bg-canvas-50 px-3 py-2"
          >
            <RecommendationValue value={item} />
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    return (
      <div className="space-y-2">
        {Object.entries(value).map(([key, nestedValue]) => (
          <div
            key={key}
            className="rounded-md bg-canvas-50 px-3 py-2"
          >
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-900/40">
              {formatKey(key)}
            </p>

            <div className="mt-0.5 text-[11.5px] font-medium text-ink-900/75">
              <RecommendationValue value={nestedValue} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <span>{String(value)}</span>
}

export default function RelocationPlanner() {
  const [activeStep, setActiveStep] = useState(1)

  const [riskZones, setRiskZones] = useState([])
  const [selectedHabitationId, setSelectedHabitationId] =
    useState('')

  const [recommendation, setRecommendation] = useState(null)

  const [loadingHabitations, setLoadingHabitations] =
    useState(true)

  const [loadingRecommendation, setLoadingRecommendation] =
    useState(false)

  const [error, setError] = useState('')

  // ============================================================
  // LOAD REAL BACKEND RISK DATA
  // ============================================================

  useEffect(() => {
    let cancelled = false

    async function loadRiskZones() {
      try {
        setLoadingHabitations(true)
        setError('')

        const result = await getRiskZones({
          limit: 50,
          offset: 0,
        })

        if (cancelled) return

        // Backend may return either:
        // 1. an array
        // 2. { data: [...] }
        const data = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : []

        setRiskZones(data)

        if (data.length > 0) {
          setSelectedHabitationId(
            String(data[0].habitation_id)
          )
        }
      } catch (err) {
        console.error(
          'Failed to load habitations for planner:',
          err
        )

        if (!cancelled) {
          setError(
            err.message ||
              'Failed to load habitation risk data'
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingHabitations(false)
        }
      }
    }

    loadRiskZones()

    return () => {
      cancelled = true
    }
  }, [])

  // ============================================================
  // SELECTED HABITATION
  // ============================================================

  const selectedHabitation = useMemo(() => {
    return riskZones.find(
      (item) =>
        String(item.habitation_id) ===
        String(selectedHabitationId)
    )
  }, [riskZones, selectedHabitationId])

  // ============================================================
  // GET BACKEND RECOMMENDATION
  // ============================================================

  async function handleGetRecommendation() {
    if (!selectedHabitationId) {
      setError('Please select a habitation first.')
      return
    }

    try {
      setLoadingRecommendation(true)
      setError('')
      setRecommendation(null)

      const result = await getRecommendation(
        selectedHabitationId
      )

      setRecommendation(result)
      setActiveStep(3)
    } catch (err) {
      console.error(
        'Failed to get relocation recommendation:',
        err
      )

      setError(
        err.message ||
          'Failed to get relocation recommendation'
      )
    } finally {
      setLoadingRecommendation(false)
    }
  }

  // ============================================================
  // NEXT STEP
  // ============================================================

  function handleNext() {
    if (activeStep === 1 && !selectedHabitationId) {
      setError('Please select a habitation first.')
      return
    }

    if (
      activeStep === 3 &&
      !recommendation
    ) {
      setError(
        'Generate the recommendation before continuing.'
      )
      return
    }

    setError('')

    setActiveStep((step) =>
      Math.min(WORKFLOW_STEPS.length, step + 1)
    )
  }

  const currentStep =
    WORKFLOW_STEPS[activeStep - 1]

  return (
    <section className="rounded-2xl border border-navy-200 bg-gradient-to-br from-white via-canvas-50 to-navy-50 p-6 shadow-card sm:p-8">

      {/* ========================================================
          HEADER
          ======================================================== */}

      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-bold tracking-tight text-ink-900">
              Relocation Planner
            </h2>

            <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink-900/55">
              The decision-making workflow, from identifying a
              vulnerable habitation through to decision support
              for authorities.
            </p>
          </div>

          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-medium text-teal-700">
            Backend Decision Support
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">

        {/* ======================================================
            WORKFLOW STEPS
            ====================================================== */}

        <ol className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto lg:w-64 lg:flex-col lg:overflow-visible">

          {WORKFLOW_STEPS.map((step) => {
            const active = activeStep === step.id

            return (
              <li
                key={step.id}
                className="shrink-0"
              >
                <button
                  onClick={() => {
                    setError('')
                    setActiveStep(step.id)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors ${
                    active
                      ? 'border-gold-400 bg-navy-900 shadow-[0_0_20px_rgba(244,196,0,0.25)]'
                      : 'border-line-200 bg-white hover:border-navy-300 hover:bg-navy-50'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      active
                        ? 'bg-gold-400 text-navy-950 shadow-[0_0_12px_rgba(244,196,0,0.55)]'
                        : 'bg-canvas-100 text-ink-900/50'
                    }`}
                  >
                    {step.id}
                  </span>

                  <span
                    className={`whitespace-nowrap text-[12.5px] font-medium lg:whitespace-normal ${
                      active
                        ? 'text-white'
                        : 'text-ink-900/75'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* ======================================================
            MAIN CONTENT
            ====================================================== */}

        <div className="min-h-[300px] flex-1">

          <motion.div
            key={activeStep}
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex h-full flex-col rounded-xl border border-navy-200 bg-white p-6 shadow-card sm:p-8"
          >

            <p className="text-[11px] font-bold uppercase tracking-wide text-navy-700">
              Step {activeStep} of {WORKFLOW_STEPS.length}
            </p>

            <h3 className="mt-2 font-display text-[20px] font-bold text-ink-900">
              {currentStep.title}
            </h3>

            <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-ink-900/60">
              {currentStep.description}
            </p>

            {/* ==================================================
                STEP 1
                ================================================== */}

            {activeStep === 1 && (
              <div className="mt-6">

                <label className="mb-2 block text-[11px] font-semibold text-ink-900/55">
                  Select monitored habitation
                </label>

                {loadingHabitations ? (

                  <div className="flex items-center gap-2 rounded-lg border border-line-200 bg-canvas-50 px-4 py-3 text-[12px] text-ink-900/55">

                    <Loader2
                      size={15}
                      className="animate-spin"
                    />

                    Loading habitations...

                  </div>

                ) : riskZones.length === 0 ? (

                  <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-[12px] text-orange-700">
                    No monitored habitations were returned
                    by the backend.
                  </div>

                ) : (

                  <>
                    <div className="relative">

                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-900/35"
                      />

                      <select
                        value={selectedHabitationId}
                        onChange={(event) => {
                          setSelectedHabitationId(
                            event.target.value
                          )

                          setRecommendation(null)
                          setError('')
                        }}
                        className="h-11 w-full appearance-none rounded-lg border border-line-200 bg-white pl-9 pr-4 text-[12.5px] font-medium text-ink-900 outline-none transition-colors focus:border-navy-400"
                      >

                        {riskZones.map((item) => (

                          <option
                            key={item.habitation_id}
                            value={item.habitation_id}
                          >
                            {item.name ||
                              item.habitation_name ||
                              `Habitation ${item.habitation_id}`}
                            {' — '}
                            {item.district ||
                              'Unknown district'}
                            {' — Risk '}
                            {Number(
                              item.risk_score || 0
                            ).toFixed(1)}
                          </option>

                        ))}

                      </select>

                    </div>

                    {selectedHabitation && (

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

                        <div className="rounded-lg bg-canvas-50 p-3">
                          <p className="text-[9.5px] text-ink-900/40">
                            District
                          </p>

                          <p className="mt-1 text-[12px] font-bold text-ink-900">
                            {selectedHabitation.district ||
                              'Unknown'}
                          </p>
                        </div>

                        <div className="rounded-lg bg-canvas-50 p-3">
                          <p className="text-[9.5px] text-ink-900/40">
                            Risk score
                          </p>

                          <p className="mt-1 text-[12px] font-bold text-ink-900">
                            {Number(
                              selectedHabitation.risk_score || 0
                            ).toFixed(1)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-canvas-50 p-3">
                          <p className="text-[9.5px] text-ink-900/40">
                            Risk level
                          </p>

                          <p className="mt-1 text-[12px] font-bold text-ink-900">
                            {selectedHabitation.risk_level ||
                              'Unknown'}
                          </p>
                        </div>

                        <div className="rounded-lg bg-canvas-50 p-3">
                          <p className="text-[9.5px] text-ink-900/40">
                            Risk zone
                          </p>

                          <p className="mt-1 text-[12px] font-bold text-ink-900">
                            {selectedHabitation.risk_zone ||
                              'Unknown'}
                          </p>
                        </div>

                      </div>

                    )}

                  </>

                )}

              </div>
            )}

            {/* ==================================================
                STEP 2
                ================================================== */}

            {activeStep === 2 && selectedHabitation && (

              <div className="mt-6">

                <div className="rounded-xl border border-navy-100 bg-canvas-50 p-5">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900">
                      <MapPin
                        size={16}
                        className="text-gold-400"
                      />
                    </div>

                    <div>

                      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-900/40">
                        Selected habitation
                      </p>

                      <h4 className="mt-0.5 text-[15px] font-bold text-ink-900">
                        {selectedHabitation.name ||
                          selectedHabitation.habitation_name ||
                          `Habitation ${selectedHabitation.habitation_id}`}
                      </h4>

                      <p className="mt-0.5 text-[11px] text-ink-900/50">
                        {selectedHabitation.district ||
                          'Unknown district'}
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                    <div className="rounded-lg bg-white p-4">
                      <p className="text-[10px] text-ink-900/40">
                        Risk score
                      </p>

                      <p className="mt-1 text-[22px] font-bold text-navy-900">
                        {Number(
                          selectedHabitation.risk_score || 0
                        ).toFixed(1)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-4">
                      <p className="text-[10px] text-ink-900/40">
                        Risk level
                      </p>

                      <p className="mt-1 text-[16px] font-bold text-ink-900">
                        {selectedHabitation.risk_level ||
                          'Unknown'}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-4">
                      <p className="text-[10px] text-ink-900/40">
                        Risk zone
                      </p>

                      <p className="mt-1 text-[16px] font-bold text-ink-900">
                        {selectedHabitation.risk_zone ||
                          'Unknown'}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            )}

            {/* ==================================================
                STEP 3
                ================================================== */}

            {activeStep === 3 && (

              <div className="mt-6">

                {!recommendation ? (

                  <div className="rounded-xl border border-line-200 bg-canvas-50 p-5">

                    <div className="flex items-start gap-3">

                      <AlertTriangle
                        size={17}
                        className="mt-0.5 shrink-0 text-navy-700"
                      />

                      <div>

                        <p className="text-[12.5px] font-semibold text-ink-900">
                          Generate relocation recommendation
                        </p>

                        <p className="mt-1 text-[11px] leading-relaxed text-ink-900/50">
                          Request the recommendation from the
                          backend for the currently selected
                          habitation.
                        </p>

                      </div>

                    </div>

                    <button
                      onClick={handleGetRecommendation}
                      disabled={
                        loadingRecommendation ||
                        !selectedHabitationId
                      }
                      className="mt-5 flex h-10 items-center gap-2 rounded-lg bg-gold-400 px-4 text-[12px] font-bold text-navy-950 shadow-[0_0_14px_rgba(244,196,0,0.35)] transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      {loadingRecommendation ? (
                        <>
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                          Generating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          Generate recommendation
                        </>
                      )}

                    </button>

                  </div>

                ) : (

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">

                    <div className="flex items-center gap-2">

                      <CheckCircle2
                        size={17}
                        className="text-emerald-600"
                      />

                      <p className="text-[12.5px] font-bold text-emerald-800">
                        Backend recommendation received
                      </p>

                    </div>

                    <div className="mt-4 rounded-lg bg-white p-4">
                      <RecommendationValue
                        value={recommendation}
                      />
                    </div>

                  </div>

                )}

              </div>

            )}

            {/* ==================================================
                STEP 4
                ================================================== */}

            {activeStep === 4 && (

              <div className="mt-6 rounded-xl border border-navy-100 bg-canvas-50 p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900">

                    <CheckCircle2
                      size={16}
                      className="text-gold-400"
                    />

                  </div>

                  <div>

                    <p className="text-[12.5px] font-bold text-ink-900">
                      Authority decision support
                    </p>

                    <p className="mt-1 text-[11.5px] leading-relaxed text-ink-900/55">
                      The selected habitation's backend risk
                      information and recommendation can now
                      be reviewed as part of the relocation
                      planning process.
                    </p>

                  </div>

                </div>

                {selectedHabitation && (

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <div className="rounded-lg bg-white p-3">

                      <p className="text-[9.5px] text-ink-900/40">
                        Habitation
                      </p>

                      <p className="mt-1 text-[12px] font-bold text-ink-900">
                        {selectedHabitation.name ||
                          selectedHabitation.habitation_name ||
                          `Habitation ${selectedHabitation.habitation_id}`}
                      </p>

                    </div>

                    <div className="rounded-lg bg-white p-3">

                      <p className="text-[9.5px] text-ink-900/40">
                        Risk zone
                      </p>

                      <p className="mt-1 text-[12px] font-bold text-ink-900">
                        {selectedHabitation.risk_zone ||
                          'Unknown'}
                      </p>

                    </div>

                  </div>

                )}

              </div>

            )}

            {/* ==================================================
                ERROR
                ================================================== */}

            {error && (

              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11.5px] text-red-700">
                {error}
              </div>

            )}

            {/* ==================================================
                NAVIGATION
                ================================================== */}

            <div className="mt-auto flex items-center gap-2 pt-6">

              <button
                disabled={activeStep === 1}
                onClick={() =>
                  setActiveStep((step) =>
                    Math.max(1, step - 1)
                  )
                }
                className="h-9 rounded-lg border border-line-300 px-4 text-[12.5px] font-medium text-ink-900/70 transition-colors hover:bg-white disabled:opacity-35"
              >
                Back
              </button>

              {activeStep < WORKFLOW_STEPS.length && (

                <button
                  onClick={handleNext}
                  disabled={
                    loadingHabitations ||
                    (activeStep === 1 &&
                      !selectedHabitationId)
                  }
                  className="h-9 rounded-lg bg-gold-400 px-4 text-[12.5px] font-bold text-navy-950 shadow-[0_0_14px_rgba(244,196,0,0.35)] transition-colors hover:bg-gold-300 disabled:opacity-35"
                >
                  Next step
                </button>

              )}

              {activeStep === WORKFLOW_STEPS.length && (

                <button
                  onClick={() => {
                    setActiveStep(1)
                    setRecommendation(null)
                    setError('')
                  }}
                  className="h-9 rounded-lg bg-navy-900 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-navy-800"
                >
                  Start another assessment
                </button>

              )}

            </div>

          </motion.div>

        </div>

      </div>

    </section>
  )
}
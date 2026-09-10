import { useEffect, useState } from 'react'
import {
  Layers,
  CloudRain,
  Mountain,
  Waves,
  CloudLightning,
  Loader2,
} from 'lucide-react'

import { getHazards } from '../services/api'

const HAZARD_OPTIONS = [
  {
    id: 'flood',
    label: 'Flood',
    icon: CloudRain,
  },
  {
    id: 'landslide',
    label: 'Landslide',
    icon: Mountain,
  },
  {
    id: 'coastalErosion',
    label: 'Coastal Erosion',
    icon: Waves,
  },
  {
    id: 'cloudburst',
    label: 'Cloudburst',
    icon: CloudLightning,
  },
]

export default function HazardLayerControl({
  mode,
  activeHazard,
  onSetZones,
  onSetHazard,
}) {
  const [hazards, setHazards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadHazards() {
      try {
        setLoading(true)
        setError('')

        const result = await getHazards()

        if (!cancelled) {
          // Backend returns the hazard array directly
          const hazardData = Array.isArray(result)
            ? result
            : result.data || []

          setHazards(hazardData)
        }
      } catch (err) {
        console.error(
          'Failed to load hazard data:',
          err
        )

        if (!cancelled) {
          setHazards([])
          setError(
            err.message ||
              'Failed to load hazard data'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHazards()

    return () => {
      cancelled = true
    }
  }, [])

  /*
    ============================================================
    DETERMINE AVAILABLE HAZARD TYPES
    ============================================================
  */

  const availableHazardTypes = new Set(
    hazards.map((hazard) =>
      String(hazard.hazard_type || '')
        .trim()
        .toLowerCase()
    )
  )

  /*
    ============================================================
    CHECK HAZARD AVAILABILITY
    ============================================================
  */

  function isHazardAvailable(hazardId) {
    if (hazardId === 'flood') {
      return (
        availableHazardTypes.has('flood') ||
        availableHazardTypes.has('floods')
      )
    }

    if (hazardId === 'landslide') {
      return (
        availableHazardTypes.has('landslide') ||
        availableHazardTypes.has('landslides')
      )
    }

    if (hazardId === 'coastalErosion') {
      return (
        availableHazardTypes.has('coastal erosion') ||
        availableHazardTypes.has('coastalerosion')
      )
    }

    if (hazardId === 'cloudburst') {
      return (
        availableHazardTypes.has('cloudburst') ||
        availableHazardTypes.has('cloud bursts')
      )
    }

    return false
  }

  return (
    <div className="rounded-xl border border-white/10 bg-navy-950/70 px-3 py-3 backdrop-blur">

      {/* HEADER */}

      <div className="mb-2 flex items-center gap-1.5 px-1 text-white/40">
        <Layers size={12} />

        <p className="text-[10.5px] font-medium uppercase tracking-wide">
          Hazard layers
        </p>

        {loading && (
          <Loader2
            size={11}
            className="ml-auto animate-spin"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">

        {/* COMPOSITE RED ZONES */}

        <button
          type="button"
          onClick={onSetZones}
          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors ${
            mode === 'zones'
              ? 'bg-teal-500/20 text-teal-200'
              : 'text-white/60 hover:bg-white/[0.06]'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />

          Composite Red Zones
        </button>

        {/* HAZARD OPTIONS */}

        {HAZARD_OPTIONS.map((hazard) => {
          const Icon = hazard.icon

          const available =
            isHazardAvailable(hazard.id)

          const active =
            mode === 'hazard' &&
            activeHazard === hazard.id

          const disabled =
            !loading && !available

          return (
            <button
              key={hazard.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                onSetHazard?.(hazard.id)
              }
              title={
                disabled
                  ? `${hazard.label} data is not currently available in the backend`
                  : `Show ${hazard.label} hazard layer`
              }
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors ${
                active
                  ? 'bg-teal-500/20 text-teal-200'
                  : disabled
                  ? 'cursor-not-allowed text-white/25'
                  : 'text-white/60 hover:bg-white/[0.06]'
              }`}
            >
              <Icon size={13} />

              <span className="flex-1 text-left">
                {hazard.label}
              </span>

              {!loading && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    available
                      ? 'bg-emerald-400'
                      : 'bg-white/20'
                  }`}
                />
              )}
            </button>
          )
        })}

      </div>

      {/* BACKEND STATUS */}

      {!loading && !error && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <p className="px-2 text-[9.5px] text-white/35">
            {hazards.length > 0
              ? `${hazards.length} backend hazard records loaded`
              : 'No backend hazard records found'}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <p className="px-2 text-[9.5px] leading-relaxed text-orange-300/70">
            Hazard data unavailable
          </p>
        </div>
      )}

    </div>
  )
}
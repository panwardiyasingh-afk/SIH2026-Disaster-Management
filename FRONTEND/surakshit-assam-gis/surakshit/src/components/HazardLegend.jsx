const RISK_ZONES = [
  {
    id: 'red',
    label: 'Red Zone',
    color: '#C6362F',
  },
  {
    id: 'orange',
    label: 'Orange Zone',
    color: '#C97A2E',
  },
  {
    id: 'yellow',
    label: 'Yellow Zone',
    color: '#B8932A',
  },
  {
    id: 'green',
    label: 'Safer Zone',
    color: '#2F8F5B',
  },
]

const HAZARD_LABELS = {
  flood: 'Flood',
  landslide: 'Landslide',
  coastalErosion: 'Coastal Erosion',
  cloudburst: 'Cloudburst',
}

export default function HazardLegend({
  mode,
  activeHazard,
}) {
  const hazardLabel =
    HAZARD_LABELS[activeHazard] ||
    'Hazard'

  return (
    <div className="rounded-xl border border-white/10 bg-navy-950/70 px-4 py-3.5 text-white backdrop-blur">

      {/* =====================================================
          LEGEND TITLE
          ===================================================== */}

      <p className="mb-2.5 text-[10.5px] font-medium uppercase tracking-wide text-white/40">
        {mode === 'zones'
          ? 'Risk zones'
          : `${hazardLabel} intensity`}
      </p>

      {/* =====================================================
          RISK ZONES
          ===================================================== */}

      {mode === 'zones' ? (
        <ul className="space-y-1.5">

          {RISK_ZONES.map((zone) => (
            <li
              key={zone.id}
              className="flex items-center gap-2.5"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{
                  backgroundColor:
                    zone.color,
                }}
              />

              <span className="text-[12px] text-white/80">
                {zone.label}
              </span>
            </li>
          ))}

        </ul>
      ) : (
        /* ===================================================
           HAZARD INTENSITY
           =================================================== */

        <div>

          <div
            className="
              h-2
              w-40
              rounded-full
              bg-gradient-to-r
              from-sky-300/40
              via-yellow-400
              via-orange-500
              to-red-600
            "
          />

          <div className="mt-1.5 flex justify-between text-[10.5px] text-white/45">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
          </div>

        </div>
      )}

      {/* =====================================================
          FLOOD DATA NOTE
          ===================================================== */}

      {mode === 'hazard' &&
        activeHazard === 'flood' && (
          <div className="mt-2.5 border-t border-white/10 pt-2">

            <p className="text-[9.5px] leading-relaxed text-white/35">
              Flood locations are sourced from
              the backend hazard dataset.
            </p>

          </div>
        )}

    </div>
  )
}
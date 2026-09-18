import {
  LayoutGrid,
  MapPinned,
  Activity,
  Route,
  ShieldCheck,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
  },
  {
    id: 'hazard-map',
    label: 'Hazard Map',
    icon: MapPinned,
  },
  {
    id: 'risk-analysis',
    label: 'Risk Analysis',
    icon: Activity,
  },
  {
    id: 'relocation-planner',
    label: 'Relocation Planner',
    icon: Route,
  },
]

export default function Sidebar({
  activeSection,
  onNavigate,
  open,
  onClose,
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-[2050] bg-navy-950/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[2100] w-64
          bg-navy-900 text-white
          flex flex-col
          transition-transform duration-300 ease-out
          lg:z-40 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-6 pt-7 pb-6">

          <div className="flex items-center gap-2.5">

            {/* Logo */}
            <div className="h-8 w-8 rounded-md bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
              <ShieldCheck
                size={17}
                className="text-teal-300"
              />
            </div>

            {/* Brand name */}
            <div className="leading-tight">
              <p className="font-display font-bold text-[15px] tracking-tight">
                SURAKSHIT
              </p>

              <p className="text-[10.5px] text-white/40">
                Assam GIS Platform
              </p>
            </div>

          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>

        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-3">
          <div className="space-y-1">
            {NAV_ITEMS.map(
            ({ id, label, icon: Icon }) => {

              const active = activeSection === id

              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`
                    w-full
                    flex items-center gap-3
                    px-3.5 py-2.5
                    rounded-lg
                    text-[13.5px]
                    font-medium
                    transition-colors duration-150

                    ${
                      active
                        ? 'bg-teal-500/15 text-teal-200 border border-teal-400/30'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/[0.04] border border-transparent'
                    }
                  `}
                >

                  <Icon
                    size={16}
                    strokeWidth={2}
                    className={
                      active
                        ? 'text-teal-300'
                        : 'text-white/45'
                    }
                  />

                  {label}

                </button>
              )
            }
            )}
          </div>

          <div className="relative mt-auto overflow-hidden rounded-xl border border-white/10 shadow-lg">
            <img
              src="/sidebar-disaster-management.png"
              alt="Disaster response team rescuing residents during flooding in Assam"
              className="h-40 w-full object-cover object-center opacity-90"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 via-navy-950/75 to-transparent px-3 pb-3 pt-9">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold-300">
                Preparedness in action
              </p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-white/75">
                Map risk. Coordinate response. Protect communities.
              </p>
            </div>
          </div>

        </nav>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10">

          <p className="text-[11px] leading-relaxed text-white/35">
            Smart disaster risk mapping and proactive relocation
            planning for Assam. Demo build — SIH 2026.
          </p>

        </div>

      </aside>
    </>
  )
}

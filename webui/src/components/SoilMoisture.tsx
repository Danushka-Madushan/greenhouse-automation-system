import { Sprout, AlertTriangle, CheckCircle, Droplets } from 'lucide-react'

interface SoilMoistureProps {
  sector1: number
  sector2: number
  sector3: number
  sector4: number
  minMoisture: number
  maxMoisture: number
}

const getSectorStyle = (v: number, min: number, max: number) => {
  if (v < min) return { bg: 'bg-[--color-md-error-container]', text: 'text-[--color-md-on-error-container]', border: 'border-[--color-md-error]', dot: 'bg-[--color-md-error]' }
  if (v > max) return { bg: 'bg-[--color-md-secondary-container]', text: 'text-[--color-md-on-secondary-container]', border: 'border-[--color-md-secondary]', dot: 'bg-[--color-md-secondary]' }
  return { bg: 'bg-[--color-md-primary-container]', text: 'text-[--color-md-on-primary-container]', border: 'border-[--color-md-outline-variant]', dot: 'bg-[--color-md-primary]' }
}

const getSectorFill = (v: number, min: number, max: number) => {
  if (v < min) return 'var(--color-md-error)'
  if (v > max) return 'var(--color-md-secondary)'
  return 'var(--color-md-primary)'
}

interface MiniBarProps {
  value: number
  label: string
  min: number
  max: number
}

const MiniBar = ({ value, label, min, max }: MiniBarProps) => {
  const { bg, text, border, dot } = getSectorStyle(value, min, max)
  return (
    <div className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border ${bg} ${border}`}>
      <div className="flex items-center gap-1 w-full justify-center">
        <div className={`size-1.5 rounded-full shrink-0 ${dot}`} />
        <span className={`text-[10px] font-semibold truncate ${text}`}>{label}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/40">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: getSectorFill(value, min, max) }}
        />
      </div>
      <span className={`text-sm font-bold ${text}`}>{value}%</span>
    </div>
  )
}

export const SoilMoisture = ({ sector1, sector2, sector3, sector4, minMoisture, maxMoisture }: SoilMoistureProps) => {
  const average = Math.round((sector1 + sector2 + sector3 + sector4) / 4)
  const pct = average / 100

  const isDry = average < minMoisture
  const isWet = average > maxMoisture
  const label = isDry ? 'Irrigation Needed' : isWet ? 'Over-saturated' : 'Optimal Moisture'
  const chipStyle = isDry
    ? 'bg-[--color-md-error-container] text-[--color-md-on-error-container]'
    : isWet
      ? 'bg-[--color-md-secondary-container] text-[--color-md-on-secondary-container]'
      : 'bg-[--color-md-primary-container] text-[--color-md-on-primary-container]'
  const Icon = isDry || isWet ? AlertTriangle : CheckCircle

  return (
    <div className="rounded-[28px] bg-[--color-md-surface-container-low] md-elevation-1 flex flex-col overflow-hidden transition-shadow duration-300 hover:md-elevation-2">

      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-widest uppercase text-[--color-md-on-surface-variant] mb-1">
            Soil Moisture
          </p>
          <h2 className="text-[20px] font-medium text-[--color-md-on-surface] leading-tight">
            {average}% <span className="text-sm font-normal text-[--color-md-on-surface-variant]">avg</span>
          </h2>
          <p className="text-xs text-[--color-md-on-surface-variant] mt-0.5">4-sector rootzone</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[--color-md-primary-container] flex items-center justify-center shrink-0">
          <Sprout className="size-5 text-[--color-md-on-primary-container]" />
        </div>
      </div>

      {/* Half-circle gauge ── fluid via viewBox */}
      <div className="flex justify-center px-4 pt-1 pb-0">
        <svg viewBox="0 0 120 64" style={{ width: '100%', maxWidth: '148px', height: 'auto' }}>
          {(() => {
            const r = 44, cx = 60, cy = 56

            const txLeft = cx - r
            const tyLeft = cy
            const txRight = cx + r
            const tyRight = cy

            const fillDeg = 180 - pct * 180
            const fillRad = (fillDeg * Math.PI) / 180
            const fxEnd = cx + r * Math.cos(fillRad)
            const fyEnd = cy - r * Math.sin(fillRad)
            const largeArc = 0

            const needleR = r - 10
            const nxEnd = cx + needleR * Math.cos(fillRad)
            const nyEnd = cy - needleR * Math.sin(fillRad)
            const nxBase1 = cx + 2 * Math.cos(fillRad + Math.PI / 2)
            const nyBase1 = cy - 2 * Math.sin(fillRad + Math.PI / 2)
            const nxBase2 = cx + 2 * Math.cos(fillRad - Math.PI / 2)
            const nyBase2 = cy - 2 * Math.sin(fillRad - Math.PI / 2)
            const fill = getSectorFill(average, minMoisture, maxMoisture)

            return (
              <>
                {/* Track arc */}
                <path
                  d={`M ${txLeft} ${tyLeft} A ${r} ${r} 0 0 1 ${txRight} ${tyRight}`}
                  fill="none"
                  stroke="var(--color-md-surface-container-highest)"
                  strokeWidth="9" strokeLinecap="round"
                />
                {/* Fill arc */}
                {pct > 0 && (
                  <path
                    d={`M ${txLeft} ${tyLeft} A ${r} ${r} 0 ${largeArc} 1 ${fxEnd} ${fyEnd}`}
                    fill="none" stroke={fill}
                    strokeWidth="9" strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                )}
                {/* Needle */}
                <polygon
                  points={`${nxEnd},${nyEnd} ${nxBase1},${nyBase1} ${nxBase2},${nyBase2}`}
                  fill={fill} className="transition-all duration-700 ease-out"
                />
                {/* Centre pivot */}
                <circle cx={cx} cy={cy} r="4" fill="white" stroke={fill} strokeWidth="1.5" />
              </>
            )
          })()}
        </svg>
      </div>

      {/* 2×2 sector grid */}
      <div className="px-4 pb-2 grid grid-cols-2 gap-1.5">
        <MiniBar value={sector1} label="NW Sec 1" min={minMoisture} max={maxMoisture} />
        <MiniBar value={sector2} label="NE Sec 2" min={minMoisture} max={maxMoisture} />
        <MiniBar value={sector3} label="SW Sec 3" min={minMoisture} max={maxMoisture} />
        <MiniBar value={sector4} label="SE Sec 4" min={minMoisture} max={maxMoisture} />
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 mt-auto">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${chipStyle}`}>
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-[--color-md-outline-variant] flex justify-between text-xs text-[--color-md-on-surface-variant]">
          <span>Active Valves</span>
          <span className="font-medium text-[--color-md-on-surface] flex items-center gap-1">
            <Droplets className="size-3" />
            {isDry ? '4 Open' : 'All Closed'}
          </span>
        </div>
      </div>
    </div>
  )
}

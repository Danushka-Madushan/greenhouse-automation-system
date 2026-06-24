import { Sprout, AlertTriangle, CheckCircle, Droplets } from 'lucide-react'

interface SoilMoistureProps {
  sector1: number
  sector2: number
  sector3: number
  sector4: number
}

const getSectorStyle = (v: number) => {
  if (v < 30) return { bg: 'bg-[#F9DEDC]', text: 'text-[#8C1D18]', border: 'border-[#F2B8B5]', dot: 'bg-[#B3261E]' }
  if (v > 80) return { bg: 'bg-[#D3E3FD]', text: 'text-[#041E49]', border: 'border-[#A8C7FA]', dot: 'bg-[#0B57D0]' }
  return { bg: 'bg-[--color-md-primary-container]', text: 'text-[--color-md-on-primary-container]', border: 'border-[--color-md-outline-variant]', dot: 'bg-[--color-md-primary]' }
}

const getSectorFill = (v: number) => {
  if (v < 30) return 'hsl(3,60%,55%)'
  if (v > 80) return 'hsl(213,80%,45%)'
  return 'hsl(155,52%,42%)'
}

const MiniBar = ({ value, label }: { value: number; label: string }) => {
  const { bg, text, border, dot } = getSectorStyle(value)
  return (
    <div className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border ${bg} ${border}`}>
      <div className="flex items-center gap-1">
        <div className={`size-1.5 rounded-full ${dot}`} />
        <span className={`text-[10px] font-semibold ${text}`}>{label}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/40">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: getSectorFill(value) }}
        />
      </div>
      <span className={`text-sm font-bold ${text}`}>{value}%</span>
    </div>
  )
}

export const SoilMoisture = ({ sector1, sector2, sector3, sector4 }: SoilMoistureProps) => {
  const average = Math.round((sector1 + sector2 + sector3 + sector4) / 4)
  const pct = average / 100

  const isDry = average < 30
  const isWet = average > 80
  const label = isDry ? 'Irrigation Needed' : isWet ? 'Over-saturated' : 'Optimal Moisture'
  const chipStyle = isDry
    ? 'bg-[#F9DEDC] text-[#8C1D18]'
    : isWet
    ? 'bg-[#D3E3FD] text-[#041E49]'
    : 'bg-[--color-md-primary-container] text-[--color-md-on-primary-container]'
  const Icon = isDry || isWet ? AlertTriangle : CheckCircle

  return (
    <div className="rounded-[28px] bg-[--color-md-surface-container-low] md-elevation-1 flex flex-col overflow-hidden transition-shadow duration-300 hover:md-elevation-2">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[--color-md-on-surface-variant] mb-1">
            Soil Moisture
          </p>
          <h2 className="text-[22px] font-medium text-[--color-md-on-surface] leading-tight">
            {average}% <span className="text-sm font-normal text-[--color-md-on-surface-variant]">avg</span>
          </h2>
          <p className="text-sm text-[--color-md-on-surface-variant] mt-0.5">4-sector rootzone</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[--color-md-primary-container] flex items-center justify-center shrink-0">
          <Sprout className="size-6 text-[--color-md-on-primary-container]" />
        </div>
      </div>

      {/* Half-circle average gauge */}
      <div className="flex justify-center pt-1 pb-0">
        <svg viewBox="0 0 120 64" className="w-36 h-16">
          {(() => {
            const r = 44, cx = 60, cy = 56

            const txLeft  = cx - r   // left end of track (180°)
            const tyLeft  = cy
            const txRight = cx + r   // right end of track (0°)
            const tyRight = cy

            // Fill end: sweeps from 180° toward 0° as pct goes 0→1
            const fillDeg = 180 - pct * 180
            const fillRad = (fillDeg * Math.PI) / 180
            const fxEnd = cx + r * Math.cos(fillRad)
            const fyEnd = cy - r * Math.sin(fillRad)  // SVG Y is flipped

            // The filled arc spans pct*180° — always ≤ 180°, so largeArc is always 0
            const largeArc = 0

            const needleR  = r - 10
            const nxEnd    = cx + needleR * Math.cos(fillRad)
            const nyEnd    = cy - needleR * Math.sin(fillRad)
            const nxBase1  = cx + 2 * Math.cos(fillRad + Math.PI / 2)
            const nyBase1  = cy - 2 * Math.sin(fillRad + Math.PI / 2)
            const nxBase2  = cx + 2 * Math.cos(fillRad - Math.PI / 2)
            const nyBase2  = cy - 2 * Math.sin(fillRad - Math.PI / 2)

            return (
              <>
                {/* Track arc */}
                <path
                  d={`M ${txLeft} ${tyLeft} A ${r} ${r} 0 0 1 ${txRight} ${tyRight}`}
                  fill="none"
                  stroke="var(--color-md-surface-container-highest)"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                {/* Fill arc */}
                {pct > 0 && (
                  <path
                    d={`M ${txLeft} ${tyLeft} A ${r} ${r} 0 ${largeArc} 1 ${fxEnd} ${fyEnd}`}
                    fill="none"
                    stroke={getSectorFill(average)}
                    strokeWidth="9"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                )}
                {/* Needle */}
                <polygon
                  points={`${nxEnd},${nyEnd} ${nxBase1},${nyBase1} ${nxBase2},${nyBase2}`}
                  fill={getSectorFill(average)}
                  className="transition-all duration-700 ease-out"
                />
                {/* Centre pivot */}
                <circle cx={cx} cy={cy} r="4" fill="white" stroke={getSectorFill(average)} strokeWidth="1.5" />
              </>
            )
          })()}
        </svg>
      </div>

      {/* 2×2 sector matrix */}
      <div className="px-5 pb-2 grid grid-cols-2 gap-2">
        <MiniBar value={sector1} label="NW Sec 1" />
        <MiniBar value={sector2} label="NE Sec 2" />
        <MiniBar value={sector3} label="SW Sec 3" />
        <MiniBar value={sector4} label="SE Sec 4" />
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 mt-auto">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${chipStyle}`}>
          <Icon className="size-3.5" />
          {label}
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

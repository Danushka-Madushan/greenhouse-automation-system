import { ProgressBar, Label } from '@heroui/react'
import { Sun, Zap, TrendingUp } from 'lucide-react'

interface PhotosynthesisProps {
  lightLevel: number // 0–2000 µmol/m²/s
}

const getMetrics = (par: number) => {
  if (par < 200)  return { efficiency: Math.round((par / 200) * 35), label: 'Insufficient Light', chip: 'neutral' as const }
  if (par < 600)  return { efficiency: Math.round(35 + ((par - 200) / 400) * 40), label: 'Active — Moderate', chip: 'green' as const }
  if (par <= 1200) return { efficiency: Math.min(98, Math.round(75 + ((par - 600) / 600) * 23)), label: 'Peak Rate — Optimal', chip: 'green' as const }
  return { efficiency: Math.max(20, Math.round(98 - ((par - 1200) / 800) * 60)), label: 'Photo-stress Risk', chip: 'amber' as const }
}

const chipStyles = {
  neutral: 'bg-[--color-md-surface-container-high] text-[--color-md-on-surface-variant]',
  green:   'bg-[--color-md-primary-container] text-[--color-md-on-primary-container]',
  amber:   'bg-[#FFF3CD] text-[#7A5200]',
}

// Radial "sun" PAR indicator
const SunDial = ({ par, max = 2000 }: { par: number, max: number }) => {
  const pct   = Math.min(par / max, 1)
  const rays   = 12
  const hue    = Math.round(50 - pct * 30) // golden-yellow → orange
  const rInner = 18, rOuter = 28

  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20">
      {/* Ray spokes */}
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i / rays) * 360
        const rad   = (angle * Math.PI) / 180
        const active = i < Math.round(pct * rays)
        const x1 = 40 + rInner * Math.cos(rad)
        const y1 = 40 + rInner * Math.sin(rad)
        const x2 = 40 + (active ? rOuter : rInner + 3) * Math.cos(rad)
        const y2 = 40 + (active ? rOuter : rInner + 3) * Math.sin(rad)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={active ? `hsl(${hue}, 90%, 52%)` : 'var(--color-md-outline-variant)'}
            strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round"
            className="transition-all duration-500"
          />
        )
      })}
      {/* Core circle */}
      <circle cx="40" cy="40" r="14"
        fill={`hsl(${hue}, 85%, 58%)`} fillOpacity={0.15 + pct * 0.75}
        className="transition-all duration-500"
      />
      <circle cx="40" cy="40" r="10"
        fill={`hsl(${hue}, 90%, 50%)`} fillOpacity={0.25 + pct * 0.65}
        className="transition-all duration-500"
      />
    </svg>
  )
}

export const Photosynthesis = ({ lightLevel }: PhotosynthesisProps) => {
  const { efficiency, label, chip } = getMetrics(lightLevel)
  const dli = ((lightLevel * 0.0864 * 12) / 100).toFixed(1)

  return (
    <div className="rounded-[28px] bg-[--color-md-surface-container-low] md-elevation-1 flex flex-col overflow-hidden transition-shadow duration-300 hover:md-elevation-2">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[--color-md-on-surface-variant] mb-1">
            Photosynthesis
          </p>
          <h2 className="text-[22px] font-medium text-[--color-md-on-surface] leading-tight">
            {lightLevel} <span className="text-sm font-normal text-[--color-md-on-surface-variant]">µmol/m²/s</span>
          </h2>
          <p className="text-sm text-[--color-md-on-surface-variant] mt-0.5">Active PAR reading</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[--color-md-tertiary-container] flex items-center justify-center shrink-0">
          <Sun className="size-6 text-[--color-md-on-tertiary-container]" />
        </div>
      </div>

      {/* Sun dial centred */}
      <div className="flex justify-center py-2">
        <SunDial par={lightLevel} max={2000} />
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-2">
        <ProgressBar
          aria-label="Photosynthetic efficiency"
          value={efficiency}
          color={chip === 'amber' ? 'warning' : chip === 'neutral' ? 'default' : 'success'}
        >
          <div className="flex justify-between text-[11px] text-[--color-md-on-surface-variant] mb-1.5">
            <Label className="flex items-center gap-1">
              <Zap className="size-3" /> Efficiency
            </Label>
            <ProgressBar.Output />
          </div>
          <ProgressBar.Track className="bg-[--color-md-surface-container-highest] rounded-full h-2">
            <ProgressBar.Fill className="rounded-full transition-all duration-700" />
          </ProgressBar.Track>
        </ProgressBar>
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 mt-auto">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${chipStyles[chip]}`}>
          <TrendingUp className="size-3.5" />
          {label}
        </div>
        <div className="mt-3 pt-3 border-t border-[--color-md-outline-variant] flex justify-between text-xs text-[--color-md-on-surface-variant]">
          <span>Daily Light Integral</span>
          <span className="font-medium text-[--color-md-on-surface]">{dli} mol/m²/d</span>
        </div>
      </div>
    </div>
  )
}

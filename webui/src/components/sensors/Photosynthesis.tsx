import { Sun, Zap, TrendingUp } from 'lucide-react'

interface PhotosynthesisProps {
  lightLevel: number // 0–2000 µmol/m²/s
}

const getMetrics = (par: number) => {
  if (par < 200) return { efficiency: Math.round((par / 200) * 35), label: 'Insufficient Light', chip: 'neutral' as const }
  if (par < 600) return { efficiency: Math.round(35 + ((par - 200) / 400) * 40), label: 'Active - Moderate', chip: 'green' as const }
  if (par <= 1200) return { efficiency: Math.min(98, Math.round(75 + ((par - 600) / 600) * 23)), label: 'Peak Rate - Optimal', chip: 'green' as const }
  return { efficiency: Math.max(20, Math.round(98 - ((par - 1200) / 800) * 60)), label: 'Photo-stress Risk', chip: 'amber' as const }
}

const chipStyles = {
  neutral: 'bg-[--color-md-surface-container-high] text-[--color-md-on-surface-variant]',
  green: 'bg-[--color-md-primary-container] text-[--color-md-on-primary-container]',
  amber: 'bg-[--color-md-tertiary-container] text-[--color-md-on-tertiary-container]',
}

const ringColor = {
  neutral: 'var(--color-md-outline)',
  green: 'var(--color-md-primary)',
  amber: 'var(--color-md-tertiary)',
}

// Radial "sun" PAR indicator — fluid via viewBox + width:100%
const SunDial = ({ par, max = 2000, efficiency, chip }: { par: number; max: number; efficiency: number; chip: 'neutral' | 'green' | 'amber' }) => {
  const pct = Math.min(par / max, 1)
  const rays = 12
  const hue = Math.round(50 - pct * 30) // golden-yellow → warm-orange
  const rInner = 18, rOuter = 28

  // Radial efficiency ring outside the rays
  const ringR = 35
  const circumference = 2 * Math.PI * ringR
  const dashOffset = circumference * (1 - efficiency / 100)

  return (
    <svg viewBox="0 0 80 80" style={{ width: '100%', maxWidth: 'min(55%, 200px)', height: 'auto' }}>
      {/* Track ring */}
      <circle
        cx="40" cy="40" r={ringR}
        fill="none"
        stroke="var(--color-md-surface-container-highest)"
        strokeWidth="3"
      />
      {/* Efficiency progress ring */}
      <circle
        cx="40" cy="40" r={ringR}
        fill="none"
        stroke={ringColor[chip]}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 40 40)"
        className="transition-all duration-700"
      />

      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i / rays) * 360
        const rad = (angle * Math.PI) / 180
        const active = i < Math.round(pct * rays)
        const x1 = 40 + rInner * Math.cos(rad)
        const y1 = 40 + rInner * Math.sin(rad)
        const x2 = 40 + (active ? rOuter : rInner + 3) * Math.cos(rad)
        const y2 = 40 + (active ? rOuter : rInner + 3) * Math.sin(rad)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={active ? `hsl(${hue}, 88%, 50%)` : 'var(--color-md-outline-variant)'}
            strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round"
            className="transition-all duration-500"
          />
        )
      })}
      {/* Core circles */}
      <circle cx="40" cy="40" r="14"
        fill={`hsl(${hue}, 85%, 58%)`} fillOpacity={0.15 + pct * 0.70}
        className="transition-all duration-500"
      />
      <circle cx="40" cy="40" r="10"
        fill={`hsl(${hue}, 90%, 50%)`} fillOpacity={0.25 + pct * 0.60}
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
      <div className="px-5 pt-5 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-widest uppercase text-[--color-md-on-surface-variant] mb-1">
            Photosynthesis
          </p>
          <h2 className="text-[20px] font-medium text-[--color-md-on-surface] leading-tight">
            {lightLevel} <span className="text-xs font-normal text-[--color-md-on-surface-variant]">µmol/m²/s</span>
          </h2>
          <p className="text-xs text-[--color-md-on-surface-variant] mt-0.5">Active PAR reading</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[--color-md-tertiary-container] flex items-center justify-center shrink-0">
          <Sun className="size-5 text-[--color-md-on-tertiary-container]" />
        </div>
      </div>

      {/* Sun dial — fluid, capped at 128px, with radial efficiency ring */}
      <div className="flex justify-center px-6 py-2">
        <SunDial par={lightLevel} max={2000} efficiency={efficiency} chip={chip} />
      </div>

      {/* Efficiency percentage — replaces linear progress bar */}
      <div className="px-5 pb-3 flex flex-col items-center gap-0.5">
        <div className="flex items-baseline gap-1">
          <span className="text-[40px] font-bold leading-none text-[--color-md-on-surface]">{efficiency}</span>
          <span className="text-lg font-medium text-[--color-md-on-surface-variant]">%</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[--color-md-on-surface-variant]">
          <Zap className="size-3" />
          <span>Greenhouse Efficiency</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 mt-auto">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${chipStyles[chip]}`}>
          <TrendingUp className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-[--color-md-outline-variant] flex justify-between text-xs text-[--color-md-on-surface-variant]">
          <span>Daily Light Integral</span>
          <span className="font-medium text-[--color-md-on-surface]">{dli} mol/m²/d</span>
        </div>
      </div>
    </div>
  )
}

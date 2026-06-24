import { Thermometer, Droplets, AlertTriangle, Waves, Gauge } from 'lucide-react'

interface TempHumidityProps {
  temperature: number
  humidity: number
}

// ─── Derived calculations ──────────────────────────────────────────────────

/** Dew point via Magnus formula (°C) */
function dewPoint(T: number, RH: number): number {
  const a = 17.62, b = 243.12
  const gamma = (a * T) / (b + T) + Math.log(RH / 100)
  return (b * gamma) / (a - gamma)
}

/** Vapour Pressure Deficit (kPa) */
function vpd(T: number, RH: number): number {
  const sat = 0.6108 * Math.exp((17.27 * T) / (T + 237.3))
  return sat * (1 - RH / 100)
}

/**
 * Heat index (feels-like) in °C.
 * Uses the Rothfusz regression for RH ≥ 40% and T ≥ 27°C,
 * otherwise falls back to a simple Steadman approximation.
 */
function heatIndex(T: number, RH: number): number {
  if (T < 27 || RH < 40) {
    // Simple version: correction based on vapour pressure
    const e = (RH / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T))
    return T + 0.33 * e - 4.0
  }
  // Full Rothfusz polynomial (inputs in °C / %)
  return (
    -8.78469475556 +
    1.61139411 * T +
    2.33854883889 * RH +
    -0.14611605 * T * RH +
    -0.012308094 * T * T +
    -0.0164248277778 * RH * RH +
    0.002211732 * T * T * RH +
    0.00072546 * T * RH * RH +
    -0.000003582 * T * T * RH * RH
  )
}

// ─── Arc gauge ────────────────────────────────────────────────────────────

const ArcGauge = ({
  value, max, color, trackColor, size = 120,
}: {
  value: number; max: number; color: string; trackColor: string; size?: number
}) => {
  const R = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const C = 2 * Math.PI * R
  const arcLen = (240 / 360) * C
  const pct = Math.min(Math.max(value / max, 0), 1)
  const filledLen = pct * arcLen

  return (
    <svg width={size} height={size}>
      <g transform={`rotate(150, ${cx}, ${cy})`}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={trackColor}
          strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${arcLen} ${C}`} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={color}
          strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${filledLen} ${C}`}
          style={{ transition: 'stroke-dasharray 0.7s ease-out' }} />
      </g>
    </svg>
  )
}

// ─── Derived stat chip ────────────────────────────────────────────────────

const StatChip = ({
  icon: Icon, label, value, unit, accent,
}: {
  icon: React.ElementType; label: string; value: string; unit: string; accent: string
}) => (
  <div className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-2xl bg-[--color-md-surface-container]">
    <div className="flex items-center gap-1.5">
      <Icon className={`size-3 ${accent}`} />
      <span className="text-[9px] font-medium tracking-widest uppercase text-[--color-md-on-surface-variant]">
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-0.5">
      <span className="text-[15px] font-semibold text-[--color-md-on-surface] leading-none">{value}</span>
      <span className="text-[10px] text-[--color-md-on-surface-variant]">{unit}</span>
    </div>
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────

export const TempHumidity = ({ temperature, humidity }: TempHumidityProps) => {
  const isTempHigh = temperature > 32
  const isTempLow  = temperature < 18
  const isHumHigh  = humidity > 80
  const isHumLow   = humidity < 40

  const hasAlert = isTempHigh || isTempLow || isHumHigh || isHumLow
  const comfortLabel = !hasAlert
    ? 'Climate Stable'
    : isTempHigh || isHumHigh
    ? 'High Heat / Humid Alert'
    : 'Cool or Dry Conditions'

  const dp   = dewPoint(temperature, humidity)
  const vpdV = vpd(temperature, humidity)
  const hi   = heatIndex(temperature, humidity)

  return (
    <div className="rounded-[28px] bg-[--color-md-surface-container-low] md-elevation-1 flex flex-col overflow-hidden transition-shadow duration-300 hover:md-elevation-2">

      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[--color-md-on-surface-variant] mb-1">
            Climate
          </p>
          <h2 className="text-[22px] font-medium text-[--color-md-on-surface] leading-tight">
            Atmosphere
          </h2>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[--color-md-tertiary-container] flex items-center justify-center shrink-0">
          <Thermometer className="size-6 text-[--color-md-on-tertiary-container]" />
        </div>
      </div>

      {/* Dual gauge row */}
      <div className="px-4 py-2 flex justify-around items-start">

        {/* Temperature */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <ArcGauge
              value={temperature} max={50}
              color="var(--color-md-error)"
              trackColor="var(--color-md-error-container)"
              size={120}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-3">
              <span className="text-xl font-bold text-[--color-md-on-surface] leading-none">
                {temperature.toFixed(1)}°
              </span>
              <span className="text-[9px] font-medium tracking-widest text-[--color-md-on-surface-variant] uppercase mt-0.5">
                Temp °C
              </span>
            </div>
          </div>
          {/* Fixed-height badge slot */}
          <div className="h-5 flex items-center justify-center mt-1">
            {isTempHigh && <span className="text-[10px] font-medium text-[#B3261E] bg-[#F9DEDC] px-2 py-0.5 rounded-full">High</span>}
            {isTempLow  && <span className="text-[10px] font-medium text-[#386A20] bg-[#C3EFAD] px-2 py-0.5 rounded-full">Low</span>}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-24 bg-[--color-md-outline-variant] mx-1 mt-4" />

        {/* Humidity */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <ArcGauge
              value={humidity} max={100}
              color="var(--color-md-secondary)"
              trackColor="var(--color-md-secondary-container)"
              size={120}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-3">
              <Droplets className="size-4 text-[--color-md-secondary] mb-0.5" />
              <span className="text-xl font-bold text-[--color-md-on-surface] leading-none">{humidity}%</span>
              <span className="text-[9px] font-medium tracking-widest text-[--color-md-on-surface-variant] uppercase mt-0.5">
                Humid
              </span>
            </div>
          </div>
          {/* Fixed-height badge slot */}
          <div className="h-5 flex items-center justify-center mt-1">
            {isHumHigh && <span className="text-[10px] font-medium text-[#0B57D0] bg-[#D3E3FD] px-2 py-0.5 rounded-full">High</span>}
            {isHumLow  && <span className="text-[10px] font-medium text-[#B5860D] bg-[#FEF08A] px-2 py-0.5 rounded-full">Low</span>}
          </div>
        </div>
      </div>

      {/* ── Derived stats row ── */}
      <div className="px-4 pb-1 flex gap-2">
        <StatChip
          icon={Thermometer}
          label="Feels Like"
          value={hi.toFixed(1)}
          unit="°C"
          accent="text-[--color-md-error]"
        />
        <StatChip
          icon={Waves}
          label="Dew Point"
          value={dp.toFixed(1)}
          unit="°C"
          accent="text-[--color-md-secondary]"
        />
        <StatChip
          icon={Gauge}
          label="VPD"
          value={vpdV.toFixed(2)}
          unit="kPa"
          accent="text-[--color-md-tertiary]"
        />
      </div>

      {/* Status footer */}
      <div className="px-6 py-4 mt-auto">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-medium
          ${hasAlert
            ? 'bg-[#F9DEDC] text-[#8C1D18]'
            : 'bg-[--color-md-primary-container] text-[--color-md-on-primary-container]'
          }`}
        >
          {hasAlert && <AlertTriangle className="size-3.5 shrink-0" />}
          {comfortLabel}
        </div>
      </div>
    </div>
  )
}

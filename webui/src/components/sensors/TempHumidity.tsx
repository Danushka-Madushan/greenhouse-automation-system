import { Thermometer, Droplets, AlertTriangle, Waves, CheckCircle } from 'lucide-react'

interface TempHumidityProps {
  temperature: number
  humidity: number
  minTemp: number
  maxTemp: number
  minHum: number
  maxHum: number
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
    const e = (RH / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T))
    return T + 0.33 * e - 4.0
  }
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

// ─── Arc gauge — fully fluid via SVG viewBox ───────────────────────────────
// The SVG uses a fixed viewBox and scales via CSS width/height: 100%.
// This means it shrinks naturally as the card narrows.

const ArcGauge = ({
  value, max, color, trackColor,
}: {
  value: number; max: number; color: string; trackColor: string
}) => {
  const size = 120
  const R = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const C = 2 * Math.PI * R
  const arcLen = (240 / 360) * C
  const pct = Math.min(Math.max(value / max, 0), 1)
  const filledLen = pct * arcLen

  return (
    // viewBox is fixed; the SVG expands to fill its container width
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto' }}>
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

// ─── Derived stat chip ─────────────────────────────────────────────────────

const StatChip = ({
  icon: Icon, label, value, unit, accent,
}: {
  icon: React.ElementType; label: string; value: string; unit: string; accent: string
}) => (
  <div className="flex-1 items-center min-w-0 flex flex-col gap-1 px-2.5 py-2.5 rounded-2xl bg-[--color-md-surface-container]">
    <div className="flex items-center gap-1 min-w-0">
      <Icon className={`size-3.5 shrink-0 ${accent}`} />
      <span className="text-[11px] font-medium tracking-widest uppercase text-[--color-md-on-surface-variant] truncate">
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-0.5 min-w-0">
      <span className="text-[15px] font-semibold text-[--color-md-on-surface] leading-none truncate">{value}</span>
      <span className="text-[11px] text-[--color-md-on-surface-variant] shrink-0">{unit}</span>
    </div>
  </div>
)

// ─── Main component ────────────────────────────────────────────────────────

export const TempHumidity = ({ temperature, humidity, minTemp, maxTemp, minHum, maxHum }: TempHumidityProps) => {
  const isTempHigh = temperature > maxTemp
  const isTempLow = temperature < minTemp
  const isHumHigh = humidity > maxHum
  const isHumLow = humidity < minHum

  const hasAlert = isTempHigh || isTempLow || isHumHigh || isHumLow
  const comfortLabel = !hasAlert
    ? 'Climate Stable'
    : isTempHigh || isHumHigh
      ? 'High Heat / Humid Alert'
      : 'Cool or Dry Conditions'

  const dp = dewPoint(temperature, humidity)
  const vpdV = vpd(temperature, humidity)
  const hi = heatIndex(temperature, humidity)

  return (
    <div className="rounded-[28px] bg-[--color-md-surface-container-low] md-elevation-1 flex flex-col overflow-hidden transition-shadow duration-300 hover:md-elevation-2">

      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-widest uppercase text-[--color-md-on-surface-variant] mb-1">
            Atomosphere
          </p>
          <h2 className="text-[20px] font-medium text-[--color-md-on-surface] leading-tight">
            {vpdV.toFixed(2)} <span className="text-xs font-normal text-[--color-md-on-surface-variant]">kPa</span>
          </h2>
          <p className="text-xs text-[--color-md-on-surface-variant] mt-0.5">Absorbing Nutrients</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[--color-md-tertiary-container] flex items-center justify-center shrink-0">
          <Thermometer className="size-5 text-[--color-md-on-tertiary-container]" />
        </div>
      </div>

      {/* Dual gauge row — gauges scale fluidly with card width */}
      <div className="px-3 py-1 flex items-start gap-1">

        {/* Temperature gauge */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          <div className="relative w-full">
            <ArcGauge
              value={temperature} max={50}
              color="var(--color-md-error)"
              trackColor="var(--color-md-error-container)"
            />
            {/* Centred label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: '6%' }}>
              <Thermometer className="size-4.5 text-[--color-md-secondary] mb-0.5" />
              <span className="text-[20px] font-bold text-[--color-md-on-surface] leading-none">
                {temperature.toFixed(1)}°
              </span>
              <span className="text-[10px] font-medium tracking-widest text-[--color-md-on-surface-variant] uppercase mt-0.5">
                Temp °C
              </span>
            </div>
          </div>
          {/* Badge slot */}
          <div className="h-5 flex items-center justify-center mt-0.5">
            {isTempHigh && <span className="text-[10px] font-medium text-[#8C1D18] bg-[#F9DEDC] px-2 py-0.5 rounded-full">High</span>}
            {isTempLow && <span className="text-[10px] font-medium text-[#386A20] bg-[#C3EFAD] px-2 py-0.5 rounded-full">Low</span>}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-[--color-md-outline-variant] mx-0.5 mt-3 mb-6 shrink-0" />

        {/* Humidity gauge */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          <div className="relative w-full">
            <ArcGauge
              value={humidity} max={100}
              color="var(--color-md-secondary)"
              trackColor="var(--color-md-secondary-container)"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: '6%' }}>
              <Droplets className="size-4.5 text-[--color-md-secondary] mb-0.5" />
              <span className="text-[20px] font-bold text-[--color-md-on-surface] leading-none">{humidity}%</span>
              <span className="text-[10px] font-medium tracking-widest text-[--color-md-on-surface-variant] uppercase mt-0.5">
                Humid
              </span>
            </div>
          </div>
          <div className="h-5 flex items-center justify-center mt-0.5">
            {isHumHigh && <span className="text-[10px] font-medium text-[#0B57D0] bg-[#D3E3FD] px-2 py-0.5 rounded-full">High</span>}
            {isHumLow && <span className="text-[10px] font-medium text-[#7A5200] bg-[#FEF3C7] px-2 py-0.5 rounded-full">Low</span>}
          </div>
        </div>
      </div>

      {/* Derived stats row */}
      <div className="px-3 pb-1 flex gap-1.5">
        <StatChip icon={Thermometer} label="Feels Like" value={hi.toFixed(1)} unit="°C" accent="text-[--color-md-error]" />
        <StatChip icon={Waves} label="Dew Point" value={dp.toFixed(1)} unit="°C" accent="text-[--color-md-secondary]" />
      </div>

      {/* Status footer */}
      <div className="px-5 pb-4 mt-auto">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
          ${hasAlert
            ? 'bg-[--color-md-error-container] text-[--color-md-on-error-container]'
            : 'bg-[--color-md-primary-container] text-[--color-md-on-primary-container]'
          }`}
        >
          {hasAlert ? <AlertTriangle className="size-3.5 shrink-0" /> : <CheckCircle className="size-3.5 shrink-0" />}
          <span className="truncate">{comfortLabel}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-[--color-md-outline-variant] flex justify-between text-xs text-[--color-md-on-surface-variant]">
          <span>Vent Fans</span>
          <span className="font-medium text-[--color-md-on-surface]">Auto (Active)</span>
        </div>
      </div>
    </div>
  )
}

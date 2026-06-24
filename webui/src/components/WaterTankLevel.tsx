import { Droplet, AlertTriangle, CheckCircle } from 'lucide-react'

interface WaterTankLevelProps {
  level: number // 0–100
}

export const WaterTankLevel = ({ level }: WaterTankLevelProps) => {
  const capacity = 2000
  const currentVolume = Math.round((level / 100) * capacity)

  const isLow      = level < 20
  const isNearFull = level > 90

  const waterColors = isLow
    ? { top: '#72A8C8', bot: '#1A4060' }
    : isNearFull
    ? { top: '#7DD4F8', bot: '#1053A0' }
    : { top: '#4AABF0', bot: '#0C44A0' }

  const statusConfig = isLow
    ? { label: 'Low Level', icon: AlertTriangle, bg: 'bg-[#F9DEDC]', text: 'text-[#8C1D18]' }
    : isNearFull
    ? { label: 'Nearly Full', icon: CheckCircle,  bg: 'bg-[#C3EFAD]', text: 'text-[#1A3A0C]' }
    : { label: 'Optimal',     icon: CheckCircle,  bg: 'bg-[#C3EFAD]', text: 'text-[#1A3A0C]' }

  const StatusIcon = statusConfig.icon

  // Tank geometry inside SVG coordinate space
  const tX = 14, tY = 18, tW = 92, tH = 170
  const waterH  = Math.max(0, Math.round((level / 100) * tH))
  const waveY   = tY + tH - waterH   // top of water surface

  // Generates a double-wide sinusoidal wave path for seamless CSS loop
  const period = 28
  const amp    = 3.5
  const buildWave = (y: number): string => {
    const totalW = tW * 2 + period
    let d = `M ${tX} ${y}`
    for (let x = 0; x <= totalW; x += period) {
      const x0 = tX + x
      d += ` C ${x0 + period * 0.25},${y - amp} ${x0 + period * 0.75},${y + amp} ${x0 + period},${y}`
    }
    return d + ` V ${tY + tH} H ${tX} Z`
  }

  // Bubble y-positions near the tank floor (bubbles rise upward via animation)
  const bubbles = [
    { cx: tX + 17, cy: tY + tH - Math.round(waterH * 0.10), r: 2.5, cls: 'b1' },
    { cx: tX + 53, cy: tY + tH - Math.round(waterH * 0.18), r: 1.8, cls: 'b2' },
    { cx: tX + 74, cy: tY + tH - Math.round(waterH * 0.08), r: 2.2, cls: 'b3' },
  ]

  const riseH = (factor: number) => Math.round(waterH * factor)

  return (
    <div className="rounded-[28px] bg-[--color-md-surface-container-low] md-elevation-1 flex flex-col overflow-hidden transition-shadow duration-300 hover:md-elevation-2">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[--color-md-on-surface-variant] mb-1">
            Water Tank
          </p>
          <h2 className="text-[22px] font-medium text-[--color-md-on-surface] leading-tight">
            {level}% Full
          </h2>
          <p className="text-sm text-[--color-md-on-surface-variant] mt-0.5">
            {currentVolume.toLocaleString()} / {capacity.toLocaleString()} L
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[--color-md-secondary-container] flex items-center justify-center shrink-0">
          <Droplet className="size-6 text-[--color-md-on-secondary-container]" />
        </div>
      </div>

      {/* ── Tank SVG ── */}
      <div className="flex justify-center px-6 py-2">
        {/*
          viewBox 0 0 148 220:
            tX=14 tW=92 → right edge=106; tick labels reach ~140; right pad=8
            tY=18 tH=170 → water bottom=188; pipe nub below +14; bottom pad=18
        */}
        <svg viewBox="0 0 148 220" className="w-37 h-55">
          <defs>
            {/* Water depth gradient */}
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={waterColors.top} stopOpacity="0.92" />
              <stop offset="100%" stopColor={waterColors.bot} stopOpacity="1"    />
            </linearGradient>

            {/* Glass sheen — left-to-right fade */}
            <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="white" stopOpacity="0.22" />
              <stop offset="50%"  stopColor="white" stopOpacity="0.05" />
              <stop offset="100%" stopColor="white" stopOpacity="0"    />
            </linearGradient>

            {/* Empty tank body */}
            <linearGradient id="emptyBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--color-md-surface-container-high)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-md-surface-container)"      stopOpacity="0.6" />
            </linearGradient>

            {/* Clips */}
            <clipPath id="tc">
              <rect x={tX} y={tY} width={tW} height={tH} rx="14" />
            </clipPath>

            {/* Animations */}
            <style>{`
              @keyframes waveAnim {
                from { transform: translateX(0);        }
                to   { transform: translateX(-${period}px); }
              }
              @keyframes rise1 {
                0%,100% { opacity:0; transform:translateY(0); }
                12%     { opacity:.35; }
                82%     { opacity:.2; }
                96%     { opacity:0; transform:translateY(-${riseH(0.80)}px); }
              }
              @keyframes rise2 {
                0%,100% { opacity:0; transform:translateY(0); }
                15%     { opacity:.28; }
                78%     { opacity:.15; }
                96%     { opacity:0; transform:translateY(-${riseH(0.72)}px); }
              }
              @keyframes rise3 {
                0%,100% { opacity:0; transform:translateY(0); }
                10%     { opacity:.32; }
                85%     { opacity:.18; }
                96%     { opacity:0; transform:translateY(-${riseH(0.86)}px); }
              }
              .wave-inner { animation: waveAnim 2s linear infinite; }
              .b1 { animation: rise1 4.4s ease-in infinite 0.2s; }
              .b2 { animation: rise2 3.7s ease-in infinite 1.7s; }
              .b3 { animation: rise3 5.1s ease-in infinite 0.8s; }
            `}</style>
          </defs>

          {/* ── Top pipe nub ── */}
          <rect x={tX + tW / 2 - 8} y={4} width={16} height={tY + 3} rx="4"
            fill="var(--color-md-outline-variant)" fillOpacity="0.5" />
          {/* Collar ring */}
          <rect x={tX + tW / 2 - 10} y={tY - 3} width={20} height={6} rx="3"
            fill="var(--color-md-outline-variant)" fillOpacity="0.38" />

          {/* ── Empty tank body ── */}
          <rect x={tX} y={tY} width={tW} height={tH} rx="14" fill="url(#emptyBg)" />

          {/* ── Dashed ruler lines at 25 / 50 / 75 % ── */}
          {[25, 50, 75].map(pct => {
            const y       = tY + tH - Math.round((pct / 100) * tH)
            const inWater = y >= waveY
            return (
              <g key={pct}>
                {/* Full-width dash inside tank */}
                <line
                  x1={tX + 6} y1={y} x2={tX + tW - 6} y2={y}
                  stroke={inWater ? 'white' : 'var(--color-md-outline-variant)'}
                  strokeWidth="0.75"
                  strokeOpacity={inWater ? 0.18 : 0.28}
                  strokeDasharray="3 6"
                  clipPath="url(#tc)"
                />
                {/* Left notch (outside tank) */}
                <line x1={tX - 2} y1={y} x2={tX + 9} y2={y}
                  stroke="var(--color-md-outline-variant)" strokeWidth="1.5" strokeOpacity="0.6" />
                {/* Right notch (outside tank) */}
                <line x1={tX + tW - 9} y1={y} x2={tX + tW + 2} y2={y}
                  stroke="var(--color-md-outline-variant)" strokeWidth="1.5" strokeOpacity="0.6" />
                {/* Label */}
                <text
                  x={tX + tW + 7} y={y + 3.5}
                  fontSize="8.5" fontFamily="system-ui,sans-serif" fontWeight="400"
                  fill="var(--color-md-on-surface-variant)"
                >{pct}%</text>
              </g>
            )
          })}

          {/* ── Animated water fill ── */}
          {level > 0 && (
            <g clipPath="url(#tc)">
              <g className="wave-inner">
                <path d={buildWave(waveY)} fill="url(#wg)" />
              </g>
            </g>
          )}

          {/* ── Rising bubbles (clipped to tank, fade out before reaching surface) ── */}
          {level > 14 && (
            <g clipPath="url(#tc)">
              {bubbles.map(b => (
                <circle key={b.cls} className={b.cls}
                  cx={b.cx} cy={b.cy} r={b.r}
                  fill="white" fillOpacity="0" />
              ))}
            </g>
          )}

          {/* ── Glass sheen overlay ── */}
          <rect x={tX} y={tY} width={tW * 0.38} height={tH} rx="14"
            fill="url(#sheen)" clipPath="url(#tc)" />

          {/* ── Inner top rim glint ── */}
          <path
            d={`M ${tX + 16} ${tY + 3} Q ${tX + tW / 2} ${tY + 1} ${tX + tW - 16} ${tY + 3}`}
            fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.2"
            clipPath="url(#tc)"
          />

          {/* ── Tank border ── */}
          <rect x={tX} y={tY} width={tW} height={tH} rx="14"
            fill="none" stroke="var(--color-md-outline-variant)" strokeWidth="2.5" />

          {/* ── Bottom pipe nub ── */}
          {/* Collar ring */}
          <rect x={tX + tW / 2 - 10} y={tY + tH - 3} width={20} height={6} rx="3"
            fill="var(--color-md-outline-variant)" fillOpacity="0.38" />
          {/* Pipe stub */}
          <rect x={tX + tW / 2 - 8} y={tY + tH + 3} width={16} height={13} rx="4"
            fill="var(--color-md-outline-variant)" fillOpacity="0.45" />

          {/* ── Percentage label inside water ── */}
          {level > 12 && (
            <text
              x={tX + tW / 2}
              y={Math.max(waveY + 17, tY + 22)}
              textAnchor="middle"
              fontSize="13" fontWeight="600" fontFamily="system-ui,sans-serif"
              fill="white" fillOpacity="0.72"
            >
              {level}%
            </text>
          )}
        </svg>
      </div>

      {/* ── Status chip + footer ── */}
      <div className="px-6 pb-4 mt-auto">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
          <StatusIcon className="size-3.5" />
          {statusConfig.label}
        </div>
        <div className="mt-3 pt-3 border-t border-[--color-md-outline-variant] flex justify-between text-xs text-[--color-md-on-surface-variant]">
          <span>Flow rate</span>
          <span className="font-medium text-[--color-md-on-surface]">120 L/hr</span>
        </div>
      </div>
    </div>
  )
}

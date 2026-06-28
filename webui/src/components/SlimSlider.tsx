/* ─── Simulator Slider ─────────────────────────────── */
interface SliderProps {
  label: string
  value: number
  unit?: string
  min: number
  max: number
  step?: number
  accent: string
  onChange: (v: number) => void
}

export const SimSlider = ({ label, value, unit = '%', min, max, step = 1, accent, onChange }: SliderProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-baseline">
      <span className="text-xs font-medium text-[--color-md-on-surface-variant]">{label}</span>
      <span className="text-xs font-bold" style={{ color: accent }}>{value}{unit}</span>
    </div>
    <div className="relative h-5 flex items-center">
      {/* Track background */}
      <div className="absolute w-full h-1 rounded-full bg-[--color-md-surface-container-highest]" />
      {/* Active track */}
      <div className="absolute h-1 rounded-full transition-all duration-150"
        style={{ width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: accent }} />
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="relative w-full opacity-0 cursor-pointer h-5 z-10"
      />
      {/* Thumb */}
      <div className="absolute h-5 w-5 rounded-full border-2 border-white shadow-md pointer-events-none transition-all duration-150"
        style={{
          left: `calc(${((value - min) / (max - min)) * 100}% - 10px)`,
          backgroundColor: accent
        }}
      />
    </div>
  </div>
)

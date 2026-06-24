import { useState } from 'react'
import { Tabs } from '@heroui/react'
import { LayoutDashboard, BarChart3, Leaf, ShieldCheck, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { WaterTankLevel }  from './components/WaterTankLevel'
import { TempHumidity }    from './components/TempHumidity'
import { Photosynthesis }  from './components/Photosynthesis'
import { SoilMoisture }    from './components/SoilMoisture'
import { AnalyticsEmpty }  from './components/AnalyticsEmpty'

/* ─── Simulator Slider ─────────────────────────── */
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
const SimSlider = ({ label, value, unit = '%', min, max, step = 1, accent, onChange }: SliderProps) => (
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

/* ─── App ──────────────────────────────────────── */
const App = () => {
  const [waterLevel,  setWaterLevel]  = useState(68)
  const [temperature, setTemperature] = useState(24.5)
  const [humidity,    setHumidity]    = useState(62)
  const [lightLevel,  setLightLevel]  = useState(720)
  const [sector1, setSector1] = useState(45)
  const [sector2, setSector2] = useState(52)
  const [sector3, setSector3] = useState(38)
  const [sector4, setSector4] = useState(48)
  const [simOpen, setSimOpen] = useState(true)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-md-surface)', color: 'var(--color-md-on-surface)' }}>

      {/* ── M3 Top App Bar ────────────────────────── */}
      <header
        className="sticky top-0 z-50 h-16 flex items-center px-4 sm:px-6 lg:px-8 gap-4"
        style={{
          backgroundColor: 'var(--color-md-surface-container-low)',
          borderBottom: '1px solid var(--color-md-outline-variant)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-md-primary)', color: 'var(--color-md-on-primary)' }}
          >
            <Leaf className="size-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight" style={{ color: 'var(--color-md-on-surface)', fontFamily: 'var(--font-display)' }}>
              GreenOS
            </span>
            <span className="text-[10px] font-medium tracking-[0.12em] uppercase" style={{ color: 'var(--color-md-on-surface-variant)' }}>
              Automation System
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div
          className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: 'var(--color-md-primary-container)',
            color: 'var(--color-md-on-primary-container)',
          }}
        >
          <ShieldCheck className="size-4" />
          <span>Greenhouse Online</span>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">

        {/* M3 Navigation Tabs — secondary variant with custom styling */}
        <Tabs variant="secondary" defaultSelectedKey="dashboard" className="w-full flex flex-col">

          {/* Tab bar */}
          <Tabs.ListContainer className="mb-8">
            <Tabs.List
              aria-label="Main Navigation"
              className="inline-flex rounded-full p-1 gap-1"
              style={{
                backgroundColor: 'var(--color-md-surface-container)',
                border: '1px solid var(--color-md-outline-variant)',
              }}
            >
              {/* Dashboard tab */}
              <Tabs.Tab
                id="dashboard"
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200
                  data-[selected=true]:bg-[--color-md-secondary-container]
                  data-[selected=true]:text-[--color-md-on-secondary-container]
                  text-[--color-md-on-surface-variant]
                  hover:bg-[--color-md-surface-container-high]"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
                <Tabs.Indicator className="hidden" />
              </Tabs.Tab>

              {/* Analytics tab */}
              <Tabs.Tab
                id="analytics"
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200
                  data-[selected=true]:bg-[--color-md-secondary-container]
                  data-[selected=true]:text-[--color-md-on-secondary-container]
                  text-[--color-md-on-surface-variant]
                  hover:bg-[--color-md-surface-container-high]"
              >
                <BarChart3 className="size-4" />
                Analytics
                <Tabs.Indicator className="hidden" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          {/* ── Dashboard Panel ─────────────────── */}
          <Tabs.Panel id="dashboard" className="flex flex-col gap-8">

            {/* Page headline — M3 Headline Large */}
            <div>
              <h1
                className="text-[32px] font-medium leading-tight mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-md-on-surface)' }}
              >
                Dashboard
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Real-time greenhouse environment overview
              </p>
            </div>

            {/* ── Metric Cards ─────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <WaterTankLevel level={waterLevel} />
              <TempHumidity temperature={temperature} humidity={humidity} />
              <Photosynthesis lightLevel={lightLevel} />
              <SoilMoisture sector1={sector1} sector2={sector2} sector3={sector3} sector4={sector4} />
            </div>

            {/* ── Simulator Panel (M3 Card) ─────── */}
            <div
              className="rounded-[28px] overflow-hidden md-elevation-1"
              style={{ backgroundColor: 'var(--color-md-surface-container-low)' }}
            >
              {/* Panel header */}
              <button
                onClick={() => setSimOpen(v => !v)}
                className="w-full flex items-center justify-between px-6 py-5 text-left
                  hover:brightness-95 transition-all duration-200 md-state-layer"
                style={{ borderBottom: simOpen ? '1px solid var(--color-md-outline-variant)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-md-surface-container-highest)' }}
                  >
                    <Settings2
                      className="size-5"
                      style={{ color: 'var(--color-md-on-surface-variant)' }}
                    />
                  </div>
                  <div>
                    <p className="text-base font-semibold" style={{ color: 'var(--color-md-on-surface)' }}>
                      Sensor Simulator
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                      Adjust values to simulate environmental conditions
                    </p>
                  </div>
                </div>
                {simOpen
                  ? <ChevronUp className="size-5" style={{ color: 'var(--color-md-on-surface-variant)' }} />
                  : <ChevronDown className="size-5" style={{ color: 'var(--color-md-on-surface-variant)' }} />
                }
              </button>

              {/* Slider grid */}
              {simOpen && (
                <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                  {/* Water */}
                  <div className="flex flex-col gap-5">
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                      Water Tank
                    </p>
                    <SimSlider label="Water Level" value={waterLevel} min={0} max={100}
                      accent="var(--color-md-secondary)" onChange={setWaterLevel} />
                  </div>

                  {/* Climate */}
                  <div className="flex flex-col gap-5">
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                      Climate
                    </p>
                    <SimSlider label="Temperature" value={temperature} unit="°C" min={10} max={45} step={0.5}
                      accent="var(--color-md-error)" onChange={setTemperature} />
                    <SimSlider label="Humidity" value={humidity} min={20} max={100}
                      accent="var(--color-md-secondary)" onChange={setHumidity} />
                  </div>

                  {/* Light */}
                  <div className="flex flex-col gap-5">
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                      Light (PAR)
                    </p>
                    <SimSlider label="Sunlight Intensity" value={lightLevel} unit=" µmol" min={0} max={2000} step={10}
                      accent="var(--color-md-tertiary)" onChange={setLightLevel} />
                  </div>

                  {/* Soil sectors */}
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                      Soil Moisture
                    </p>
                    <SimSlider label="NW Sector 1" value={sector1} min={10} max={95}
                      accent="var(--color-md-primary)" onChange={setSector1} />
                    <SimSlider label="NE Sector 2" value={sector2} min={10} max={95}
                      accent="var(--color-md-primary)" onChange={setSector2} />
                    <SimSlider label="SW Sector 3" value={sector3} min={10} max={95}
                      accent="var(--color-md-primary)" onChange={setSector3} />
                    <SimSlider label="SE Sector 4" value={sector4} min={10} max={95}
                      accent="var(--color-md-primary)" onChange={setSector4} />
                  </div>

                </div>
              )}
            </div>
          </Tabs.Panel>

          {/* ── Analytics Panel ──────────────────── */}
          <Tabs.Panel id="analytics">
            <AnalyticsEmpty />
          </Tabs.Panel>

        </Tabs>
      </main>
    </div>
  )
}

export default App

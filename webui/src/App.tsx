import { useEffect, useState } from 'react'
import {
  LayoutDashboard, BarChart3, Leaf, ShieldCheck,
  Settings2, SlidersHorizontal,
  X
} from 'lucide-react'
import { WaterTankLevel } from './components/WaterTankLevel'
import { TempHumidity } from './components/TempHumidity'
import { Photosynthesis } from './components/Photosynthesis'
import { SoilMoisture } from './components/SoilMoisture'
import { AnalyticsEmpty } from './components/AnalyticsEmpty'
import { SettingsModal } from './components/SettingsModal'
import { signalRService } from './services/signalr'

/* ─── Types ────────────────────────────────────────── */
type TabId = 'dashboard' | 'analytics'

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

/* ─── App ──────────────────────────────────────────── */
const App = () => {
  const [waterLevel, setWaterLevel] = useState(68)
  const [temperature, setTemperature] = useState(24.5)
  const [humidity, setHumidity] = useState(62)
  const [lightLevel, setLightLevel] = useState(720)
  const [sector1, setSector1] = useState(45)
  const [sector2, setSector2] = useState(52)
  const [sector3, setSector3] = useState(38)
  const [sector4, setSector4] = useState(48)

  const [isConnected, setIsConnected] = useState(false)

  // Sidebar open/closed
  const [simOpen, setSimOpen] = useState(false)
  // Simulation enabled/disabled toggle
  const [simEnabled, setSimEnabled] = useState(true)

  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [status, setStatus] = useState<string>('')

  // Crop / Threshold state config
  const [cropKey, setCropKey] = useState('eggplant')
  const [cropName, setCropName] = useState('Eggplant')
  const [minTemp, setMinTemp] = useState(24)
  const [maxTemp, setMaxTemp] = useState(30)
  const [minHum, setMinHum] = useState(60)
  const [maxHum, setMaxHum] = useState(70)
  const [minMoisture, setMinMoisture] = useState(60)
  const [maxMoisture, setMaxMoisture] = useState(75)
  const [tankCapacity, setTankCapacity] = useState(2000)

  // Settings Modal Open State
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    signalRService.startConnection()

    signalRService.connection.on('SYS:ONLINE', () => {
      setIsConnected(true)
    })

    signalRService.connection.on('SYS:OFFLINE', () => {
      setIsConnected(false)
    })

    signalRService.connection.on('OnSensorUpdate', (data: string) => {
      console.log('Received data from C#:', data)
      setStatus(data)
    })

    signalRService.connection.on('CommandAcknowledged', (msg: string) => {
      console.log(msg)
    })

    return () => {
      signalRService.connection.off('OnSensorUpdate')
      signalRService.connection.off('CommandAcknowledged')
      signalRService.connection.off('SYS:ONLINE')
      signalRService.connection.off('SYS:OFFLINE')
    }
  }, [])

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-md-surface)', color: 'var(--color-md-on-surface)' }}
    >

      {/* ══════════════════════════════════════════════
          TOP APP BAR — logo · tabs · status
      ══════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 h-16 flex items-center px-4 sm:px-6 gap-4"
        style={{
          backgroundColor: 'var(--color-md-surface-container-low)',
          borderBottom: '1px solid var(--color-md-outline-variant)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* ── Left: Brand ── */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-md-primary)', color: 'var(--color-md-on-primary)' }}
          >
            <Leaf className="size-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: 'var(--color-md-on-surface)', fontFamily: 'var(--font-display)' }}
            >
              GreenOS
            </span>
            <span
              className="text-[10px] font-medium tracking-[0.12em] uppercase hidden sm:block"
              style={{ color: 'var(--color-md-on-surface-variant)' }}
            >
              Automation System{status ? ` · ${status}` : ''}
            </span>
          </div>
        </div>

        {/* ── Center: Navigation Tabs ── */}
        <nav
          className="flex items-center rounded-full p-1 gap-1 shrink-0"
          style={{
            backgroundColor: 'var(--color-md-surface-container)',
            border: '1px solid var(--color-md-outline-variant)',
          }}
          aria-label="Main Navigation"
        >
          {/* Dashboard tab */}
          <button
            id="tab-dashboard"
            role="tab"
            aria-selected={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2"
            style={{
              backgroundColor: activeTab === 'dashboard'
                ? 'var(--color-md-secondary-container)'
                : 'transparent',
              color: activeTab === 'dashboard'
                ? 'var(--color-md-on-secondary-container)'
                : 'var(--color-md-on-surface-variant)',
            }}
          >
            <LayoutDashboard className="size-4" />
            <span>Dashboard</span>
          </button>

          {/* Analytics tab */}
          <button
            id="tab-analytics"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2"
            style={{
              backgroundColor: activeTab === 'analytics'
                ? 'var(--color-md-secondary-container)'
                : 'transparent',
              color: activeTab === 'analytics'
                ? 'var(--color-md-on-secondary-container)'
                : 'var(--color-md-on-surface-variant)',
            }}
          >
            <BarChart3 className="size-4" />
            <span>Analytics</span>
          </button>
        </nav>

        {/* ── Right: Status chip ── */}
        <div className="flex-1 flex justify-end min-w-0">
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shrink-0"
            style={{
              backgroundColor: isConnected ? 'var(--color-md-primary-container)' : 'var(--color-md-error-container)',
              color: isConnected ? 'var(--color-md-on-primary-container)' : 'var(--color-md-on-error-container)',
            }}
          >
            <ShieldCheck className="size-4" />
            <span>System {isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <main
        className="px-4 sm:px-6 lg:px-8 pt-8 pb-20 transition-all duration-300 ease-in-out"
        style={{ marginRight: simOpen ? '288px' : '0' }}
      >
        {/* ── Dashboard Panel ── */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">

            {/* Page headline with dynamic crop name */}
            <div>
              <h1
                className="text-[32px] font-medium leading-tight mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-md-on-surface)' }}
              >
                Monitoring Crops: <span className="font-bold text-[--color-md-primary]">{cropName}</span>
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Real-time greenhouse environment overview
              </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <WaterTankLevel level={waterLevel} capacity={tankCapacity} />
              <TempHumidity
                temperature={temperature}
                humidity={humidity}
                minTemp={minTemp}
                maxTemp={maxTemp}
                minHum={minHum}
                maxHum={maxHum}
              />
              <Photosynthesis lightLevel={lightLevel} />
              <SoilMoisture
                sector1={sector1}
                sector2={sector2}
                sector3={sector3}
                sector4={sector4}
                minMoisture={minMoisture}
                maxMoisture={maxMoisture}
              />
            </div>
          </div>
        )}

        {/* ── Analytics Panel ── */}
        {activeTab === 'analytics' && (
          <AnalyticsEmpty />
        )}
      </main>

      {/* ══════════════════════════════════════════════
          FLOATING SETTINGS BUTTON (Bottom-Left Corner)
      ══════════════════════════════════════════════ */}
      <button
        id="settings-fab"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
        title="Configuration Settings"
        className="fixed bottom-7 left-7 z-45 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shadow-lg hover:brightness-95 active:scale-95 transition-all cursor-pointer"
        style={{
          backgroundColor: 'var(--color-md-primary-container)',
          color: 'var(--color-md-on-primary-container)',
          border: '1px solid var(--color-md-outline-variant)',
        }}
      >
        <Settings2 className="size-4" />
        <span>Settings</span>
      </button>

      {/* ══════════════════════════════════════════════
          FLOATING RE-OPEN BUTTON (visible only when sidebar is closed)
      ══════════════════════════════════════════════ */}
      <button
        id="sim-fab-open"
        onClick={() => setSimOpen(true)}
        aria-label="Open Sensor Simulator"
        title="Open Sensor Simulator"
        className="sim-fab"
        style={{
          opacity: simOpen ? 0 : 1,
          pointerEvents: simOpen ? 'none' : 'auto',
          transform: simOpen ? 'scale(0.8) translateY(8px)' : 'scale(1) translateY(0)',
          transition: 'opacity 250ms ease, transform 250ms ease',
        }}
      >
        <SlidersHorizontal className="size-5" />
        <span>Simulator</span>
      </button>

      {/* ══════════════════════════════════════════════
          SENSOR SIMULATOR RIGHT SIDEBAR
      ══════════════════════════════════════════════ */}
      <aside className={`sim-sidebar${simOpen ? '' : ' collapsed'}`}>

        {/* ── Sidebar inner content ── */}
        <div style={{ opacity: simOpen ? 1 : 0, transition: 'opacity 200ms ease', pointerEvents: simOpen ? 'auto' : 'none' }}>

          {/* ── Sidebar Header ── */}
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--color-md-outline-variant)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--color-md-surface-container-highest)' }}
            >
              <Settings2 className="size-4" style={{ color: 'var(--color-md-on-surface-variant)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-md-on-surface)' }}>
                Sensor Simulator
              </p>
              <p className="text-[11px]" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Simulate environmental data
              </p>
            </div>

            {/* On / Off toggle */}
            <div className="flex items-center gap-2">
              <button
                id="sim-enable-toggle"
                role="switch"
                aria-checked={simEnabled}
                aria-label="Enable simulation"
                onClick={() => setSimEnabled(v => !v)}
                className={`sim-toggle-track${simEnabled ? ' on' : ''}`}
                title={simEnabled ? 'Simulation ON – click to disable' : 'Simulation OFF – click to enable'}
              >
                <div className="sim-toggle-thumb" />
              </button>

              {/* Close button */}
              <button
                id="sim-sidebar-close"
                onClick={() => setSimOpen(false)}
                aria-label="Close Sensor Simulator"
                title="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-[--color-md-surface-container-high]"
                style={{ color: 'var(--color-md-on-surface-variant)' }}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* ── Slider Groups ── */}
          <div className={`px-5 py-5 flex flex-col gap-7${simEnabled ? '' : ' sim-sliders-disabled'}`}>

            {/* Water Tank */}
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Water Tank
              </p>
              <SimSlider label="Water Level" value={waterLevel} min={0} max={100}
                accent="var(--color-md-secondary)" onChange={setWaterLevel} />
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--color-md-outline-variant)' }} />

            {/* Climate */}
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Climate
              </p>
              <SimSlider label="Temperature" value={temperature} unit="°C" min={10} max={45} step={0.5}
                accent="var(--color-md-error)" onChange={setTemperature} />
              <SimSlider label="Humidity" value={humidity} min={20} max={100}
                accent="var(--color-md-secondary)" onChange={setHumidity} />
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--color-md-outline-variant)' }} />

            {/* Light */}
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Light (PAR)
              </p>
              <SimSlider label="Sunlight Intensity" value={lightLevel} unit=" µmol" min={0} max={2000} step={10}
                accent="var(--color-md-tertiary)" onChange={setLightLevel} />
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--color-md-outline-variant)' }} />

            {/* Soil Moisture */}
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--color-md-on-surface-variant)' }}>
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
        </div>{/* end inner content */}
      </aside>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        cropKey={cropKey}
        cropName={cropName}
        minTemp={minTemp}
        maxTemp={maxTemp}
        minHum={minHum}
        maxHum={maxHum}
        minMoisture={minMoisture}
        maxMoisture={maxMoisture}
        tankCapacity={tankCapacity}
        onSave={(settings) => {
          setCropKey(settings.cropKey)
          setCropName(settings.cropName)
          setMinTemp(settings.minTemp)
          setMaxTemp(settings.maxTemp)
          setMinHum(settings.minHum)
          setMaxHum(settings.maxHum)
          setMinMoisture(settings.minMoisture)
          setMaxMoisture(settings.maxMoisture)
          setTankCapacity(settings.tankCapacity)
          setSettingsOpen(false)
        }}
      />

    </div>
  )
}

export default App

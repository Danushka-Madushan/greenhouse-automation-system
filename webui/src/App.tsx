import { useEffect, useState } from 'react'
import { WaterTankLevel } from './components/sensors/WaterTankLevel'
import { TempHumidity } from './components/sensors/TempHumidity'
import { Photosynthesis } from './components/sensors/Photosynthesis'
import { SoilMoisture } from './components/sensors/SoilMoisture'
import { AnalyticsEmpty } from './components/sensors/AnalyticsEmpty'
import { SettingsModal } from './components/SettingsModal'
import { signalRService } from './services/signalr'
import { Parser } from './utils/parser'
import SimulationBar from './components/SimulationBar'
import FloatingSimulatorToggle from './components/FloatingSimulatorToggle'
import FloatingSettingsToggle from './components/FloatingSettingsToggle'
import Nav from './components/Nav'

/* ─── Types ────────────────────────────────────────── */
type TabId = 'dashboard' | 'analytics'

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

  const resetAllValuesToZeroOnOffline = () => {
    setWaterLevel(0)
    setTemperature(0)
    setHumidity(0)
    setLightLevel(0)
    setSector1(0)
    setSector2(0)
    setSector3(0)
    setSector4(0)
  }

  useEffect(() => {
    signalRService.startConnection()

    signalRService.connection.on('SYS:ONLINE', () => {
      setIsConnected(true)
    })

    signalRService.connection.on('SYS:OFFLINE', () => {
      setIsConnected(false)
      resetAllValuesToZeroOnOffline()
    })

    signalRService.connection.on('onSensorUpdate:TEMP_HUMIDITY', (data: string) => {
      const { temperature, humidity } = Parser.parseTempHumidity(data)
      setTemperature(temperature)
      setHumidity(humidity)
    })

    signalRService.connection.on('onSensorError:TEMP_HUMIDITY', (data: string) => {
      console.log('Received error from C#:', data)
    })

    signalRService.connection.on('CommandAcknowledged', (msg: string) => {
      console.log(msg)
    })

    return () => {
      signalRService.connection.off('onSensorUpdate:TEMP_HUMIDITY')
      signalRService.connection.off('onSensorError:TEMP_HUMIDITY')
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
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} isConnected={isConnected} />

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
      <FloatingSettingsToggle setSettingsOpen={setSettingsOpen} />

      {/* ══════════════════════════════════════════════
          FLOATING RE-OPEN BUTTON (visible only when sidebar is closed)
      ══════════════════════════════════════════════ */}
      <FloatingSimulatorToggle simOpen={simOpen} setSimOpen={setSimOpen} />

      {/* ══════════════════════════════════════════════
          SENSOR SIMULATOR RIGHT SIDEBAR
      ══════════════════════════════════════════════ */}
      <SimulationBar
        humidity={humidity}
        lightLevel={lightLevel}
        sector1={sector1}
        sector2={sector2}
        sector3={sector3}
        sector4={sector4}
        setHumidity={setHumidity}
        setLightLevel={setLightLevel}
        setSector1={setSector1}
        setSector2={setSector2}
        setSector3={setSector3}
        setSector4={setSector4}
        setSimEnabled={setSimEnabled}
        setSimOpen={setSimOpen}
        setTemperature={setTemperature}
        setWaterLevel={setWaterLevel}
        simEnabled={simEnabled}
        simOpen={simOpen}
        temperature={temperature}
        waterLevel={waterLevel}
      />

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

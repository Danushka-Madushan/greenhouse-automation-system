import { useEffect, useState } from 'react'
import { WaterTankLevel } from './components/sensors/WaterTankLevel'
import { TempHumidity } from './components/sensors/TempHumidity'
import { Photosynthesis } from './components/sensors/Photosynthesis'
import { SoilMoisture } from './components/sensors/SoilMoisture'
import { SettingsModal } from './components/SettingsModal'
import { ModeToggleBar } from './components/ModeToggleBar'
import { AnalyticsTab } from './components/AnalyticsTab'
import { signalRService } from './services/signalr'
import { logEfficiencySnapshot, type EfficiencySnapshot } from './services/analyticsService'
import { Parser } from './utils/parser'
import SimulationBar from './components/SimulationBar'
import FloatingSimulatorToggle from './components/FloatingSimulatorToggle'
import FloatingSettingsToggle from './components/FloatingSettingsToggle'
import Nav from './components/Nav'
import { toast } from '@heroui/react/toast'
import { OfflineOverlay } from './components/OfflineOverlay'

/* Types */
type TabId = 'dashboard' | 'analytics'
type OperatingMode = 'MANUAL' | 'AUTO'

const WATER_PUMP_DEFAULT_SECONDS = 3
const WATER_PUMP_MIN_SECONDS = 3
const WATER_PUMP_MAX_SECONDS = 6

const getPumpRunSecondsFromStatus = (statusMessage: string): number => {
  const payload = statusMessage.split(':').slice(2).join(':')
  if (!payload.startsWith('RUNNING:')) return 0
  const value = Number(payload.split(':')[1])
  return Number.isFinite(value) ? value : 0
}

/* Photosynthesis efficiency calculator (same logic as Photosynthesis card) */
const calcEfficiency = (par: number): number => {
  if (par < 200) return Math.round((par / 200) * 35)
  if (par < 600) return Math.round(35 + ((par - 200) / 400) * 40)
  if (par <= 1200) return Math.min(98, Math.round(75 + ((par - 600) / 600) * 23))
  return Math.max(20, Math.round(98 - ((par - 1200) / 800) * 60))
}

/* App */
const App = () => {
  const [waterLevel, setWaterLevel] = useState(0)
  const [temperature, setTemperature] = useState(0)
  const [humidity, setHumidity] = useState(0)
  const [lightLevel, setLightLevel] = useState(0)
  const [sector1, setSector1] = useState(0)
  const [sector2, setSector2] = useState(0)
  const [sector3, setSector3] = useState(0)
  const [sector4, setSector4] = useState(0)

  const [isConnected, setIsConnected] = useState(false)

  /* Sidebar open/closed */
  const [simOpen, setSimOpen] = useState(false)
  /* Simulation enabled/disabled toggle */
  const [simEnabled, setSimEnabled] = useState(true)

  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  /* Crop / Threshold state config */
  const [cropKey, setCropKey] = useState('eggplant')
  const [cropName, setCropName] = useState('Eggplant')
  const [minTemp, setMinTemp] = useState(24)
  const [maxTemp, setMaxTemp] = useState(30)
  const [minHum, setMinHum] = useState(60)
  const [maxHum, setMaxHum] = useState(70)
  const [minMoisture, setMinMoisture] = useState(60)
  const [maxMoisture, setMaxMoisture] = useState(75)
  const [tankCapacity, setTankCapacity] = useState(2000)

  /* Settings Modal Open State */
  const [settingsOpen, setSettingsOpen] = useState(false)

  /* Actuator States */
  const [isExhaustFanOn, setIsExhaustFanOn] = useState(false)
  const [isWaterPumpRunning, setIsWaterPumpRunning] = useState(false)
  const [waterPumpRemainingSeconds, setWaterPumpRemainingSeconds] = useState(0)
  const [pumpDurationSecondsInput, setPumpDurationSecondsInput] = useState(String(WATER_PUMP_DEFAULT_SECONDS))
  const [isSubmittingPumpCommand, setIsSubmittingPumpCommand] = useState(false)
  const [isRefillPumpRunning, setIsRefillPumpRunning] = useState(false)

  /* Operating Mode — default MANUAL so nothing fires on plug-in */
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('MANUAL')

  /* Analytics live snapshots */
  const [liveSnapshots, setLiveSnapshots] = useState<EfficiencySnapshot[]>([])

  /* ── Reset on disconnect ──────────────────────────── */
  const resetAllValuesToZeroOnOffline = () => {
    setWaterLevel(0)
    setTemperature(0)
    setHumidity(0)
    setLightLevel(0)
    setSector1(0)
    setSector2(0)
    setSector3(0)
    setSector4(0)
    setIsExhaustFanOn(false)
    setIsWaterPumpRunning(false)
    setWaterPumpRemainingSeconds(0)
    setIsRefillPumpRunning(false)
    /* Keep operatingMode as-is — it will re-sync when board reconnects */
  }

  /* ── Pump input helpers ───────────────────────────── */
  const clampPumpSeconds = (value: number) =>
    Math.min(WATER_PUMP_MAX_SECONDS, Math.max(WATER_PUMP_MIN_SECONDS, value))

  const parsePumpSecondsInput = () => {
    const parsed = Number.parseInt(pumpDurationSecondsInput, 10)
    if (!Number.isFinite(parsed)) return WATER_PUMP_DEFAULT_SECONDS
    return clampPumpSeconds(parsed)
  }

  /* ── Actuator handlers ────────────────────────────── */
  const handleFanTurnOn = async () => { await signalRService.turnExhaustFanOn() }
  const handleFanTurnOff = async () => { await signalRService.turnExhaustFanOff() }

  const handlePumpRun = async () => {
    const seconds = parsePumpSecondsInput()
    setPumpDurationSecondsInput(String(seconds))
    setIsSubmittingPumpCommand(true)
    try {
      await signalRService.runWaterPump(seconds)
    } finally {
      setIsSubmittingPumpCommand(false)
    }
  }

  const handleRefillPumpOn = async () => { await signalRService.turnRefillPumpOn() }
  const handleRefillPumpOff = async () => { await signalRService.turnRefillPumpOff() }

  /* ── Mode handlers ────────────────────────────────── */
  const handleSetAutoMode = async () => {
    await signalRService.setAutoMode()
  }

  const handleSetManualMode = async () => {
    await signalRService.setManualMode()
  }

  /* ── Analytics helpers ────────────────────────────── */
  const efficiency = calcEfficiency(lightLevel)

  const handleSnapshotAdded = (snapshot: EfficiencySnapshot) => {
    setLiveSnapshots(prev => [...prev.slice(-119), snapshot]) // keep last 120
    void logEfficiencySnapshot(snapshot)
  }



  const handleManualSync = () => {
    if (!isConnected) {
      toast.danger('Offline', { description: 'Cannot sync while offline.' })
      return
    }
    const snap: EfficiencySnapshot = {
      timestamp: Date.now(),
      efficiency,
      lightLevel,
      temperature,
      humidity,
      moisture: sector1,
      waterLevel,
    }
    handleSnapshotAdded(snap)
    toast.success('Synced to Cloud', { description: 'Live sensor data logged.' })
  }

  /* ── SignalR setup ────────────────────────────────── */
  useEffect(() => {
    signalRService.startConnection()

    /* System lifecycle */
    signalRService.connection.on('SYS:ONLINE', () => {
      setIsConnected(true)
    })
    signalRService.connection.on('SYS:OFFLINE', () => {
      setIsConnected(false)
      resetAllValuesToZeroOnOffline()
    })
    signalRService.connection.onclose((error) => {
      console.warn('SignalR Connection Closed Unexpectedly:', error)
      setIsConnected(false)
      resetAllValuesToZeroOnOffline()
    })
    signalRService.connection.onreconnecting((error) => {
      console.warn('SignalR Connection Lost. Attempting to reconnect...', error)
      setIsConnected(false)
      resetAllValuesToZeroOnOffline()
    })
    signalRService.connection.onreconnected((connectionId) => {
      console.log('SignalR Reconnected Successfully. ID:', connectionId)
      setIsConnected(true)
    })

    /* Sensor listeners */
    signalRService.connection.on('onSensorUpdate:LIGHT_INTENSITY', (data: string) => {
      setLightLevel(Parser.parseLightIntensity(data))
    })
    signalRService.connection.on('onSensorUpdate:WATER_LEVEL', (data: string) => {
      setWaterLevel(Parser.parseWaterLevel(data))
    })
    signalRService.connection.on('onSensorUpdate:TEMP_HUMIDITY', (data: string) => {
      const { temperature, humidity } = Parser.parseTempHumidity(data)
      setTemperature(temperature)
      setHumidity(humidity)
    })
    signalRService.connection.on('onSensorUpdate:SOIL_MOISTURE', (data: string) => {
      const { sector1, sector2, sector3, sector4 } = Parser.parseSoilMoisture(data)
      setSector1(sector1)
      setSector2(sector2)
      setSector3(sector3)
      setSector4(sector4)
    })
    signalRService.connection.on('onSensorError:TEMP_HUMIDITY', (data: string) => {
      console.log('Received error from C#:', data)
      setTemperature(0)
      setHumidity(0)
      toast.danger('Temperature/Humidity Sensor', {
        description: data.split(':').slice(2).join(' ').replace(/_/g, ' ')
      })
    })

    /* Actuator listeners */
    signalRService.connection.on('onActuatorUpdate:EXHAUST_FAN', (data: string) => {
      setIsExhaustFanOn(data.endsWith(':ON'))
    })
    signalRService.connection.on('onActuatorUpdate:WATER_PUMP', (data: string) => {
      const isRunning = data.includes('RUNNING:')
      setIsWaterPumpRunning(isRunning)
      setWaterPumpRemainingSeconds(isRunning ? getPumpRunSecondsFromStatus(data) : 0)
    })
    signalRService.connection.on('onActuatorUpdate:REFILL_PUMP', (data: string) => {
      setIsRefillPumpRunning(data.endsWith(':ON'))
    })

    /* Mode listener */
    signalRService.connection.on('onModeUpdate', (data: string) => {
      const mode = data.endsWith('AUTO') ? 'AUTO' : 'MANUAL'
      setOperatingMode(mode)
    })

    /* ACK listeners */
    signalRService.connection.on('onActuatorAck:EXHAUST_FAN', (data: string) => {
      console.log('Exhaust Fan ACK:', data)
    })
    signalRService.connection.on('onActuatorAck:WATER_PUMP', (data: string) => {
      console.log('Water Pump ACK:', data)
    })
    signalRService.connection.on('onActuatorAck:REFILL_PUMP', (data: string) => {
      console.log('Refill Pump ACK:', data)
    })
    signalRService.connection.on('onModeAck', (data: string) => {
      console.log('Mode ACK:', data)
    })

    signalRService.connection.on('CommandAcknowledged', (msg: string) => {
      console.log(msg)

      if (msg.startsWith('ACK:GATEWAY:REJECTED:WATER_PUMP_SECONDS_OUT_OF_RANGE')) {
        toast.warning('Water Pump Command Rejected', {
          description: 'Allowed pump duration is 3 to 6 seconds.'
        })
        return
      }
      if (msg.startsWith('ACK:GATEWAY:QUEUED:CMD:WATER_PUMP:RUN_SECONDS:')) {
        toast.success('Water Pump Triggered', {
          description: `Pump command queued for ${msg.split(':').pop()} second(s).`
        })
        return
      }
      if (msg.startsWith('ACK:GATEWAY:QUEUED:CMD:EXHAUST_FAN:ON')) {
        toast.success('Exhaust Fan', { description: 'Fan ON command queued.' })
        return
      }
      if (msg.startsWith('ACK:GATEWAY:QUEUED:CMD:EXHAUST_FAN:OFF')) {
        toast.success('Exhaust Fan', { description: 'Fan OFF command queued.' })
        return
      }
      if (msg.startsWith('ACK:GATEWAY:QUEUED:CMD:REFILL_PUMP:ON')) {
        toast.success('Refill Pump', { description: 'Refill pump ON command queued.' })
        return
      }
      if (msg.startsWith('ACK:GATEWAY:QUEUED:CMD:REFILL_PUMP:OFF')) {
        toast.success('Refill Pump', { description: 'Refill pump OFF command queued.' })
        return
      }
      if (msg.startsWith('ACK:GATEWAY:QUEUED:CMD:MODE:AUTO')) {
        toast.success('Mode Switch', { description: 'Switched to Autonomous Mode.' })
        return
      }
      if (msg.startsWith('ACK:GATEWAY:QUEUED:CMD:MODE:MANUAL')) {
        toast.success('Mode Switch', { description: 'Switched to Manual Mode. Active actuators cancelled.' })
      }
    })

    return () => {
      signalRService.connection.off('onSensorUpdate:TEMP_HUMIDITY')
      signalRService.connection.off('onSensorUpdate:LIGHT_INTENSITY')
      signalRService.connection.off('onSensorUpdate:WATER_LEVEL')
      signalRService.connection.off('onSensorUpdate:SOIL_MOISTURE')
      signalRService.connection.off('onSensorError:TEMP_HUMIDITY')
      signalRService.connection.off('CommandAcknowledged')
      signalRService.connection.off('onActuatorUpdate:EXHAUST_FAN')
      signalRService.connection.off('onActuatorUpdate:WATER_PUMP')
      signalRService.connection.off('onActuatorUpdate:REFILL_PUMP')
      signalRService.connection.off('onActuatorAck:EXHAUST_FAN')
      signalRService.connection.off('onActuatorAck:WATER_PUMP')
      signalRService.connection.off('onActuatorAck:REFILL_PUMP')
      signalRService.connection.off('onModeUpdate')
      signalRService.connection.off('onModeAck')
      signalRService.connection.off('SYS:ONLINE')
      signalRService.connection.off('SYS:OFFLINE')
    }
  }, [])

  const isManualControlEnabled = operatingMode === 'MANUAL' && isConnected

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-md-surface)', color: 'var(--color-md-on-surface)' }}
    >
      {/* Offline Gate */}
      <OfflineOverlay isConnected={isConnected} />

      {/* TOP APP BAR */}
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} isConnected={isConnected} />

      {/* MAIN CONTENT */}
      <main
        className="px-4 sm:px-6 lg:px-8 pt-8 pb-20 transition-all duration-300 ease-in-out"
        style={{ marginRight: simOpen ? '288px' : '0' }}
      >

        {/* ── Dashboard Panel ── */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">

            {/* Header row */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Page headline */}
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

              {/* Compact Actuator Controls */}
              <div
                className="flex items-center gap-4 rounded-2xl p-2 px-4 shadow-sm"
                style={{
                  backgroundColor: 'var(--color-md-surface-container)',
                  border: '1px solid var(--color-md-outline-variant)',
                  opacity: operatingMode === 'AUTO' ? 0.5 : 1,
                  pointerEvents: operatingMode === 'AUTO' ? 'none' : 'auto',
                  transition: 'opacity 0.3s',
                }}
                title={operatingMode === 'AUTO' ? 'Controls disabled in Auto Mode' : undefined}
              >
                {/* Exhaust Fan Compact */}
                <div className="flex items-center gap-3 border-r pr-4" style={{ borderColor: 'var(--color-md-outline-variant)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-md-on-surface)' }}>Fan</span>
                  <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                    <button
                      onClick={() => void handleFanTurnOn()}
                      disabled={!isManualControlEnabled}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: isExhaustFanOn ? 'var(--color-md-primary)' : 'transparent',
                        color: isExhaustFanOn ? 'var(--color-md-on-primary)' : 'var(--color-md-on-surface)',
                      }}
                    >
                      ON
                    </button>
                    <button
                      onClick={() => void handleFanTurnOff()}
                      disabled={!isManualControlEnabled}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: !isExhaustFanOn ? 'var(--color-md-surface-container-highest)' : 'transparent',
                        color: 'var(--color-md-on-surface)',
                      }}
                    >
                      OFF
                    </button>
                  </div>
                </div>

                {/* Water Pump Compact */}
                <div className="flex items-center gap-3 border-r pr-4" style={{ borderColor: 'var(--color-md-outline-variant)' }}>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-md-on-surface)' }}>Pump</span>
                    {isWaterPumpRunning && (
                      <span className="text-[10px] font-bold text-center -mt-1" style={{ color: 'var(--color-md-secondary)' }}>
                        {waterPumpRemainingSeconds}s
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={WATER_PUMP_MIN_SECONDS}
                      max={WATER_PUMP_MAX_SECONDS}
                      value={pumpDurationSecondsInput}
                      onChange={(event) => setPumpDurationSecondsInput(event.target.value)}
                      disabled={!isManualControlEnabled}
                      className="w-14 h-8 rounded-lg text-center text-xs font-semibold focus:outline-none disabled:opacity-40"
                      style={{
                        backgroundColor: 'var(--color-md-surface-container-highest)',
                        color: 'var(--color-md-on-surface)',
                        border: '1px solid var(--color-md-outline-variant)',
                      }}
                      title={`Allowed range: ${WATER_PUMP_MIN_SECONDS}-${WATER_PUMP_MAX_SECONDS}s`}
                    />
                    <button
                      onClick={() => void handlePumpRun()}
                      disabled={!isManualControlEnabled || isSubmittingPumpCommand}
                      className="h-8 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      style={{ backgroundColor: 'var(--color-md-secondary)', color: 'var(--color-md-on-secondary)' }}
                    >
                      {isSubmittingPumpCommand ? '...' : 'RUN'}
                    </button>
                  </div>
                </div>

                {/* Refill Pump Compact */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-md-on-surface)' }}>Refill</span>
                  <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                    <button
                      onClick={() => void handleRefillPumpOn()}
                      disabled={!isManualControlEnabled}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: isRefillPumpRunning ? 'var(--color-md-tertiary)' : 'transparent',
                        color: isRefillPumpRunning ? 'var(--color-md-on-tertiary)' : 'var(--color-md-on-surface)',
                      }}
                    >
                      ON
                    </button>
                    <button
                      onClick={() => void handleRefillPumpOff()}
                      disabled={!isManualControlEnabled}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: !isRefillPumpRunning ? 'var(--color-md-surface-container-highest)' : 'transparent',
                        color: 'var(--color-md-on-surface)',
                      }}
                    >
                      OFF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode Toggle Bar */}
            <ModeToggleBar
              mode={operatingMode}
              isConnected={isConnected}
              onSetAuto={() => void handleSetAutoMode()}
              onSetManual={() => void handleSetManualMode()}
            />

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
          <AnalyticsTab
            lightLevel={lightLevel}
            temperature={temperature}
            humidity={humidity}
            moisture={sector1}
            waterLevel={waterLevel}
            efficiency={efficiency}
            isConnected={isConnected}
            liveSnapshots={liveSnapshots}
            onSnapshotAdded={handleSnapshotAdded}
            onManualSync={handleManualSync}
          />
        )}
      </main>

      {/* FLOATING SETTINGS BUTTON */}
      <FloatingSettingsToggle setSettingsOpen={setSettingsOpen} />

      {/* FLOATING SIMULATOR TOGGLE */}
      <FloatingSimulatorToggle simOpen={simOpen} setSimOpen={setSimOpen} />

      {/* SENSOR SIMULATOR RIGHT SIDEBAR */}
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

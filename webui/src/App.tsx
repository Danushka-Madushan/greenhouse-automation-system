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
import { toast } from '@heroui/react/toast'
import { OfflineOverlay } from './components/OfflineOverlay'

/* Types */
type TabId = 'dashboard' | 'analytics'

const WATER_PUMP_DEFAULT_SECONDS = 3
const WATER_PUMP_MIN_SECONDS = 3
const WATER_PUMP_MAX_SECONDS = 6

const getPumpRunSecondsFromStatus = (statusMessage: string): number => {
  const payload = statusMessage.split(':').slice(2).join(':')

  if (!payload.startsWith('RUNNING:')) {
    return 0
  }

  const value = Number(payload.split(':')[1])
  return Number.isFinite(value) ? value : 0
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
  }

  const clampPumpSeconds = (value: number) => {
    return Math.min(WATER_PUMP_MAX_SECONDS, Math.max(WATER_PUMP_MIN_SECONDS, value))
  }

  const parsePumpSecondsInput = () => {
    const parsed = Number.parseInt(pumpDurationSecondsInput, 10)
    if (!Number.isFinite(parsed)) {
      return WATER_PUMP_DEFAULT_SECONDS
    }

    return clampPumpSeconds(parsed)
  }

  const handleFanTurnOn = async () => {
    await signalRService.turnExhaustFanOn()
  }

  const handleFanTurnOff = async () => {
    await signalRService.turnExhaustFanOff()
  }

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

  useEffect(() => {
    signalRService.startConnection()

    /* Custom Gateway Events (Graceful) */
    signalRService.connection.on('SYS:ONLINE', () => {
      setIsConnected(true)
    })

    signalRService.connection.on('SYS:OFFLINE', () => {
      setIsConnected(false)
      resetAllValuesToZeroOnOffline()
    })

    /* NATIVE SIGNALR LIFECYCLE EVENTS (Handles Crashes & Drops) */
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
      /* The C# server will automatically push new sensor data on its next polling cycle. */
    })

    /* Sensor Data Listeners */
    signalRService.connection.on('onSensorUpdate:LIGHT_INTENSITY', (data: string) => {
      const lightLevel = Parser.parseLightIntensity(data)
      setLightLevel(lightLevel)
    })

    signalRService.connection.on('onSensorUpdate:WATER_LEVEL', (data: string) => {
      const waterLevel = Parser.parseWaterLevel(data)
      setWaterLevel(waterLevel)
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
      toast.danger("Temperature/Humidity Sensor", {
        description: data.split(':').slice(2).join(' ').replace(/_/g, ' ')
      })
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
        toast.success('Exhaust Fan', {
          description: 'Fan ON command queued.'
        })
        return
      }

      if (msg.startsWith('ACK:GATEWAY:QUEUED:CMD:EXHAUST_FAN:OFF')) {
        toast.success('Exhaust Fan', {
          description: 'Fan OFF command queued.'
        })
      }
    })

    signalRService.connection.on('onActuatorUpdate:EXHAUST_FAN', (data: string) => {
      const isOn = data.endsWith(':ON')
      setIsExhaustFanOn(isOn)
    })

    signalRService.connection.on('onActuatorUpdate:WATER_PUMP', (data: string) => {
      const isRunning = data.includes('RUNNING:')
      setIsWaterPumpRunning(isRunning)

      if (isRunning) {
        setWaterPumpRemainingSeconds(getPumpRunSecondsFromStatus(data))
      } else {
        setWaterPumpRemainingSeconds(0)
      }
    })

    signalRService.connection.on('onActuatorAck:EXHAUST_FAN', (data: string) => {
      console.log('Exhaust Fan ACK:', data)
    })

    signalRService.connection.on('onActuatorAck:WATER_PUMP', (data: string) => {
      console.log('Water Pump ACK:', data)
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
      signalRService.connection.off('onActuatorAck:EXHAUST_FAN')
      signalRService.connection.off('onActuatorAck:WATER_PUMP')
      signalRService.connection.off('SYS:ONLINE')
      signalRService.connection.off('SYS:OFFLINE')
    }
  }, [])

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-md-surface)', color: 'var(--color-md-on-surface)' }}
    >
      {/* Offline Gate - renders above everything, blocks all interaction */}
      <OfflineOverlay isConnected={isConnected} />

      {/* TOP APP BAR - logo · tabs · status */}
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} isConnected={isConnected} />

      {/* MAIN CONTENT */}
      <main
        className="px-4 sm:px-6 lg:px-8 pt-8 pb-20 transition-all duration-300 ease-in-out"
        style={{ marginRight: simOpen ? '288px' : '0' }}
      >
        {/* ── Dashboard Panel ── */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            {/* ── Header & Compact Actuator Controls ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
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

              {/* Compact Actuator Controls (Prototype) */}
              <div
                className="flex items-center gap-4 rounded-2xl p-2 px-4 shadow-sm"
                style={{
                  backgroundColor: 'var(--color-md-surface-container)',
                  border: '1px solid var(--color-md-outline-variant)'
                }}
              >
                {/* Exhaust Fan Compact */}
                <div className="flex items-center gap-3 border-r pr-4" style={{ borderColor: 'var(--color-md-outline-variant)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-md-on-surface)' }}>
                    Fan
                  </span>
                  <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                    <button
                      onClick={() => void handleFanTurnOn()}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: isExhaustFanOn ? 'var(--color-md-primary)' : 'transparent',
                        color: isExhaustFanOn ? 'var(--color-md-on-primary)' : 'var(--color-md-on-surface)'
                      }}
                    >
                      ON
                    </button>
                    <button
                      onClick={() => void handleFanTurnOff()}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: !isExhaustFanOn ? 'var(--color-md-surface-container-highest)' : 'transparent',
                        color: !isExhaustFanOn ? 'var(--color-md-on-surface)' : 'var(--color-md-on-surface)'
                      }}
                    >
                      OFF
                    </button>
                  </div>
                </div>

                {/* Water Pump Compact */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-md-on-surface)' }}>
                      Pump
                    </span>
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
                      className="w-14 h-8 rounded-lg text-center text-xs font-semibold focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-md-surface-container-highest)',
                        color: 'var(--color-md-on-surface)',
                        border: '1px solid var(--color-md-outline-variant)'
                      }}
                      title={`Allowed range: ${WATER_PUMP_MIN_SECONDS}-${WATER_PUMP_MAX_SECONDS}s`}
                    />
                    <button
                      onClick={() => void handlePumpRun()}
                      disabled={isSubmittingPumpCommand}
                      className="h-8 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                      style={{
                        backgroundColor: 'var(--color-md-secondary)',
                        color: 'var(--color-md-on-secondary)'
                      }}
                    >
                      {isSubmittingPumpCommand ? '...' : 'RUN'}
                    </button>
                  </div>
                </div>
              </div>
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

      {/* FLOATING SETTINGS BUTTON (Bottom-Left Corner) */}
      <FloatingSettingsToggle setSettingsOpen={setSettingsOpen} />

      {/* FLOATING RE-OPEN BUTTON (visible only when sidebar is closed) */}
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

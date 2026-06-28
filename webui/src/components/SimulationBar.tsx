import { Settings2, X } from 'lucide-react'
import { SimSlider } from './SlimSlider'
import type { Dispatch } from 'react'

interface SimulationBarProps {
  simOpen: boolean
  setSimOpen: Dispatch<React.SetStateAction<boolean>>
  simEnabled: boolean
  setSimEnabled: Dispatch<React.SetStateAction<boolean>>
  waterLevel: number
  setWaterLevel: Dispatch<React.SetStateAction<number>>
  temperature: number
  setTemperature: Dispatch<React.SetStateAction<number>>
  humidity: number
  setHumidity: Dispatch<React.SetStateAction<number>>
  lightLevel: number
  setLightLevel: Dispatch<React.SetStateAction<number>>
  sector1: number
  setSector1: Dispatch<React.SetStateAction<number>>
  sector2: number
  setSector2: Dispatch<React.SetStateAction<number>>
  sector3: number
  setSector3: Dispatch<React.SetStateAction<number>>
  sector4: number
  setSector4: Dispatch<React.SetStateAction<number>>
}

const SimulationBar = ({
  simOpen, setSimOpen, simEnabled, setSimEnabled, waterLevel, setWaterLevel,
  temperature, setTemperature, humidity, setHumidity, lightLevel, setLightLevel,
  sector1, setSector1, sector2, setSector2, sector3, setSector3, sector4, setSector4
}: SimulationBarProps) => {
  return (
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
  )
}

export default SimulationBar

import { SlidersHorizontal } from 'lucide-react'

interface FloatingSimulatorToggleProps {
  simOpen: boolean
  setSimOpen: (open: boolean) => void
}

const FloatingSimulatorToggle = ({ simOpen, setSimOpen }: FloatingSimulatorToggleProps) => {
  return (
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
  )
}

export default FloatingSimulatorToggle

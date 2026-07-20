import { Cpu, Hand, Leaf, Zap } from 'lucide-react'

interface ModeToggleBarProps {
  mode: 'MANUAL' | 'AUTO'
  isConnected: boolean
  onSetAuto: () => void
  onSetManual: () => void
}

export const ModeToggleBar = ({ mode, isConnected, onSetAuto, onSetManual }: ModeToggleBarProps) => {
  const isAuto = mode === 'AUTO'

  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500"
      style={{
        backgroundColor: isAuto
          ? 'var(--color-md-primary-container)'
          : 'var(--color-md-surface-container)',
        border: `1px solid ${isAuto ? 'var(--color-md-primary)' : 'var(--color-md-outline-variant)'}`,
        boxShadow: isAuto ? '0 0 0 1px var(--color-md-primary)20' : 'none',
      }}
    >
      {/* Left: Icon + Mode Info */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500"
          style={{
            backgroundColor: isAuto ? 'var(--color-md-primary)' : 'var(--color-md-surface-container-high)',
          }}
        >
          {isAuto
            ? <Cpu className="size-5" style={{ color: 'var(--color-md-on-primary)' }} />
            : <Hand className="size-5" style={{ color: 'var(--color-md-on-surface-variant)' }} />
          }
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: isAuto ? 'var(--color-md-on-primary-container)' : 'var(--color-md-on-surface)' }}
            >
              {isAuto ? 'Autonomous Mode' : 'Manual Mode'}
            </span>
            {/* Live pulse indicator for AUTO */}
            {isAuto && (
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: 'var(--color-md-primary)' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ backgroundColor: 'var(--color-md-primary)' }}
                />
              </span>
            )}
          </div>
          <p
            className="text-xs mt-0.5"
            style={{ color: isAuto ? 'var(--color-md-on-primary-container)' : 'var(--color-md-on-surface-variant)' }}
          >
            {isAuto
              ? 'Arduino managing fan, water pump & refill autonomously'
              : 'All actuators controlled manually via this panel'}
          </p>
        </div>
      </div>

      {/* Right: Toggle + Status chips */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Auto mode status chips */}
        {isAuto && (
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'var(--color-md-primary)20', color: 'var(--color-md-on-primary-container)' }}
            >
              <Zap className="size-3" />
              Fan
            </div>
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'var(--color-md-primary)20', color: 'var(--color-md-on-primary-container)' }}
            >
              <Leaf className="size-3" />
              Pump
            </div>
          </div>
        )}

        {/* Toggle pill */}
        <div
          className="flex items-center gap-0 rounded-xl p-1"
          style={{ backgroundColor: isAuto ? 'var(--color-md-primary)30' : 'var(--color-md-surface-container-high)' }}
        >
          <button
            onClick={onSetManual}
            disabled={!isConnected}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 disabled:opacity-40"
            style={{
              backgroundColor: !isAuto ? 'var(--color-md-surface-container-highest)' : 'transparent',
              color: !isAuto ? 'var(--color-md-on-surface)' : 'var(--color-md-on-surface-variant)',
              boxShadow: !isAuto ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            MANUAL
          </button>
          <button
            onClick={onSetAuto}
            disabled={!isConnected}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 disabled:opacity-40"
            style={{
              backgroundColor: isAuto ? 'var(--color-md-primary)' : 'transparent',
              color: isAuto ? 'var(--color-md-on-primary)' : 'var(--color-md-on-surface-variant)',
              boxShadow: isAuto ? '0 1px 3px rgba(0,0,0,0.20)' : 'none',
            }}
          >
            AUTO
          </button>
        </div>
      </div>
    </div>
  )
}

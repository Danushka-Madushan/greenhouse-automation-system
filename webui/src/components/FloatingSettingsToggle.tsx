import { Settings2 } from 'lucide-react'

interface FloatingSettingsToggleProps {
  setSettingsOpen: (open: boolean) => void
}

const FloatingSettingsToggle = ({ setSettingsOpen }: FloatingSettingsToggleProps) => {
  return (
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
  )
}

export default FloatingSettingsToggle

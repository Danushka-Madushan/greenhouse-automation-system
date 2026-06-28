import { BarChart3, LayoutDashboard, Leaf, ShieldCheck } from 'lucide-react'

interface NavProps {
  activeTab: 'dashboard' | 'analytics'
  setActiveTab: (tab: 'dashboard' | 'analytics') => void
  isConnected: boolean
}

const Nav = ({ activeTab, setActiveTab, isConnected }: NavProps) => {
  return (
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
              Automation System
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
  )
}

export default Nav

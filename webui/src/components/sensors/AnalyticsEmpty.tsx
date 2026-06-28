import { BarChart3, Bell, ArrowRight } from 'lucide-react'

export const AnalyticsEmpty = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
    {/* Illustrated placeholder — M3 style large icon + tonal container */}
    <div className="w-24 h-24 rounded-[32px] bg-[--color-md-secondary-container] flex items-center justify-center mb-8 md-elevation-1">
      <BarChart3 className="size-12 text-[--color-md-on-secondary-container]" />
    </div>

    {/* M3 Headline + Body */}
    <h2 className="text-[28px] font-medium text-[--color-md-on-surface] text-center mb-3 max-w-sm leading-snug"
      style={{ fontFamily: 'var(--font-display)' }}>
      Analytics Coming Soon
    </h2>
    <p className="text-base text-[--color-md-on-surface-variant] text-center max-w-sm leading-relaxed mb-8">
      Yield prediction, water consumption trends, and anomaly detection will be available here once telemetry data has been collected.
    </p>

    {/* Feature preview chips */}
    <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-md">
      {['Yield Prediction', 'Water Consumption', 'Anomaly Detection', 'Climate Trends'].map(f => (
        <span key={f}
          className="px-4 py-1.5 rounded-full text-sm font-medium
            bg-[--color-md-surface-container-high] text-[--color-md-on-surface-variant]
            border border-[--color-md-outline-variant]">
          {f}
        </span>
      ))}
    </div>

    {/* M3 Filled tonal button */}
    <button
      className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm
        bg-[--color-md-secondary-container] text-[--color-md-on-secondary-container]
        hover:brightness-95 active:brightness-90 transition-all md-state-layer"
    >
      <Bell className="size-4" />
      Notify Me When Ready
      <ArrowRight className="size-4" />
    </button>
  </div>
)

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import {
  TrendingUp, Calendar, BarChart2, Lightbulb, AlertTriangle, Info,
  ChevronLeft, ChevronRight, Leaf
} from 'lucide-react'
import {
  type EfficiencySnapshot, type DailyStats, type Recommendation,
  toDateKey, computeDailyStats, getDateSnapshots, getWeekStats, generateRecommendations
} from '../services/analyticsService'

/* Register Chart.js modules */
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
)

export const LOG_INTERVAL_MS = 10 * 1000 // 10 seconds

/* ── View id type (shared by state + ViewTab prop) ──────── */
type ViewId = 'live' | 'compare' | 'week'

/* ── Efficiency → color helper ──────────────────────────── */
const efficiencyColor = (e: number) => {
  if (e >= 75) return '#059669'  // primary green
  if (e >= 40) return '#D97706'              // amber
  return '#DC2626'                           // error red
}

/* ── Recommendation card ────────────────────────────────── */
const RecCard = ({ rec }: { rec: Recommendation }) => {
  const iconMap = {
    tip: <Lightbulb className="size-4 shrink-0" style={{ color: 'var(--color-md-primary)' }} />,
    warning: <AlertTriangle className="size-4 shrink-0" style={{ color: 'var(--color-md-error)' }} />,
    info: <Info className="size-4 shrink-0" style={{ color: 'var(--color-md-secondary)' }} />,
  }
  const bgMap = {
    tip: 'var(--color-md-primary-container)',
    warning: 'var(--color-md-error-container)',
    info: 'var(--color-md-secondary-container)',
  }
  const textMap = {
    tip: 'var(--color-md-on-primary-container)',
    warning: 'var(--color-md-on-error-container)',
    info: 'var(--color-md-on-secondary-container)',
  }

  return (
    <div
      className="rounded-2xl p-4 flex gap-3"
      style={{ backgroundColor: bgMap[rec.type] }}
    >
      {iconMap[rec.type]}
      <div>
        <p className="text-xs font-bold mb-0.5" style={{ color: textMap[rec.type] }}>{rec.title}</p>
        <p className="text-xs leading-relaxed" style={{ color: textMap[rec.type] }}>{rec.description}</p>
      </div>
    </div>
  )
}

/* ── Stat card ──────────────────────────────────────────── */
const StatCard = ({ label, value, unit, color }: { label: string; value: number | string; unit?: string; color?: string }) => (
  <div
    className="rounded-2xl p-4 flex flex-col gap-1"
    style={{ backgroundColor: 'var(--color-md-surface-container-low)', border: '1px solid var(--color-md-outline-variant)' }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-md-on-surface-variant)' }}>{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold" style={{ color: color ?? 'var(--color-md-on-surface)' }}>{value}</span>
      {unit && <span className="text-sm" style={{ color: 'var(--color-md-on-surface-variant)' }}>{unit}</span>}
    </div>
  </div>
)

/* ── View tab button ─────────────────────────────────────── */
const ViewTab = ({
  id, label, icon, active, onSelect,
}: { id: ViewId; label: string; icon: React.ReactNode; active: boolean; onSelect: (id: ViewId) => void }) => (
  <button
    onClick={() => onSelect(id)}
    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
    style={{
      backgroundColor: active ? 'var(--color-md-primary)' : 'transparent',
      color: active ? 'var(--color-md-on-primary)' : 'var(--color-md-on-surface-variant)',
    }}
  >
    {icon}
    {label}
  </button>
)

/* ── Empty state ─────────────────────────────────────────── */
const EmptyGraph = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
    <Leaf className="size-10" style={{ color: 'var(--color-md-on-surface-variant)' }} />
    <p className="text-sm" style={{ color: 'var(--color-md-on-surface-variant)' }}>{message}</p>
  </div>
)

/* ── Props ──────────────────────────────────────────────── */
interface AnalyticsTabProps {
  /* Live sensor values passed from App — used to build the live graph */
  lightLevel: number
  temperature: number
  humidity: number
  moisture: number
  waterLevel: number
  efficiency: number   /* Computed photosynthesis efficiency from App */
  isConnected: boolean
  /* Called by analytics service interval (passed up to App for logging) */
  liveSnapshots: EfficiencySnapshot[]
  onSnapshotAdded: (s: EfficiencySnapshot) => void
  onManualSync: () => void
}

/* ── Component ──────────────────────────────────────────── */
export const AnalyticsTab = ({
  lightLevel, temperature, humidity, moisture, waterLevel, efficiency,
  isConnected, liveSnapshots, onSnapshotAdded, onManualSync
}: AnalyticsTabProps) => {

  /* ── Date Compare State ──────────────────────────────── */
  const [dateA, setDateA] = useState(toDateKey())
  const [dateB, setDateB] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1); return toDateKey(d)
  })
  const [statsA, setStatsA] = useState<DailyStats | null>(null)
  const [statsB, setStatsB] = useState<DailyStats | null>(null)
  const [loadingCompare, setLoadingCompare] = useState(false)

  /* ── Week State ──────────────────────────────────────── */
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d
  })
  const [weekStats, setWeekStats] = useState<DailyStats[]>([])
  const [loadingWeek, setLoadingWeek] = useState(false)

  /* ── Selected day details ────────────────────────────── */
  const [selectedDayStats, setSelectedDayStats] = useState<DailyStats | null>(null)
  const [recs, setRecs] = useState<Recommendation[]>([])

  /* ── Active view ─────────────────────────────────────── */
  const [activeView, setActiveView] = useState<ViewId>('live')

  /* ── Load compare ────────────────────────────────────── */
  /* Accepts optional overrides so callers (e.g. a date picker's onChange)
     can trigger a reload with the fresh value without waiting for state
     to re-render first. */
  const loadCompare = useCallback(async (a: string = dateA, b: string = dateB) => {
    setLoadingCompare(true)
    const [snapsA, snapsB] = await Promise.all([getDateSnapshots(a), getDateSnapshots(b)])
    const sa = computeDailyStats(a, snapsA)
    const sb = computeDailyStats(b, snapsB)
    setStatsA(sa)
    setStatsB(sb)
    /* Show recommendations for date A */
    setSelectedDayStats(sa)
    setRecs(generateRecommendations(sa))
    setLoadingCompare(false)
  }, [dateA, dateB])

  /* ── Load week ───────────────────────────────────────── */
  const loadWeek = useCallback(async (start: Date = weekStart) => {
    setLoadingWeek(true)
    const stats = await getWeekStats(start)
    setWeekStats(stats)
    setLoadingWeek(false)
  }, [weekStart])

  /* ── View switching ───────────────────────────────────── */
  /* Fetching here (triggered by the tab click itself) rather than in a
     useEffect keyed on activeView avoids the extra synchronous setState
     -> re-render pass right after the view changes. */
  const handleViewChange = (view: ViewId) => {
    setActiveView(view)
    if (view === 'compare') void loadCompare()
    if (view === 'week') void loadWeek()
  }

  /* ── Auto-capture live snapshot every 1 min ─────────────
     Previously this ran inside a `useEffect` keyed on
     [efficiency, isConnected], firing every time those props changed and
     only logging once the 60s guard elapsed. That ties *what gets logged*
     to *whenever the prop happens to change* — if the parent briefly
     resets efficiency to 0 while re-fetching a sensor reading, that render
     can be the one that lands on the 60s boundary and gets captured,
     which produces the alternating "10, 0, 34, 0" pattern in the chart.
     A real interval sampling the latest values via a ref removes that
     race: it always samples "whatever the value is right now", exactly
     once every 60s, independent of render timing. */
  const latestRef = useRef({ efficiency, lightLevel, temperature, humidity, moisture, waterLevel, isConnected })
  useEffect(() => {
    latestRef.current = { efficiency, lightLevel, temperature, humidity, moisture, waterLevel, isConnected }
  }, [efficiency, lightLevel, temperature, humidity, moisture, waterLevel, isConnected])

  // Keep the latest onSnapshotAdded in a ref too. If it's recreated on every
  // parent render (no useCallback upstream) and we depended on it directly
  // below, the interval-owning effect would tear down and restart on every
  // render — resetting the 60s countdown before it ever elapses, so nothing
  // would ever get logged. Reading it via a ref lets the interval itself
  // mount exactly once for the component's lifetime.
  const onSnapshotAddedRef = useRef(onSnapshotAdded)
  useEffect(() => {
    onSnapshotAddedRef.current = onSnapshotAdded
  }, [onSnapshotAdded])

  useEffect(() => {
    const interval = setInterval(() => {
      const { isConnected, efficiency, lightLevel, temperature, humidity, moisture, waterLevel } = latestRef.current
      if (!isConnected) return
      // Guard against a transient NaN/undefined mid-read from the sensor layer.
      // Note: this intentionally does NOT filter out legitimate 0 values
      // (e.g. genuine 0% efficiency at night) — only non-finite ones.
      if (![efficiency, lightLevel, temperature, humidity, moisture, waterLevel].every(Number.isFinite)) return
      const snap: EfficiencySnapshot = {
        timestamp: Date.now(), efficiency, lightLevel, temperature, humidity, moisture, waterLevel
      }
      onSnapshotAddedRef.current(snap)
    }, LOG_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  /* ── Chart colors (Standard RGB/Hex for Chart.js) ────── */
  const colorPrimary = '#059669' // emerald-600
  const colorSecondary = '#3B82F6' // blue-500
  const colorAmber = '#D97706' // amber-600

  /**
   * Chart.js color options (ticks, grid, etc.) are parsed by Chart.js's own
   * color utility, which only understands literal CSS colors (hex, rgb,
   * named) — it cannot resolve `var(--x)` custom-property references, and
   * neither can the underlying Canvas 2D `fillStyle`/`strokeStyle` setters,
   * since custom-property substitution only happens during the CSS cascade,
   * not when a raw string is assigned in JS. Passing `var(--x)` straight
   * through (as the previous code did) silently fails to parse and Chart.js
   * falls back to its default (black), which is why axis text/grid — and
   * anything relying on the same options object — rendered unreadable.
   * Resolving the variable to its computed value up front fixes this.
   */
  const cssVar = (name: string, alphaHex = ''): string => {
    if (typeof window === 'undefined') return '#666666'
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value ? `${value}${alphaHex}` : '#666666'
  }

  /* ── Live Line Chart Data ────────────────────────────── */
  const liveLabels = liveSnapshots.map(s => {
    const d = new Date(s.timestamp)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  })

  const liveData = {
    labels: liveLabels,
    datasets: [
      {
        label: 'Photosynthesis Efficiency %',
        data: liveSnapshots.map(s => s.efficiency),
        borderColor: colorPrimary,
        backgroundColor: 'rgba(5, 150, 105, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  }

  /* ── Compare Chart Data ──────────────────────────────── */
  const buildCompareData = (stats: DailyStats | null) => {
    if (!stats || stats.snapshots.length === 0) return { labels: [], datasets: [] }
    return {
      labels: stats.snapshots.map(s => {
        const d = new Date(s.timestamp)
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      }),
      datasets: [{
        label: stats.date,
        data: stats.snapshots.map(s => s.efficiency),
        borderColor: stats.date === dateA ? colorPrimary : colorSecondary,
        backgroundColor: stats.date === dateA ? 'rgba(5, 150, 105, 0.15)' : 'rgba(59, 130, 246, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      }]
    }
  }

  /* ── Week Bar Chart Data ─────────────────────────────── */
  const weekData = {
    labels: weekStats.map(s => {
      const d = new Date(s.date + 'T00:00:00')
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }),
    datasets: [{
      label: 'Avg Daily Efficiency %',
      data: weekStats.map(s => s.avgEfficiency),
      backgroundColor: weekStats.map(s => {
        const hex = efficiencyColor(s.avgEfficiency)
        return `${hex}cc`
      }),
      borderRadius: 10,
      borderSkipped: false,
    }]
  }

  /* ── Chart Options ───────────────────────────────────── */
  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B', // slate-800
        titleColor: '#F8FAFC', // slate-50
        bodyColor: '#CBD5E1', // slate-300
        borderColor: '#334155', // slate-700
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: ctx => ` ${ctx.parsed.y?.toFixed(0) ?? '0'}% efficiency`,
        }
      },
    },
    scales: {
      x: {
        grid: { color: cssVar('--color-md-outline-variant', '33') },
        ticks: { color: cssVar('--color-md-on-surface-variant'), font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        min: 0, max: 100,
        grid: { color: cssVar('--color-md-outline-variant', '33') },
        ticks: {
          color: cssVar('--color-md-on-surface-variant'),
          font: { size: 10 },
          callback: v => `${v}%`,
        },
      },
    },
  }

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: ctx => ` ${ctx.parsed.y ?? 0}% avg efficiency`,
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: cssVar('--color-md-on-surface-variant'), font: { size: 10 } },
      },
      y: {
        min: 0, max: 100,
        grid: { color: cssVar('--color-md-outline-variant', '33') },
        ticks: {
          color: cssVar('--color-md-on-surface-variant'),
          font: { size: 10 },
          callback: v => `${v}%`,
        },
      },
    },
    onClick: (_, elements) => {
      if (elements.length > 0 && weekStats[elements[0].index]) {
        const s = weekStats[elements[0].index]
        setSelectedDayStats(s)
        setRecs(generateRecommendations(s))
      }
    },
  }

  /* ── Week navigation ─────────────────────────────────── */
  const shiftWeek = (dir: number) => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + dir * 7)
    setWeekStats([])
    setWeekStart(next)
    void loadWeek(next)
  }

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1
          className="text-[28px] font-medium leading-tight mb-1"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-md-on-surface)' }}
        >
          Greenhouse <span className="font-bold text-[--color-md-primary]">Analytics</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-md-on-surface-variant)' }}>
          Photosynthesis efficiency tracking · Firebase-backed history · Smart recommendations
        </p>
      </div>

      {/* Live Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Current Efficiency" value={efficiency} unit="%" color={efficiencyColor(efficiency)} />
        <StatCard label="Today's Snapshots" value={liveSnapshots.length} unit="pts" />
        <StatCard
          label="Session Peak"
          value={liveSnapshots.length > 0 ? Math.max(...liveSnapshots.map(s => s.efficiency)) : '—'}
          unit={liveSnapshots.length > 0 ? '%' : undefined}
          color={colorPrimary}
        />
        <StatCard
          label="Session Avg"
          value={liveSnapshots.length > 0
            ? Math.round(liveSnapshots.reduce((a, s) => a + s.efficiency, 0) / liveSnapshots.length)
            : '—'}
          unit={liveSnapshots.length > 0 ? '%' : undefined}
        />
      </div>

      {/* View Selector */}
      <div
        className="flex items-center gap-1 p-1 rounded-2xl w-fit"
        style={{ backgroundColor: 'var(--color-md-surface-container)' }}
      >
        <ViewTab id="live" label="Live Graph" icon={<TrendingUp className="size-3.5" />} active={activeView === 'live'} onSelect={handleViewChange} />
        <ViewTab id="compare" label="Date Compare" icon={<Calendar className="size-3.5" />} active={activeView === 'compare'} onSelect={handleViewChange} />
        <ViewTab id="week" label="Week View" icon={<BarChart2 className="size-3.5" />} active={activeView === 'week'} onSelect={handleViewChange} />
      </div>

      {/* ── LIVE VIEW ────────────────────────────────────── */}
      {activeView === 'live' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div
            className="xl:col-span-2 rounded-[28px] p-5 md-elevation-1"
            style={{ backgroundColor: 'var(--color-md-surface-container-low)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-md-on-surface-variant)' }}>Live Efficiency</p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-md-on-surface)' }}>
                  Photosynthesis Rate · {LOG_INTERVAL_MS / 1000}-sec intervals
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!isConnected && (
                  <span className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: 'var(--color-md-error-container)', color: 'var(--color-md-on-error-container)' }}>
                    Offline — No logging
                  </span>
                )}
                <button
                  onClick={onManualSync}
                  disabled={!isConnected}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 shadow-sm"
                  style={{ backgroundColor: 'var(--color-md-primary)', color: 'var(--color-md-on-primary)' }}
                >
                  Sync Now
                </button>
              </div>
            </div>
            <div style={{ height: '280px' }}>
              {liveSnapshots.length > 1
                ? <Line data={liveData} options={lineOptions} />
                : <EmptyGraph message={`Waiting for data — snapshots log every ${LOG_INTERVAL_MS / 1000} seconds while online`} />
              }
            </div>
          </div>

          {/* Current Sensor Values */}
          <div
            className="rounded-[28px] p-5 md-elevation-1 flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-md-surface-container-low)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-md-on-surface-variant)' }}>
              Current Readings
            </p>

            {[
              { label: 'Light (PAR)', value: lightLevel, unit: 'µmol', color: colorAmber },
              { label: 'Temperature', value: temperature.toFixed(1), unit: '°C' },
              { label: 'Humidity', value: humidity.toFixed(0), unit: '%' },
              { label: 'Soil Moisture', value: moisture.toFixed(0), unit: '%', color: colorPrimary },
              { label: 'Water Level', value: waterLevel.toFixed(0), unit: '%' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-md-on-surface-variant)' }}>{row.label}</span>
                <span className="text-sm font-bold" style={{ color: row.color ?? 'var(--color-md-on-surface)' }}>
                  {row.value} <span className="font-normal text-xs" style={{ color: 'var(--color-md-on-surface-variant)' }}>{row.unit}</span>
                </span>
              </div>
            ))}

            <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--color-md-outline-variant)' }}>
              <p className="text-[10px]" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Data is logged to Firebase every 1 min when online. Snapshots persist for historical comparison.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DATE COMPARE VIEW ────────────────────────────── */}
      {activeView === 'compare' && (
        <div className="flex flex-col gap-5">
          {/* Date pickers */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-md-on-surface-variant)' }}>Date A</label>
              <input
                type="date"
                value={dateA}
                max={toDateKey()}
                onChange={e => {
                  const val = e.target.value
                  setDateA(val)
                  if (activeView === 'compare') void loadCompare(val, dateB)
                }}
                className="px-3 py-1.5 rounded-xl text-sm font-medium border focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-md-surface-container)',
                  color: 'var(--color-md-on-surface)',
                  borderColor: 'var(--color-md-primary)',
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-md-on-surface-variant)' }}>Date B</label>
              <input
                type="date"
                value={dateB}
                max={toDateKey()}
                onChange={e => {
                  const val = e.target.value
                  setDateB(val)
                  if (activeView === 'compare') void loadCompare(dateA, val)
                }}
                className="px-3 py-1.5 rounded-xl text-sm font-medium border focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-md-surface-container)',
                  color: 'var(--color-md-on-surface)',
                  borderColor: 'var(--color-md-secondary)',
                }}
              />
            </div>
            <button
              onClick={() => void loadCompare()}
              className="px-4 py-1.5 rounded-xl text-xs font-bold"
              style={{ backgroundColor: 'var(--color-md-primary)', color: 'var(--color-md-on-primary)' }}
            >
              {loadingCompare ? 'Loading…' : 'Compare'}
            </button>
          </div>

          {/* Side-by-side charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[{ stats: statsA, date: dateA, color: colorPrimary }, { stats: statsB, date: dateB, color: colorSecondary }].map(({ stats, date, color }) => (
              <div
                key={date}
                className="rounded-[28px] p-5 md-elevation-1"
                style={{
                  backgroundColor: 'var(--color-md-surface-container-low)',
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-md-on-surface)' }}>{date}</p>
                {stats && (
                  <p className="text-[10px] mb-3" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                    Avg {stats.avgEfficiency}% · Peak {stats.peakEfficiency}% · {stats.snapshots.length} snapshots
                  </p>
                )}
                <div style={{ height: '200px' }}>
                  {stats && stats.snapshots.length > 1
                    ? <Line data={buildCompareData(stats)} options={lineOptions} />
                    : <EmptyGraph message="No data for this date" />
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations for dateA */}
          {selectedDayStats && recs.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Recommendations for {selectedDayStats.date}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recs.map((r, i) => <RecCard key={i} rec={r} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WEEK VIEW ────────────────────────────────────── */}
      {activeView === 'week' && (
        <div className="flex flex-col gap-5">
          {/* Week navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => shiftWeek(-1)}
              className="p-2 rounded-xl transition-all"
              style={{ backgroundColor: 'var(--color-md-surface-container)', color: 'var(--color-md-on-surface)' }}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-md-on-surface)' }}>
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' — '}
              {(() => { const e = new Date(weekStart); e.setDate(e.getDate() + 6); return e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })()}
            </span>
            <button
              onClick={() => shiftWeek(1)}
              disabled={weekStart >= (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d })()}
              className="p-2 rounded-xl transition-all disabled:opacity-30"
              style={{ backgroundColor: 'var(--color-md-surface-container)', color: 'var(--color-md-on-surface)' }}
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="text-xs" style={{ color: 'var(--color-md-on-surface-variant)' }}>
              Click a bar to see recommendations
            </span>
          </div>

          {/* Bar chart */}
          <div
            className="rounded-[28px] p-5 md-elevation-1"
            style={{ backgroundColor: 'var(--color-md-surface-container-low)' }}
          >
            <div style={{ height: '260px' }}>
              {loadingWeek
                ? <EmptyGraph message="Loading week data…" />
                : weekStats.some(s => s.snapshots.length > 0)
                  ? <Bar data={weekData} options={barOptions} />
                  : <EmptyGraph message="No data recorded this week" />
              }
            </div>
          </div>

          {/* Weekly summary */}
          {weekStats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Week Avg Efficiency"
                value={weekStats.every(s => s.snapshots.length === 0)
                  ? '—'
                  : Math.round(weekStats.filter(s => s.snapshots.length > 0).reduce((a, s) => a + s.avgEfficiency, 0) / weekStats.filter(s => s.snapshots.length > 0).length)}
                unit="%"
              />
              <StatCard
                label="Best Day Peak"
                value={weekStats.every(s => s.snapshots.length === 0) ? '—' : Math.max(...weekStats.map(s => s.peakEfficiency))}
                unit="%"
                color={colorPrimary}
              />
              <StatCard
                label="Total Optimal Hours"
                value={weekStats.every(s => s.snapshots.length === 0) ? '—' : parseFloat(weekStats.reduce((a, s) => a + s.hoursAtOptimal, 0).toFixed(1))}
                unit="h"
              />
              <StatCard
                label="Days With Data"
                value={weekStats.filter(s => s.snapshots.length > 0).length}
                unit="/ 7"
              />
            </div>
          )}

          {/* Day detail recommendations (on bar click) */}
          {selectedDayStats && activeView === 'week' && recs.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: 'var(--color-md-on-surface-variant)' }}>
                Recommendations for {selectedDayStats.date}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recs.map((r, i) => <RecCard key={i} rec={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

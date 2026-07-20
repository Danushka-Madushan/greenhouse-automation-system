import { db } from './firebase'
import { ref, set, get, child } from 'firebase/database'

/* ── Data Schema ──────────────────────────────────────────── */

export interface EfficiencySnapshot {
  timestamp: number       // Unix ms
  efficiency: number      // 0–100 photosynthesis efficiency %
  lightLevel: number      // raw LDR / PAR value
  temperature: number     // °C
  humidity: number        // %
  moisture: number        // soil moisture %
  waterLevel: number      // tank level %
}

export interface DailyStats {
  date: string            // 'YYYY-MM-DD'
  snapshots: EfficiencySnapshot[]
  avgEfficiency: number
  peakEfficiency: number
  minEfficiency: number
  hoursAtOptimal: number  // hours where efficiency >= 75%
}

/* ── Helpers ──────────────────────────────────────────────── */

/** Returns 'YYYY-MM-DD' for a given Date (or today) */
export const toDateKey = (d: Date = new Date()): string => {
  return d.toISOString().slice(0, 10)
}

/** Returns 'HH:mm:ss' for snapshot key — unique per second */
const toTimeKey = (d: Date = new Date()): string => {
  return d.toTimeString().slice(0, 8).replace(/:/g, '-')
}

/** Compute daily stats from an array of snapshots */
export const computeDailyStats = (date: string, snapshots: EfficiencySnapshot[]): DailyStats => {
  if (snapshots.length === 0) {
    return { date, snapshots: [], avgEfficiency: 0, peakEfficiency: 0, minEfficiency: 0, hoursAtOptimal: 0 }
  }

  const efficiencies = snapshots.map(s => s.efficiency)
  const avgEfficiency = Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length)
  const peakEfficiency = Math.max(...efficiencies)
  const minEfficiency = Math.min(...efficiencies)

  /* Each snapshot represents ~5 minutes = 5/60 hours */
  const optimalCount = efficiencies.filter(e => e >= 75).length
  const hoursAtOptimal = parseFloat(((optimalCount * 5) / 60).toFixed(1))

  return { date, snapshots, avgEfficiency, peakEfficiency, minEfficiency, hoursAtOptimal }
}

/* ── Write ────────────────────────────────────────────────── */

/**
 * Firebase Realtime Database rejects writes containing `undefined` or `NaN`
 * (it throws synchronously before the request is even sent). A single bad
 * sensor read (e.g. a momentary NaN from a divide-by-zero efficiency calc)
 * will otherwise silently kill that write with no visible feedback.
 */
const isValidSnapshot = (s: EfficiencySnapshot): boolean =>
  Object.values(s).every(v => typeof v === 'number' && Number.isFinite(v))

/**
 * Log one efficiency snapshot to Firebase Realtime DB.
 * Path: analytics/{YYYY-MM-DD}/{HH-mm-ss}
 * Only called when WebUI is online.
 *
 * Throws on failure (invalid data or a Firebase error) instead of swallowing
 * it, so callers — e.g. a "Sync Now" button — can tell the user it failed
 * rather than appearing to do nothing.
 */
export const logEfficiencySnapshot = async (snapshot: EfficiencySnapshot): Promise<void> => {
  if (!isValidSnapshot(snapshot)) {
    console.error('[Analytics] Skipped invalid snapshot (NaN/undefined field):', snapshot)
    throw new Error('Invalid snapshot: contains NaN or non-numeric field')
  }

  const dateKey = toDateKey(new Date(snapshot.timestamp))
  const timeKey = toTimeKey(new Date(snapshot.timestamp))
  const path = `analytics/${dateKey}/${timeKey}`

  try {
    await set(ref(db, path), snapshot)
  } catch (err) {
    console.error('[Analytics] Failed to log snapshot:', err)
    throw err
  }
}

/* ── Read ─────────────────────────────────────────────────── */

/**
 * Load all snapshots for a given date string ('YYYY-MM-DD').
 * Returns sorted by timestamp ascending.
 */
export const getDateSnapshots = async (dateKey: string): Promise<EfficiencySnapshot[]> => {
  try {
    const snapshot = await get(child(ref(db), `analytics/${dateKey}`))
    if (!snapshot.exists()) return []

    const data = snapshot.val() as Record<string, EfficiencySnapshot>
    return Object.values(data).sort((a, b) => a.timestamp - b.timestamp)
  } catch (err) {
    console.warn('[Analytics] Failed to load date snapshots:', err)
    return []
  }
}

/**
 * Load daily stats for 7 consecutive days starting from startDate.
 * Used for the week comparison bar chart.
 */
export const getWeekStats = async (startDate: Date): Promise<DailyStats[]> => {
  const results: DailyStats[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateKey = toDateKey(d)
    const snapshots = await getDateSnapshots(dateKey)
    results.push(computeDailyStats(dateKey, snapshots))
  }

  return results
}

/* ── Recommendations Engine ───────────────────────────────── */

export interface Recommendation {
  type: 'tip' | 'warning' | 'info'
  title: string
  description: string
}

/** Generate actionable recommendations from daily stats */
export const generateRecommendations = (stats: DailyStats): Recommendation[] => {
  const recs: Recommendation[] = []

  if (stats.snapshots.length === 0) return recs

  if (stats.avgEfficiency < 40) {
    recs.push({
      type: 'warning',
      title: 'Low Average Efficiency',
      description: `Average efficiency was only ${stats.avgEfficiency}%. Consider supplemental LED grow lighting to boost photosynthesis.`
    })
  }

  if (stats.peakEfficiency < 60) {
    recs.push({
      type: 'warning',
      title: 'Insufficient Light Peaks',
      description: `Peak efficiency was ${stats.peakEfficiency}%. Crops may benefit from repositioning or clearing obstructions from light sources.`
    })
  }

  if (stats.hoursAtOptimal < 4) {
    recs.push({
      type: 'tip',
      title: 'Extend Optimal Light Window',
      description: `Only ${stats.hoursAtOptimal}h of optimal-range light today. Aim for 6–8 hours above 75% efficiency for most crops.`
    })
  }

  if (stats.avgEfficiency >= 75) {
    recs.push({
      type: 'info',
      title: 'Excellent Growing Conditions',
      description: `Today's average efficiency of ${stats.avgEfficiency}% indicates ideal photosynthetic conditions. Maintain current settings.`
    })
  }

  /* Check for high-variance (stress events) */
  const efficiencies = stats.snapshots.map(s => s.efficiency)
  const mean = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length
  const variance = efficiencies.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / efficiencies.length
  const stdDev = Math.sqrt(variance)

  if (stdDev > 20) {
    recs.push({
      type: 'warning',
      title: 'High Efficiency Variance Detected',
      description: `Efficiency fluctuated significantly (±${Math.round(stdDev)}%). Check for intermittent shade, sensor issues, or ventilation disruptions.`
    })
  }

  return recs
}

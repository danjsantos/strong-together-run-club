// Metrics helpers. All week bucketing is done in Eastern Time (America/New_York)
// with weeks starting on Monday, to match the run club's local reality and the
// streak logic.

const TZ = 'America/New_York'

function etYmd(date: Date): { y: number; m: number; d: number } {
  // en-CA formats as YYYY-MM-DD
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}

function etWeekday(date: Date): number {
  // 0 = Sunday ... 6 = Saturday, evaluated in ET
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(date)
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[wd] ?? 0
}

function keyFromUTCParts(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

/** Monday (ET) of the week containing the given ISO timestamp, as 'YYYY-MM-DD'. */
export function etWeekStartKey(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  const { y, m, d } = etYmd(date)
  const wd = etWeekday(date)
  const offset = wd === 0 ? 6 : wd - 1 // days since Monday
  // Anchor at noon UTC to avoid any day-boundary slips, then step back.
  const base = new Date(Date.UTC(y, m - 1, d, 12))
  base.setUTCDate(base.getUTCDate() - offset)
  return keyFromUTCParts(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate())
}

/** The last `n` Monday week-start keys, oldest first, ending at the current week. */
export function lastNWeekStarts(n: number, now: Date = new Date()): string[] {
  const currentKey = etWeekStartKey(now)
  const [y, m, d] = currentKey.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d, 12))
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(base)
    dt.setUTCDate(dt.getUTCDate() - i * 7)
    keys.push(keyFromUTCParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()))
  }
  return keys
}

/** Bucket timestamps into the last `weeks` ET weeks. Older ones are ignored. */
export function weeklyCounts(
  timestamps: (string | null | undefined)[],
  weeks: number,
  now: Date = new Date(),
): { weekStart: string; count: number }[] {
  const keys = lastNWeekStarts(weeks, now)
  const counts: Record<string, number> = {}
  keys.forEach((k) => (counts[k] = 0))
  for (const ts of timestamps) {
    if (!ts) continue
    const k = etWeekStartKey(ts)
    if (k in counts) counts[k] += 1
  }
  return keys.map((k) => ({ weekStart: k, count: counts[k] }))
}

/** Short label like "Jun 16" from a 'YYYY-MM-DD' key (no timezone parsing). */
export function weekLabel(key: string): string {
  const [, m, d] = key.split('-').map(Number)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[m - 1]} ${d}`
}

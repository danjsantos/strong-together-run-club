const TZ = 'America/New_York'

// Returns the Monday-of-week key (YYYY-MM-DD) for a date, evaluated in Eastern Time.
function etWeekStart(date: Date): string {
  const etDateStr = date.toLocaleDateString('en-CA', { timeZone: TZ }) // 'YYYY-MM-DD' in ET
  const [y, m, d] = etDateStr.split('-').map(Number)
  // Fixed UTC noon keeps the weekday math stable and DST-proof.
  const dt = new Date(Date.UTC(y, m - 1, d, 12))
  const daysSinceMonday = (dt.getUTCDay() + 6) % 7 // 0=Sun..6=Sat -> 0 when Monday
  dt.setUTCDate(dt.getUTCDate() - daysSinceMonday)
  return dt.toISOString().slice(0, 10)
}

// Consecutive-week check-in streak, counting back from the most recent week
// with a check-in. A gap of one or more weeks ends the streak.
export function computeWeekStreak(dates: (string | Date | null | undefined)[]): number {
  const weeks = new Set<string>()
  for (const d of dates) {
    if (!d) continue
    const dt = new Date(d)
    if (isNaN(dt.getTime())) continue
    weeks.add(etWeekStart(dt))
  }
  if (weeks.size === 0) return 0

  const sorted = Array.from(weeks).sort() // ascending YYYY-MM-DD
  let streak = 1
  for (let i = sorted.length - 1; i > 0; i--) {
    const cur = Date.parse(sorted[i] + 'T00:00:00Z')
    const prev = Date.parse(sorted[i - 1] + 'T00:00:00Z')
    if (Math.round((cur - prev) / 86400000) === 7) {
      streak++
    } else {
      break
    }
  }
  return streak
}

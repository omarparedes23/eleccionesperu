// Loads pre-computed historical timeline from public/data/history-summary.json
// This is a single ~6KB file containing 73 timeline points from the Python snapshots.

export type HistoryPoint = {
  hora: string
  central: number
  min: number
  max: number
  pctActas: number
}

const SUMMARY_URL = "/data/history-summary.json"

export async function loadHistoricalTimeline(): Promise<HistoryPoint[]> {
  try {
    const res = await fetch(SUMMARY_URL, { cache: "force-cache" })
    if (!res.ok) return []
    const data: HistoryPoint[] = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"

type HistoryPoint = {
  hora: string
  central: number
  min: number
  max: number
  pctActas: number
}

const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + Math.round(n).toLocaleString("es-PE")
const fmt = (n: number) => Math.round(n).toLocaleString("es-PE")

export default function TimelineChart({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-center h-48">
        <p className="text-gray-400 text-sm text-center">
          Actualiza al menos 2 veces para ver la evolución de la proyección
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Evolución de la Proyección (sesión actual)
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={history} margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} width={80} />
          <Tooltip
            formatter={(v, name) => [fmtSigned(Number(v)), name]}
            contentStyle={{ fontSize: 11 }}
          />
          <ReferenceLine
            y={0} stroke="#64748b" strokeDasharray="4 2" strokeWidth={1.5}
            label={{ value: "Empate", position: "right", fontSize: 10 }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          <Line dataKey="max"     name="Máximo FP" stroke="#f97316" strokeDasharray="4 2" dot={false} strokeWidth={1.5} />
          <Line dataKey="central" name="Central"   stroke="#1d4ed8" dot={{ r: 3 }}        strokeWidth={2} />
          <Line dataKey="min"     name="Mínimo"    stroke="#dc2626" strokeDasharray="4 2" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

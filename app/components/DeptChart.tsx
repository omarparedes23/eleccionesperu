"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import type { DeptResult } from "../types"

export default function DeptChart({ departamentos }: { departamentos: DeptResult[] }) {
  const data = [...departamentos]
    .sort((a, b) => b.fp.pct - a.fp.pct)
    .map(d => ({
      nombre: d.nombre,
      FP:     parseFloat(d.fp.pct.toFixed(1)),
      JPP:    parseFloat(d.jpp.pct.toFixed(1)),
    }))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Resultados por Departamento
      </h2>
      <ResponsiveContainer width="100%" height={620}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v, name) => [`${Number(v).toFixed(1)}%`, name]}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine x={50} stroke="#64748b" strokeDasharray="4 2" strokeWidth={1.5} />
          <Bar dataKey="FP"  stackId="a" fill="#f97316" radius={[2, 0, 0, 2]} />
          <Bar dataKey="JPP" stackId="a" fill="#dc2626" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

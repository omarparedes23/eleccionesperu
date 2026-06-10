"use client"

import type { ProyeccionResult } from "../types"

const fmt = (n: number) => Math.round(n).toLocaleString("es-PE")
const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + fmt(n)

type Step = {
  label: string
  value: number
  sub: string
  color: "fp" | "jpp" | "neutral"
}

export default function ProjectionPipeline({ p }: { p: ProyeccionResult }) {
  const steps: Step[] = [
    {
      label: "Margen actual",
      value: p.margenActual,
      sub: "votos contabilizados",
      color: p.margenActual >= 0 ? "fp" : "jpp",
    },
    {
      label: "Pendiente nacional",
      value: p.pendienteNeto,
      sub: `IC 95%: ±${fmt(p.ic)}`,
      color: p.pendienteNeto >= 0 ? "fp" : "jpp",
    },
    {
      label: "Exterior (77 países)",
      value: p.exteriorNeto,
      sub: `${p.paisesConDatos} con datos`,
      color: p.exteriorNeto >= 0 ? "fp" : "jpp",
    },
  ]

  const ganador = p.central >= 0 ? "FP" : "JPP"
  const winnerColor = ganador === "FP" ? "text-orange-600" : "text-red-600"
  const winnerBg = ganador === "FP" ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200"

  // Calculate positions on a horizontal scale
  const range = Math.max(Math.abs(p.min), Math.abs(p.max), Math.abs(p.central)) * 1.2
  const scale = (v: number) => 50 + (v / range) * 45 // 5% to 95% of width

  return (
    <div className={`rounded-2xl border p-5 ${winnerBg}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
        Proyección Final — Pipeline
      </h2>

      {/* Pipeline steps */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            {/* Step number */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              step.color === "fp" ? "bg-orange-100 text-orange-600"
              : step.color === "jpp" ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-600"
            }`}>
              {i + 1}
            </div>

            {/* Label */}
            <div className="w-32 shrink-0">
              <p className="text-xs font-medium text-gray-700">{step.label}</p>
              <p className="text-[10px] text-gray-400">{step.sub}</p>
            </div>

            {/* Arrow */}
            <div className="text-gray-300 text-lg">→</div>

            {/* Value */}
            <div className="flex-1">
              <span className={`text-lg font-bold font-mono ${step.value >= 0 ? "text-orange-600" : "text-red-600"}`}>
                {fmtSigned(step.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Result bar visualization */}
      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-3">
        {/* Range bar */}
        <div
          className="absolute inset-y-0 bg-blue-100 rounded-full"
          style={{
            left: `${Math.min(scale(p.min), scale(p.max))}%`,
            width: `${Math.abs(scale(p.max) - scale(p.min))}%`,
          }}
        />
        {/* Central point */}
        <div
          className="absolute inset-y-0 w-1.5 bg-blue-500 rounded-full"
          style={{ left: `calc(${scale(p.central)}% - 3px)` }}
        />
        {/* Zero line */}
        {scale(0) > 5 && scale(0) < 95 && (
          <div
            className="absolute inset-y-0 w-px bg-gray-400"
            style={{ left: `${scale(0)}%` }}
          />
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-gray-400 mb-2">
        <span className="text-red-500">Min: {fmtSigned(p.min)}</span>
        <span className="text-gray-400">IC 95%</span>
        <span className="text-orange-500">Max: {fmtSigned(p.max)}</span>
      </div>

      {/* Final verdict */}
      <div className="text-center">
        <p className={`text-2xl font-bold ${winnerColor}`}>
          {ganador} {fmtSigned(p.central)} votos
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Rango: [{fmtSigned(p.min)} / {fmtSigned(p.max)}]
        </p>
      </div>
    </div>
  )
}

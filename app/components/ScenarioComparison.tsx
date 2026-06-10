"use client"

import type { ProyeccionResult, EscenarioPesimista } from "../types"

const fmt = (n: number) => Math.round(n).toLocaleString("es-PE")
const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + fmt(n)

export default function ScenarioComparison({
  base,
  pesimista,
}: {
  base: ProyeccionResult
  pesimista: EscenarioPesimista
}) {
  const baseGanador = base.central >= 0 ? "FP" : "JPP"
  const pesGanador = pesimista.central >= 0 ? "FP" : "JPP"

  const scenarios = [
    {
      label: "Escenario Base",
      central: base.central,
      min: base.min,
      max: base.max,
      ganador: baseGanador,
      desc: "Priors 1V → modelo blend",
      accent: "border-orange-200 bg-orange-50",
      textAccent: "text-orange-600",
    },
    {
      label: "Escenario Pesimista",
      central: pesimista.central,
      min: pesimista.min,
      max: pesimista.max,
      ganador: pesGanador,
      desc: `RP→60%, APP→50% · Δ ${fmtSigned(pesimista.deltaVsBase)}`,
      accent: "border-red-200 bg-red-50",
      textAccent: "text-red-600",
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
        Comparación de Escenarios
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.accent}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-700">{s.label}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                s.ganador === "FP" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
              }`}>
                {s.ganador} gana
              </span>
            </div>

            <p className={`text-2xl font-bold ${s.ganador === "FP" ? "text-orange-600" : "text-red-600"}`}>
              {fmtSigned(s.central)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">{s.desc}</p>

            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-red-500">Mín: {fmtSigned(s.min)}</span>
                <span className="text-gray-400">IC 95%</span>
                <span className="text-orange-500">Máx: {fmtSigned(s.max)}</span>
              </div>

              {/* Mini bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 bg-blue-100 rounded-full" style={{ left: "0%", right: "0%" }} />
                <div className="absolute inset-y-0 w-1 bg-blue-500 rounded-full" style={{ left: "50%" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delta callout */}
      <div className="mt-4 p-3 bg-gray-50 rounded-xl text-center">
        <p className="text-xs text-gray-500">
          Diferencia entre escenarios:{" "}
          <span className="font-semibold text-gray-700">
            {fmtSigned(pesimista.central - base.central)} votos
          </span>
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Sensibilidad: ±5% por país en priors exteriores
        </p>
      </div>
    </div>
  )
}

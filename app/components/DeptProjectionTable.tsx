"use client"

import type { DeptResult } from "../types"

const fmt = (n: number) => Math.round(n).toLocaleString("es-PE")
const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + fmt(n)

export default function DeptProjectionTable({ departamentos }: { departamentos: DeptResult[] }) {
  const conProj = departamentos.filter(d => d.proj !== null)
  const totalPendientes = conProj.reduce((s, d) => s + (d.proj?.actasRestantes ?? 0), 0)
  const totalJee = conProj.reduce((s, d) => s + (d.proj?.actasJee ?? 0), 0)
  const totalNeto = conProj.reduce((s, d) => s + (d.proj?.neto ?? 0), 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Proyección Regional — Por Departamento
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Votos estimados pendientes · Actas JEE incluidas con tendencia del dpto.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
              <th className="text-left px-4 py-2.5">Departamento</th>
              <th className="text-center px-2 py-2.5">Actas%</th>
              <th className="text-right px-2 py-2.5">Pend.</th>
              <th className="text-right px-2 py-2.5">JEE</th>
              <th className="text-right px-2 py-2.5 text-orange-300">FP Est.</th>
              <th className="text-right px-2 py-2.5 text-red-300">JPP Est.</th>
              <th className="text-right px-2 py-2.5">FP%</th>
              <th className="text-center px-2 py-2.5">Neto Pend.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {conProj
              .sort((a, b) => Math.abs(b.proj!.neto) - Math.abs(a.proj!.neto))
              .map(d => {
                const p = d.proj!
                const fpWins = p.neto >= 0
                const jeeStr = p.actasJee > 0 ? `(${p.actasJee})` : ""
                return (
                  <tr key={d.nombre} className={`hover:bg-gray-50 transition-colors ${fpWins ? "bg-orange-50/30" : "bg-red-50/30"}`}>
                    <td className="px-4 py-2 font-medium text-gray-800">{d.nombre}</td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <div className="w-10 bg-gray-200 rounded-full h-1">
                          <div className="h-1 rounded-full bg-blue-400" style={{ width: `${Math.min(d.pctActas, 100)}%` }} />
                        </div>
                        <span className="text-gray-600 w-8 text-right">{d.pctActas.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-gray-600">{fmt(p.actasRestantes)}</td>
                    <td className="px-2 py-2 text-right font-mono text-gray-400">{jeeStr || "—"}</td>
                    <td className={`px-2 py-2 text-right font-mono ${fpWins ? "text-orange-600 font-semibold" : "text-gray-500"}`}>
                      {fmt(p.fpEst)}
                    </td>
                    <td className={`px-2 py-2 text-right font-mono ${!fpWins ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                      {fmt(p.jppEst)}
                    </td>
                    <td className={`px-2 py-2 text-right ${fpWins ? "text-orange-600" : "text-red-600"}`}>
                      {(p.fpRatio * 100).toFixed(1)}%
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        fpWins ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                      }`}>
                        {fpWins ? "FP" : "JPP"} {fmtSigned(p.neto)}
                      </span>
                    </td>
                  </tr>
                )
              })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-800 text-white font-bold text-xs">
              <td className="px-4 py-2.5">PENDIENTE NACIONAL</td>
              <td className="px-2 py-2.5" />
              <td className="px-2 py-2.5 text-right font-mono">{fmt(totalPendientes)}</td>
              <td className="px-2 py-2.5 text-right font-mono text-gray-400">{totalJee > 0 ? `(${totalJee})` : ""}</td>
              <td className="px-2 py-2.5" />
              <td className="px-2 py-2.5" />
              <td className="px-2 py-2.5" />
              <td className="px-2 py-2.5 text-center">
                <span className={`font-semibold ${totalNeto >= 0 ? "text-orange-300" : "text-red-300"}`}>
                  {totalNeto >= 0 ? "FP" : "JPP"} {fmtSigned(totalNeto)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

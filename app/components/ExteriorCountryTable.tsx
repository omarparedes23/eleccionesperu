"use client"

import { useState, useMemo } from "react"
import type { ExteriorCountryResult } from "../types"

const fmt = (n: number) => Math.round(n).toLocaleString("es-PE")
const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + fmt(n)

type SortKey = "nombre" | "region" | "pctActas" | "blendPct" | "netoProy" | "fpVotos" | "jppVotos"
type SortDir = "asc" | "desc"

const REGION_COLORS: Record<string, string> = {
  AFRICA:   "bg-amber-100 text-amber-700",
  AMERICAS: "bg-blue-100 text-blue-700",
  ASIA:     "bg-emerald-100 text-emerald-700",
  EUROPA:   "bg-purple-100 text-purple-700",
  OCEANIA:  "bg-cyan-100 text-cyan-700",
}

const REGION_LABELS: Record<string, string> = {
  AFRICA:   "África",
  AMERICAS: "Américas",
  ASIA:     "Asia",
  EUROPA:   "Europa",
  OCEANIA:  "Oceanía",
}

export default function ExteriorCountryTable({ paises }: { paises: ExteriorCountryResult[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("netoProy")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [filterRegion, setFilterRegion] = useState<string>("all")
  const [search, setSearch] = useState("")

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const filtered = useMemo(() => {
    let data = [...paises]
    if (filterRegion !== "all") data = data.filter(p => p.region === filterRegion)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(p => p.nombre.toLowerCase().includes(q))
    }
    data.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1
      if (sortKey === "nombre") return mul * a.nombre.localeCompare(b.nombre)
      if (sortKey === "region") return mul * a.region.localeCompare(b.region)
      return mul * ((a[sortKey] as number) - (b[sortKey] as number))
    })
    return data
  }, [paises, sortKey, sortDir, filterRegion, search])

  const totalNeto = filtered.reduce((s, p) => s + p.netoProy, 0)
  const paisesConDatos = filtered.filter(p => p.fuente !== "prior").length

  const SortHeader = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: string }) => (
    <th
      className={`px-3 py-2.5 cursor-pointer hover:text-white transition-colors select-none text-${align}`}
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-[10px] opacity-50">{sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}</span>
      </span>
    </th>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Voto Exterior — Proyección por País
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Modelo blend bayesiano · {paisesConDatos} países con datos reales · {filtered.length} mostrados
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Neto proyectado</p>
            <p className={`text-lg font-bold ${totalNeto >= 0 ? "text-orange-600" : "text-red-600"}`}>
              {fmtSigned(totalNeto)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar país..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 w-48"
          />
          <div className="flex gap-1">
            {["all", "AMERICAS", "EUROPA", "ASIA", "AFRICA", "OCEANIA"].map(r => (
              <button
                key={r}
                onClick={() => setFilterRegion(r)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                  filterRegion === r
                    ? "bg-slate-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r === "all" ? "Todos" : REGION_LABELS[r] ?? r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-800 text-white">
            <tr>
              <SortHeader k="nombre" label="País" />
              <SortHeader k="region" label="Región" />
              <SortHeader k="pctActas" label="Actas%" align="right" />
              <th className="px-3 py-2.5 text-right">FP Real%</th>
              <SortHeader k="blendPct" label="Blend%" align="right" />
              <SortHeader k="netoProy" label="Neto Proy." align="right" />
              <th className="px-3 py-2.5 text-center">Fuente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => {
              const isReal = p.fuente === "real"
              const isPrior = p.fuente === "prior"
              return (
                <tr key={p.nombre} className={`hover:bg-gray-50 transition-colors ${isPrior ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2 font-medium text-gray-800">{p.nombre}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${REGION_COLORS[p.region] ?? "bg-gray-100"}`}>
                      {REGION_LABELS[p.region] ?? p.region}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-10 bg-gray-200 rounded-full h-1">
                        <div
                          className="h-1 rounded-full bg-blue-400"
                          style={{ width: `${Math.min(p.pctActas, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-600 w-8 text-right">{p.pctActas.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {p.fpPctReal !== null ? `${(p.fpPctReal * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${p.blendPct >= 0.5 ? "text-orange-600" : "text-red-600"}`}>
                    {(p.blendPct * 100).toFixed(1)}%
                  </td>
                  <td className={`px-3 py-2 text-right font-mono font-semibold ${p.netoProy >= 0 ? "text-orange-600" : "text-red-600"}`}>
                    {fmtSigned(p.netoProy)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isReal ? "bg-green-100 text-green-700"
                      : isPrior ? "bg-gray-100 text-gray-500"
                      : "bg-blue-100 text-blue-700"
                    }`}>
                      {isReal ? "real" : isPrior ? "prior" : "blend"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

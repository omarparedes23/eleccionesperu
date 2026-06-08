"use client"

import { useState, useEffect } from "react"

type Dept = {
  nombre: string
  actasContabilizadas: number
  totalActas: number
  pendientes: number
  fp: { votos: number; porcentaje: number }
  jpp: { votos: number; porcentaje: number }
}

type ApiData = {
  timestamp: string
  departamentos: Dept[]
  nacional: {
    fp: number
    jpp: number
    fpPct: number
    jppPct: number
    actasPct: number
    ventaja: number
  }
}

function fmt(n: number) {
  return n.toLocaleString("es-PE")
}

function ts(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function Page() {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchData(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/resultados")
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError("Error al cargar datos. Verifica tu conexion.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Cargando resultados de los 25 departamentos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => fetchData()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) return null

  const { nacional, departamentos } = data
  const lider = nacional.fp > nacional.jpp ? "FP" : "JPP"

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Elecciones Peru 2026 — Segunda Vuelta
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Fuente: ONPE — Datos en tiempo real
        </p>
      </div>

      {/* Resumen nacional */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-3 gap-4 items-center">

          {/* FP */}
          <div className="text-center">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">
              Fuerza Popular
            </p>
            <p className="text-4xl font-bold text-orange-500">
              {nacional.fpPct.toFixed(2)}%
            </p>
            <p className="text-gray-600 text-sm mt-1">{fmt(nacional.fp)} votos</p>
            <p className="text-xs text-gray-400 mt-0.5">Keiko Fujimori</p>
          </div>

          {/* Centro */}
          <div className="text-center border-x border-gray-100 px-4">
            <p className={`text-lg font-bold ${lider === "FP" ? "text-orange-500" : "text-red-600"}`}>
              {lider} +{fmt(Math.abs(nacional.ventaja))}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Actas contabilizadas</span>
                <span className="font-medium">{nacional.actasPct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${nacional.actasPct}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-400">
                Actualizado: {ts(data.timestamp)}
              </p>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <span className={refreshing ? "animate-spin" : ""}>⟳</span>
                {refreshing ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>

          {/* JPP */}
          <div className="text-center">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
              Juntos por el Peru
            </p>
            <p className="text-4xl font-bold text-red-600">
              {nacional.jppPct.toFixed(2)}%
            </p>
            <p className="text-gray-600 text-sm mt-1">{fmt(nacional.jpp)} votos</p>
            <p className="text-xs text-gray-400 mt-0.5">Roberto Sanchez Palomino</p>
          </div>
        </div>
      </div>

      {/* Tabla departamentos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Departamento</th>
                <th className="text-center px-3 py-3">Actas %</th>
                <th className="text-right px-3 py-3 text-orange-300">FP Votos</th>
                <th className="text-right px-3 py-3 text-orange-300">FP %</th>
                <th className="text-right px-3 py-3 text-red-300">JPP Votos</th>
                <th className="text-right px-3 py-3 text-red-300">JPP %</th>
                <th className="text-center px-3 py-3">Ventaja</th>
                <th className="text-right px-3 py-3">Pend.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {departamentos.map((d) => {
                const fpWins = d.fp.votos > d.jpp.votos
                const diff = Math.abs(d.fp.votos - d.jpp.votos)
                return (
                  <tr
                    key={d.nombre}
                    className={fpWins ? "bg-orange-50 hover:bg-orange-100" : "bg-red-50 hover:bg-red-100"}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-800">{d.nombre}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-blue-400"
                            style={{ width: `${d.actasContabilizadas}%` }}
                          />
                        </div>
                        <span className="text-gray-600 text-xs w-10 text-right">
                          {d.actasContabilizadas.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${fpWins ? "font-semibold text-orange-600" : "text-gray-600"}`}>
                      {fmt(d.fp.votos)}
                    </td>
                    <td className={`px-3 py-2.5 text-right ${fpWins ? "font-semibold text-orange-600" : "text-gray-500"}`}>
                      {d.fp.porcentaje.toFixed(2)}%
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${!fpWins ? "font-semibold text-red-600" : "text-gray-600"}`}>
                      {fmt(d.jpp.votos)}
                    </td>
                    <td className={`px-3 py-2.5 text-right ${!fpWins ? "font-semibold text-red-600" : "text-gray-500"}`}>
                      {d.jpp.porcentaje.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          fpWins
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {fpWins ? "FP" : "JPP"} +{fmt(diff)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-400 text-xs">
                      {fmt(d.pendientes)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold">
                <td className="px-4 py-3">TOTAL NACIONAL</td>
                <td className="px-3 py-3 text-center">{nacional.actasPct.toFixed(1)}%</td>
                <td className="px-3 py-3 text-right font-mono text-orange-300">{fmt(nacional.fp)}</td>
                <td className="px-3 py-3 text-right text-orange-300">{nacional.fpPct.toFixed(2)}%</td>
                <td className="px-3 py-3 text-right font-mono text-red-300">{fmt(nacional.jpp)}</td>
                <td className="px-3 py-3 text-right text-red-300">{nacional.jppPct.toFixed(2)}%</td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-sm font-bold ${lider === "FP" ? "text-orange-300" : "text-red-300"}`}>
                    {lider} +{fmt(Math.abs(nacional.ventaja))}
                  </span>
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Datos obtenidos directamente de la API publica de la ONPE •{" "}
        {departamentos.filter((d) => d.fp.votos > d.jpp.votos).length} depts FP •{" "}
        {departamentos.filter((d) => d.jpp.votos > d.fp.votos).length} depts JPP
      </p>
    </main>
  )
}

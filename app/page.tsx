"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import type { ApiResult } from "./types"
import { loadHistoricalTimeline, type HistoryPoint } from "./lib/load-snapshots"

const DeptChart = dynamic(() => import("./components/DeptChart"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-center h-48">
      <p className="text-gray-400 text-sm">Cargando gráfico...</p>
    </div>
  ),
})

const TimelineChart = dynamic(() => import("./components/TimelineChart"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-center h-48">
      <p className="text-gray-400 text-sm">Cargando gráfico...</p>
    </div>
  ),
})

const WorldMapChart = dynamic(() => import("./components/WorldMapChart"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-center h-48">
      <p className="text-gray-400 text-sm">Cargando mapa...</p>
    </div>
  ),
})

const ExteriorCountryTable = dynamic(() => import("./components/ExteriorCountryTable"), {
  ssr: false,
})

const ProjectionPipeline = dynamic(() => import("./components/ProjectionPipeline"), {
  ssr: false,
})

const ScenarioComparison = dynamic(() => import("./components/ScenarioComparison"), {
  ssr: false,
})

const DeptProjectionTable = dynamic(() => import("./components/DeptProjectionTable"), {
  ssr: false,
})

// --- Helpers ---
const fmt = (n: number) => Math.round(n).toLocaleString("es-PE")
const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + fmt(n)
const ts = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })



// --- Card exterior ---
function ExteriorCard({ ext }: { ext: ApiResult["exterior"] }) {
  const ganadorExt  = ext.fp.pct >= ext.jpp.pct ? "FP" : "JPP"
  const colorExt    = ganadorExt === "FP" ? "text-orange-600" : "text-red-600"

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Voto Exterior</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          ext.disponible ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {ext.disponible ? "Datos reales" : "Estimado"}
        </span>
      </div>

      {ext.disponible ? (
        <>
          <div className="text-xs text-gray-500">
            {ext.actas.toLocaleString()} / {ext.totalActas.toLocaleString()} actas ({ext.pctActas.toFixed(1)}%)
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-orange-50 rounded-lg p-2">
              <p className="text-xs text-orange-500 font-medium">FP</p>
              <p className="text-lg font-bold text-orange-600">{ext.fp.pct.toFixed(2)}%</p>
              <p className="text-xs text-gray-400">{fmt(ext.fp.votos)} votos</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-xs text-red-500 font-medium">JPP</p>
              <p className="text-lg font-bold text-red-600">{ext.jpp.pct.toFixed(2)}%</p>
              <p className="text-xs text-gray-400">{fmt(ext.jpp.votos)} votos</p>
            </div>
          </div>
          <p className={`text-center text-sm font-semibold ${colorExt}`}>
            Neto actual: {fmtSigned(ext.netoActual)} votos
          </p>
          {ext.ic > 0 && (
            <p className="text-center text-xs text-gray-400">IC 95%: ±{fmt(ext.ic)}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400">ONPE aún no publica — usando constantes históricas</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-orange-50 rounded-lg p-2">
              <p className="text-xs text-orange-500 font-medium">FP est.</p>
              <p className="text-xl font-bold text-orange-600">{ext.fp.pct.toFixed(0)}%</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-xs text-red-500 font-medium">JPP est.</p>
              <p className="text-xl font-bold text-red-600">{ext.jpp.pct.toFixed(0)}%</p>
            </div>
          </div>
          <p className="text-center text-sm font-semibold text-orange-600">
            Neto est.: {fmtSigned(ext.netoEstimado)}
          </p>
        </>
      )}
    </div>
  )
}

// --- Tabla de departamentos ---
function DeptTable({ departamentos }: { departamentos: ApiResult["departamentos"] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Departamento</th>
              <th className="text-center px-3 py-3">Actas%</th>
              <th className="text-right px-3 py-3 text-orange-300">FP Votos</th>
              <th className="text-right px-3 py-3 text-orange-300">FP%</th>
              <th className="text-right px-3 py-3 text-red-300">JPP Votos</th>
              <th className="text-right px-3 py-3 text-red-300">JPP%</th>
              <th className="text-center px-3 py-3">Ventaja</th>
              <th className="text-right px-3 py-3 text-blue-300">Proy.</th>
              <th className="text-right px-3 py-3">Pend.JEE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {departamentos.map(d => {
              const fpWins = d.fp.votos >= d.jpp.votos
              const diff   = Math.abs(d.fp.votos - d.jpp.votos)
              const rowBg  = fpWins ? "bg-orange-50 hover:bg-orange-100" : "bg-red-50 hover:bg-red-100"
              return (
                <tr key={d.nombre} className={rowBg}>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{d.nombre}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="w-14 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${Math.min(d.pctActas, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 w-10 text-right">{d.pctActas.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${fpWins ? "font-semibold text-orange-600" : "text-gray-600"}`}>
                    {fmt(d.fp.votos)}
                  </td>
                  <td className={`px-3 py-2.5 text-right ${fpWins ? "font-semibold text-orange-600" : "text-gray-500"}`}>
                    {d.fp.pct.toFixed(2)}%
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${!fpWins ? "font-semibold text-red-600" : "text-gray-600"}`}>
                    {fmt(d.jpp.votos)}
                  </td>
                  <td className={`px-3 py-2.5 text-right ${!fpWins ? "font-semibold text-red-600" : "text-gray-500"}`}>
                    {d.jpp.pct.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      fpWins ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                    }`}>
                      {fpWins ? "FP" : "JPP"} +{fmt(diff)}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-right text-xs font-mono ${
                    d.proj === null ? "text-gray-300" :
                    d.proj.neto >= 0 ? "text-orange-500" : "text-red-500"
                  }`}>
                    {d.proj ? fmtSigned(d.proj.neto) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-400 text-xs font-mono">
                    {d.pendientesJee > 0 ? fmt(d.pendientesJee) : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-800 text-white font-bold">
              <td className="px-4 py-3">TOTAL NACIONAL</td>
              <td className="px-3 py-3 text-center text-blue-200">
                {departamentos.reduce((a, d) => a + d.contabilizadas, 0).toLocaleString()} actas
              </td>
              <td className="px-3 py-3 text-right font-mono text-orange-300">
                {fmt(departamentos.reduce((a, d) => a + d.fp.votos, 0))}
              </td>
              <td colSpan={1} />
              <td className="px-3 py-3 text-right font-mono text-red-300">
                {fmt(departamentos.reduce((a, d) => a + d.jpp.votos, 0))}
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// --- Página principal ---
export default function Page() {
  const [data,       setData]       = useState<ApiResult | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [history,    setHistory]    = useState<HistoryPoint[]>([])
  const [autoMin,    setAutoMin]    = useState(0)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    const label = isRefresh ? "🔄 Actualizar" : "🚀 Carga inicial"
    console.log(`[${label}] Iniciando fetch /api/resultados...`)
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    const t0 = performance.now()
    try {
      const res = await fetch("/api/resultados")
      console.log(`[${label}] Response HTTP ${res.status} en ${Math.round(performance.now() - t0)}ms`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d: ApiResult = await res.json()
      console.log(`[${label}] Datos recibidos:`, {
        timestamp: d.timestamp,
        depts: d.departamentos.length,
        nacional: `${d.nacional.fpPct.toFixed(2)}% FP / ${d.nacional.jppPct.toFixed(2)}% JPP`,
        actas: `${d.nacional.actasPct.toFixed(1)}% (${d.nacional.contabilizadas.toLocaleString()}/${d.nacional.totalActas.toLocaleString()})`,
        ventaja: `${d.nacional.ventaja >= 0 ? "FP" : "JPP"} ${Math.abs(d.nacional.ventaja).toLocaleString()}`,
        proyeccion: `central=${Math.round(d.proyeccion.central)} min=${Math.round(d.proyeccion.min)} max=${Math.round(d.proyeccion.max)}`,
        exteriorPaises: d.exteriorPaises?.length ?? 0,
        paisesConDatos: d.proyeccion.paisesConDatos,
        escenarioPesimista: d.escenarioPesimista ? `central=${Math.round(d.escenarioPesimista.central)}` : "null",
      })
      // Debug: mostrar info de países en consola
      const dbg = (d as Record<string, unknown>)._debug as Record<string, unknown> | undefined
      if (dbg) {
        console.groupCollapsed(`[🔍 DEBUG] Países: ${dbg.paisesReales}/${dbg.paisesConDatos} reales, ${dbg.paisesRechazados} rechazados, ${dbg.paisesSinDatos} sin-datos, ${dbg.tiempoMs}ms`)
        console.log(`Depts: ${dbg.deptsOk}/25 | Exterior agg: ${dbg.extOk} | VPA global: ${dbg.vpaGlobal}`)
        const detalle = dbg.detalle as Array<{ nombre: string; estado: string; contabilizadas?: number; error?: string }> | undefined
        if (detalle) {
          const ok = detalle.filter(d => d.estado === "OK")
          const sinDatos = detalle.filter(d => d.estado === "sin-datos")
          const rechazados = detalle.filter(d => d.estado === "rechazado")
          if (ok.length > 0) console.log("✅ Con datos:", ok.map(p => `${p.nombre}(${p.contabilizadas})`).join(", "))
          if (sinDatos.length > 0) console.log("⚠️ Sin datos:", sinDatos.map(p => p.nombre).join(", "))
          if (rechazados.length > 0) console.log("❌ Rechazados:", rechazados.map(p => `${p.nombre}: ${p.error}`).join("; "))
        }
        console.groupEnd()
      }
      setData(d)
      setHistory(prev => [
        ...prev.slice(-29),
        {
          hora:    ts(d.timestamp),
          central: Math.round(d.proyeccion.central),
          min:     Math.round(d.proyeccion.min),
          max:     Math.round(d.proyeccion.max),
          pctActas: d.nacional.actasPct,
        },
      ])
    } catch (err) {
      console.error(`[${label}] Error:`, err)
      setError("Error al cargar datos. Verifica tu conexión.")
    } finally {
      setLoading(false)
      setRefreshing(false)
      console.log(`[${label}] Completado en ${Math.round(performance.now() - t0)}ms total`)
    }
  }, [])

  // Load historical snapshots on first render
  useEffect(() => {
    console.log("📚 Cargando histórico de snapshots...")
    loadHistoricalTimeline().then(h => {
      console.log(`📚 Histórico cargado: ${h.length} puntos, rango ${h[0]?.hora ?? "?"} → ${h[h.length - 1]?.hora ?? "?"}`)
      if (h.length > 0) setHistory(h)
    })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current)
    if (autoMin > 0) {
      autoRef.current = setInterval(() => fetchData(true), autoMin * 60_000)
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [autoMin, fetchData])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Cargando datos de los 25 departamentos + 77 países del exterior...</p>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-600">{error ?? "Sin datos"}</p>
      <button onClick={() => fetchData()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
        Reintentar
      </button>
    </div>
  )

  const { nacional, departamentos, exterior, exteriorPaises, proyeccion, escenarioPesimista } = data
  const lider       = nacional.fp >= nacional.jpp ? "FP" : "JPP"
  const liderColor  = lider === "FP" ? "text-orange-500" : "text-red-600"

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Elecciones Perú 2026 — Segunda Vuelta</h1>
        <p className="text-gray-400 text-xs mt-1">Fuente: API pública ONPE · {ts(data.timestamp)}</p>
      </div>

      {/* Resumen nacional */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-3 gap-4 items-center">

          <div className="text-center">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Fuerza Popular</p>
            <p className="text-4xl font-bold text-orange-500">{nacional.fpPct.toFixed(2)}%</p>
            <p className="text-gray-600 text-sm mt-1">{fmt(nacional.fp)} votos</p>
            <p className="text-xs text-gray-400 mt-0.5">Keiko Fujimori</p>
          </div>

          <div className="text-center border-x border-gray-100 px-4">
            <p className={`text-xl font-bold ${liderColor}`}>
              {lider} {fmtSigned(nacional.ventaja)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {departamentos.filter(d => d.fp.votos > d.jpp.votos).length} depts FP ·{" "}
              {departamentos.filter(d => d.jpp.votos > d.fp.votos).length} depts JPP
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Actas procesadas</span>
                <span className="font-medium">{nacional.actasPct.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${nacional.actasPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {nacional.contabilizadas.toLocaleString()} / {nacional.totalActas.toLocaleString()} actas
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400">Actualizado: {ts(data.timestamp)}</p>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <span className={refreshing ? "animate-spin inline-block" : ""}>⟳</span>
                {refreshing ? "Actualizando..." : "Actualizar"}
              </button>
              <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
                <span>Auto:</span>
                {[0, 1, 2, 5].map(m => (
                  <button
                    key={m}
                    onClick={() => setAutoMin(m)}
                    className={`px-2 py-0.5 rounded ${autoMin === m ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                  >
                    {m === 0 ? "Off" : `${m}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Juntos por el Perú</p>
            <p className="text-4xl font-bold text-red-600">{nacional.jppPct.toFixed(2)}%</p>
            <p className="text-gray-600 text-sm mt-1">{fmt(nacional.jpp)} votos</p>
            <p className="text-xs text-gray-400 mt-0.5">Roberto Sánchez Palomino</p>
          </div>
        </div>
      </div>

      {/* Proyección Pipeline */}
      <ProjectionPipeline p={proyeccion} />

      {/* Exterior card + Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExteriorCard ext={exterior} />
        {escenarioPesimista && (
          <ScenarioComparison base={proyeccion} pesimista={escenarioPesimista} />
        )}
      </div>

      {/* Gráficos — dynamic import con ssr:false */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DeptChart departamentos={departamentos} />
        <TimelineChart history={history} />
      </div>

      {/* Tabla departamentos */}
      <DeptTable departamentos={departamentos} />

      {/* Proyección regional por departamento */}
      <DeptProjectionTable departamentos={departamentos} />

      {/* Mapa mundial + Tabla exterior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WorldMapChart paises={exteriorPaises} />
        <ExteriorCountryTable paises={exteriorPaises} />
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Datos obtenidos de la API pública de ONPE · Proyección territorial IC 95% binomial · Exterior: modelo por país (77 países, blend bayesiano) · Prior 1V: USA/ESP/ITA 67/63/62%
      </p>
    </main>
  )
}

import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"
import type { DeptResult, ExteriorResult, ExteriorCountryResult, ProyeccionResult, EscenarioPesimista, ApiResult } from "../../types"
import { PAISES_EXTERIOR, REGIONES, ACTAS_TOTALES_EXTERIOR, TOTAL_ACTAS_EXTERIOR, VARIACION_EXTERIOR_PCT, Z_95 } from "../../lib/paises-exterior"

// Load priors from static JSON files (read once at module init)
let PRIORS_BASE: Record<string, number> = {}
let PRIORS_PESIMISTA: Record<string, number> = {}
try {
  PRIORS_BASE = JSON.parse(readFileSync(join(process.cwd(), "public", "data", "priors_1v.json"), "utf-8"))
  PRIORS_PESIMISTA = JSON.parse(readFileSync(join(process.cwd(), "public", "data", "priors_1v_pesimista.json"), "utf-8"))
} catch { /* priors not available */ }

const BASE = "https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend"

const CODIGO_FP  = 8
const CODIGO_JPP = 10
const ID_ELECCION = 10

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept":     "application/json",
  "Referer":    "https://resultadosegundavuelta.onpe.gob.pe/main/resumen",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
}

type OParticipante = {
  codigoAgrupacionPolitica: number
  totalVotosValidos: number
  porcentajeVotosValidos: number
}

type OTotales = {
  contabilizadas: number
  totalActas: number
  actasContabilizadas: number
  pendientesJee: number
}

// --- Fetchers ---
async function fetchDept(ubigeo: string) {
  const qs = `idEleccion=${ID_ELECCION}&tipoFiltro=ubigeo_nivel_01&idAmbitoGeografico=1&idUbigeoDepartamento=${ubigeo}`
  const [rT, rP] = await Promise.all([
    fetch(`${BASE}/resumen-general/totales?${qs}`,       { headers: HEADERS, cache: "no-store" }),
    fetch(`${BASE}/resumen-general/participantes?${qs}`, { headers: HEADERS, cache: "no-store" }),
  ])
  if (!rT.ok || !rP.ok) throw new Error(`HTTP error dept ${ubigeo}`)
  const [dT, dP] = await Promise.all([rT.json(), rP.json()])
  return { totales: dT.data as OTotales, participantes: dP.data as OParticipante[] }
}

async function fetchExterior(): Promise<{ totales: OTotales; participantes: OParticipante[] } | null> {
  const qs = `idEleccion=${ID_ELECCION}&tipoFiltro=ambito_geografico&idAmbitoGeografico=2`
  try {
    const [rT, rP] = await Promise.all([
      fetch(`${BASE}/resumen-general/totales?${qs}`,       { headers: HEADERS, cache: "no-store" }),
      fetch(`${BASE}/resumen-general/participantes?${qs}`, { headers: HEADERS, cache: "no-store" }),
    ])
    const [dT, dP] = await Promise.all([rT.json(), rP.json()])
    const t = dT.data as OTotales
    if (t.contabilizadas > 0) {
      return { totales: t, participantes: dP.data as OParticipante[] }
    }
  } catch { /* endpoint aún no disponible */ }
  return null
}

async function fetchPaisExterior(
  ubigeoPais: string,
  nombrePais: string,
  ubigeoDept: string,
): Promise<{ nombre: string; contabilizadas: number; totalActas: number; fpV: number; jppV: number } | null> {
  const qs = `idEleccion=${ID_ELECCION}&tipoFiltro=ubigeo_nivel_02&idAmbitoGeografico=2&idUbigeoDepartamento=${ubigeoDept}&idUbigeoProvincia=${ubigeoPais}`
  try {
    const [rT, rP] = await Promise.all([
      fetch(`${BASE}/resumen-general/totales?${qs}`,       { headers: HEADERS, cache: "no-store" }),
      fetch(`${BASE}/resumen-general/participantes?${qs}`, { headers: HEADERS, cache: "no-store" }),
    ])
    if (!rT.ok || !rP.ok) return null
    const t = (await rT.json()).data as OTotales
    const p = (await rP.json()).data as OParticipante[]
    const fp  = p.find(x => x.codigoAgrupacionPolitica === CODIGO_FP)
    const jpp = p.find(x => x.codigoAgrupacionPolitica === CODIGO_JPP)
    if (!fp || !jpp) return null
    if (t.contabilizadas <= 0) return null
    return {
      nombre: nombrePais,
      contabilizadas: t.contabilizadas,
      totalActas: t.totalActas,
      fpV: fp.totalVotosValidos,
      jppV: jpp.totalVotosValidos,
    }
  } catch {
    return null
  }
}

// --- Blend bayesiano por país ---
function calcularExteriorPaises(
  paisesReales: Map<string, { contabilizadas: number; totalActas: number; fpV: number; jppV: number }>,
  vpaGlobal: number,
): ExteriorCountryResult[] {
  const filas: ExteriorCountryResult[] = []

  for (const [ubigeo, config] of Object.entries(PAISES_EXTERIOR)) {
    const totalActasP = ACTAS_TOTALES_EXTERIOR[config.nombre] ?? 1
    const real = paisesReales.get(config.nombre)

    let fpPctReal: number | null = null
    let pctActas = 0
    let blend = config.fpPrior
    let fpEst: number, jppEst: number
    let fuente: "real" | "real+prior" | "prior"
    let contabilizadas = 0

    if (real) {
      const { contabilizadas: cont, fpV, jppV } = real
      contabilizadas = cont
      const tv = fpV + jppV
      const fpR = tv > 0 ? fpV / tv : config.fpPrior
      fpPctReal = fpR
      pctActas = totalActasP > 0 ? (cont / totalActasP) * 100 : 0

      const vpaP = cont > 0 ? tv / cont : vpaGlobal
      blend = (pctActas / 100) * fpR + (1 - pctActas / 100) * config.fpPrior
      const vpaBlend = (pctActas / 100) * vpaP + (1 - pctActas / 100) * vpaGlobal

      const pend = totalActasP - cont
      fpEst  = fpV + pend * vpaBlend * blend
      jppEst = jppV + pend * vpaBlend * (1 - blend)
      fuente = pend === 0 ? "real" : "real+prior"
    } else {
      fpEst  = totalActasP * vpaGlobal * config.fpPrior
      jppEst = totalActasP * vpaGlobal * (1 - config.fpPrior)
      fuente = "prior"
    }

    filas.push({
      nombre: config.nombre,
      region: config.region,
      contabilizadas,
      totalActas: totalActasP,
      pctActas,
      fpVotos: real?.fpV ?? 0,
      jppVotos: real?.jppV ?? 0,
      fpPctReal,
      fpPrior: config.fpPrior,
      blendPct: blend,
      netoProy: fpEst - jppEst,
      fuente,
    })
  }

  return filas.sort((a, b) => Math.abs(b.netoProy) - Math.abs(a.netoProy))
}

// --- Escenario pesimista ---
function calcularEscenarioPesimista(
  margenActual: number,
  pendienteNeto: number,
  ciNac: number,
  exteriorPaises: ExteriorCountryResult[],
  vpaGlobal: number,
): EscenarioPesimista {
  let netoPes = 0
  let varPes = 0

  for (const pais of exteriorPaises) {
    const basePrior = PRIORS_BASE[pais.nombre]
    const pesPrior  = PRIORS_PESIMISTA[pais.nombre]
    if (basePrior == null || pesPrior == null) continue
    const priorPes = Math.max(0.01, Math.min(0.99, pesPrior))
    const totalActasP = ACTAS_TOTALES_EXTERIOR[pais.nombre] ?? 1
    const fpEst  = totalActasP * vpaGlobal * priorPes
    const jppEst = totalActasP * vpaGlobal * (1 - priorPes)
    netoPes += fpEst - jppEst
    varPes += (totalActasP * vpaGlobal * 2 * (VARIACION_EXTERIOR_PCT / 100)) ** 2
  }

  const ciPes = Z_95 * Math.sqrt(varPes)

  return {
    exteriorNeto: netoPes,
    deltaVsBase: netoPes - exteriorPaises.reduce((s, p) => s + p.netoProy, 0),
    central: margenActual + pendienteNeto + netoPes,
    min: margenActual + (pendienteNeto - ciNac) + (netoPes - ciPes),
    max: margenActual + (pendienteNeto + ciNac) + (netoPes + ciPes),
    metodo: "RP→60%, APP→50% (priors 1V reales)",
  }
}

// --- Handler principal ---
export async function GET() {
  console.log("[API] Iniciando scraping: 25 depts + exterior + 77 países...")
  const t0 = Date.now()

  // Departamentos + exterior agregado + países individuales en paralelo
  const [deptSettled, extRaw, paisesResults] = await Promise.all([
    Promise.allSettled(
      Object.entries({
        "010000": "Amazonas",   "020000": "Ancash",       "030000": "Apurimac",
        "040000": "Arequipa",   "050000": "Ayacucho",     "060000": "Cajamarca",
        "070000": "Cusco",      "080000": "Huancavelica", "090000": "Huanuco",
        "100000": "Ica",        "110000": "Junin",        "120000": "La Libertad",
        "130000": "Lambayeque", "140000": "Lima",         "150000": "Loreto",
        "160000": "Pasco",      "170000": "Madre de Dios","180000": "Moquegua",
        "190000": "Piura",      "200000": "Puno",         "210000": "San Martin",
        "220000": "Tacna",      "230000": "Tumbes",       "240000": "Callao",
        "250000": "Ucayali",
      }).map(async ([ubigeo, nombre]) => ({
        nombre,
        ...(await fetchDept(ubigeo)),
      }))
    ),
    fetchExterior(),
    Promise.allSettled(
      Object.entries(PAISES_EXTERIOR).map(async ([ubigeo, config]) => {
        const result = await fetchPaisExterior(ubigeo, config.nombre, REGIONES[config.region])
        return { nombre: config.nombre, result }
      })
    ),
  ])

  const deptOk = deptSettled.filter(r => r.status === "fulfilled").length
  const extOk = extRaw ? "OK" : "null"
  const paisesFulfilled = paisesResults.filter(r => r.status === "fulfilled")
  const paisesOk = paisesFulfilled.filter(r => (r as PromiseFulfilledResult<{ nombre: string; result: unknown }>).value.result !== null).length
  const paisesRechazados = paisesResults.filter(r => r.status === "rejected").length
  const paisesSinDatos = paisesFulfilled.filter(r => (r as PromiseFulfilledResult<{ nombre: string; result: unknown }>).value.result === null).length
  console.log(`[API] Scraping completado en ${Date.now() - t0}ms: depts=${deptOk}/25, ext=${extOk}, países OK=${paisesOk}/77, rechazados=${paisesRechazados}, sinDatos=${paisesSinDatos}`)

  // Procesar departamentos
  const departamentos: DeptResult[] = deptSettled
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchDept>> & { nombre: string }> =>
      r.status === "fulfilled"
    )
    .map(({ value: { nombre, totales: t, participantes: p } }) => {
      const fp  = p.find(x => x.codigoAgrupacionPolitica === CODIGO_FP)
      const jpp = p.find(x => x.codigoAgrupacionPolitica === CODIGO_JPP)
      const fpV  = fp?.totalVotosValidos  ?? 0
      const jppV = jpp?.totalVotosValidos ?? 0
      const totalV = fpV + jppV
      const contabilizadas  = t.contabilizadas
      const totalActas      = t.totalActas
      const actasPendientes = totalActas - contabilizadas

      let proj: DeptResult["proj"] = null
      if (contabilizadas > 0 && actasPendientes > 0 && totalV > 0) {
        const vpa      = totalV / contabilizadas
        const vPend    = vpa * actasPendientes
        const fpRatio  = fpV  / totalV
        const jppRatio = jppV / totalV
        const fpEst    = Math.round(vPend * fpRatio)
        const jppEst   = Math.round(vPend * jppRatio)
        const varianza = vPend * vPend * 4 * fpRatio * jppRatio / totalV
        proj = {
          fpEst, jppEst, neto: fpEst - jppEst, varianza,
          actasRestantes: actasPendientes,
          actasJee: t.pendientesJee ?? 0,
          fpRatio,
        }
      }

      return {
        nombre,
        pctActas:       t.actasContabilizadas,
        contabilizadas,
        totalActas,
        actasPendientes,
        pendientesJee:  t.pendientesJee ?? 0,
        fp:  { votos: fpV,  pct: fp?.porcentajeVotosValidos  ?? 0 },
        jpp: { votos: jppV, pct: jpp?.porcentajeVotosValidos ?? 0 },
        proj,
      }
    })
    .sort((a, b) => (b.fp.votos - b.jpp.votos) - (a.fp.votos - a.jpp.votos))

  // Totales nacionales
  const totals = departamentos.reduce(
    (acc, d) => ({
      fp:   acc.fp   + d.fp.votos,
      jpp:  acc.jpp  + d.jpp.votos,
      actas: acc.actas + d.totalActas,
      cont:  acc.cont  + d.contabilizadas,
    }),
    { fp: 0, jpp: 0, actas: 0, cont: 0 }
  )
  const totalVotosNac = totals.fp + totals.jpp
  const margenActual  = totals.fp - totals.jpp

  // Proyección territorial
  let pendienteNeto = 0, varianzaNac = 0
  for (const d of departamentos) {
    if (d.proj) {
      pendienteNeto += d.proj.neto
      varianzaNac   += d.proj.varianza
    }
  }
  const ciNac = Z_95 * Math.sqrt(varianzaNac)

  // Exterior agregado
  let exterior: ExteriorResult
  if (extRaw) {
    const { totales: tE, participantes: pE } = extRaw
    const fpE  = pE.find(x => x.codigoAgrupacionPolitica === CODIGO_FP)
    const jppE = pE.find(x => x.codigoAgrupacionPolitica === CODIGO_JPP)
    const fpEV  = fpE?.totalVotosValidos  ?? 0
    const jppEV = jppE?.totalVotosValidos ?? 0
    const totalEV = fpEV + jppEV
    const fpEPct  = totalEV > 0 ? fpEV / totalEV : 0
    const netoExtC = fpEV - jppEV

    let ciExt = 0
    const actasExtPend = tE.totalActas - tE.contabilizadas
    if (tE.contabilizadas > 0 && actasExtPend > 0 && totalEV > 0) {
      const vpaE   = totalEV / tE.contabilizadas
      const vPendE = vpaE * actasExtPend
      const varE   = vPendE * vPendE * 4 * fpEPct * (1 - fpEPct) / totalEV
      ciExt = Z_95 * Math.sqrt(varE)
    }

    exterior = {
      disponible: true,
      actas:    tE.contabilizadas,
      totalActas: tE.totalActas,
      pctActas: tE.totalActas > 0 ? (tE.contabilizadas / tE.totalActas) * 100 : 0,
      fp:  { votos: fpEV,  pct: fpEPct * 100 },
      jpp: { votos: jppEV, pct: (1 - fpEPct) * 100 },
      netoActual:   netoExtC,
      netoEstimado: netoExtC,
      netoMin:      netoExtC - ciExt,
      netoMax:      netoExtC + ciExt,
      ic:           ciExt,
    }
  } else {
    exterior = {
      disponible: false,
      actas: 0, totalActas: TOTAL_ACTAS_EXTERIOR, pctActas: 0,
      fp:  { votos: 0, pct: 65 },
      jpp: { votos: 0, pct: 35 },
      netoActual: 0,
      netoEstimado: 0,
      netoMin: -50000,
      netoMax: 50000,
      ic: 50000,
    }
  }

  // Exterior por países (blend bayesiano)
  const paisesReales = new Map<string, { contabilizadas: number; totalActas: number; fpV: number; jppV: number }>()
  let vpaSum = 0, vpaCount = 0
  for (const r of paisesResults.filter((r): r is PromiseFulfilledResult<{ nombre: string; result: NonNullable<Awaited<ReturnType<typeof fetchPaisExterior>>> }> => r.status === "fulfilled" && r.value.result !== null)) {
    const { nombre, result } = r.value
    if (result) {
      paisesReales.set(nombre, result)
      if (result.contabilizadas > 0) {
        vpaSum += result.fpV + result.jppV
        vpaCount += result.contabilizadas
      }
    }
  }
  const vpaGlobal = vpaCount > 0 ? Math.max(vpaSum / vpaCount, 150) : 175
  console.log(`[API] Exterior países: ${paisesReales.size} con datos reales, vpaGlobal=${vpaGlobal.toFixed(1)}`)

  const exteriorPaises = calcularExteriorPaises(paisesReales, vpaGlobal)
  const netoExtPaises = exteriorPaises.reduce((s, p) => s + p.netoProy, 0)
  const paisesConDatos = exteriorPaises.filter(p => p.contabilizadas > 0).length
  const coberturaExt = exteriorPaises.reduce((s, p) => s + p.pctActas * p.totalActas, 0) / TOTAL_ACTAS_EXTERIOR

  // Calcular CI del exterior por país
  let varianzaExt = 0
  for (const pais of exteriorPaises) {
    const totalActasP = ACTAS_TOTALES_EXTERIOR[pais.nombre] ?? 1
    varianzaExt += (totalActasP * vpaGlobal * 2 * (VARIACION_EXTERIOR_PCT / 100)) ** 2
  }
  const ciExtPaises = Z_95 * Math.sqrt(varianzaExt)

  const central = margenActual + pendienteNeto + netoExtPaises
  const minVal  = margenActual + (pendienteNeto - ciNac) + (netoExtPaises - ciExtPaises)
  const maxVal  = margenActual + (pendienteNeto + ciNac) + (netoExtPaises + ciExtPaises)
  console.log(`[API] Proyección: central=${Math.round(central)}, ext=${Math.round(netoExtPaises)}, paises=${paisesConDatos}/${exteriorPaises.length}`)

  const proyeccion: ProyeccionResult = {
    margenActual, pendienteNeto, ic: ciNac,
    exteriorNeto: netoExtPaises,
    central, min: minVal, max: maxVal,
    exteriorEsReal: paisesConDatos > 0,
    paisesConDatos,
    totalPaises: Object.keys(PAISES_EXTERIOR).length,
    vpaGlobal,
    coberturaExt: coberturaExt * 100,
  }

  const escenarioPesimista: EscenarioPesimista = calcularEscenarioPesimista(margenActual, pendienteNeto, ciNac, exteriorPaises, vpaGlobal)

  // Debug info for diagnosing country fetches from browser console
  const debugPaises = [
    ...paisesResults
      .filter((r): r is PromiseFulfilledResult<{ nombre: string; result: NonNullable<Awaited<ReturnType<typeof fetchPaisExterior>>> | null }> =>
        r.status === "fulfilled" && r.value.result !== null
      )
      .map(r => ({ nombre: r.value.nombre, estado: "OK", contabilizadas: r.value.result!.contabilizadas })),
    ...paisesResults
      .filter((r): r is PromiseFulfilledResult<{ nombre: string; result: null }> =>
        r.status === "fulfilled" && r.value.result === null
      )
      .map(r => ({ nombre: r.value.nombre, estado: "sin-datos" })),
    ...paisesResults
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r, i) => ({ nombre: `error-${i}`, estado: "rechazado", error: String(r.reason)?.slice(0, 80) })),
  ]

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    departamentos,
    nacional: {
      fp: totals.fp, jpp: totals.jpp,
      fpPct:  totalVotosNac > 0 ? (totals.fp  / totalVotosNac) * 100 : 0,
      jppPct: totalVotosNac > 0 ? (totals.jpp / totalVotosNac) * 100 : 0,
      actasPct:      totals.actas > 0 ? (totals.cont / totals.actas) * 100 : 0,
      contabilizadas: totals.cont,
      totalActas:     totals.actas,
      ventaja: margenActual,
    },
    exterior,
    exteriorPaises,
    proyeccion,
    escenarioPesimista,
    _debug: {
      tiempoMs: Date.now() - t0,
      deptsOk: deptOk,
      extOk: extOk,
      paisesReales: paisesReales.size,
      paisesConDatos,
      paisesRechazados,
      paisesSinDatos,
      vpaGlobal: Math.round(vpaGlobal),
      detalle: debugPaises,
    },
  } satisfies ApiResult & { _debug: Record<string, unknown> })
}

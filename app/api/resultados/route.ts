import { NextResponse } from "next/server"
import type { DeptResult, ExteriorResult, ApiResult } from "../../types"

const BASE = "https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend"

const CODIGO_FP  = 8
const CODIGO_JPP = 10
const ID_ELECCION = 10
const Z_95 = 1.96

// Constantes de fallback para exterior cuando ONPE aún no publica
const PADRON_EXTERIOR         = 1_200_000
const PARTICIPACION_EXT_PCT   = 36.0
const FP_PCT_EXTERIOR         = 65.0
const VARIACION_EXTERIOR_PCT  = 5.0

const DEPARTAMENTOS: Record<string, string> = {
  "010000": "Amazonas",   "020000": "Ancash",       "030000": "Apurimac",
  "040000": "Arequipa",   "050000": "Ayacucho",     "060000": "Cajamarca",
  "070000": "Cusco",      "080000": "Huancavelica", "090000": "Huanuco",
  "100000": "Ica",        "110000": "Junin",        "120000": "La Libertad",
  "130000": "Lambayeque", "140000": "Lima",         "150000": "Loreto",
  "160000": "Pasco",      "170000": "Madre de Dios","180000": "Moquegua",
  "190000": "Piura",      "200000": "Puno",         "210000": "San Martin",
  "220000": "Tacna",      "230000": "Tumbes",       "240000": "Callao",
  "250000": "Ucayali",
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept":     "application/json",
  "Referer":    "https://resultadosegundavuelta.onpe.gob.pe/main/resumen",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
}

// --- Tipos ONPE ---
type OParticipante = {
  codigoAgrupacionPolitica: number
  totalVotosValidos: number
  porcentajeVotosValidos: number
}

type OTotales = {
  contabilizadas: number        // count bruto de actas procesadas
  totalActas: number            // total de actas
  actasContabilizadas: number   // porcentaje (0-100)
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

// --- Handler principal ---
export async function GET() {
  // Todos los departamentos + exterior en paralelo
  const [deptSettled, extRaw] = await Promise.all([
    Promise.allSettled(
      Object.entries(DEPARTAMENTOS).map(async ([ubigeo, nombre]) => ({
        nombre,
        ...(await fetchDept(ubigeo)),
      }))
    ),
    fetchExterior(),
  ])

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
        // IC binomial: var(neto) = vPend² × 4 × p × q / n
        const varianza = vPend * vPend * 4 * fpRatio * jppRatio / totalV
        proj = { fpEst, jppEst, neto: fpEst - jppEst, varianza }
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

  // Exterior
  let exterior: ExteriorResult
  let netoExtC: number, netoExtMin: number, netoExtMax: number
  let exteriorEsReal = false

  if (extRaw) {
    const { totales: tE, participantes: pE } = extRaw
    const fpE  = pE.find(x => x.codigoAgrupacionPolitica === CODIGO_FP)
    const jppE = pE.find(x => x.codigoAgrupacionPolitica === CODIGO_JPP)
    const fpEV  = fpE?.totalVotosValidos  ?? 0
    const jppEV = jppE?.totalVotosValidos ?? 0
    const totalEV = fpEV + jppEV
    const fpEPct  = totalEV > 0 ? fpEV / totalEV : 0
    netoExtC = fpEV - jppEV

    let ciExt = 0
    const actasExtPend = tE.totalActas - tE.contabilizadas
    if (tE.contabilizadas > 0 && actasExtPend > 0 && totalEV > 0) {
      const vpaE   = totalEV / tE.contabilizadas
      const vPendE = vpaE * actasExtPend
      const varE   = vPendE * vPendE * 4 * fpEPct * (1 - fpEPct) / totalEV
      ciExt = Z_95 * Math.sqrt(varE)
    }
    netoExtMin = netoExtC - ciExt
    netoExtMax = netoExtC + ciExt
    exteriorEsReal = true
    exterior = {
      disponible: true,
      actas:    tE.contabilizadas,
      totalActas: tE.totalActas,
      pctActas: tE.totalActas > 0 ? (tE.contabilizadas / tE.totalActas) * 100 : 0,
      fp:  { votos: fpEV,  pct: fpEPct * 100 },
      jpp: { votos: jppEV, pct: (1 - fpEPct) * 100 },
      netoActual:   netoExtC,
      netoEstimado: netoExtC,
      netoMin:      netoExtMin,
      netoMax:      netoExtMax,
      ic:           ciExt,
    }
  } else {
    const votantesEst = Math.round(PADRON_EXTERIOR * PARTICIPACION_EXT_PCT / 100)
    const neto = (pct: number) => votantesEst * (2 * pct / 100 - 1)
    netoExtC   = neto(FP_PCT_EXTERIOR)
    netoExtMin = neto(FP_PCT_EXTERIOR - VARIACION_EXTERIOR_PCT)
    netoExtMax = neto(FP_PCT_EXTERIOR + VARIACION_EXTERIOR_PCT)
    exterior = {
      disponible: false,
      actas: 0, totalActas: 2543, pctActas: 0,
      fp:  { votos: 0, pct: FP_PCT_EXTERIOR },
      jpp: { votos: 0, pct: 100 - FP_PCT_EXTERIOR },
      netoActual:   0,
      netoEstimado: netoExtC,
      netoMin:      netoExtMin,
      netoMax:      netoExtMax,
      ic:           netoExtMax - netoExtC,
    }
  }

  const central = margenActual + pendienteNeto + netoExtC
  const minVal  = margenActual + (pendienteNeto - ciNac) + netoExtMin
  const maxVal  = margenActual + (pendienteNeto + ciNac) + netoExtMax

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
    proyeccion: {
      margenActual, pendienteNeto, ic: ciNac,
      exteriorNeto: netoExtC,
      central, min: minVal, max: maxVal,
      exteriorEsReal,
    },
  } satisfies ApiResult)
}

import { NextResponse } from "next/server"

const BASE = "https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend"

const DEPARTAMENTOS: Record<string, string> = {
  "010000": "Amazonas",
  "020000": "Ancash",
  "030000": "Apurimac",
  "040000": "Arequipa",
  "050000": "Ayacucho",
  "060000": "Cajamarca",
  "070000": "Cusco",
  "080000": "Huancavelica",
  "090000": "Huanuco",
  "100000": "Ica",
  "110000": "Junin",
  "120000": "La Libertad",
  "130000": "Lambayeque",
  "140000": "Lima",
  "150000": "Loreto",
  "160000": "Pasco",
  "170000": "Madre de Dios",
  "180000": "Moquegua",
  "190000": "Piura",
  "200000": "Puno",
  "210000": "San Martin",
  "220000": "Tacna",
  "230000": "Tumbes",
  "240000": "Callao",
  "250000": "Ucayali",
}

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
  "Referer": "https://resultadosegundavuelta.onpe.gob.pe/main/resumen",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
}

async function fetchDept(ubigeo: string, nombre: string) {
  const params = `idEleccion=10&tipoFiltro=ubigeo_nivel_01&idAmbitoGeografico=1&idUbigeoDepartamento=${ubigeo}`

  const [totalesRes, participantesRes] = await Promise.all([
    fetch(`${BASE}/resumen-general/totales?${params}`, {
      headers: FETCH_HEADERS,
      cache: "no-store",
    }),
    fetch(`${BASE}/resumen-general/participantes?${params}`, {
      headers: FETCH_HEADERS,
      cache: "no-store",
    }),
  ])

  const [totalesData, participantesData] = await Promise.all([
    totalesRes.json(),
    participantesRes.json(),
  ])

  const t = totalesData.data
  const p: Record<string, unknown>[] = participantesData.data

  const fp = p.find((x) => x.codigoAgrupacionPolitica === 8)
  const jpp = p.find((x) => x.codigoAgrupacionPolitica === 10)

  return {
    nombre,
    actasContabilizadas: t.actasContabilizadas as number,
    totalActas: t.totalActas as number,
    pendientes: t.pendientesJee as number,
    fp: {
      votos: (fp?.totalVotosValidos as number) ?? 0,
      porcentaje: (fp?.porcentajeVotosValidos as number) ?? 0,
    },
    jpp: {
      votos: (jpp?.totalVotosValidos as number) ?? 0,
      porcentaje: (jpp?.porcentajeVotosValidos as number) ?? 0,
    },
  }
}

export async function GET() {
  const settled = await Promise.allSettled(
    Object.entries(DEPARTAMENTOS).map(([ubigeo, nombre]) =>
      fetchDept(ubigeo, nombre)
    )
  )

  const departamentos = settled
    .filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchDept>>> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value)
    .sort((a, b) => b.fp.votos - b.jpp.votos - (a.fp.votos - a.jpp.votos))

  const totals = departamentos.reduce(
    (acc, d) => ({
      fp: acc.fp + d.fp.votos,
      jpp: acc.jpp + d.jpp.votos,
      actas: acc.actas + d.totalActas,
      cont: acc.cont + Math.round((d.totalActas * d.actasContabilizadas) / 100),
    }),
    { fp: 0, jpp: 0, actas: 0, cont: 0 }
  )

  const totalVotos = totals.fp + totals.jpp

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    departamentos,
    nacional: {
      fp: totals.fp,
      jpp: totals.jpp,
      fpPct: totalVotos > 0 ? (totals.fp / totalVotos) * 100 : 0,
      jppPct: totalVotos > 0 ? (totals.jpp / totalVotos) * 100 : 0,
      actasPct: totals.actas > 0 ? (totals.cont / totals.actas) * 100 : 0,
      ventaja: totals.fp - totals.jpp,
    },
  })
}

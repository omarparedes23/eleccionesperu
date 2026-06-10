export type DeptResult = {
  nombre: string
  pctActas: number
  contabilizadas: number
  totalActas: number
  actasPendientes: number
  pendientesJee: number
  fp:  { votos: number; pct: number }
  jpp: { votos: number; pct: number }
  proj: {
    fpEst: number
    jppEst: number
    neto: number
    varianza: number
    actasRestantes: number
    actasJee: number
    fpRatio: number
  } | null
}

export type ExteriorCountryResult = {
  nombre: string
  region: string
  contabilizadas: number
  totalActas: number
  pctActas: number
  fpVotos: number
  jppVotos: number
  fpPctReal: number | null
  fpPrior: number
  blendPct: number
  netoProy: number
  fuente: "real" | "real+prior" | "prior"
}

export type ExteriorResult = {
  disponible: boolean
  actas: number
  totalActas: number
  pctActas: number
  fp:  { votos: number; pct: number }
  jpp: { votos: number; pct: number }
  netoActual: number
  netoEstimado: number
  netoMin: number
  netoMax: number
  ic: number
}

export type ProyeccionResult = {
  margenActual: number
  pendienteNeto: number
  ic: number
  exteriorNeto: number
  central: number
  min: number
  max: number
  exteriorEsReal: boolean
  paisesConDatos: number
  totalPaises: number
  vpaGlobal: number
  coberturaExt: number
}

export type EscenarioPesimista = {
  exteriorNeto: number
  deltaVsBase: number
  central: number
  min: number
  max: number
  metodo: string
}

export type ApiResult = {
  timestamp: string
  departamentos: DeptResult[]
  nacional: {
    fp: number
    jpp: number
    fpPct: number
    jppPct: number
    actasPct: number
    contabilizadas: number
    totalActas: number
    ventaja: number
  }
  exterior: ExteriorResult
  exteriorPaises: ExteriorCountryResult[]
  proyeccion: ProyeccionResult
  escenarioPesimista: EscenarioPesimista | null
}

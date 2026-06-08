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
  } | null
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
  proyeccion: ProyeccionResult
}

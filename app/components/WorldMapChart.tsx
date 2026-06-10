"use client"

import { useMemo, useState, useEffect } from "react"
import { geoMercator, geoPath } from "d3-geo"
import * as topojsonClient from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"
import type { ExteriorCountryResult } from "../types"
import { PAISES_EXTERIOR } from "../lib/paises-exterior"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const fmt = (n: number) => Math.round(n).toLocaleString("es-PE")
const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + fmt(n)

function getColor(fpBlend: number): string {
  if (fpBlend >= 0.70) return "#c2410c"
  if (fpBlend >= 0.60) return "#f97316"
  if (fpBlend >= 0.55) return "#fb923c"
  if (fpBlend >= 0.45) return "#d4d4d8"
  if (fpBlend >= 0.40) return "#ef4444"
  if (fpBlend >= 0.30) return "#dc2626"
  return "#991b1b"
}

const ISO_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.values(PAISES_EXTERIOR).filter(p => p.iso).map(p => [p.iso!, p.nombre])
)

const ISO_TO_NUM: Record<string, string> = {
  DZ: "012", GH: "288", KE: "404", MA: "504", EG: "818", ZA: "710",
  AR: "032", BO: "068", BR: "076", CA: "124", CL: "152", CO: "170",
  CR: "188", CU: "192", EC: "218", SV: "222", US: "840", GT: "320",
  HN: "340", MX: "484", NI: "558", PA: "591", PY: "600", DO: "214",
  TT: "780", UY: "858", VE: "862", SA: "682", QA: "634", AE: "784",
  PH: "608", IN: "356", ID: "360", IR: "364", IL: "376", JP: "392",
  JO: "400", KW: "414", LB: "422", MY: "458", KR: "410", CN: "156",
  SG: "702", TH: "764", TR: "792", VN: "704",
  DE: "276", AT: "040", BE: "056", BY: "112", DK: "208", ES: "724",
  FI: "246", FR: "250", GB: "826", LU: "442", GR: "300", NL: "528",
  HU: "348", IE: "372", IT: "380", MT: "470", NO: "578", PL: "616",
  PT: "620", AD: "020", CZ: "203", RO: "642", RU: "643", SE: "752",
  CH: "756", AU: "036", NZ: "554",
}

const NUM_TO_ISO: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_TO_NUM).map(([iso, num]) => [num, iso])
)

type TooltipInfo = { x: number; y: number; data: ExteriorCountryResult }

type PathEntry = { countryId: string; d: string; fill: string; idx: number }

function handleMouse(
  e: React.MouseEvent,
  countryId: string,
  paisesByName: Map<string, ExteriorCountryResult>,
  setTooltip: (t: TooltipInfo | null) => void,
) {
  const iso = NUM_TO_ISO[countryId]
  const name = iso ? ISO_TO_NAME[iso] : undefined
  const data = name ? paisesByName.get(name) : undefined
  if (data) {
    const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect()
    if (rect) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, data })
    }
  }
}

export default function WorldMapChart({ paises }: { paises: ExteriorCountryResult[] }) {
  const [topo, setTopo] = useState<Topology | null>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then((d: Topology) => setTopo(d))
      .catch(() => {})
  }, [])

  const paisesByName = useMemo(() => {
    const map = new Map<string, ExteriorCountryResult>()
    for (const p of paises) map.set(p.nombre, p)
    return map
  }, [paises])

  const { paths, svgWidth, svgHeight } = useMemo(() => {
    if (!topo) return { paths: [], svgWidth: 960, svgHeight: 500 }

    const countries = topo.objects.countries as GeometryCollection
    const geojson = topojsonClient.feature(topo, countries)
    const w = 960, h = 500
    const projection = geoMercator().scale(150).translate([w / 2, h / 2 + 20])
    const pathGen = geoPath().projection(projection)

    const result: PathEntry[] = geojson.features.map((f, i) => {
      const id = typeof f.id === "string" ? f.id : String(f.id ?? "")
      const iso = NUM_TO_ISO[id]
      const name = iso ? ISO_TO_NAME[iso] : undefined
      const data = name ? paisesByName.get(name) : undefined
      const d = pathGen(f as never) ?? ""
      return { countryId: id, d, fill: data ? getColor(data.blendPct) : "#e5e7eb", idx: i }
    })

    return { paths: result, svgWidth: w, svgHeight: h }
  }, [topo, paisesByName])

  if (!topo) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Cargando mapa mundial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Mapa Mundial — Voto Exterior
      </h2>
      <p className="text-xs text-gray-400 mb-3">Color por % blend FP · Hover para detalles</p>

      <div className="relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ height: "auto" }}>
          {paths.map(({ countryId, d, fill, idx }) => (
            <path
              key={`${countryId}-${idx}`}
              d={d}
              fill={fill}
              stroke="#fff"
              strokeWidth={0.5}
              className="transition-colors duration-150 hover:opacity-80 cursor-pointer"
              onMouseEnter={(e) => handleMouse(e, countryId, paisesByName, setTooltip)}
              onMouseMove={(e) => handleMouse(e, countryId, paisesByName, setTooltip)}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </svg>

        {tooltip && (
          <div
            className="absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-3 pointer-events-none"
            style={{ left: tooltip.x + 12, top: tooltip.y - 8, minWidth: 180 }}
          >
            <p className="font-semibold text-gray-800 text-sm">{tooltip.data.nombre}</p>
            <div className="mt-1 space-y-0.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Blend FP%</span>
                <span className={`font-mono font-semibold ${tooltip.data.blendPct >= 0.5 ? "text-orange-600" : "text-red-600"}`}>
                  {(tooltip.data.blendPct * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Neto proy.</span>
                <span className={`font-mono font-semibold ${tooltip.data.netoProy >= 0 ? "text-orange-600" : "text-red-600"}`}>
                  {fmtSigned(tooltip.data.netoProy)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actas</span>
                <span className="font-mono text-gray-700">{tooltip.data.contabilizadas}/{tooltip.data.totalActas} ({tooltip.data.pctActas.toFixed(0)}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fuente</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  tooltip.data.fuente === "real" ? "bg-green-100 text-green-700"
                  : tooltip.data.fuente === "prior" ? "bg-gray-100 text-gray-500"
                  : "bg-blue-100 text-blue-700"
                }`}>{tooltip.data.fuente}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-gray-500">
        <span>JPP</span>
        <div className="flex h-2.5">
          {["#991b1b", "#dc2626", "#ef4444", "#d4d4d8", "#fb923c", "#f97316", "#c2410c"].map(c => (
            <div key={c} className="w-5 h-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span>FP</span>
      </div>
    </div>
  )
}

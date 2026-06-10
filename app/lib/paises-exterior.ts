// Mapa completo de 77 países del exterior peruano.
// Fuente: ONPE /ubigeos/provincias?idAmbitoGeografico=2
// fpPrior: estimado basado en demografía Peruana + primera vuelta (modelo de transferencia 1V→2V).

export const REGIONES = {
  AFRICA:   "910000",
  AMERICAS: "920000",
  ASIA:     "930000",
  EUROPA:   "940000",
  OCEANIA:  "950000",
} as const

export type RegionKey = keyof typeof REGIONES

export const REGION_LABELS: Record<RegionKey, string> = {
  AFRICA:   "África",
  AMERICAS: "Américas",
  ASIA:     "Asia",
  EUROPA:   "Europa",
  OCEANIA:  "Oceanía",
}

export type PaisConfig = {
  nombre: string
  ubigeo: string
  region: RegionKey
  fpPrior: number
  iso?: string // ISO Alpha-2 para el mapa mundial
}

export const PAISES_EXTERIOR: Record<string, PaisConfig> = {
  // ─── AFRICA ─────────────────────────────────────────────────────────────
  "910100": { nombre: "ARGELIA",           ubigeo: "910100", region: "AFRICA",   fpPrior: 0.60, iso: "DZ" },
  "911200": { nombre: "GHANA",             ubigeo: "911200", region: "AFRICA",   fpPrior: 0.60, iso: "GH" },
  "910400": { nombre: "KENIA",             ubigeo: "910400", region: "AFRICA",   fpPrior: 0.60, iso: "KE" },
  "910500": { nombre: "MARRUECOS",         ubigeo: "910500", region: "AFRICA",   fpPrior: 0.60, iso: "MA" },
  "910300": { nombre: "EGIPTO",            ubigeo: "910300", region: "AFRICA",   fpPrior: 0.60, iso: "EG" },
  "910600": { nombre: "SUDAFRICA",         ubigeo: "910600", region: "AFRICA",   fpPrior: 0.60, iso: "ZA" },

  // ─── AMERICAS ────────────────────────────────────────────────────────────
  "920100": { nombre: "ANTILLAS HOLANDESAS", ubigeo: "920100", region: "AMERICAS", fpPrior: 0.60, iso: "AN" },
  "920200": { nombre: "ARGENTINA",         ubigeo: "920200", region: "AMERICAS", fpPrior: 0.58, iso: "AR" },
  "920400": { nombre: "BOLIVIA",           ubigeo: "920400", region: "AMERICAS", fpPrior: 0.42, iso: "BO" },
  "920500": { nombre: "BRASIL",            ubigeo: "920500", region: "AMERICAS", fpPrior: 0.68, iso: "BR" },
  "920600": { nombre: "CANADA",            ubigeo: "920600", region: "AMERICAS", fpPrior: 0.65, iso: "CA" },
  "921000": { nombre: "CHILE",             ubigeo: "921000", region: "AMERICAS", fpPrior: 0.34, iso: "CL" },
  "920700": { nombre: "COLOMBIA",          ubigeo: "920700", region: "AMERICAS", fpPrior: 0.55, iso: "CO" },
  "920800": { nombre: "COSTA RICA",        ubigeo: "920800", region: "AMERICAS", fpPrior: 0.60, iso: "CR" },
  "920900": { nombre: "CUBA",              ubigeo: "920900", region: "AMERICAS", fpPrior: 0.58, iso: "CU" },
  "921100": { nombre: "ECUADOR",           ubigeo: "921100", region: "AMERICAS", fpPrior: 0.65, iso: "EC" },
  "921200": { nombre: "EL SALVADOR",       ubigeo: "921200", region: "AMERICAS", fpPrior: 0.61, iso: "SV" },
  "921300": { nombre: "ESTADOS UNIDOS",    ubigeo: "921300", region: "AMERICAS", fpPrior: 0.67, iso: "US" },
  "921500": { nombre: "GUATEMALA",         ubigeo: "921500", region: "AMERICAS", fpPrior: 0.66, iso: "GT" },
  "923000": { nombre: "GUAYANA FRANCESA",  ubigeo: "923000", region: "AMERICAS", fpPrior: 0.67, iso: "GF" },
  "921700": { nombre: "HONDURAS",          ubigeo: "921700", region: "AMERICAS", fpPrior: 0.73, iso: "HN" },
  "921900": { nombre: "MEXICO",            ubigeo: "921900", region: "AMERICAS", fpPrior: 0.64, iso: "MX" },
  "922000": { nombre: "NICARAGUA",         ubigeo: "922000", region: "AMERICAS", fpPrior: 0.63, iso: "NI" },
  "922100": { nombre: "PANAMA",            ubigeo: "922100", region: "AMERICAS", fpPrior: 0.67, iso: "PA" },
  "922200": { nombre: "PARAGUAY",          ubigeo: "922200", region: "AMERICAS", fpPrior: 0.68, iso: "PY" },
  "922300": { nombre: "PUERTO RICO",       ubigeo: "922300", region: "AMERICAS", fpPrior: 0.64, iso: "PR" },
  "922400": { nombre: "REPUBLICA DOMINICANA", ubigeo: "922400", region: "AMERICAS", fpPrior: 0.66, iso: "DO" },
  "922600": { nombre: "TRINIDAD Y TOBAGO", ubigeo: "922600", region: "AMERICAS", fpPrior: 0.60, iso: "TT" },
  "922700": { nombre: "URUGUAY",           ubigeo: "922700", region: "AMERICAS", fpPrior: 0.65, iso: "UY" },
  "922800": { nombre: "VENEZUELA",         ubigeo: "922800", region: "AMERICAS", fpPrior: 0.62, iso: "VE" },

  // ─── ASIA ───────────────────────────────────────────────────────────────
  "931900": { nombre: "ARABIA SAUDITA",     ubigeo: "931900", region: "ASIA",     fpPrior: 0.65, iso: "SA" },
  "933800": { nombre: "CATAR",              ubigeo: "933800", region: "ASIA",     fpPrior: 0.65, iso: "QA" },
  "933700": { nombre: "EMIRATOS ARABES UNIDOS", ubigeo: "933700", region: "ASIA", fpPrior: 0.65, iso: "AE" },
  "933200": { nombre: "FILIPINAS",          ubigeo: "933200", region: "ASIA",     fpPrior: 0.62, iso: "PH" },
  "930400": { nombre: "INDIA",              ubigeo: "930400", region: "ASIA",     fpPrior: 0.62, iso: "IN" },
  "931100": { nombre: "INDONESIA",          ubigeo: "931100", region: "ASIA",     fpPrior: 0.62, iso: "ID" },
  "932400": { nombre: "IRAN",               ubigeo: "932400", region: "ASIA",     fpPrior: 0.60, iso: "IR" },
  "930600": { nombre: "ISRAEL",             ubigeo: "930600", region: "ASIA",     fpPrior: 0.65, iso: "IL" },
  "930700": { nombre: "JAPON",              ubigeo: "930700", region: "ASIA",     fpPrior: 0.77, iso: "JP" },
  "931300": { nombre: "JORDANIA",           ubigeo: "931300", region: "ASIA",     fpPrior: 0.62, iso: "JO" },
  "932800": { nombre: "KUWAIT",             ubigeo: "932800", region: "ASIA",     fpPrior: 0.65, iso: "KW" },
  "930800": { nombre: "LIBANO",             ubigeo: "930800", region: "ASIA",     fpPrior: 0.62, iso: "LB" },
  "933000": { nombre: "MALASIA",            ubigeo: "933000", region: "ASIA",     fpPrior: 0.62, iso: "MY" },
  "930100": { nombre: "COREA",              ubigeo: "930100", region: "ASIA",     fpPrior: 0.50, iso: "KR" },
  "930200": { nombre: "CHINA",              ubigeo: "930200", region: "ASIA",     fpPrior: 0.61, iso: "CN" },
  "932500": { nombre: "SINGAPUR",           ubigeo: "932500", region: "ASIA",     fpPrior: 0.63, iso: "SG" },
  "931000": { nombre: "TAILANDIA",          ubigeo: "931000", region: "ASIA",     fpPrior: 0.62, iso: "TH" },
  "931500": { nombre: "TURQUIA",            ubigeo: "931500", region: "ASIA",     fpPrior: 0.62, iso: "TR" },
  "932000": { nombre: "VIETNAM",            ubigeo: "932000", region: "ASIA",     fpPrior: 0.62, iso: "VN" },

  // ─── EUROPA ─────────────────────────────────────────────────────────────
  "940200": { nombre: "ALEMANIA",           ubigeo: "940200", region: "EUROPA",   fpPrior: 0.54, iso: "DE" },
  "940300": { nombre: "AUSTRIA",            ubigeo: "940300", region: "EUROPA",   fpPrior: 0.57, iso: "AT" },
  "940400": { nombre: "BELGICA",            ubigeo: "940400", region: "EUROPA",   fpPrior: 0.57, iso: "BE" },
  "943600": { nombre: "BIELORRUSIA",        ubigeo: "943600", region: "EUROPA",   fpPrior: 0.60, iso: "BY" },
  "940800": { nombre: "DINAMARCA",          ubigeo: "940800", region: "EUROPA",   fpPrior: 0.60, iso: "DK" },
  "940900": { nombre: "ESPANA",             ubigeo: "940900", region: "EUROPA",   fpPrior: 0.63, iso: "ES" },
  "941000": { nombre: "FINLANDIA",          ubigeo: "941000", region: "EUROPA",   fpPrior: 0.54, iso: "FI" },
  "941100": { nombre: "FRANCIA",            ubigeo: "941100", region: "EUROPA",   fpPrior: 0.57, iso: "FR" },
  "941200": { nombre: "GRAN BRETANA",       ubigeo: "941200", region: "EUROPA",   fpPrior: 0.58, iso: "GB" },
  "942000": { nombre: "LUXEMBURGO",         ubigeo: "942000", region: "EUROPA",   fpPrior: 0.59, iso: "LU" },
  "941300": { nombre: "GRECIA",             ubigeo: "941300", region: "EUROPA",   fpPrior: 0.62, iso: "GR" },
  "941400": { nombre: "HOLANDA",            ubigeo: "941400", region: "EUROPA",   fpPrior: 0.55, iso: "NL" },
  "941500": { nombre: "HUNGRIA",            ubigeo: "941500", region: "EUROPA",   fpPrior: 0.61, iso: "HU" },
  "941800": { nombre: "IRLANDA",            ubigeo: "941800", region: "EUROPA",   fpPrior: 0.52, iso: "IE" },
  "941700": { nombre: "ITALIA",             ubigeo: "941700", region: "EUROPA",   fpPrior: 0.62, iso: "IT" },
  "943700": { nombre: "MACEDONIA",          ubigeo: "943700", region: "EUROPA",   fpPrior: 0.60, iso: "MK" },
  "942100": { nombre: "MALTA",              ubigeo: "942100", region: "EUROPA",   fpPrior: 0.62, iso: "MT" },
  "942300": { nombre: "NORUEGA",            ubigeo: "942300", region: "EUROPA",   fpPrior: 0.53, iso: "NO" },
  "942400": { nombre: "POLONIA",            ubigeo: "942400", region: "EUROPA",   fpPrior: 0.59, iso: "PL" },
  "942500": { nombre: "PORTUGAL",           ubigeo: "942500", region: "EUROPA",   fpPrior: 0.55, iso: "PT" },
  "944200": { nombre: "ANDORRA",            ubigeo: "944200", region: "EUROPA",   fpPrior: 0.60, iso: "AD" },
  "940600": { nombre: "REP.CHECA",          ubigeo: "940600", region: "EUROPA",   fpPrior: 0.55, iso: "CZ" },
  "942600": { nombre: "RUMANIA",            ubigeo: "942600", region: "EUROPA",   fpPrior: 0.61, iso: "RO" },
  "942900": { nombre: "RUSIA",              ubigeo: "942900", region: "EUROPA",   fpPrior: 0.57, iso: "RU" },
  "942700": { nombre: "SUECIA",             ubigeo: "942700", region: "EUROPA",   fpPrior: 0.57, iso: "SE" },
  "942800": { nombre: "SUIZA",              ubigeo: "942800", region: "EUROPA",   fpPrior: 0.60, iso: "CH" },

  // ─── OCEANIA ────────────────────────────────────────────────────────────
  "950100": { nombre: "AUSTRALIA",          ubigeo: "950100", region: "OCEANIA",  fpPrior: 0.60, iso: "AU" },
  "950200": { nombre: "NUEVA ZELANDA",      ubigeo: "950200", region: "OCEANIA",  fpPrior: 0.65, iso: "NZ" },
}

// Total de actas por país (dato fijo de ONPE — no cambia durante la elección).
// Fuente: resumen-general/totales scrapeado el 2026-06-08.
export const ACTAS_TOTALES_EXTERIOR: Record<string, number> = {
  "ESTADOS UNIDOS": 749, "ESPANA": 446, "ARGENTINA": 299, "CHILE": 281,
  "ITALIA": 251, "JAPON": 81, "CANADA": 52, "BRASIL": 44, "VENEZUELA": 34,
  "FRANCIA": 31, "ALEMANIA": 29, "BOLIVIA": 22, "SUIZA": 19, "AUSTRALIA": 18,
  "COLOMBIA": 17, "ECUADOR": 16, "MEXICO": 14, "GRAN BRETANA": 13,
  "BELGICA": 10, "PANAMA": 10, "SUECIA": 9, "COSTA RICA": 7, "HOLANDA": 6,
  "CHINA": 4, "ISRAEL": 4, "PARAGUAY": 4, "REP.DOMINICANA": 4, "URUGUAY": 4,
  "AUSTRIA": 3, "NUEVA ZELANDA": 3, "RUSIA": 3, "ANTILLAS HOLANDESAS": 2,
  "DINAMARCA": 2, "EMIRATOS ARABES UNIDOS": 2, "GUATEMALA": 2,
  "GUAYANA FRANCESA": 2, "NORUEGA": 2, "PORTUGAL": 2, "PUERTO RICO": 2,
  "RUMANIA": 2, "TURQUIA": 2, "ARGELIA": 1, "ANDORRA": 1, "ARABIA SAUDITA": 1,
  "BIELORRUSIA": 1, "CATAR": 1, "COREA": 1, "CUBA": 1, "EGIPTO": 1,
  "EL SALVADOR": 1, "FILIPINAS": 1, "FINLANDIA": 1, "GHANA": 1,
  "GRECIA": 1, "HONDURAS": 1, "HUNGRIA": 1, "INDIA": 1, "INDONESIA": 1,
  "IRAN": 1, "IRLANDA": 1, "JORDANIA": 1, "KENIA": 1, "KUWAIT": 1,
  "LIBANO": 1, "LUXEMBURGO": 1, "MACEDONIA": 1, "MALASIA": 1, "MALTA": 1,
  "MARRUECOS": 1, "NICARAGUA": 1, "POLONIA": 1, "REP.CHECA": 1,
  "SINGAPUR": 1, "SUDAFRICA": 1, "TAILANDIA": 1, "TRINIDAD Y TOBAGO": 1,
  "VIETNAM": 1,
}

export const TOTAL_ACTAS_EXTERIOR = 2543
export const VARIACION_EXTERIOR_PCT = 5.0
export const Z_95 = 1.96

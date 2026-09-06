/**
 * Normaliza brand/model/version antes de gravar. O motivo: `GET /vehicles`
 * dedupica por `brand-model-version-yearModel` em minúsculas, mas o `WHERE`
 * de busca no Oracle é sensível a caixa — "FORD"/"Ford" não batem, e uma
 * chamada de `/extract` com a marca digitada diferente do que já está salvo
 * cria um veículo duplicado (só escondido pelo dedup do GET, não pelo banco).
 *
 * A regra só reescreve strings inteiras em CAIXA ALTA (típico de entrada
 * manual/curl, ex.: "FORD", "RAPTOR") para Title Case. Siglas/códigos de
 * versão legítimos — "BYD", "GS", "SRX", "S10", "PRO-4X", "L200 Triton" —
 * escapam da regra por serem curtos (≤3) ou por terem dígito/hífen, e saem
 * intocados.
 */

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function looksAllCapsWord(s: string): boolean {
  return s.length > 3 && /^[A-ZÀ-ÖØ-Þ ]+$/.test(s)
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map(w => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function normalizePart(raw: string): string {
  const s = collapseSpaces(raw)
  return looksAllCapsWord(s) ? titleCase(s) : s
}

export interface VehicleIdentity {
  brand: string
  model: string
  version: string
}

export function normalizeVehicleIdentity(v: VehicleIdentity): VehicleIdentity {
  return {
    brand: normalizePart(v.brand),
    model: normalizePart(v.model),
    version: normalizePart(v.version),
  }
}

/**
 * Camada determinística: regex/keyword sobre o texto já transcrito de uma
 * ficha técnica (ver `transcribePdf` em `extractor.ts`), sem chamar IA.
 *
 * Cobre só os campos objetivos — os que costumam aparecer como um número ou
 * um termo inequívoco perto de uma unidade conhecida ("397 cv", "583 Nm",
 * "R$ 499.000"). Cada regra só grava um valor quando o match é confiante;
 * na dúvida, deixa o campo de fora (fica `null`) em vez de arriscar um dado
 * errado — quem cobre o resto é a extração por IA, alimentada com o mesmo
 * texto (ver `extractVehicleSpecs`).
 *
 * PDFs de fabricantes diferentes têm layouts bem diferentes entre si — por
 * isso as regras aqui são propositalmente conservadoras (poucos falsos
 * positivos), não uma tentativa de cobrir 100% dos formatos.
 */

export interface ParseResult {
  /** Chaves no mesmo formato snake_case usado pelos SPEC_CATEGORIES/extractor. */
  specs: Record<string, number>
  /**
   * `'deterministic'` para cada chave presente em `specs`. Tipado como
   * `'deterministic' | 'ai'` só pra o objeto poder ser reaproveitado (e ganhar
   * entradas `'ai'`) pelo chamador em `extractVehicleSpecs` — este parser
   * nunca grava `'ai'` aqui.
   */
  provenance: Record<string, 'deterministic' | 'ai'>
}

const KGF_M_TO_NM = 9.80665

/** Converte um número em formato pt-BR ("2.415", "3,0", "499.000") pra float. */
export function toNumber(raw: string): number {
  let s = raw.trim()
  if (s.includes(',') && s.includes('.')) {
    // "1.234,5" — ponto é separador de milhar, vírgula é decimal.
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    // "3,0" — vírgula decimal.
    s = s.replace(',', '.')
  } else {
    // "2.415" (milhar) vs "3.0" (decimal) — só trata como milhar quando o
    // padrão é exatamente 3 dígitos depois do ponto.
    const thousands = s.match(/^(\d{1,3})\.(\d{3})$/)
    if (thousands) s = thousands[1] + thousands[2]
  }
  return parseFloat(s)
}

export function kgfmToNm(kgfm: number): number {
  return Math.round(kgfm * KGF_M_TO_NM)
}

export function normalizeText(raw: string): string {
  return raw.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim()
}

/** Texto normalizado, minúsculo e numa linha só — mais simples pra regex. */
function flatten(text: string): string {
  return normalizeText(text).replace(/\s+/g, ' ').toLowerCase()
}

export function parseHeadlineSpecs(rawText: string): ParseResult {
  const specs: Record<string, number> = {}
  const provenance: Record<string, 'deterministic' | 'ai'> = {}

  if (!rawText || rawText.trim().length < 20) {
    return { specs, provenance }
  }

  const text = flatten(rawText)

  const set = (key: string, value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return
    specs[key] = value
    provenance[key] = 'deterministic'
  }

  // Potência
  {
    const m = text.match(/(\d{2,3})\s*cv\b/)
    if (m) set('potencia_cv', parseInt(m[1], 10))
  }

  // Torque — prioriza Nm; kgf.m/kgfm/kgf m vira Nm.
  {
    const nm = text.match(/(\d{2,4}(?:[.,]\d)?)\s*n\.?\s*m\b/)
    if (nm) {
      set('torque_nm', Math.round(toNumber(nm[1])))
    } else {
      const kgfm = text.match(/(\d{1,3}(?:[.,]\d)?)\s*kgf\.?\s*m\b/)
      if (kgfm) set('torque_nm', kgfmToNm(toNumber(kgfm[1])))
    }
  }

  // Cilindrada
  {
    const litros = text.match(/(\d[.,]\d)\s*(?:l\b|litros)/)
    if (litros) {
      set('cilindrada_l', toNumber(litros[1]))
    } else {
      const cc = text.match(/(\d{3,4})\s*(?:cm3|cm³|cc)\b/)
      if (cc) set('cilindrada_l', Math.round((parseInt(cc[1], 10) / 1000) * 10) / 10)
    }
  }

  // Marchas
  {
    const m = text.match(/(\d{1,2})\s*marchas?\b/)
    if (m) set('qtd_marchas', parseInt(m[1], 10))
  }

  // Câmbio automático vs manual
  {
    const hasAuto = /(c[âa]mbio|transmiss[ãa]o)\s+automátic|automatizad/.test(text)
    if (hasAuto) {
      set('transmissao_automatica', 1)
    } else if (/(c[âa]mbio|transmiss[ãa]o)\s+manual\b/.test(text)) {
      set('transmissao_automatica', 0)
    }
  }

  // Combustível
  if (/\bdiesel\b/.test(text)) set('motor_diesel', 1)
  if (/\bflex\b/.test(text)) set('motor_flex', 1)

  // Turbo / biturbo
  if (/\bbiturbo\b|twin-?turbo/.test(text)) {
    set('tecnologia_biturbo', 1)
    set('tecnologia_turbo', 1)
  } else if (/\bturbo\b/.test(text)) {
    set('tecnologia_turbo', 1)
  }

  // 4x4 com reduzida/caixa de transferência
  if (/\b4x4\b/.test(text) && /(reduzida|low range|caixa de transfer[êe]ncia|\b4l\b)/.test(text)) {
    set('tracao_4x4_high_low', 1)
  }

  // Garantia — "garantia" e o número de anos precisam estar próximos.
  {
    const m = text.match(/garantia[^.]{0,40}?(\d{1,2})\s*anos?/)
    if (m) set('anos_garantia', parseInt(m[1], 10))
  }

  // Preço — "R$ 499.000" / "R$499.000,00"
  {
    const m = text.match(/r\$\s*([\d.]{4,}(?:,\d{2})?)/)
    if (m) set('preco_base_brl', Math.round(toNumber(m[1])))
  }

  // Airbags — número pode vir antes ("7 airbags") ou depois ("airbags: 7").
  {
    const before = text.match(/(\d{1,2})\s*airbags?\b/)
    const after = text.match(/airbags?[^\d]{0,10}(\d{1,2})\b/)
    const m = before ?? after
    if (m) set('airbags_qtd', parseInt(m[1], 10))
  }

  // Peso em ordem de marcha
  {
    const m = text.match(/ordem de marcha[^\d]{0,20}(\d[\d.,]{2,7})\s*kg\b/)
    if (m) set('peso_ordem_marcha_kg', Math.round(toNumber(m[1])))
  }

  // Rodas (aro em polegadas — faixa plausível 14"-24")
  {
    const m = text.match(/(?:aro|rodas?)[^\d]{0,15}(\d{2})\s*(?:"|polegadas)/)
    if (m) {
      const val = parseInt(m[1], 10)
      if (val >= 14 && val <= 24) set('rodas_polegadas', val)
    }
  }

  // Consumo combinado
  {
    const m = text.match(/(\d{1,2}[.,]\d)\s*km\/?\s*l\b/)
    if (m) set('economia_combustivel_kmpl', toNumber(m[1]))
  }

  return { specs, provenance }
}

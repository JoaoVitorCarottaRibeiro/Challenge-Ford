/**
 * Histórico de valor de referência FIPE (Tabela FIPE, via api pública parallelum.com.br/fipe)
 * por ano-modelo, para cada veículo do catálogo — verificado manualmente em set/2026.
 *
 * IMPORTANTE: isto é o valor de referência de mercado atual para cada ano-modelo
 * (quanto vale hoje uma unidade 2018, 2019, 2020...), não uma série histórica de
 * preço de lançamento mês a mês — a API pública da FIPE não expõe histórico mensal
 * (esse recurso é pago). Cada ano listado é o que a própria FIPE tinha cadastrado
 * no momento da consulta — veículos lançados recentemente naturalmente têm menos
 * anos disponíveis.
 */

export interface FipeYearValue {
  ano: number
  valor: number
}

export interface FipeHistoryEntry {
  brand: string
  model: string
  version: string
  historico: FipeYearValue[]
}

export const FIPE_HISTORY: FipeHistoryEntry[] = [
  {
    brand: 'Ford', model: 'Ranger', version: 'Raptor',
    historico: [
      { ano: 2024, valor: 404163 },
      { ano: 2025, valor: 438908 },
      { ano: 2026, valor: 452540 },
    ],
  },
  {
    brand: 'Toyota', model: 'Hilux', version: 'SRX',
    historico: [
      { ano: 2016, valor: 168338 }, { ano: 2017, valor: 176028 }, { ano: 2018, valor: 183383 },
      { ano: 2019, valor: 196246 }, { ano: 2020, valor: 201154 }, { ano: 2021, valor: 227145 },
      { ano: 2022, valor: 232824 }, { ano: 2023, valor: 246463 }, { ano: 2024, valor: 274049 },
      { ano: 2025, valor: 290004 }, { ano: 2026, valor: 306650 },
    ],
  },
  {
    brand: 'Volkswagen', model: 'Amarok', version: 'Highline V6',
    historico: [
      { ano: 2018, valor: 132317 }, { ano: 2019, valor: 139329 }, { ano: 2020, valor: 147961 },
      { ano: 2021, valor: 158991 }, { ano: 2022, valor: 166083 }, { ano: 2023, valor: 183960 },
      { ano: 2024, valor: 229730 }, { ano: 2025, valor: 267717 }, { ano: 2026, valor: 325580 },
    ],
  },
  {
    brand: 'Volkswagen', model: 'Amarok', version: 'Extreme',
    historico: [
      { ano: 2018, valor: 134662 }, { ano: 2019, valor: 149837 }, { ano: 2020, valor: 160460 },
      { ano: 2021, valor: 166151 }, { ano: 2022, valor: 181831 }, { ano: 2023, valor: 207997 },
      { ano: 2024, valor: 231193 }, { ano: 2025, valor: 289129 }, { ano: 2026, valor: 339270 },
    ],
  },
  {
    brand: 'Volkswagen', model: 'Amarok', version: 'Comfortline',
    historico: [
      { ano: 2019, valor: 111389 }, { ano: 2020, valor: 123010 },
      { ano: 2021, valor: 131783 }, { ano: 2022, valor: 135078 },
    ],
  },
  {
    brand: 'Chevrolet', model: 'S10', version: 'High Country',
    historico: [
      { ano: 2016, valor: 129387 }, { ano: 2017, valor: 140682 }, { ano: 2018, valor: 150725 },
      { ano: 2019, valor: 154494 }, { ano: 2020, valor: 158357 }, { ano: 2021, valor: 172749 },
      { ano: 2022, valor: 179924 }, { ano: 2023, valor: 186997 }, { ano: 2024, valor: 200938 },
      { ano: 2025, valor: 256962 }, { ano: 2026, valor: 268591 }, { ano: 2027, valor: 294378 },
    ],
  },
  {
    brand: 'Mitsubishi', model: 'L200 Triton', version: 'Katana',
    historico: [
      { ano: 2025, valor: 271201 }, { ano: 2026, valor: 278601 }, { ano: 2027, valor: 309266 },
    ],
  },
  {
    brand: 'Nissan', model: 'Frontier', version: 'PRO-4X',
    historico: [
      { ano: 2023, valor: 191547 }, { ano: 2024, valor: 207287 },
      { ano: 2025, valor: 230001 }, { ano: 2026, valor: 256945 },
    ],
  },
  {
    brand: 'Fiat', model: 'Titano', version: 'Ranch',
    historico: [
      { ano: 2024, valor: 174304 }, { ano: 2025, valor: 181478 }, { ano: 2026, valor: 208531 },
    ],
  },
  {
    brand: 'BYD', model: 'Shark', version: 'GS',
    historico: [
      { ano: 2025, valor: 267622 }, { ano: 2026, valor: 306124 },
    ],
  },
  {
    // Código FIPE 7405 (marca Toyota, 56): "Hilux CD SR 4x4 2.8 TDI Diesel Aut." —
    // conferido diretamente na API pública (parallelum.com.br/fipe) em set/2026.
    brand: 'Toyota', model: 'Hilux', version: 'SR',
    historico: [
      { ano: 2016, valor: 155098 }, { ano: 2018, valor: 162951 }, { ano: 2020, valor: 172791 },
      { ano: 2022, valor: 187099 }, { ano: 2024, valor: 209889 }, { ano: 2025, valor: 240674 },
      { ano: 2026, valor: 252046 },
    ],
  },
  {
    // Código FIPE 8554 (marca Toyota, 56): "Hilux CD GR-S 4x4 2.8 TDI Dies. Aut." —
    // conferido diretamente na API pública (parallelum.com.br/fipe) em set/2026.
    // Esse código da FIPE só tem anos até 2024 (nada de 2025/2026 cadastrado ainda
    // por ela) — é o real, não estico artificialmente pra completar.
    brand: 'Toyota', model: 'Hilux', version: 'GR Sport',
    historico: [
      { ano: 2019, valor: 200334 }, { ano: 2020, valor: 205342 }, { ano: 2022, valor: 236154 },
      { ano: 2023, valor: 263744 }, { ano: 2024, valor: 284757 },
    ],
  },
]

export function fipeKey(brand: string, model: string, version: string) {
  return `${brand.trim().toLowerCase()}|${model.trim().toLowerCase()}|${version.trim().toLowerCase()}`
}

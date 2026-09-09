'use client'

import { useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { FIPE_HISTORY, fipeKey } from '@/constants/fipeHistory'

interface Vehicle {
  brand: string
  model: string
  version: string
  yearModel: number
  spec?: { precoBaseBrl: number | null } | null
}

// Paleta categórica validada (contraste + separação p/ daltonismo conferidos com
// scripts/validate_palette.js da skill dataviz, rodada contra as superfícies reais
// do app: --card #f5f5f5 no claro, #111827 no escuro). Uma cor fixa por MARCA, não
// por veículo — com só 8 marcas no catálogo isso cobre tudo sem esticar a paleta.
const BRAND_COLOR: Record<string, { light: string; dark: string }> = {
  Ford:       { light: '#2a78d6', dark: '#3987e5' },
  Toyota:     { light: '#eb6834', dark: '#d95926' },
  Volkswagen: { light: '#1baf7a', dark: '#199e70' },
  Chevrolet:  { light: '#eda100', dark: '#c98500' },
  Mitsubishi: { light: '#e87ba4', dark: '#d55181' },
  Nissan:     { light: '#008300', dark: '#008300' },
  Fiat:       { light: '#4a3aa7', dark: '#9085e9' },
  BYD:        { light: '#e34948', dark: '#e66767' },
}
const FALLBACK_COLOR = { light: '#898781', dark: '#898781' }

// Quando uma marca tem mais de uma versão cadastrada (hoje só a Amarok), a cor
// continua a mesma da marca — a distinção vem do traço, não de inventar uma cor
// nova. Evita que o gráfico pareça um arco-íris de 10 tons sem relação entre si.
const DASH_PATTERNS: (string | undefined)[] = [undefined, '7 4', '2 3']

const PRICE_BUCKETS = [
  { label: 'Até R$ 250 mil', test: (p: number) => p <= 250_000 },
  { label: 'R$ 250 mil – R$ 350 mil', test: (p: number) => p > 250_000 && p <= 350_000 },
  { label: 'Acima de R$ 350 mil', test: (p: number) => p > 350_000 },
]

// Espaço insecável entre "R$" e o valor: o Recharts quebra o tick em duas linhas em
// qualquer espaço comum quando o texto não cabe na largura do eixo, cortando o "R$"
// do topo contra a margem do gráfico.
function formatCompactBRL(value: number) {
  return `R$ ${Math.round(value / 1000)}k`
}

export default function PriceHistoryChart({ vehicles }: { vehicles: Vehicle[] }) {
  const { theme } = useTheme()
  const mode = theme === 'light' ? 'light' : 'dark'
  const [active, setActive] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('')

  // Cada veículo só entra no gráfico com anos >= seu próprio yearModel (preço de
  // anos anteriores ao cadastro não interessa). Com 2+ pontos nesse recorte vira
  // uma linha de tendência; com exatamente 1 (só o próprio ano de lançamento
  // registrado na FIPE) ainda aparece no gráfico, mas como um ponto isolado, sem
  // linha — não há tendência real pra desenhar, só um preço conhecido. Só fica de
  // fora do gráfico (e vai pra mensagem separada) quem não tem nenhum ano >= o
  // próprio ano de cadastro.
  const { allSeries, noDataAll } = useMemo(() => {
    // Ordem estável (por marca, depois por versão) pra cor/traço nunca mudarem
    // quando um filtro reduz quantos veículos aparecem — a identidade visual é do
    // veículo, não da posição dele na lista filtrada.
    const sorted = [...vehicles].sort((a, b) =>
      a.brand === b.brand ? a.version.localeCompare(b.version) : a.brand.localeCompare(b.brand)
    )
    const seenPerBrand: Record<string, number> = {}
    const series: {
      label: string; brand: string; yearModel: number
      precoBaseBrl: number | null
      historico: { ano: number; valor: number }[]
      kind: 'line' | 'point'
      color: string; dash: string | undefined
    }[] = []
    const noData: { label: string; brand: string; yearModel: number }[] = []

    sorted.forEach(v => {
      const entry = FIPE_HISTORY.find(f => fipeKey(f.brand, f.model, f.version) === fipeKey(v.brand, v.model, v.version))
      const precoBaseBrl = v.spec?.precoBaseBrl ?? null
      const historico = (entry?.historico ?? []).filter(h => h.ano >= v.yearModel)

      const label = `${v.brand} ${v.model} ${v.version}`
      if (historico.length === 0) {
        noData.push({ label, brand: v.brand, yearModel: v.yearModel })
        return
      }

      const idxInBrand = seenPerBrand[v.brand] ?? 0
      seenPerBrand[v.brand] = idxInBrand + 1
      const color = BRAND_COLOR[v.brand] ?? FALLBACK_COLOR
      series.push({
        label,
        brand: v.brand,
        yearModel: v.yearModel,
        precoBaseBrl,
        historico,
        kind: historico.length >= 2 ? 'line' : 'point',
        color: color[mode],
        dash: DASH_PATTERNS[idxInBrand % DASH_PATTERNS.length],
      })
    })

    return { allSeries: series, noDataAll: noData }
  }, [vehicles, mode])

  const brandOptions = useMemo(
    () => [...new Set([...allSeries, ...noDataAll].map(s => s.brand))].sort(),
    [allSeries, noDataAll]
  )
  const yearOptions = useMemo(
    () => [...new Set([...allSeries, ...noDataAll].map(s => s.yearModel))].sort((a, b) => a - b),
    [allSeries, noDataAll]
  )

  const filteredSeries = useMemo(() => allSeries.filter(s =>
    (!brandFilter || s.brand === brandFilter) &&
    (!yearFilter || s.yearModel === Number(yearFilter)) &&
    (!priceFilter || (s.precoBaseBrl != null && PRICE_BUCKETS.find(b => b.label === priceFilter)?.test(s.precoBaseBrl)))
  ), [allSeries, brandFilter, yearFilter, priceFilter])

  const filteredNoData = useMemo(() => noDataAll.filter(u =>
    (!brandFilter || u.brand === brandFilter) &&
    (!yearFilter || u.yearModel === Number(yearFilter))
  ), [noDataAll, brandFilter, yearFilter])

  const data = useMemo(() => {
    const allYears = [...new Set(filteredSeries.flatMap(s => s.historico.map(h => h.ano)))].sort((a, b) => a - b)
    return allYears.map(ano => {
      const row: Record<string, number | string> = { ano }
      filteredSeries.forEach(s => {
        const found = s.historico.find(h => h.ano === ano)
        if (found) row[s.label] = found.valor
      })
      return row
    })
  }, [filteredSeries])

  const activeStillVisible = active && filteredSeries.some(s => s.label === active)
  const visibleSeries = activeStillVisible ? filteredSeries.filter(s => s.label === active) : filteredSeries

  const pointOnlyMessage =
    activeStillVisible && visibleSeries.length === 1 && visibleSeries[0].kind === 'point'
      ? 'Somente preço do ano de lançamento disponível.'
      : null

  const selectStyle = {
    backgroundColor: 'var(--card)',
    borderColor: 'var(--card-border)',
    color: 'var(--foreground)',
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium outline-none"
          style={selectStyle}>
          <option value="">Todas as marcas</option>
          {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium outline-none"
          style={selectStyle}>
          <option value="">Todos os anos</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          value={priceFilter}
          onChange={e => setPriceFilter(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium outline-none"
          style={selectStyle}>
          <option value="">Todas as faixas de preço</option>
          {PRICE_BUCKETS.map(b => <option key={b.label} value={b.label}>{b.label}</option>)}
        </select>
      </div>

      {filteredSeries.length === 0 && filteredNoData.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Nenhum veículo corresponde a esses filtros.
        </p>
      ) : filteredSeries.length === 0 ? null : (
        <>
          <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {filteredSeries.map(s => {
              const isActive = active === s.label
              const dimmed = active !== null && !isActive
              return (
                <button
                  key={s.label}
                  onClick={() => setActive(isActive ? null : s.label)}
                  className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1 text-xs font-medium transition-opacity min-w-0 text-left"
                  style={{
                    border: `1px solid ${isActive ? s.color : 'var(--card-border)'}`,
                    backgroundColor: isActive ? `${s.color}1a` : 'transparent',
                    color: 'var(--foreground)',
                    opacity: dimmed ? 0.4 : 1,
                  }}>
                  <svg width="14" height="8" className="shrink-0">
                    {s.kind === 'line' ? (
                      <line x1="0" y1="4" x2="14" y2="4" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
                    ) : (
                      <circle cx="7" cy="4" r="3" fill={s.color} />
                    )}
                  </svg>
                  {s.label}
                </button>
              )
            })}
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="ano" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={formatCompactBRL} width={64} />
                <Tooltip
                  formatter={(value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                {visibleSeries.map(s => (
                  <Line key={s.label} type="monotone" dataKey={s.label} stroke={s.color}
                    strokeDasharray={s.dash} strokeWidth={2}
                    dot={s.kind === 'point' ? { r: 5, fill: s.color, stroke: 'var(--card)', strokeWidth: 1.5 } : false}
                    activeDot={{ r: 4 }} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {pointOnlyMessage && (
        <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
          {pointOnlyMessage}
        </p>
      )}

      {filteredNoData.length > 0 && (
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
          Preços de anos seguintes não disponíveis para {filteredNoData.map(u => u.label).join(', ')}.
        </p>
      )}
    </div>
  )
}

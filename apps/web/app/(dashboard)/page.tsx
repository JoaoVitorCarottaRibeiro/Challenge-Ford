'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Car, BarChart3, ShieldCheck, Gauge, Trophy, History, ArrowRight, Crown } from 'lucide-react'
import api from '@/lib/api'
import { BrandBadge } from '@/components/BrandBadge'
import { SourceBadge } from '@/components/SourceBadge'
import { SOURCE_LABEL } from '@/constants/specCategories'

interface Vehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
  spec: {
    potenciaCv: number | null
    torqueNm: number | null
    precoBaseBrl: number | null
    source: string | null
    fetchedAt: string | null
  } | null
}

const VERIFIED_SOURCES = ['pdf_oficial', 'pdf_upload']

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vehicles')
      .then(res => setVehicles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const withSpecs = useMemo(() => vehicles.filter(v => v.spec?.potenciaCv != null), [vehicles])
  const brands = useMemo(() => [...new Set(vehicles.map(v => v.brand))], [vehicles])

  const coveragePct = vehicles.length ? Math.round((withSpecs.length / vehicles.length) * 100) : 0

  const verifiedCount = withSpecs.filter(v => VERIFIED_SOURCES.includes(v.spec?.source || '')).length
  const reliabilityPct = withSpecs.length ? Math.round((verifiedCount / withSpecs.length) * 100) : 0

  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    withSpecs.forEach(v => {
      const s = v.spec?.source || 'ia_generated'
      counts[s] = (counts[s] || 0) + 1
    })
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count, pct: Math.round((count / withSpecs.length) * 100) }))
      .sort((a, b) => b.count - a.count)
  }, [withSpecs])

  const leaderboard = useMemo(
    () => [...withSpecs].sort((a, b) => (b.spec!.potenciaCv || 0) - (a.spec!.potenciaCv || 0)).slice(0, 5),
    [withSpecs]
  )

  const recent = useMemo(
    () => vehicles
      .filter(v => v.spec?.fetchedAt)
      .sort((a, b) => new Date(b.spec!.fetchedAt!).getTime() - new Date(a.spec!.fetchedAt!).getTime())
      .slice(0, 5),
    [vehicles]
  )

  const fordFlagship = useMemo(
    () => withSpecs
      .filter(v => v.brand.toLowerCase() === 'ford')
      .sort((a, b) => (b.spec!.potenciaCv || 0) - (a.spec!.potenciaCv || 0))[0] ?? null,
    [withSpecs]
  )

  const rivals = useMemo(() => withSpecs.filter(v => v.brand.toLowerCase() !== 'ford'), [withSpecs])
  const rivalAvgPower = rivals.length
    ? Math.round(rivals.reduce((sum, v) => sum + (v.spec!.potenciaCv || 0), 0) / rivals.length)
    : null
  const rivalTop = rivals.length
    ? rivals.reduce((max, v) => (v.spec!.potenciaCv || 0) > (max.spec!.potenciaCv || 0) ? v : max)
    : null

  const stats = [
    { label: 'Veículos monitorados', value: vehicles.length, icon: Car, color: '#3b82f6' },
    { label: 'Marcas monitoradas', value: brands.length, icon: BarChart3, color: '#8b5cf6' },
    { label: 'Cobertura de dados', value: `${coveragePct}%`, icon: Gauge, color: '#10b981' },
    { label: 'Fontes confiáveis', value: `${reliabilityPct}%`, icon: ShieldCheck, color: '#f59e0b' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Visão Geral</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Panorama comparativo entre a Ford e a concorrência
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border p-4"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${stat.color}20` }}>
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{loading ? '...' : stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{stat.label}</p>
            </div>
          )
        })}
      </div>

      {!loading && fordFlagship && (
        <div className="rounded-2xl border p-5 mb-8 flex items-center gap-4"
          style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/15">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              {fordFlagship.brand} {fordFlagship.model} {fordFlagship.version}
            </p>
            <p className="text-xs mt-0.5 text-white/70">
              {fordFlagship.spec!.potenciaCv} cv
              {rivalAvgPower != null && (
                <> · {fordFlagship.spec!.potenciaCv! >= rivalAvgPower ? '+' : ''}{(fordFlagship.spec!.potenciaCv! - rivalAvgPower)} cv vs. média da concorrência ({rivalAvgPower} cv)</>
              )}
              {rivalTop && (
                <> · líder do segmento: {rivalTop.brand} {rivalTop.model} ({rivalTop.spec!.potenciaCv} cv)</>
              )}
            </p>
          </div>
          <Link href={`/vehicles/${fordFlagship.id}`}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white">
            Ver ficha <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
            Confiabilidade das fontes
          </h2>
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
          ) : sourceBreakdown.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhum dado extraído ainda.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {sourceBreakdown.map(({ source, count, pct }) => {
                const info = SOURCE_LABEL[source]
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{info?.text || source}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--card-border)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: info?.color || '#8b5cf6' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
            <Trophy className="w-3.5 h-3.5" /> Liderança em potência
          </h2>
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhum dado extraído ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {leaderboard.map((v, i) => (
                <Link key={v.id} href={`/vehicles/${v.id}`} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-4 shrink-0" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                  <BrandBadge brand={v.brand} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{v.brand} {v.model}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{v.version}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md shrink-0"
                    style={{ color: 'var(--accent)', backgroundColor: 'var(--card-border)' }}>{v.spec!.potenciaCv} cv</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
            <History className="w-3.5 h-3.5" /> Atividade recente
          </h2>
          <Link href="/vehicles" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            Ver todos os veículos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
        ) : recent.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhuma extração registrada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recent.map(v => (
              <Link key={v.id} href={`/vehicles/${v.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: 'var(--background)' }}>
                <BrandBadge brand={v.brand} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{v.brand} {v.model} {v.version}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(v.spec!.fetchedAt!)}</p>
                </div>
                {v.spec?.precoBaseBrl != null && (
                  <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--foreground)' }}>
                    {formatBRL(v.spec.precoBaseBrl)}
                  </span>
                )}
                <SourceBadge source={v.spec?.source || 'ia_generated'} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

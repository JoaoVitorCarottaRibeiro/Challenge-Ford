'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { History, ArrowRight, TrendingUp, Info } from 'lucide-react'
import api from '@/lib/api'
import { BrandBadge } from '@/components/BrandBadge'
import PriceHistoryChart from '@/components/PriceHistoryChart'

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

  const brands = useMemo(() => [...new Set(vehicles.map(v => v.brand))], [vehicles])

  const recent = useMemo(
    () => vehicles
      .filter(v => v.spec?.fetchedAt)
      .sort((a, b) => new Date(b.spec!.fetchedAt!).getTime() - new Date(a.spec!.fetchedAt!).getTime())
      .slice(0, 5),
    [vehicles]
  )

  const stats = [
    { label: 'Veículos monitorados', value: vehicles.length },
    { label: 'Marcas monitoradas', value: brands.length },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8 max-w-md">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl border p-4"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{loading ? '...' : stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-5 mb-8" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
          <TrendingUp className="w-3.5 h-3.5" /> Valor FIPE por ano-modelo
          <span
            className="cursor-help"
            title="Valor de referência FIPE por ano-modelo, a partir do ano de cadastro de cada veículo — não é preço de lançamento nem série mensal (a FIPE não disponibiliza histórico mensal gratuito). Com 2+ anos registrados a partir do ano de cadastro, vira uma linha de tendência; com só o próprio ano de lançamento, aparece como um ponto isolado. Só fica de fora do gráfico quem não tem nenhum ano registrado a partir do cadastro.">
            <Info className="w-3.5 h-3.5" />
          </span>
        </h2>
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
        ) : (
          <PriceHistoryChart vehicles={vehicles} />
        )}
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

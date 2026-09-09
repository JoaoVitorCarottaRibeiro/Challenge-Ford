'use client'

import { useEffect, useMemo, useState, MouseEvent } from 'react'
import Link from 'next/link'
import { Search, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { BrandBadge } from '@/components/BrandBadge'

interface Vehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
  spec: { potenciaCv: number | null } | null
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api.get('/vehicles')
      .then(res => setVehicles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleDelete(e: MouseEvent, id: string, label: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Remover ${label}?`)) return
    try {
      await api.delete(`/vehicles/${id}`)
      load()
    } catch {
      alert('Não foi possível remover o veículo.')
    }
  }

  const brands = useMemo(
    () => [...new Set(vehicles.map(v => v.brand))].sort(),
    [vehicles]
  )

  const filtered = vehicles.filter(v =>
    (!selectedBrand || v.brand === selectedBrand) &&
    `${v.brand} ${v.model} ${v.version} ${v.yearModel}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Veículos</h1>

      <div className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 mb-4 max-w-md"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
        <Search className="w-4 h-4" style={{ color: 'var(--muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar veículo..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setSelectedBrand(null)}
          className="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors"
          style={{
            backgroundColor: selectedBrand === null ? 'var(--primary)' : 'var(--card)',
            color: selectedBrand === null ? 'white' : 'var(--foreground)',
            border: `1px solid ${selectedBrand === null ? 'var(--primary)' : 'var(--card-border)'}`
          }}>
          Todas as marcas
        </button>

        {brands.map(brand => {
          const active = selectedBrand === brand
          return (
            <button
              key={brand}
              onClick={() => setSelectedBrand(active ? null : brand)}
              className="shrink-0 flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? 'var(--primary)' : 'var(--card)',
                color: active ? 'white' : 'var(--foreground)',
                border: `1px solid ${active ? 'var(--primary)' : 'var(--card-border)'}`
              }}>
              <BrandBadge brand={brand} size={24} />
              {brand}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(v => (
            <Link key={v.id} href={`/vehicles/${v.id}`}
              className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <BrandBadge brand={v.brand} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{v.brand} {v.model}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{v.version} · {v.yearModel}</p>
              </div>
              {v.spec?.potenciaCv && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md"
                  style={{ color: 'var(--primary)', backgroundColor: 'var(--card-border)' }}>{v.spec.potenciaCv} cv</span>
              )}
              <button onClick={e => handleDelete(e, v.id, `${v.brand} ${v.model} ${v.version}`)}
                className="p-2 rounded-lg hover:opacity-70">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </Link>
          ))}
          {filtered.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum veículo encontrado.</p>}
        </div>
      )}
    </div>
  )
}

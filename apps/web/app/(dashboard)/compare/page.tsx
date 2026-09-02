'use client'

import { useEffect, useState } from 'react'
import { Scale } from 'lucide-react'
import api from '@/lib/api'
import SpecReport from '@/components/SpecReport'
import { HERO_FIELDS, formatSpecValue } from '@/constants/specCategories'

interface Vehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
  spec: Record<string, unknown> | null
}

function vehicleLabel(v: Vehicle) {
  return `${v.brand} ${v.model} ${v.version} - ${v.yearModel}`
}

export default function ComparePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  useEffect(() => {
    api.get('/vehicles')
      .then(res => setVehicles(res.data.filter((v: Vehicle) => v.spec !== null)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const vehicleA = vehicles.find(v => v.id === idA) ?? null
  const vehicleB = vehicles.find(v => v.id === idB) ?? null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Comparativo</h1>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-8">
        <select value={idA} onChange={e => setIdA(e.target.value)}
          className="rounded-xl border px-4 py-3 text-sm outline-none"
          style={{ backgroundColor: 'var(--card)', borderColor: '#3b82f6', color: 'var(--foreground)' }}>
          <option value="">Veículo A — selecionar</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{vehicleLabel(v)}</option>)}
        </select>

        <span className="text-center text-sm font-bold" style={{ color: 'var(--muted)' }}>VS</span>

        <select value={idB} onChange={e => setIdB(e.target.value)}
          className="rounded-xl border px-4 py-3 text-sm outline-none"
          style={{ backgroundColor: 'var(--card)', borderColor: '#8b5cf6', color: 'var(--foreground)' }}>
          <option value="">Veículo B — selecionar</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{vehicleLabel(v)}</option>)}
        </select>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}

      {vehicleA && vehicleB ? (
        <>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Destaques</h2>
          <div className="rounded-2xl border overflow-hidden mb-8"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
            {HERO_FIELDS.map(field => {
              const aVal = vehicleA.spec?.[field.key]
              const bVal = vehicleB.spec?.[field.key]
              if (aVal == null && bVal == null) return null
              return (
                <div key={field.key} className="flex items-center py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--card-border)' }}>
                  <span className="flex-1 text-right pr-3 text-sm" style={{ color: 'var(--foreground)' }}>
                    {formatSpecValue(aVal, field)}
                  </span>
                  <span className="w-32 text-center text-xs shrink-0" style={{ color: 'var(--muted)' }}>{field.label}</span>
                  <span className="flex-1 text-left pl-3 text-sm" style={{ color: 'var(--foreground)' }}>
                    {formatSpecValue(bVal, field)}
                  </span>
                </div>
              )
            })}
          </div>

          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Relatório completo</h2>
          <SpecReport spec={vehicleA.spec} specB={vehicleB.spec} defaultOpenFirst={false} />
        </>
      ) : (
        !loading && (
          <div className="text-center mt-16">
            <Scale className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>Compare dois veículos</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Selecione dois veículos acima para ver o comparativo completo</p>
          </div>
        )
      )}
    </div>
  )
}

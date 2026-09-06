'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import SpecReport from '@/components/SpecReport'
import { HERO_FIELDS, SOURCE_LABEL, formatSpecValue } from '@/constants/specCategories'
import { useAuth } from '@/context/AuthContext'

interface Vehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
  spec: (Record<string, unknown> & { source?: string; pdfSourceFile?: string | null }) | null
}

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/vehicles/${params.id}`)
      .then(res => setVehicle(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleDelete() {
    if (!vehicle) return
    if (!confirm(`Remover ${vehicle.brand} ${vehicle.model} ${vehicle.version}?`)) return
    try {
      await api.delete(`/vehicles/${vehicle.id}`)
      router.push('/vehicles')
    } catch {
      alert('Não foi possível remover o veículo.')
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Carregando...</p>
  if (!vehicle) return <p style={{ color: 'var(--muted)' }}>Veículo não encontrado.</p>

  const sourceInfo = vehicle.spec?.source ? SOURCE_LABEL[vehicle.spec.source] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.push('/vehicles')} className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: 'var(--accent)' }}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        {isAdmin && (
          <button onClick={handleDelete} className="p-2 rounded-lg hover:opacity-70">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>

      <div className="rounded-2xl p-6 mb-5" style={{ backgroundColor: 'var(--primary)' }}>
        <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{vehicle.brand}</p>
        <p className="text-2xl font-bold text-white mt-1">{vehicle.model} {vehicle.version}</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{vehicle.yearModel}</p>
      </div>

      {vehicle.spec ? (
        <>
          {sourceInfo && (
            <div className="inline-block rounded-lg border px-3.5 py-2 mb-5"
              style={{ backgroundColor: `${sourceInfo.color}20`, borderColor: sourceInfo.color }}>
              <span className="text-xs font-semibold" style={{ color: sourceInfo.color }}>{sourceInfo.text}</span>
              {vehicle.spec.pdfSourceFile && (
                <span className="text-xs ml-2" style={{ color: sourceInfo.color }}>· {vehicle.spec.pdfSourceFile}</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {HERO_FIELDS.map(field => {
              const val = vehicle.spec?.[field.key]
              if (val == null) return null
              return (
                <div key={field.key} className="rounded-2xl border p-4 text-center"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
                  <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{formatSpecValue(val, field)}</p>
                  <p className="text-xs mt-1 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{field.label}</p>
                </div>
              )
            })}
          </div>

          <SpecReport spec={vehicle.spec} />
        </>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Sem especificações disponíveis.</p>
      )}
    </div>
  )
}

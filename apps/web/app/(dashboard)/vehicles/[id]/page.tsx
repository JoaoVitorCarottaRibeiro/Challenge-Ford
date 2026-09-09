'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { VehicleDetailView } from '@/components/VehicleDetailView'

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

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.push('/vehicles')} className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: 'var(--accent)' }}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button onClick={handleDelete} className="p-2 rounded-lg hover:opacity-70">
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      <VehicleDetailView vehicle={vehicle} spec={vehicle.spec} />
    </div>
  )
}

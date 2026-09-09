'use client'

import SpecReport from '@/components/SpecReport'
import { BrandBadge } from '@/components/BrandBadge'
import { HERO_FIELDS, SOURCE_LABEL, formatSpecValue } from '@/constants/specCategories'

interface VehicleDetailViewProps {
  vehicle: { brand: string; model: string; version: string; yearModel: number }
  spec: (Record<string, unknown> & { source?: string; pdfSourceFile?: string | null }) | null
}

// Miolo visual da ficha de um veículo — header + badge de fonte + cards de destaque +
// relatório completo. Usado na tela de detalhe (vehicles/[id]) e no painel de resultado
// da tela de Extrair Specs, pra não ter duas versões da mesma UI.
export function VehicleDetailView({ vehicle, spec }: VehicleDetailViewProps) {
  const sourceInfo = spec?.source ? SOURCE_LABEL[spec.source] : null

  return (
    <div>
      <div className="rounded-2xl p-6 mb-5 flex items-center gap-4" style={{ backgroundColor: 'var(--hero-bg)' }}>
        <BrandBadge brand={vehicle.brand} size={56} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--hero-fg-muted)' }}>{vehicle.brand}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--hero-fg)' }}>{vehicle.model} {vehicle.version}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--hero-fg-muted)' }}>{vehicle.yearModel}</p>
        </div>
      </div>

      {spec ? (
        <>
          {sourceInfo && (
            <div className="inline-block rounded-lg border px-3.5 py-2 mb-5"
              style={{ backgroundColor: `${sourceInfo.color}20`, borderColor: sourceInfo.color }}>
              <span className="text-xs font-semibold" style={{ color: sourceInfo.color }}>{sourceInfo.text}</span>
              {spec.pdfSourceFile && (
                <span className="text-xs ml-2" style={{ color: sourceInfo.color }}>· {spec.pdfSourceFile}</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {HERO_FIELDS.map(field => {
              const val = spec?.[field.key]
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

          <SpecReport spec={spec} />
        </>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Sem especificações disponíveis.</p>
      )}
    </div>
  )
}

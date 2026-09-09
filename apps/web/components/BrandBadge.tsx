'use client'

import { useState } from 'react'

const BRAND_COLORS: Record<string, string> = {
  ford: '1F3A6E', toyota: 'CC0000', mitsubishi: 'E60012', volkswagen: '001E50', chevrolet: 'CC0000', ram: '5B2A86',
  fiat: '941711', nissan: 'C3002F', byd: 'E60012',
}

// Slugs do Simple Icons (cdn.simpleicons.org) — CDN público de ícones de marca em SVG.
// BYD não tem ícone nesse catálogo (testado, retorna 404) — usa asset local (BRAND_LOCAL_LOGOS) em vez do CDN.
const BRAND_LOGO_SLUGS: Record<string, string> = {
  ford: 'ford', toyota: 'toyota', mitsubishi: 'mitsubishi', volkswagen: 'volkswagen', chevrolet: 'chevrolet', ram: 'ram',
  fiat: 'fiat', nissan: 'nissan',
}

// Logos locais (sem cobertura no Simple Icons) — arquivo em public/, já sem fundo.
const BRAND_LOCAL_LOGOS: Record<string, string> = {
  byd: '/byd-logo.png',
}

export function brandColor(brand: string) {
  return `#${BRAND_COLORS[brand.toLowerCase()] || '1F3A6E'}`
}

export function BrandBadge({ brand, size = 40 }: { brand: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const key = brand.toLowerCase()
  const slug = BRAND_LOGO_SLUGS[key]
  const localLogo = BRAND_LOCAL_LOGOS[key]
  const color = BRAND_COLORS[key] || '1F3A6E'

  if ((!slug && !localLogo) || failed) {
    return (
      <div className="rounded-xl flex items-center justify-center text-white font-bold shrink-0"
        style={{ width: size, height: size, backgroundColor: brandColor(brand) }}>
        {brand[0].toUpperCase()}
      </div>
    )
  }

  return (
    <div className="rounded-xl flex items-center justify-center shrink-0 bg-white border"
      style={{ width: size, height: size, borderColor: 'var(--card-border)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={localLogo || `https://cdn.simpleicons.org/${slug}/${color}`}
        alt={brand}
        width={Math.round(size * (localLogo ? 0.7 : 0.55))}
        height={Math.round(size * (localLogo ? 0.7 : 0.55))}
        onError={() => setFailed(true)}
      />
    </div>
  )
}

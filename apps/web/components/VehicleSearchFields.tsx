'use client'

import type { KeyboardEvent } from 'react'

interface VehicleSearchFieldsProps {
  brand: string
  model: string
  version: string
  year: string
  onBrandChange: (value: string) => void
  onModelChange: (value: string) => void
  onVersionChange: (value: string) => void
  onYearChange: (value: string) => void
  onEnter?: () => void
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 27 }, (_, i) => String(CURRENT_YEAR - i))

const fieldStyle = { backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', color: 'var(--foreground)' }
const labelClass = "flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide"
const inputClass = "rounded-xl border px-3.5 py-3 text-sm outline-none"

// Marca/Modelo/Versão/Ano em texto livre (ano por seletor) — mesmo container usado no
// dashboard ("Buscar Veículo") e na tela de Extrair Specs, pra não ter duas UIs
// diferentes fazendo a mesma coisa. O ano é manual de propósito: o ano-modelo real de
// um veículo (inclusive o que uma ficha técnica em PDF descreve) não tem relação
// nenhuma com a data em que alguém faz a busca.
export function VehicleSearchFields({
  brand, model, version, year, onBrandChange, onModelChange, onVersionChange, onYearChange, onEnter,
}: VehicleSearchFieldsProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onEnter?.()
  }

  return (
    <>
      <label className={labelClass} style={{ color: 'var(--muted)' }}>
        Marca
        <input value={brand} onChange={e => onBrandChange(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ex: Ford" className={inputClass} style={fieldStyle} />
      </label>
      <label className={labelClass} style={{ color: 'var(--muted)' }}>
        Modelo
        <input value={model} onChange={e => onModelChange(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ex: Ranger" className={inputClass} style={fieldStyle} />
      </label>
      <label className={labelClass} style={{ color: 'var(--muted)' }}>
        Versão
        <input value={version} onChange={e => onVersionChange(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ex: Raptor" className={inputClass} style={fieldStyle} />
      </label>
      <label className={labelClass} style={{ color: 'var(--muted)' }}>
        Ano
        <select value={year} onChange={e => onYearChange(e.target.value)} className={inputClass} style={fieldStyle}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
    </>
  )
}

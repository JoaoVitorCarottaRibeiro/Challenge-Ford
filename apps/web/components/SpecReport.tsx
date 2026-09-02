'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { SPEC_CATEGORIES, formatSpecValue, SpecField } from '@/constants/specCategories'

type Spec = Record<string, unknown> | null | undefined

interface Props {
  spec: Spec
  /** Quando informado, o relatório vira uma comparação lado a lado (A = spec, B = specB). */
  specB?: Spec
  defaultOpenFirst?: boolean
}

function isFilled(v: unknown) {
  return v !== null && v !== undefined
}

function isTruthy(v: unknown) {
  return v === 1 || v === true
}

function countFilled(fields: SpecField[], s: Spec) {
  if (!s) return 0
  return fields.filter(f => isFilled(s[f.key])).length
}

function getBetter(field: SpecField, a: unknown, b: unknown): 'A' | 'B' | null {
  if (field.type === 'bool') {
    const av = isTruthy(a)
    const bv = isTruthy(b)
    if (!isFilled(a) || !isFilled(b) || av === bv) return null
    return av ? 'A' : 'B'
  }
  if (!isFilled(a) || !isFilled(b)) return null
  const an = Number(a)
  const bn = Number(b)
  if (an === bn) return null
  return an > bn ? 'A' : 'B'
}

export default function SpecReport({ spec, specB, defaultOpenFirst = true }: Props) {
  const isCompare = specB !== undefined
  const [openCategory, setOpenCategory] = useState<string | null>(
    defaultOpenFirst ? SPEC_CATEGORIES[0].name : null
  )

  if (!spec) {
    return <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 20 }}>Sem especificações disponíveis.</p>
  }

  function toggle(name: string) {
    setOpenCategory(prev => (prev === name ? null : name))
  }

  return (
    <div className="flex flex-col gap-2.5">
      {SPEC_CATEGORIES.map(category => {
        const isOpen = openCategory === category.name
        const filledA = countFilled(category.fields, spec)
        const filledB = isCompare ? countFilled(category.fields, specB) : null

        return (
          <div key={category.name} className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <button
              onClick={() => toggle(category.name)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{category.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {isCompare ? `${filledA}/${category.fields.length} · ${filledB}/${category.fields.length}` : `${filledA}/${category.fields.length}`}
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted)' }} />}
              </span>
            </button>

            {isOpen && (
              <div className="border-t" style={{ borderColor: 'var(--card-border)' }}>
                {category.fields.map(field => {
                  const aVal = spec[field.key]

                  if (!isCompare) {
                    return (
                      <div key={field.key} className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0"
                        style={{ borderColor: 'var(--card-border)' }}>
                        <span className="text-sm" style={{ color: 'var(--muted)' }}>{field.label}</span>
                        {field.type === 'bool' ? (
                          isTruthy(aVal)
                            ? <Check className="w-4 h-4 text-emerald-500" />
                            : <span className="text-sm" style={{ color: isFilled(aVal) ? '#ef4444' : 'var(--muted)' }}>{isFilled(aVal) ? <X className="w-4 h-4" /> : '—'}</span>
                        ) : (
                          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{formatSpecValue(aVal, field)}</span>
                        )}
                      </div>
                    )
                  }

                  const bVal = specB?.[field.key]
                  const better = getBetter(field, aVal, bVal)

                  return (
                    <div key={field.key} className="flex items-center py-2.5 border-b last:border-b-0"
                      style={{ borderColor: 'var(--card-border)' }}>
                      <div className="flex-1 flex justify-end pr-3">
                        {field.type === 'bool' ? (
                          isTruthy(aVal)
                            ? <Check className="w-4 h-4" style={{ color: better === 'A' ? '#10b981' : '#9ca3af' }} />
                            : (isFilled(aVal) ? <X className="w-4 h-4 text-red-500" /> : <span style={{ color: 'var(--muted)' }}>—</span>)
                        ) : (
                          <span className="text-xs font-medium" style={{ color: better === 'A' ? '#10b981' : 'var(--foreground)', fontWeight: better === 'A' ? 700 : 500 }}>
                            {formatSpecValue(aVal, field)}
                          </span>
                        )}
                      </div>
                      <span className="w-40 text-center text-xs shrink-0" style={{ color: 'var(--muted)' }}>{field.label}</span>
                      <div className="flex-1 flex justify-start pl-3">
                        {field.type === 'bool' ? (
                          isTruthy(bVal)
                            ? <Check className="w-4 h-4" style={{ color: better === 'B' ? '#10b981' : '#9ca3af' }} />
                            : (isFilled(bVal) ? <X className="w-4 h-4 text-red-500" /> : <span style={{ color: 'var(--muted)' }}>—</span>)
                        ) : (
                          <span className="text-xs font-medium" style={{ color: better === 'B' ? '#10b981' : 'var(--foreground)', fontWeight: better === 'B' ? 700 : 500 }}>
                            {formatSpecValue(bVal, field)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

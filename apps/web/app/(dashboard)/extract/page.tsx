'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { Sparkles, Search, FileUp, X, ListChecks } from 'lucide-react'
import api from '@/lib/api'
import SpecReport from '@/components/SpecReport'
import { SourceBadge } from '@/components/SourceBadge'
import { HERO_FIELDS, SPEC_CATEGORIES, formatSpecValue } from '@/constants/specCategories'

interface ExtractResult {
  source: 'db_cache' | 'pdf_oficial' | 'pdf_upload' | 'web_scraping' | 'ia_generated'
  vehicle: { id: string; brand: string; model: string; version: string; yearModel: number }
  spec: Record<string, unknown> & { pdfSourceFile?: string | null }
  categoriesSearched?: string[]
}

const ALL_CATEGORY_NAMES = SPEC_CATEGORIES.map(c => c.name)

const MAX_PDF_MB = 15

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const VEHICLE_OPTIONS: Record<string, Record<string, string[]>> = {
  Toyota:     { Hilux:       ['SRX', 'SR', 'GR Sport', 'Conquest'] },
  Ford:       { Ranger:      ['Raptor', 'Storm', 'XLS', 'XLT', 'Limited'] },
  Volkswagen: { Amarok:      ['Highline V6', 'Extreme', 'Comfortline', 'Trendline'] },
  Chevrolet:  { S10:         ['High Country', 'LTZ', 'LT', 'LS'] },
  Mitsubishi: { 'L200 Triton': ['Katana', 'HPE-S', 'HPE', 'Sport'] },
  RAM:        { Rampage:     ['R/T', 'Laramie', 'Rebel', 'Tungsten'] },
}

const YEARS = Array.from({ length: 27 }, (_, i) => String(2026 - i))

export default function ExtractPage() {
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [version, setVersion] = useState('')
  const [year, setYear] = useState('2025')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_CATEGORY_NAMES)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const allCategoriesSelected = selectedCategories.length === ALL_CATEGORY_NAMES.length

  function toggleCategory(name: string) {
    setSelectedCategories(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  function toggleAllCategories() {
    setSelectedCategories(allCategoriesSelected ? [] : ALL_CATEGORY_NAMES)
  }

  const brands = Object.keys(VEHICLE_OPTIONS)
  const models = brand ? Object.keys(VEHICLE_OPTIONS[brand] || {}) : []
  const versions = model ? VEHICLE_OPTIONS[brand]?.[model] || [] : []

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) { setPdfFile(null); setPdfError(''); return }
    if (file.type !== 'application/pdf') {
      setPdfError('Selecione um arquivo PDF.')
      setPdfFile(null)
      return
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setPdfError(`O arquivo excede ${MAX_PDF_MB}MB.`)
      setPdfFile(null)
      return
    }
    setPdfError('')
    setPdfFile(file)
  }

  function handleRemoveFile() {
    setPdfFile(null)
    setPdfError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleExtract() {
    if (!brand || !model || !version || !year) {
      setError('Selecione marca, modelo, versão e ano.')
      return
    }
    if (selectedCategories.length === 0) {
      setError('Selecione ao menos uma categoria de especificações para pesquisar.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const body: Record<string, unknown> = { brand, model, version, yearModel: parseInt(year) }
      if (pdfFile) {
        body.pdfBase64 = await fileToBase64(pdfFile)
        body.pdfFileName = pdfFile.name
      }
      // Só manda a lista quando o usuário restringiu algo — com tudo marcado
      // (padrão), preserva o cache do backend em vez de forçar reextração.
      if (!allCategoriesSelected) {
        body.categories = selectedCategories
      }
      const { data } = await api.post('/extract', body)
      setResult(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao extrair especificações.')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setBrand(''); setModel(''); setVersion(''); setYear('2025'); setResult(null); setError('')
    setSelectedCategories(ALL_CATEGORY_NAMES)
    handleRemoveFile()
  }

  const selectClass = "rounded-xl border px-3.5 py-3 text-sm outline-none disabled:opacity-40"
  const selectStyle = { backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', color: 'var(--foreground)' }

  return (
    <div>
      <div className="flex items-center gap-3.5 mb-7">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#8b5cf620' }}>
          <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Extrair Specs</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Powered by Claude AI</p>
        </div>
      </div>

      <div className="rounded-2xl border p-5 mb-6 max-w-xl grid grid-cols-2 gap-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Marca
          <select className={selectClass} style={selectStyle} value={brand}
            onChange={e => { setBrand(e.target.value); setModel(''); setVersion('') }}>
            <option value="">Selecione</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Modelo
          <select className={selectClass} style={selectStyle} value={model} disabled={!brand}
            onChange={e => { setModel(e.target.value); setVersion('') }}>
            <option value="">Selecione</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Versão
          <select className={selectClass} style={selectStyle} value={version} disabled={!model}
            onChange={e => setVersion(e.target.value)}>
            <option value="">Selecione</option>
            {versions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Ano
          <select className={selectClass} style={selectStyle} value={year} onChange={e => setYear(e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>

        <label className="col-span-2 flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Ficha técnica em PDF (opcional)
          <div className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5" style={selectStyle}>
            <FileUp className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="flex-1 text-xs font-normal normal-case"
              style={{ color: 'var(--foreground)' }}
            />
            {pdfFile && (
              <button type="button" onClick={handleRemoveFile} aria-label="Remover arquivo">
                <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
              </button>
            )}
          </div>
          <span className="text-xs font-normal normal-case" style={{ color: 'var(--muted)' }}>
            Envie a ficha de qualquer concorrente — ela vira a fonte principal da extração, no lugar da busca padrão.
          </span>
          {pdfError && <span className="text-xs font-normal normal-case text-red-500">{pdfError}</span>}
        </label>

        <div className="col-span-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              <ListChecks className="w-3.5 h-3.5" />
              O que pesquisar ({selectedCategories.length}/{ALL_CATEGORY_NAMES.length})
            </span>
            <button type="button" onClick={toggleAllCategories} className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>
              {allCategoriesSelected ? 'Limpar seleção' : 'Selecionar tudo'}
            </button>
          </div>
          <div className="rounded-xl border p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2" style={selectStyle}>
            {SPEC_CATEGORIES.map(category => (
              <label key={category.name} className="flex items-center gap-2 text-xs font-normal normal-case cursor-pointer"
                style={{ color: 'var(--foreground)' }}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.name)}
                  onChange={() => toggleCategory(category.name)}
                />
                {category.name}
              </label>
            ))}
          </div>
          <span className="text-xs font-normal normal-case" style={{ color: 'var(--muted)' }}>
            Desmarque o que não te interessa — só pesquisamos (e só pagamos IA) pelo que ficar marcado aqui.
          </span>
        </div>

        <button
          onClick={handleExtract}
          disabled={loading}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: '#8b5cf6' }}>
          <Search className="w-4 h-4" />
          {loading ? 'Consultando banco e agente de IA...' : 'Buscar Especificações'}
        </button>

        {error && <p className="col-span-2 text-sm text-red-500">{error}</p>}
      </div>

      {result && (
        <div className="flex flex-col gap-4 max-w-3xl">
          <SourceBadge source={result.source} detail={result.spec.pdfSourceFile} className="self-start" />


          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {result.vehicle.brand} {result.vehicle.model} {result.vehicle.version}
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{result.vehicle.yearModel}</p>
          </div>

          {result.categoriesSearched && result.categoriesSearched.length < ALL_CATEGORY_NAMES.length && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Pesquisado nesta rodada: {result.categoriesSearched.join(', ')}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HERO_FIELDS.map(field => {
              const val = result.spec?.[field.key]
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

          <h2 className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--muted)' }}>Relatório completo</h2>
          <SpecReport spec={result.spec} />

          <button onClick={handleClear} className="self-center text-sm font-semibold py-2" style={{ color: '#8b5cf6' }}>
            Fazer nova busca
          </button>
        </div>
      )}
    </div>
  )
}

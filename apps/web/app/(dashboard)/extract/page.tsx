'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { Sparkles, Search, FileUp, X, ListChecks, Globe, FileText } from 'lucide-react'
import api from '@/lib/api'
import SpecReport from '@/components/SpecReport'
import { SourceBadge } from '@/components/SourceBadge'
import { HERO_FIELDS, SPEC_CATEGORIES, formatSpecValue } from '@/constants/specCategories'

interface ExtractResult {
  source: 'db_cache' | 'pdf_oficial' | 'pdf_upload' | 'web_scraping' | 'ia_generated'
  vehicle: { id: string; brand: string; model: string; version: string; yearModel: number }
  spec: Record<string, unknown> & { pdfSourceFile?: string | null }
  categoriesSearched?: string[]
  aiEnabled?: boolean
  aiDisabled?: boolean
  notice?: string
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

// Marcas do segmento de picapes médias 4x4 de chassi em escada (mesma classe da
// Raptor) — a lista completa, independente de já termos ficha curada pra todas.
// Ver CLAUDE.md "Escopo do segmento" pra critério de inclusão/exclusão.
const VEHICLE_OPTIONS: Record<string, Record<string, string[]>> = {
  Ford:       { Ranger:        ['Raptor', 'Storm', 'XLS', 'XLT', 'Limited'] },
  Toyota:     { Hilux:         ['SRX', 'SR', 'GR Sport', 'Conquest'] },
  Volkswagen: { Amarok:        ['Highline V6', 'Extreme', 'Comfortline', 'Trendline'] },
  Chevrolet:  { S10:           ['High Country', 'LTZ', 'LT', 'LS'] },
  Mitsubishi: { 'L200 Triton': ['Katana', 'HPE-S', 'HPE', 'Sport'] },
  Nissan:     { Frontier:      ['PRO-4X', 'LE', 'Attack', 'S'] },
  Fiat:       { Titano:        ['Ranch', 'Volcano', 'Endurance'] },
  BYD:        { Shark:         ['GS'] },
}

const YEARS = Array.from({ length: 27 }, (_, i) => String(2026 - i))

type Tab = 'ai' | 'pdf'

export default function ExtractPage() {
  const [tab, setTab] = useState<Tab>('ai')

  // Aba "Buscar via IA/Web" — marca/modelo/versão presos ao catálogo do segmento.
  const [aiBrand, setAiBrand] = useState('')
  const [aiModel, setAiModel] = useState('')
  const [aiVersion, setAiVersion] = useState('')
  const [aiYear, setAiYear] = useState('2025')

  // Aba "Enviar ficha em PDF" — independente da anterior: o único requisito é
  // o arquivo. Marca/modelo/versão/ano são opcionais — se ficarem em branco,
  // o backend lê o próprio PDF pra identificar o veículo antes de extrair as
  // specs (só cai de volta pra "preencha manualmente" se nem isso conseguir).
  const [pdfBrand, setPdfBrand] = useState('')
  const [pdfModel, setPdfModel] = useState('')
  const [pdfVersion, setPdfVersion] = useState('')
  const [pdfYear, setPdfYear] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfFileError, setPdfFileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Compartilhado pelas duas abas.
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_CATEGORY_NAMES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ExtractResult | null>(null)

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
  const models = aiBrand ? Object.keys(VEHICLE_OPTIONS[aiBrand] || {}) : []
  const versions = aiModel ? VEHICLE_OPTIONS[aiBrand]?.[aiModel] || [] : []

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) { setPdfFile(null); setPdfFileError(''); return }
    if (file.type !== 'application/pdf') {
      setPdfFileError('Selecione um arquivo PDF.')
      setPdfFile(null)
      return
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setPdfFileError(`O arquivo excede ${MAX_PDF_MB}MB.`)
      setPdfFile(null)
      return
    }
    setPdfFileError('')
    setPdfFile(file)
  }

  function handleRemoveFile() {
    setPdfFile(null)
    setPdfFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function runExtract(body: Record<string, unknown>) {
    if (selectedCategories.length === 0) {
      setError('Selecione ao menos uma categoria de especificações para pesquisar.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      if (!allCategoriesSelected) {
        // Só manda a lista quando o usuário restringiu algo — com tudo marcado
        // (padrão), preserva o cache do backend em vez de forçar reextração.
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

  function handleExtractAi() {
    if (!aiBrand || !aiModel || !aiVersion || !aiYear) {
      setError('Selecione marca, modelo, versão e ano.')
      return
    }
    runExtract({ brand: aiBrand, model: aiModel, version: aiVersion, yearModel: parseInt(aiYear) })
  }

  async function handleExtractPdf() {
    if (!pdfFile) {
      setError('Escolha o arquivo PDF da ficha técnica.')
      return
    }
    const pdfBase64 = await fileToBase64(pdfFile)
    // Só manda o que foi preenchido — em branco, o backend identifica o
    // veículo lendo o próprio PDF.
    const body: Record<string, unknown> = { pdfBase64, pdfFileName: pdfFile.name }
    if (pdfBrand) body.brand = pdfBrand
    if (pdfModel) body.model = pdfModel
    if (pdfVersion) body.version = pdfVersion
    if (pdfYear) body.yearModel = parseInt(pdfYear)
    runExtract(body)
  }

  function handleClear() {
    setResult(null)
    setError('')
  }

  const inputClass = "rounded-xl border px-3.5 py-3 text-sm outline-none disabled:opacity-40"
  const inputStyle = { backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', color: 'var(--foreground)' }
  const labelClass = "flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide"
  const labelStyle = { color: 'var(--muted)' }

  const categoriesBlock = (
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
      <div className="rounded-xl border p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2" style={inputStyle}>
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
  )

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

      {/* Duas portas de entrada independentes: uma busca por marca/modelo do
          catálogo do segmento (via web + IA), a outra parte direto de um PDF —
          de qualquer concorrente, mesmo um ainda não cadastrado — sem depender
          da primeira. O parser determinístico lê o PDF primeiro; a IA só cobre
          o que ficar nulo. */}
      <div className="flex gap-2 mb-4 max-w-xl">
        <button
          onClick={() => { setTab('ai'); setError('') }}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: tab === 'ai' ? 'var(--primary)' : 'var(--card)',
            color: tab === 'ai' ? 'white' : 'var(--muted)',
            border: `1px solid ${tab === 'ai' ? 'var(--primary)' : 'var(--card-border)'}`
          }}>
          <Globe className="w-4 h-4" /> Buscar via IA/Web
        </button>
        <button
          onClick={() => { setTab('pdf'); setError('') }}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: tab === 'pdf' ? 'var(--primary)' : 'var(--card)',
            color: tab === 'pdf' ? 'white' : 'var(--muted)',
            border: `1px solid ${tab === 'pdf' ? 'var(--primary)' : 'var(--card-border)'}`
          }}>
          <FileText className="w-4 h-4" /> Enviar ficha em PDF
        </button>
      </div>

      {tab === 'ai' && (
        <div className="rounded-2xl border p-5 mb-6 max-w-xl grid grid-cols-2 gap-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <p className="col-span-2 text-xs" style={{ color: 'var(--muted)' }}>
            Pesquisa por marca/modelo do segmento — usa a ficha curada quando existe, senão busca em fontes públicas + conhecimento geral da IA.
          </p>

          <label className={labelClass} style={labelStyle}>
            Marca
            <select className={inputClass} style={inputStyle} value={aiBrand}
              onChange={e => { setAiBrand(e.target.value); setAiModel(''); setAiVersion('') }}>
              <option value="">Selecione</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>

          <label className={labelClass} style={labelStyle}>
            Modelo
            <select className={inputClass} style={inputStyle} value={aiModel} disabled={!aiBrand}
              onChange={e => { setAiModel(e.target.value); setAiVersion('') }}>
              <option value="">Selecione</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className={labelClass} style={labelStyle}>
            Versão
            <select className={inputClass} style={inputStyle} value={aiVersion} disabled={!aiModel}
              onChange={e => setAiVersion(e.target.value)}>
              <option value="">Selecione</option>
              {versions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>

          <label className={labelClass} style={labelStyle}>
            Ano
            <select className={inputClass} style={inputStyle} value={aiYear} onChange={e => setAiYear(e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>

          {categoriesBlock}

          <button
            onClick={handleExtractAi}
            disabled={loading}
            className="col-span-2 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: '#8b5cf6' }}>
            <Search className="w-4 h-4" />
            {loading ? 'Consultando banco e agente de IA...' : 'Buscar Especificações'}
          </button>

          {error && <p className="col-span-2 text-sm text-red-500">{error}</p>}
        </div>
      )}

      {tab === 'pdf' && (
        <div className="rounded-2xl border p-5 mb-6 max-w-xl grid grid-cols-2 gap-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <p className="col-span-2 text-xs" style={{ color: 'var(--muted)' }}>
            Envie a ficha técnica de qualquer concorrente — mesmo um que ainda não esteja no catálogo. O PDF é lido primeiro (sem IA); o agente só entra depois, pra preencher o que ficar faltando. Só o arquivo é obrigatório — deixe marca/modelo/versão/ano em branco que identificamos pelo próprio documento.
          </p>

          <label className={`col-span-2 ${labelClass}`} style={labelStyle}>
            Ficha técnica em PDF
            <div className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5" style={inputStyle}>
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
            {pdfFileError && <span className="text-xs font-normal normal-case text-red-500">{pdfFileError}</span>}
          </label>

          <label className={labelClass} style={labelStyle}>
            Marca <span className="normal-case font-normal">(opcional)</span>
            <input type="text" className={inputClass} style={inputStyle} value={pdfBrand}
              onChange={e => setPdfBrand(e.target.value)} placeholder="Detectamos pelo PDF" />
          </label>

          <label className={labelClass} style={labelStyle}>
            Modelo <span className="normal-case font-normal">(opcional)</span>
            <input type="text" className={inputClass} style={inputStyle} value={pdfModel}
              onChange={e => setPdfModel(e.target.value)} placeholder="Detectamos pelo PDF" />
          </label>

          <label className={labelClass} style={labelStyle}>
            Versão <span className="normal-case font-normal">(opcional)</span>
            <input type="text" className={inputClass} style={inputStyle} value={pdfVersion}
              onChange={e => setPdfVersion(e.target.value)} placeholder="Detectamos pelo PDF" />
          </label>

          <label className={labelClass} style={labelStyle}>
            Ano <span className="normal-case font-normal">(opcional)</span>
            <select className={inputClass} style={inputStyle} value={pdfYear} onChange={e => setPdfYear(e.target.value)}>
              <option value="">Detectar pelo PDF</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>

          {categoriesBlock}

          <button
            onClick={handleExtractPdf}
            disabled={loading}
            className="col-span-2 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: '#8b5cf6' }}>
            <FileText className="w-4 h-4" />
            {loading ? 'Lendo o PDF...' : 'Extrair do PDF'}
          </button>

          {error && <p className="col-span-2 text-sm text-red-500">{error}</p>}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={result.source} detail={result.spec.pdfSourceFile} />
            {result.aiDisabled && (
              <div className="inline-flex shrink-0 items-center rounded-lg border px-3.5 py-2"
                style={{ backgroundColor: '#f59e0b20', borderColor: '#f59e0b' }}>
                <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                  {result.notice || 'IA desabilitada — só specs-base'}
                </span>
              </div>
            )}
          </div>

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

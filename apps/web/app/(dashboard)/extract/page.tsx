'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UploadCloud, FileText, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { VehicleSearchFields } from '@/components/VehicleSearchFields'
import { VehicleDetailView } from '@/components/VehicleDetailView'

interface CatalogVehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
}

interface ExtractResult {
  source: 'db_cache' | 'pdf_oficial' | 'pdf_upload' | 'web_scraping' | 'ia_generated'
  vehicle: { id: string; brand: string; model: string; version: string; yearModel: number }
  spec: Record<string, unknown> & { pdfSourceFile?: string | null }
}

const MAX_PDF_MB = 15

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const norm = (s: string) => s.trim().toLowerCase()

export default function ExtractPage() {
  const router = useRouter()
  const [catalog, setCatalog] = useState<CatalogVehicle[]>([])
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [version, setVersion] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [existingMatch, setExistingMatch] = useState<CatalogVehicle | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    api.get('/vehicles').then(res => setCatalog(res.data)).catch(console.error)
  }, [])

  const pdfPreviewUrl = useMemo(() => pdfFile ? URL.createObjectURL(pdfFile) : null, [pdfFile])
  useEffect(() => () => { if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl) }, [pdfPreviewUrl])

  function validateAndSetFile(file: File | null) {
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

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    validateAndSetFile(e.target.files?.[0] ?? null)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    validateAndSetFile(e.dataTransfer.files?.[0] ?? null)
  }

  function handleRemoveFile() {
    setPdfFile(null)
    setPdfError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleExtract() {
    if (!brand.trim() || !model.trim() || !version.trim()) {
      setError('Preencha marca, modelo e versão.')
      return
    }
    setError('')
    setResult(null)
    setExistingMatch(null)

    // Sem PDF, um veículo já cadastrado com essa marca/modelo/versão/ano exatos só
    // precisa ser mostrado, não reextraído. Com PDF, o upload é sempre um pedido
    // explícito de (re)extração — nunca cai nesse atalho.
    if (!pdfFile) {
      const existing = catalog.find(v =>
        norm(v.brand) === norm(brand) && norm(v.model) === norm(model) &&
        norm(v.version) === norm(version) && v.yearModel === Number(year)
      )
      if (existing) {
        setExistingMatch(existing)
        return
      }
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        brand: brand.trim(), model: model.trim(), version: version.trim(),
        yearModel: Number(year),
      }
      if (pdfFile) {
        body.pdfBase64 = await fileToBase64(pdfFile)
        body.pdfFileName = pdfFile.name
      }
      const { data } = await api.post('/extract', body)
      setResult(data)
      setCatalog(prev => {
        const withoutOld = prev.filter(v => v.id !== data.vehicle.id)
        return [...withoutOld, data.vehicle]
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao extrair especificações.')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = { backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', color: 'var(--foreground)' }

  return (
    <div>
      <h1 className="text-xl font-bold mb-7" style={{ color: 'var(--foreground)' }}>Extrair Specs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
        <div className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <div className="grid grid-cols-1 gap-4">
            <VehicleSearchFields
              brand={brand} model={model} version={version} year={year}
              onBrandChange={setBrand} onModelChange={setModel} onVersionChange={setVersion} onYearChange={setYear}
              onEnter={handleExtract}
            />
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Ficha técnica em PDF (opcional)
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors"
              style={{
                backgroundColor: isDragging ? 'color-mix(in srgb, var(--primary) 12%, var(--background))' : fieldStyle.backgroundColor,
                borderColor: isDragging ? 'var(--primary)' : fieldStyle.borderColor,
              }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {pdfFile ? (
                <>
                  <FileText className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                  <p className="text-sm font-semibold normal-case" style={{ color: 'var(--foreground)' }}>{pdfFile.name}</p>
                  <button type="button" onClick={e => { e.stopPropagation(); handleRemoveFile() }}
                    className="flex items-center gap-1 text-xs font-semibold normal-case mt-1" style={{ color: 'var(--muted)' }}>
                    <X className="w-3.5 h-3.5" /> Remover arquivo
                  </button>
                </>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6" style={{ color: 'var(--muted)' }} />
                  <p className="text-sm font-semibold normal-case" style={{ color: 'var(--foreground)' }}>
                    Arraste e solte a ficha técnica aqui
                  </p>
                  <p className="text-xs font-normal normal-case" style={{ color: 'var(--muted)' }}>
                    ou <span style={{ color: 'var(--primary)', fontWeight: 600 }}>escolha um arquivo</span> · PDF até {MAX_PDF_MB}MB
                  </p>
                </>
              )}
            </div>
            {pdfError && <span className="text-xs font-normal normal-case text-red-500">{pdfError}</span>}
          </label>

          <button
            onClick={handleExtract}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--primary)' }}>
            <Search className="w-4 h-4" />
            {loading ? 'Consultando banco e agente de IA...' : 'Buscar Especificações'}
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div>
          {loading ? (
            pdfPreviewUrl ? (
              <div className="relative rounded-2xl border overflow-hidden" style={{ height: 560, borderColor: 'var(--card-border)' }}>
                <embed
                  src={pdfPreviewUrl}
                  type="application/pdf"
                  className="w-full h-full"
                  style={{ filter: 'blur(6px)', pointerEvents: 'none' }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ffffff' }} />
                  <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>Extraindo especificações do PDF...</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border flex flex-col items-center justify-center gap-3 py-24"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Consultando banco e agente de IA...</p>
              </div>
            )
          ) : existingMatch ? (
            <div className="rounded-2xl border flex flex-col items-center justify-center gap-3 text-center py-24 px-6"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Veículo já cadastrado</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {existingMatch.brand} {existingMatch.model} {existingMatch.version} {existingMatch.yearModel} já está no catálogo.
              </p>
              <button
                onClick={() => router.push(`/vehicles/${existingMatch.id}`)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white mt-1"
                style={{ backgroundColor: 'var(--primary)' }}>
                Ver veículo
              </button>
            </div>
          ) : result ? (
            <VehicleDetailView vehicle={result.vehicle} spec={result.spec} />
          ) : (
            <div className="rounded-2xl border border-dashed flex items-center justify-center py-24 px-6 text-center"
              style={{ borderColor: 'var(--card-border)', color: 'var(--muted)' }}>
              <p className="text-sm">As especificações extraídas vão aparecer aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

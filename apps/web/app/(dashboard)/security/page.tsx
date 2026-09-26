'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface AuditLogRow {
  id: string
  action: string
  ip: string
  status: 'success' | 'error'
  errorMessage: string | null
  createdAt: string
}

interface SuspiciousResponse {
  period: string
  totalSuspiciousEvents: number
  highRiskIps: { ip: string; attempts: number; risk: string }[]
  events: { action: string; ip: string; status: string; createdAt: string }[]
}

const ACTION_LABEL: Record<string, string> = {
  login_success: 'Login bem-sucedido',
  login_failed: 'Login falhou',
  unauthorized_access: 'Acesso sem token/token inválido',
  suspicious_access: 'Acesso negado (403)',
  extract: 'Extração de specs',
  list_vehicles: 'Listagem de veículos',
  get_vehicle: 'Consulta de veículo',
  create_vehicle: 'Criação de veículo',
  delete_vehicle: 'Remoção de veículo',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

export default function SecurityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [suspicious, setSuspicious] = useState<SuspiciousResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/')
    }
  }, [user, router])

  const loadData = useCallback((isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    return Promise.all([
      api.get('/admin/audit-logs'),
      api.get('/admin/suspicious'),
    ])
      .then(([logsRes, suspRes]) => {
        setLogs(logsRes.data.logs)
        setSuspicious(suspRes.data)
        setLastUpdated(new Date())
        setError('')
      })
      .catch(() => setError('Não foi possível carregar os dados de auditoria.'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  // Carrega ao entrar na tela, depois recarrega sozinho a cada 30s — sem isso
  // a página fica "congelada" no que existia no momento em que foi aberta,
  // que é exatamente o que gerou a confusão de "não atualizou" num teste real.
  useEffect(() => {
    if (!user || user.role !== 'admin') return
    loadData()
    const interval = setInterval(() => loadData(), 30000)
    return () => clearInterval(interval)
  }, [user, loadData])

  if (!user || user.role !== 'admin') return null

  const total = logs.length
  const errorCount = logs.filter(l => l.status === 'error').length
  const successCount = total - errorCount
  const uniqueIps = new Set(logs.map(l => l.ip)).size

  const byAction = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1
    return acc
  }, {})
  const actionBreakdown = Object.entries(byAction)
    .map(([action, count]) => ({ action, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)

  const recentErrors = logs.filter(l => l.status === 'error').slice(0, 10)

  const kpis = [
    { label: 'Eventos (últimos 100)', value: total, icon: Activity, color: '#3b82f6' },
    { label: 'Falhas registradas', value: errorCount, icon: AlertTriangle, color: '#ef4444' },
    { label: 'IPs distintos', value: uniqueIps, icon: ShieldCheck, color: '#10b981' },
    { label: `Suspeitos (${suspicious?.period ?? '1h'})`, value: suspicious?.totalSuspiciousEvents ?? 0, icon: ShieldAlert, color: '#f59e0b' },
  ]

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Segurança</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Observabilidade a partir do audit log real da API — sem infraestrutura de monitoramento externa.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)', color: 'var(--foreground)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          {lastUpdated && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')} · atualiza sozinho a cada 30s
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-2xl border p-4"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${kpi.color}20` }}>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{loading ? '...' : kpi.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-500 mb-6">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
            Eventos por tipo (últimos 100)
          </h2>
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
          ) : actionBreakdown.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhum evento registrado ainda.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {actionBreakdown.map(({ action, count, pct }) => (
                <div key={action}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{ACTION_LABEL[action] || action}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--card-border)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#3b82f6' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
            <ShieldAlert className="w-3.5 h-3.5" /> IPs de alto risco (5+ eventos suspeitos/hora)
          </h2>
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
          ) : !suspicious || suspicious.highRiskIps.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhum IP de alto risco na última hora.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {suspicious.highRiskIps.map(ip => (
                <div key={ip.ip} className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                  style={{ backgroundColor: 'var(--background)' }}>
                  <span className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>{ip.ip}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ color: '#ef4444', backgroundColor: '#ef444420' }}>
                    {ip.attempts} tentativas
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
          Falhas recentes
        </h2>
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
        ) : recentErrors.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhuma falha registrada nos últimos 100 eventos.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentErrors.map(l => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs"
                style={{ backgroundColor: 'var(--background)' }}>
                <span className="font-semibold shrink-0" style={{ color: 'var(--foreground)' }}>{ACTION_LABEL[l.action] || l.action}</span>
                <span className="font-mono shrink-0" style={{ color: 'var(--muted)' }}>{l.ip}</span>
                <span className="flex-1 truncate" style={{ color: 'var(--muted)' }}>{l.errorMessage}</span>
                <span className="shrink-0" style={{ color: 'var(--muted)' }}>{formatDateTime(l.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

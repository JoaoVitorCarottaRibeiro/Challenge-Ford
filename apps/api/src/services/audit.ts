import { AppDataSource, AuditLog } from '@ford-intel/database'
import { FastifyRequest } from 'fastify'
import { encrypt } from './crypto'

export async function logAudit(
  action: string,
  req: FastifyRequest,
  status: 'success' | 'error',
  payload?: Record<string, unknown>,
  errorMessage?: string
) {
  try {
    const repo = AppDataSource.getRepository(AuditLog)
    const sanitized = payload ? sanitizePayload(payload) : null
    const encryptedPayload = sanitized
      ? encrypt(JSON.stringify(sanitized))
      : null

    const log = repo.create({
      action,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 255) ?? undefined,
      payload: encryptedPayload ?? undefined,
      status,
      errorMessage: errorMessage?.substring(0, 500) ?? undefined,
    } as any)

    await repo.save(log)
  } catch {
    console.error('[AUDIT] Falha ao registrar log de auditoria')
  }
}

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ['password', 'token', 'apiKey', 'api_key', 'secret', 'authorization']
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        return [key, '[REDACTED]']
      }
      return [key, value]
    })
  )
}
import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../services/auth'

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    email: string
    role: 'admin' | 'analyst'
  }
}

/**
 * Verifica JWT e injeta dados do usuário na requisição.
 * Substitui a verificação por API Key nas rotas protegidas.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  reply: FastifyReply
) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de autorização ausente ou malformado'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyToken(token)

    if (payload.type !== 'access') {
      return reply.status(401).send({ error: 'Token inválido' })
    }

    req.user = { id: payload.sub, email: payload.email, role: payload.role }
  } catch {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token inválido ou expirado'
    })
  }
}

/**
 * Verifica se o usuário autenticado possui um dos papéis permitidos.
 * Uso: requireRole('admin') ou requireRole('admin', 'analyst')
 */
export function requireRole(...roles: Array<'admin' | 'analyst'>) {
  return async (req: AuthenticatedRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ error: 'Não autenticado' })
    }

    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Acesso restrito a: ${roles.join(', ')}`
      })
    }
  }
}
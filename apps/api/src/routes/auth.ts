import { FastifyInstance } from 'fastify'
import { authenticateUser, verifyToken, createUser } from '../services/auth'
import { AppDataSource, User } from '@ford-intel/database'

export async function authRoutes(app: FastifyInstance) {

  app.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email', maxLength: 100 },
          password: { type: 'string', minLength: 6, maxLength: 100 }
        },
        additionalProperties: false
      }
    }
  }, async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string }

    try {
      const result = await authenticateUser(email, password, req)
      return reply.send({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        role: result.role,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro de autenticação'
      return reply.status(401).send({ error: 'Unauthorized', message: msg })
    }
  })

  app.post('/auth/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  }, async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken: string }

    try {
      const payload = verifyToken(refreshToken)

      if (payload.type !== 'refresh') {
        return reply.status(401).send({ error: 'Token inválido' })
      }

      const userRepo = AppDataSource.getRepository(User)
      const user = await userRepo.findOne({ where: { id: payload.sub } })

      if (!user || !user.isActive) {
        return reply.status(401).send({ error: 'Usuário inativo' })
      }

      const { generateTokens } = await import('../services/auth')
      const tokens = generateTokens(user)

      return reply.send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      })
    } catch {
      return reply.status(401).send({ error: 'Token inválido ou expirado' })
    }
  })

  app.post('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'adminKey'],
        properties: {
          email:    { type: 'string', format: 'email', maxLength: 100 },
          password: { type: 'string', minLength: 8, maxLength: 100 },
          role:     { type: 'string', enum: ['admin', 'analyst'] },
          adminKey: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  }, async (req, reply) => {
    const { email, password, role, adminKey } = req.body as {
      email: string
      password: string
      role?: 'admin' | 'analyst'
      adminKey: string
    }

    if (adminKey !== process.env.API_KEY) {
      return reply.status(403).send({ error: 'Forbidden', message: 'adminKey inválida' })
    }

    try {
      const user = await createUser(email, password, role || 'analyst')
      return reply.status(201).send({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar usuário'
      return reply.status(400).send({ error: 'Bad Request', message: msg })
    }
  })
}
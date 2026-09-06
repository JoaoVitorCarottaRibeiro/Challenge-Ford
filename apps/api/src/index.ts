import * as dotenv from 'dotenv'
dotenv.config()

import { config } from './config/env'

import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { AppDataSource } from '@ford-intel/database'
import { vehicleRoutes } from './routes/vehicles'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'
import { verifyToken } from './services/auth'
import { logAudit } from './services/audit'

const ALLOWED_ORIGINS = config.allowedOrigins

// bodyLimit elevado (padrão é 1MB) para acomodar fichas técnicas em PDF enviadas em base64 no /extract
// trustProxy: atrás do Render/Vercel, sem isso req.ip vira o IP do balanceador — quebrando
// rate-limit por IP, lockout e os IPs registrados no audit.
const app = Fastify({ logger: true, bodyLimit: 25 * 1024 * 1024, trustProxy: true })

app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)
    ) {
      return cb(null, true)
    }
    cb(new Error('Origem não permitida pelo CORS'), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})

app.register(helmet, { contentSecurityPolicy: false })

app.register(rateLimit, {
  max: 30,
  timeWindow: '1 minute',
  // O plugin faz `throw errorResponseBuilder(...)` — o objeto PRECISA carregar
  // `statusCode: 429`, senão o setErrorHandler não reconhece e devolve 500.
  errorResponseBuilder: (_req, ctx) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Limite de ${ctx.max} requisições por ${ctx.after} atingido`
  })
})

const PUBLIC_ROUTES = new Set([
  '/health',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/register'
])

app.addHook('onRequest', async (req: any, reply) => {
  if (req.method === 'OPTIONS') return
  const pathname = req.url.split('?')[0]
  if (PUBLIC_ROUTES.has(pathname)) return

  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await logAudit('unauthorized_access', req, 'error', { url: req.url }, 'Token ausente')
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de autorização ausente ou malformado'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyToken(token)
    if (payload.type !== 'access') throw new Error('Tipo de token inválido')
    req.user = { id: payload.sub, email: payload.email, role: payload.role }
  } catch {
    await logAudit('unauthorized_access', req, 'error', { url: req.url }, 'Token inválido')
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token inválido ou expirado'
    })
  }
})

app.addHook('onResponse', async (req: any, reply) => {
  // 401 já é registrado como `unauthorized_access` pelo onRequest — aqui só o 403
  // (autenticado, mas sem permissão), que é o sinal realmente interessante.
  if (reply.statusCode === 403) {
    await logAudit('suspicious_access', req, 'error',
      { url: req.url, method: req.method, statusCode: reply.statusCode },
      `Acesso negado com status ${reply.statusCode}`
    )
  }
})

app.setErrorHandler((error: any, req, reply) => {
  if (reply.sent) return

  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Dados de entrada inválidos',
      details: error.validation.map((v: any) => v.message)
    })
  }

  // Rate-limit: o plugin faz `throw` de um objeto { statusCode: 429, error, message }.
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: error.message || 'Limite de requisições atingido'
    })
  }

  app.log.error(error)
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Ocorreu um erro interno. Tente novamente.'
  })
})

app.get('/health', async () => {
  return { status: 'ok', project: 'Ford Pickup Intel' }
})

const start = async () => {
  try {
    await AppDataSource.initialize()
    console.log('Banco de dados conectado!')

    await app.register(authRoutes, { prefix: '/api' })
    await app.register(vehicleRoutes, { prefix: '/api' })
    await app.register(adminRoutes, { prefix: '/api' })

    const port = config.port
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`API rodando em http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
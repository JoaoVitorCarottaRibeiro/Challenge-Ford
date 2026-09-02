import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { AppDataSource, User, AuditLog } from '@ford-intel/database'
import { FastifyRequest } from 'fastify'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

export interface TokenPayload {
  sub: string
  email: string
  role: 'admin' | 'analyst'
  type: 'access' | 'refresh'
}

export function generateTokens(user: User) {
  const payload: Omit<TokenPayload, 'type'> = {
    sub: user.id,
    email: user.email,
    role: user.role as 'admin' | 'analyst',
  }

  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  )

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
  )

  return { accessToken, refreshToken }
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export async function authenticateUser(
  email: string,
  password: string,
  req: FastifyRequest
): Promise<{ accessToken: string; refreshToken: string; role: string }> {
  const userRepo = AppDataSource.getRepository(User)
  const auditRepo = AppDataSource.getRepository(AuditLog)

  const user = await userRepo.findOne({ where: { email } })

  if (!user || !user.isActive) {
    await auditRepo.save(auditRepo.create({
      action: 'login_failed',
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 255),
      payload: JSON.stringify({ email }),
      status: 'error',
      errorMessage: 'Usuário não encontrado ou inativo'
    } as any))
    throw new Error('Credenciais inválidas')
  }

  const now = new Date()
  if (user.lockedUntil && user.lockedUntil > now) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000)
    throw new Error(`Conta bloqueada. Tente novamente em ${minutes} minuto(s)`)
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash)

  if (!passwordValid) {
    user.failedAttempts += 1
    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
      user.failedAttempts = 0
    }
    await userRepo.save(user)
    await auditRepo.save(auditRepo.create({
      action: 'login_failed',
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 255),
      payload: JSON.stringify({ email }),
      status: 'error',
      errorMessage: `Senha inválida. Tentativa ${user.failedAttempts}/${MAX_FAILED_ATTEMPTS}`
    } as any))
    throw new Error('Credenciais inválidas')
  }

  user.failedAttempts = 0
  user.lockedUntil = null as any
  user.lastLogin = new Date()
  await userRepo.save(user)

  const tokens = generateTokens(user)

  await auditRepo.save(auditRepo.create({
    action: 'login_success',
    ip: req.ip,
    userAgent: req.headers['user-agent']?.substring(0, 255),
    payload: JSON.stringify({ email, role: user.role }),
    status: 'success'
  } as any))

  return { ...tokens, role: user.role }
}

export async function createUser(
  email: string,
  password: string,
  role: 'admin' | 'analyst' = 'analyst'
): Promise<User> {
  const userRepo = AppDataSource.getRepository(User)
  const existing = await userRepo.findOne({ where: { email } })
  if (existing) throw new Error('Email já cadastrado')
  const passwordHash = await bcrypt.hash(password, 12)
  const user = userRepo.create({ email, passwordHash, role })
  return userRepo.save(user)
}
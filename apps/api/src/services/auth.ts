import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { AppDataSource, User } from '@ford-intel/database'
import { FastifyRequest } from 'fastify'
import { config } from '../config/env'
import { logAudit } from './audit'

const JWT_SECRET = config.jwtSecret
const JWT_EXPIRES_IN = config.jwtExpiresIn
const JWT_REFRESH_EXPIRES_IN = config.jwtRefreshExpiresIn
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

  const user = await userRepo.findOne({ where: { email } })

  if (!user || !user.isActive) {
    await logAudit('login_failed', req, 'error', { email }, 'Usuário não encontrado ou inativo')
    throw new Error('Credenciais inválidas')
  }

  const now = new Date()
  if (user.lockedUntil && user.lockedUntil > now) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000)
    await logAudit('login_failed', req, 'error', { email },
      `Conta bloqueada — tentativa durante o bloqueio (${minutes} min restantes)`)
    throw new Error(`Conta bloqueada. Tente novamente em ${minutes} minuto(s)`)
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash)

  if (!passwordValid) {
    user.failedAttempts += 1
    // Não zera o contador ao bloquear — senão, passada a janela de 15 min, o
    // atacante ganha um lote novo de 5 tentativas. O contador só volta a zero
    // num login bem-sucedido.
    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
    }
    await userRepo.save(user)
    await logAudit('login_failed', req, 'error', { email },
      `Senha inválida. Tentativa ${user.failedAttempts}/${MAX_FAILED_ATTEMPTS}`)
    throw new Error('Credenciais inválidas')
  }

  user.failedAttempts = 0
  user.lockedUntil = null as any
  user.lastLogin = new Date()
  await userRepo.save(user)

  const tokens = generateTokens(user)

  await logAudit('login_success', req, 'success', { email, role: user.role })

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
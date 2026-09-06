import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { config } from '../config/env'

const ALGORITHM = 'aes-256-gcm'
// Chave de 32 bytes já validada no boot (hex de 64 ou base64 de 44 chars).
const KEY = config.encryptionKey

/**
 * Criptografa dados sensíveis com AES-256-GCM.
 * Retorna string no formato: iv:authTag:encrypted (base64)
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted
  ].join(':')
}

/**
 * Descriptografa dados criptografados com AES-256-GCM.
 */
export function decrypt(encryptedData: string): string {
  const [ivB64, authTagB64, encrypted] = encryptedData.split(':')

  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
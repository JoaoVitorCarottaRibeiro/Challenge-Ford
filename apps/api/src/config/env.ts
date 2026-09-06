/**
 * Configuração central da API — lê e valida as variáveis de ambiente uma única
 * vez, no import. Qualquer problema (segredo obrigatório ausente, chave curta
 * demais, ENCRYPTION_KEY que não decodifica pra 32 bytes) derruba o processo no
 * boot com uma lista clara, em vez de estourar num ponto aleatório em runtime.
 *
 * Regra: nenhum outro módulo lê `process.env` para esses valores — todos
 * importam `config` daqui. (Exceção: `packages/database` é um pacote separado e
 * continua lendo `process.env` cru.)
 */

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production'
  port: number

  dbHost: string
  dbPort: number
  dbUser: string
  dbPass: string
  dbService: string
  dbSync: boolean

  jwtSecret: string
  jwtExpiresIn: string
  jwtRefreshExpiresIn: string

  /** Chave AES-256-GCM já decodificada — sempre exatamente 32 bytes. */
  encryptionKey: Buffer

  /** Senha mestra do POST /api/auth/register (adminKey). */
  apiKey: string

  /** Pode ser string vazia — nesse caso `aiEnabled` fica false. */
  anthropicApiKey: string
  aiEnabled: boolean

  allowedOrigins: string[]
}

function loadConfig(): AppConfig {
  const problems: string[] = []
  const env = process.env

  const required = (name: string): string => {
    const v = (env[name] ?? '').trim()
    if (!v) problems.push(`${name} ausente ou vazio`)
    return v
  }

  const minLen = (name: string, n: number): string => {
    const v = (env[name] ?? '').trim()
    if (!v) {
      problems.push(`${name} ausente ou vazio`)
    } else if (v.length < n) {
      problems.push(`${name} muito curto (${v.length} chars, mínimo ${n})`)
    }
    return v
  }

  /**
   * Aceita a chave em hex (64 chars → 32 bytes) ou base64 (44 chars c/ padding
   * → 32 bytes). Rejeita qualquer coisa que não decodifique pra exatamente 32
   * bytes — sem zero-padding silencioso.
   */
  const parseKey32 = (name: string): Buffer => {
    const raw = (env[name] ?? '').trim()
    if (!raw) {
      problems.push(`${name} ausente ou vazio (esperado hex de 64 chars ou base64 de 44 chars → 32 bytes)`)
      return Buffer.alloc(32)
    }
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Buffer.from(raw, 'hex')
    }
    if (/^[A-Za-z0-9+/]{43}=$/.test(raw)) {
      const buf = Buffer.from(raw, 'base64')
      if (buf.length === 32) return buf
    }
    problems.push(
      `${name} inválido — deve ser hex de 64 chars (openssl rand -hex 32) ou base64 de 44 chars, decodificando pra 32 bytes`
    )
    return Buffer.alloc(32)
  }

  const rawNodeEnv = (env.NODE_ENV ?? 'development').trim()
  const nodeEnv: AppConfig['nodeEnv'] =
    rawNodeEnv === 'production' || rawNodeEnv === 'test' ? rawNodeEnv : 'development'

  const portNum = Number(env.PORT ?? '3333')
  if (!Number.isInteger(portNum) || portNum <= 0 || portNum > 65535) {
    problems.push(`PORT inválido (${env.PORT})`)
  }

  const dbPortNum = Number(env.DB_PORT ?? '1521')
  if (!Number.isInteger(dbPortNum) || dbPortNum <= 0 || dbPortNum > 65535) {
    problems.push(`DB_PORT inválido (${env.DB_PORT})`)
  }

  const anthropicApiKey = (env.ANTHROPIC_API_KEY ?? '').trim()

  const config: AppConfig = {
    nodeEnv,
    port: Number.isFinite(portNum) ? portNum : 3333,

    dbHost: required('DB_HOST'),
    dbPort: Number.isFinite(dbPortNum) ? dbPortNum : 1521,
    dbUser: required('DB_USER'),
    dbPass: required('DB_PASS'),
    dbService: required('DB_SERVICE'),
    dbSync: nodeEnv !== 'production' || (env.DB_SYNC ?? '').trim() === 'true',

    jwtSecret: minLen('JWT_SECRET', 32),
    jwtExpiresIn: (env.JWT_EXPIRES_IN ?? '8h').trim(),
    jwtRefreshExpiresIn: (env.JWT_REFRESH_EXPIRES_IN ?? '7d').trim(),

    encryptionKey: parseKey32('ENCRYPTION_KEY'),

    apiKey: minLen('API_KEY', 16),

    anthropicApiKey,
    aiEnabled: anthropicApiKey.length > 0,

    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
  }

  if (problems.length > 0) {
    console.error('\n[config] Configuração de ambiente inválida — a API não vai subir:\n')
    for (const p of problems) console.error(`  • ${p}`)
    console.error('\nPreencha apps/api/.env (veja apps/api/.env.example) e tente de novo.\n')
    process.exit(1)
  }

  if (!config.aiEnabled) {
    console.warn(
      '[config] ANTHROPIC_API_KEY vazia — extração roda em modo determinístico (só specs-base do PDF, sem preenchimento por IA).'
    )
  }

  return config
}

export const config = loadConfig()

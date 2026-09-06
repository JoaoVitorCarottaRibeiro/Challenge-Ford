import Cookies from 'js-cookie'

/**
 * Helpers de cookie de sessão, num só lugar para AuthContext e o interceptor da API.
 *
 * `httpOnly` não é setável a partir do JS — este é o tradeoff aceito do caminho
 * minimalista (sem BFF/proxy). O que dá pra fazer daqui: `sameSite=strict` (corta
 * o vetor CSRF) e `secure` em produção (só trafega em HTTPS).
 */
const isProd = process.env.NODE_ENV === 'production'
const baseOpts = { sameSite: 'strict' as const, secure: isProd }

export interface SessionUser {
  email: string
  role: string
}

export function setSession(t: {
  accessToken: string
  refreshToken: string
  user: SessionUser
}) {
  Cookies.set('access_token', t.accessToken, { ...baseOpts, expires: 1 })
  Cookies.set('refresh_token', t.refreshToken, { ...baseOpts, expires: 7 })
  Cookies.set('user', JSON.stringify(t.user), { ...baseOpts, expires: 1 })
}

export function setAccessToken(token: string) {
  Cookies.set('access_token', token, { ...baseOpts, expires: 1 })
}

export function clearSession() {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
  Cookies.remove('user')
}

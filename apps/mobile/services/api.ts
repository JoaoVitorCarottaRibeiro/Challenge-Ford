import axios from 'axios'
import { Platform } from 'react-native'

const API_URL = 'https://fordchallenge-docar.onrender.com/api'
const HMAC_SECRET = 'ford-intel-hmac-secret-2025'

async function generateHmac(body: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(HMAC_SECRET)
  const messageData = encoder.encode(body)
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Storage universal — SecureStore no nativo, localStorage na web.
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key)
    }
    const SecureStore = await import('expo-secure-store')
    return SecureStore.getItemAsync(key)
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return
    }
    const SecureStore = await import('expo-secure-store')
    await SecureStore.setItemAsync(key, value)
  },
  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return
    }
    const SecureStore = await import('expo-secure-store')
    await SecureStore.deleteItemAsync(key)
  }
}

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await storage.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data && ['post', 'put', 'patch'].includes(config.method || '')) {
    const body = JSON.stringify(config.data)
    const signature = await generateHmac(body)
    config.headers['X-Signature'] = signature
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await storage.get('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          await storage.set('access_token', data.accessToken)
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return api.request(error.config)
        } catch {
          await storage.delete('access_token')
          await storage.delete('refresh_token')
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
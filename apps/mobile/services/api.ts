import axios from 'axios'
import { Platform } from 'react-native'

const API_URL = 'https://fordchallenge-docar.onrender.com/api'

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
import axios from 'axios'
import Cookies from 'js-cookie'
import { createHmac } from 'crypto'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data && ['post', 'put', 'patch'].includes(config.method || '')) {
    const body = JSON.stringify(config.data)
    const signature = createHmac('sha256', process.env.NEXT_PUBLIC_HMAC_SECRET || '')
      .update(body)
      .digest('hex')
    config.headers['X-Signature'] = `sha256=${signature}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = Cookies.get('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            { refreshToken }
          )
          Cookies.set('access_token', data.accessToken, { expires: 1 })
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return api.request(error.config)
        } catch {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
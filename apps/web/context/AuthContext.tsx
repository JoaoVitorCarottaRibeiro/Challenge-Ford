'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'
import api from '@/lib/api'

interface User {
  email: string
  role: 'admin' | 'analyst'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('access_token')
    const savedUser = Cookies.get('user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        logout()
      }
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    Cookies.set('access_token', data.accessToken, { expires: 1 })
    Cookies.set('refresh_token', data.refreshToken, { expires: 7 })
    const userData = { email, role: data.role }
    Cookies.set('user', JSON.stringify(userData), { expires: 1 })
    setUser(userData)
  }

  function logout() {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    Cookies.remove('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
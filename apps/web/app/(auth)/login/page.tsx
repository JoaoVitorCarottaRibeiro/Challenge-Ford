'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Coluna do formulário — fixa em claro, independente do tema do resto do app */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16">
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <h1 className="text-3xl font-normal text-neutral-900 mb-2">
            Bem-vindo(a)
          </h1>
          <p className="text-sm text-neutral-500 mb-10">
            Inteligência Competitiva Automotiva
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block rounded-lg bg-neutral-100 px-4 pt-2.5 pb-2 border border-transparent
              focus-within:border-blue-600 focus-within:bg-white transition-colors">
              <span className="block text-[11px] font-medium text-blue-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoFocus
                className="w-full bg-transparent text-sm text-neutral-900 outline-none pt-0.5"
              />
            </label>

            <label className="block rounded-lg bg-neutral-100 px-4 pt-2.5 pb-2 border border-transparent
              focus-within:border-blue-600 focus-within:bg-white transition-colors">
              <span className="block text-[11px] font-medium text-blue-700">Senha</span>
              <div className="flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-sm text-neutral-900 outline-none pt-0.5"
                />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-600 shrink-0">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold text-sm text-white bg-[#1F3A6E]
                hover:bg-[#16294f] transition-colors disabled:opacity-50 cursor-pointer mt-2">
              {isLoading ? 'Entrando...' : 'Continuar'}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 mt-10">
            <ShieldCheck className="w-3.5 h-3.5" />
            Ambiente Seguro
          </div>
        </div>
      </div>

      {/* Coluna decorativa */}
      <div className="hidden lg:flex relative items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0b1830 0%, #16264d 55%, #1F3A6E 100%)' }}>
        <div className="absolute -left-10 top-0 w-56 h-[130%] rounded-full opacity-40 blur-3xl"
          style={{ background: '#3b5ba8' }} />
        <div className="absolute right-10 -bottom-10 w-64 h-[120%] rounded-full opacity-30 blur-3xl"
          style={{ background: '#5b7fd1' }} />

        <div className="relative flex flex-col items-center text-center px-10">
          <Image src="/fordiq-logo.png" alt="Fordiq" width={973} height={379} className="w-64 h-auto mb-6" priority />
          <p className="text-sm text-white/60 max-w-xs">
            Especificações técnicas padronizadas de toda a concorrência, em um só lugar.
          </p>
        </div>
      </div>
    </div>
  )
}

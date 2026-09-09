'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from 'next-themes'
import { LogOut, Sun, Moon, ChevronUp } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/vehicles', label: 'Veículos' },
  { href: '/compare', label: 'Comparativo' },
  { href: '/extract', label: 'Extrair Specs' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <aside className="w-64 flex flex-col border-r fixed h-full"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>

        <div className="p-6 border-b flex items-center" style={{ borderColor: 'var(--card-border)' }}>
          <Link href="/">
            <Image src="/fordiq-logo.png" alt="Fordiq" width={973} height={379} className="h-8 w-auto" priority />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--muted)'
                }}>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t relative" style={{ borderColor: 'var(--card-border)' }} ref={profileRef}>
          {profileOpen && (
            <div className="absolute left-4 right-4 bottom-full mb-2 rounded-xl border overflow-hidden shadow-lg"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
                  Aparência
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: theme === 'light' ? 'var(--primary)' : 'var(--background)',
                      color: theme === 'light' ? 'white' : 'var(--muted)'
                    }}>
                    <Sun className="w-3.5 h-3.5" /> Claro
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: theme === 'dark' ? 'var(--primary)' : 'var(--background)',
                      color: theme === 'dark' ? 'white' : 'var(--muted)'
                    }}>
                    <Moon className="w-3.5 h-3.5" /> Escuro
                  </button>
                </div>
              </div>

              <button
                onClick={() => { logout(); router.push('/login') }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium border-t transition-colors text-red-500"
                style={{ borderColor: 'var(--card-border)' }}>
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}

          <button
            onClick={() => setProfileOpen(o => !o)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{ backgroundColor: profileOpen ? 'var(--background)' : 'transparent' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
              style={{ backgroundColor: 'var(--primary)' }}>
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{user.email}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{user.role}</p>
            </div>
            <ChevronUp className="w-3.5 h-3.5 shrink-0 transition-transform"
              style={{ color: 'var(--muted)', transform: profileOpen ? 'rotate(0deg)' : 'rotate(180deg)' }} />
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
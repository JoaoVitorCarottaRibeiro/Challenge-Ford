import { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { storage } from '@/services/api'

export default function RootLayout() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const token = await storage.get('access_token')
      if (!token) {
        router.replace('/(auth)/login')
      }
      setReady(true)
    }

    const timer = setTimeout(checkAuth, 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}
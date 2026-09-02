import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { storage } from '@/services/api'
import { Car, Zap, BarChart3, TrendingUp, LogOut } from 'lucide-react-native'
import api from '@/services/api'

interface Vehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
  spec: {
    potenciaCv: number | null
    torqueNm: number | null
    source: string
  } | null
}

export default function DashboardScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    storage.get('user_email').then(e => setUserEmail(e || ''))
    api.get('/vehicles')
      .then(res => setVehicles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await storage.delete('access_token')
    await storage.delete('refresh_token')
    await storage.delete('user_role')
    await storage.delete('user_email')
    router.replace('/(auth)/login')
  }

  const brands = [...new Set(vehicles.map(v => v.brand))]
  const withSpecs = vehicles.filter(v => v.spec?.potenciaCv).length
  const powerValues = vehicles.map(v => v.spec?.potenciaCv ?? 0).filter(v => v > 0)
  const maxPower = powerValues.length > 0 ? Math.max(...powerValues) : null

  const stats = [
    { label: 'Veículos', value: vehicles.length, icon: Car, color: '#3b82f6' },
    { label: 'Marcas', value: brands.length, icon: BarChart3, color: '#8b5cf6' },
    { label: 'Com specs', value: withSpecs, icon: TrendingUp, color: '#10b981' },
    { label: 'Max cv', value: maxPower ?? '—', icon: Zap, color: '#f59e0b' },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ford Pickup Intel</Text>
          <Text style={styles.headerSub}>{userEmail}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Resumo</Text>
      <View style={styles.statsGrid}>
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Icon color={stat.color} size={18} />
              </View>
              <Text style={styles.statValue}>
                {loading ? '...' : stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          )
        })}
      </View>

      <Text style={styles.sectionTitle}>Veículos cadastrados</Text>
      {loading ? (
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} />
      ) : vehicles.length === 0 ? (
        <Text style={styles.empty}>Nenhum veículo cadastrado.</Text>
      ) : (
        vehicles.map(v => (
          <View key={v.id} style={styles.vehicleCard}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {v.brand} {v.model} {v.version}
              </Text>
              <Text style={styles.vehicleSub}>
                {v.yearModel} · {v.spec?.source || 'sem specs'}
              </Text>
            </View>
            <View style={styles.vehicleSpecs}>
              {v.spec?.potenciaCv && (
                <Text style={styles.specBadge}>{v.spec.potenciaCv} cv</Text>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { padding: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 28
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#f5f5f5' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#111827',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1f2937'
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#6b7280' },
  vehicleCard: {
    backgroundColor: '#111827', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#1f2937', marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 14, fontWeight: '600', color: '#f5f5f5' },
  vehicleSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  vehicleSpecs: { alignItems: 'flex-end' },
  specBadge: {
    fontSize: 13, fontWeight: '700', color: '#3b82f6',
    backgroundColor: '#1e3a5f', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8
  },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 20 }
})
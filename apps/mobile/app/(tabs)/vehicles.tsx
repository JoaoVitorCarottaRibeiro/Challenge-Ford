import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, TextInput, Alert
} from 'react-native'
import { Search, ChevronRight, Trash2 } from 'lucide-react-native'
import api from '@/services/api'
import SpecReport from '@/components/SpecReport'
import { HERO_FIELDS, SOURCE_LABEL, formatSpecValue } from '@/constants/specCategories'

interface Vehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
  spec: (Record<string, unknown> & {
    potenciaCv: number | null
    source?: string
    pdfSourceFile?: string | null
  }) | null
}

const BRAND_COLORS: Record<string, string> = {
  Ford: '#1F3A6E', ford: '#1F3A6E', FORD: '#1F3A6E',
  Toyota: '#CC0000', toyota: '#CC0000',
  Mitsubishi: '#E60012', mitsubishi: '#E60012',
  Volkswagen: '#001E50', volkswagen: '#001E50',
  Chevrolet: '#CC0000', chevrolet: '#CC0000',
}

function getBrandColor(brand: string): string {
  return BRAND_COLORS[brand] || BRAND_COLORS[brand.toLowerCase()] || '#1F3A6E'
}

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filtered, setFiltered] = useState<Vehicle[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Vehicle | null>(null)

  function loadVehicles() {
    setLoading(true)
    api.get('/vehicles')
      .then(res => {
        const unique = deduplicar(res.data)
        setVehicles(unique)
        setFiltered(unique)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  function deduplicar(list: Vehicle[]): Vehicle[] {
    const seen = new Set<string>()
    return list.filter(v => {
      const key = `${v.brand.toLowerCase()}-${v.model.toLowerCase()}-${v.version.toLowerCase()}-${v.yearModel}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  useEffect(() => { loadVehicles() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(vehicles.filter(v =>
      `${v.brand} ${v.model} ${v.version} ${v.yearModel}`.toLowerCase().includes(q)
    ))
  }, [search, vehicles])

  function confirmDelete(v: Vehicle) {
    Alert.alert(
      'Remover veículo',
      `Deseja remover ${v.brand} ${v.model} ${v.version} ${v.yearModel}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vehicles/${v.id}`)
              if (selected?.id === v.id) setSelected(null)
              loadVehicles()
            } catch {
              Alert.alert('Erro', 'Não foi possível remover o veículo.')
            }
          }
        }
      ]
    )
  }

  if (selected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.detailTopBar}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(selected)} style={styles.deleteBtn}>
            <Trash2 color="#ef4444" size={18} />
          </TouchableOpacity>
        </View>

        <View style={[styles.detailHeader, { backgroundColor: getBrandColor(selected.brand) }]}>
          <Text style={styles.detailBrand}>{selected.brand}</Text>
          <Text style={styles.detailModel}>{selected.model} {selected.version}</Text>
          <Text style={styles.detailYear}>{selected.yearModel}</Text>
        </View>

        {selected.spec ? (
          <>
            {selected.spec.source && SOURCE_LABEL[selected.spec.source] && (
              <View style={[styles.sourceBadge, {
                backgroundColor: `${SOURCE_LABEL[selected.spec.source].color}20`,
                borderColor: SOURCE_LABEL[selected.spec.source].color
              }]}>
                <Text style={[styles.sourceText, { color: SOURCE_LABEL[selected.spec.source].color }]}>
                  {SOURCE_LABEL[selected.spec.source].text}
                </Text>
              </View>
            )}

            <View style={styles.heroGrid}>
              {HERO_FIELDS.map(field => {
                const val = selected.spec?.[field.key]
                if (val == null) return null
                return (
                  <View key={field.key} style={styles.heroCard}>
                    <Text style={styles.heroValue}>{formatSpecValue(val, field)}</Text>
                    <Text style={styles.heroLabel}>{field.label}</Text>
                  </View>
                )
              })}
            </View>

            <SpecReport spec={selected.spec} />
          </>
        ) : (
          <Text style={styles.empty}>Sem especificações disponíveis.</Text>
        )}
      </ScrollView>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Veículos</Text>

        <View style={styles.searchBox}>
          <Search color="#6b7280" size={16} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar veículo..."
            placeholderTextColor="#4b5563"
          />
        </View>

        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map(v => (
              <TouchableOpacity
                key={v.id}
                style={styles.vehicleCard}
                onPress={() => setSelected(v)}
                onLongPress={() => confirmDelete(v)}
                delayLongPress={500}>
                <View style={[styles.brandDot, { backgroundColor: getBrandColor(v.brand) }]}>
                  <Text style={styles.brandInitial}>{v.brand[0].toUpperCase()}</Text>
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{v.brand} {v.model}</Text>
                  <Text style={styles.vehicleSub}>{v.version} · {v.yearModel}</Text>
                </View>
                {v.spec?.potenciaCv && (
                  <Text style={styles.powerBadge}>{v.spec.potenciaCv} cv</Text>
                )}
                <ChevronRight color="#4b5563" size={16} />
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && (
              <Text style={styles.empty}>Nenhum veículo encontrado.</Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0f1e' },
  content:        { flex: 1, padding: 20, paddingTop: 60 },
  pageTitle:      { fontSize: 22, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 1, borderColor: '#1f2937', marginBottom: 16
  },
  searchInput:    { flex: 1, color: '#f5f5f5', fontSize: 14 },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111827', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1f2937', marginBottom: 10
  },
  brandDot: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center'
  },
  brandInitial:   { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  vehicleInfo:    { flex: 1 },
  vehicleName:    { fontSize: 14, fontWeight: '600', color: '#f5f5f5' },
  vehicleSub:     { fontSize: 12, color: '#6b7280', marginTop: 2 },
  powerBadge: {
    fontSize: 12, fontWeight: '700', color: '#3b82f6',
    backgroundColor: '#1e3a5f', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6
  },
  detailTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20, marginTop: 60
  },
  backBtn:        {},
  backText:       { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#1f1010', alignItems: 'center', justifyContent: 'center'
  },
  detailHeader:   { borderRadius: 16, padding: 24, marginBottom: 20 },
  detailBrand:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  detailModel:    { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  detailYear:     { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  sourceBadge: {
    borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16
  },
  sourceText:     { fontSize: 12, fontWeight: '600' },
  heroGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  heroCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#111827',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center'
  },
  heroValue:      { fontSize: 18, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 4 },
  heroLabel:      { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty:          { color: '#6b7280', textAlign: 'center', marginTop: 20 }
})
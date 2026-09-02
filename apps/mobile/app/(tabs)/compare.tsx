import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import api from '@/services/api'
import SpecReport from '@/components/SpecReport'
import { HERO_FIELDS, formatSpecValue } from '@/constants/specCategories'

interface Vehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
  spec: Record<string, any> | null
}

function vehicleLabel(v: Vehicle) {
  return `${v.brand} ${v.model} ${v.version} - ${v.yearModel}`
}

export default function CompareScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading,  setLoading]  = useState(true)
  const [vehicleA, setVehicleA] = useState<Vehicle | null>(null)
  const [vehicleB, setVehicleB] = useState<Vehicle | null>(null)
  const [picking,  setPicking]  = useState<'A' | 'B' | null>(null)

  useEffect(() => {
    api.get('/vehicles')
      .then(res => setVehicles(res.data.filter((v: Vehicle) => v.spec !== null)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function selectVehicle(v: Vehicle) {
    if (picking === 'A') setVehicleA(v)
    else if (picking === 'B') setVehicleB(v)
    setPicking(null)
  }

  if (picking) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { flex: 1 }]}>
          <TouchableOpacity onPress={() => setPicking(null)} style={styles.backBtn}>
            <Text style={styles.backText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Escolha o Veículo {picking}</Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {vehicles.map(v => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.pickCard,
                  (picking === 'A' ? vehicleA : vehicleB)?.id === v.id && styles.pickCardSelected
                ]}
                onPress={() => selectVehicle(v)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName}>{v.brand} {v.model} {v.version}</Text>
                  <Text style={styles.pickSub}>{v.yearModel}</Text>
                </View>
                {v.spec?.potenciaCv && (
                  <Text style={styles.pickBadge}>{v.spec.potenciaCv} cv</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Comparativo</Text>

      <View style={styles.selectors}>
        <TouchableOpacity
          style={[styles.selectorBtn, { borderColor: '#3b82f6' }]}
          onPress={() => setPicking('A')}>
          <Text style={styles.selectorLabel}>Veículo A</Text>
          <Text style={styles.selectorValue} numberOfLines={2}>
            {vehicleA ? vehicleLabel(vehicleA) : 'Selecionar'}
          </Text>
          <ChevronDown color="#6b7280" size={14} />
        </TouchableOpacity>

        <View style={styles.vsContainer}>
          <Text style={styles.vs}>VS</Text>
        </View>

        <TouchableOpacity
          style={[styles.selectorBtn, { borderColor: '#8b5cf6' }]}
          onPress={() => setPicking('B')}>
          <Text style={styles.selectorLabel}>Veículo B</Text>
          <Text style={styles.selectorValue} numberOfLines={2}>
            {vehicleB ? vehicleLabel(vehicleB) : 'Selecionar'}
          </Text>
          <ChevronDown color="#6b7280" size={14} />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />}

      {vehicleA && vehicleB && (
        <>
          <Text style={styles.sectionTitle}>Destaques</Text>
          <View style={styles.table}>
            {HERO_FIELDS.map(field => {
              const aVal = vehicleA.spec?.[field.key]
              const bVal = vehicleB.spec?.[field.key]
              if (aVal == null && bVal == null) return null
              return (
                <View key={field.key} style={styles.tableRow}>
                  <Text style={[styles.cellText, styles.cellLeft, styles.normalText]}>
                    {formatSpecValue(aVal, field)}
                  </Text>
                  <Text style={styles.tableLabel}>{field.label}</Text>
                  <Text style={[styles.cellText, styles.cellRight, styles.normalText]}>
                    {formatSpecValue(bVal, field)}
                  </Text>
                </View>
              )
            })}
          </View>

          <Text style={styles.sectionTitle}>Relatório completo</Text>
          <SpecReport spec={vehicleA.spec} specB={vehicleB.spec} defaultOpenFirst={false} />
        </>
      )}

      {!vehicleA && !vehicleB && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚖️</Text>
          <Text style={styles.emptyTitle}>Compare dois veículos</Text>
          <Text style={styles.emptySub}>
            Selecione dois veículos acima para ver o comparativo lado a lado
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0a0f1e' },
  content:         { padding: 20, paddingTop: 60, paddingBottom: 40 },
  pageTitle:       { fontSize: 22, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 20 },
  selectors:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 28 },
  selectorBtn: {
    flex: 1, backgroundColor: '#111827', borderRadius: 12,
    padding: 12, borderWidth: 1.5, minHeight: 80
  },
  selectorLabel:   { fontSize: 11, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  selectorValue:   { fontSize: 12, color: '#f5f5f5', fontWeight: '600', marginBottom: 6, lineHeight: 18 },
  vsContainer:     { alignItems: 'center', justifyContent: 'center', paddingTop: 28 },
  vs:              { fontSize: 14, fontWeight: 'bold', color: '#4b5563' },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, marginTop: 20
  },
  table: {
    backgroundColor: '#111827', borderRadius: 14,
    borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden'
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#1f2937', paddingVertical: 12
  },
  cellText:        { flex: 1 },
  cellLeft:        { alignItems: 'flex-end', paddingRight: 10 },
  cellRight:       { alignItems: 'flex-start', paddingLeft: 10 },
  normalText:      { color: '#f5f5f5', fontSize: 14, fontWeight: '500' },
  winnerText:      { color: '#10b981', fontSize: 14, fontWeight: '700' },
  tableLabel: {
    width: 130, textAlign: 'center', fontSize: 11,
    color: '#6b7280', fontWeight: '500'
  },
  cross:           { fontSize: 16, color: '#ef4444' },
  backBtn:         { marginBottom: 20 },
  backText:        { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  pickCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#1f2937', marginBottom: 10
  },
  pickCardSelected: { borderColor: '#3b82f6', backgroundColor: '#0f1e3a' },
  pickName:        { fontSize: 14, fontWeight: '600', color: '#f5f5f5' },
  pickSub:         { fontSize: 12, color: '#6b7280', marginTop: 2 },
  pickBadge: {
    fontSize: 12, fontWeight: '700', color: '#3b82f6',
    backgroundColor: '#1e3a5f', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6, marginLeft: 8
  },
  emptyState:      { alignItems: 'center', marginTop: 60 },
  emptyIcon:       { fontSize: 48, marginBottom: 16 },
  emptyTitle:      { fontSize: 18, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 8 },
  emptySub:        { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 }
})
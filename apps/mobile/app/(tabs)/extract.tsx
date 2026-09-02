import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native'
import { Sparkles, Search, ChevronDown } from 'lucide-react-native'
import api from '@/services/api'
import SpecReport from '@/components/SpecReport'
import { HERO_FIELDS, SOURCE_LABEL, formatSpecValue } from '@/constants/specCategories'

interface ExtractResult {
  source: 'db_cache' | 'pdf_oficial' | 'web_scraping' | 'ia_generated'
  vehicle: { id: string; brand: string; model: string; version: string; yearModel: number }
  spec: Record<string, unknown> & { pdfSourceFile?: string | null }
}

const VEHICLE_OPTIONS: Record<string, Record<string, string[]>> = {
  Toyota:     { Hilux:       ['SRX', 'SR', 'GR Sport', 'Conquest'] },
  Ford:       { Ranger:      ['Raptor', 'Storm', 'XLS', 'XLT', 'Limited'] },
  Volkswagen: { Amarok:      ['Highline V6', 'Extreme', 'Comfortline', 'Trendline'] },
  Chevrolet:  { S10:         ['High Country', 'LTZ', 'LT', 'LS'] },
  Mitsubishi: { 'L200 Triton': ['Katana', 'HPE-S', 'HPE', 'Sport'] },
  RAM:        { Rampage:     ['R/T', 'Laramie', 'Rebel', 'Tungsten'] },
}

const YEARS = Array.from({ length: 27 }, (_, i) => String(2026 - i))

type PickerType = 'brand' | 'model' | 'version' | 'year' | null

export default function ExtractScreen() {
  const [brand,   setBrand]   = useState('')
  const [model,   setModel]   = useState('')
  const [version, setVersion] = useState('')
  const [year,    setYear]    = useState('2025')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<ExtractResult | null>(null)
  const [picking, setPicking] = useState<PickerType>(null)

  const brands  = Object.keys(VEHICLE_OPTIONS)
  const models  = brand  ? Object.keys(VEHICLE_OPTIONS[brand] || {}) : []
  const versions = model ? VEHICLE_OPTIONS[brand]?.[model] || [] : []

  function selectOption(type: PickerType, value: string) {
    if (type === 'brand')   { setBrand(value); setModel(''); setVersion('') }
    if (type === 'model')   { setModel(value); setVersion('') }
    if (type === 'version') { setVersion(value) }
    if (type === 'year')    { setYear(value) }
    setPicking(null)
  }

  async function handleExtract() {
    if (!brand || !model || !version || !year) {
      Alert.alert('Campos obrigatórios', 'Selecione marca, modelo, versão e ano.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/extract', {
        brand, model, version, yearModel: parseInt(year)
      })
      setResult(data)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao extrair especificações.'
      Alert.alert('Erro', msg)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setBrand(''); setModel(''); setVersion(''); setYear('2025'); setResult(null)
  }

  if (picking) {
    const options =
      picking === 'brand'   ? brands :
      picking === 'model'   ? models :
      picking === 'version' ? versions :
      YEARS

    const label =
      picking === 'brand'   ? 'Selecione a Marca' :
      picking === 'model'   ? 'Selecione o Modelo' :
      picking === 'version' ? 'Selecione a Versão' :
      'Selecione o Ano'

    return (
      <View style={styles.container}>
        <View style={[styles.content, { flex: 1 }]}>
          <TouchableOpacity onPress={() => setPicking(null)} style={styles.backBtn}>
            <Text style={styles.backText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{label}</Text>
          <ScrollView style={{ flex: 1 }}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionCard,
                  (picking === 'brand' ? brand :
                   picking === 'model' ? model :
                   picking === 'version' ? version : year) === opt && styles.optionCardSelected
                ]}
                onPress={() => selectOption(picking, opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    )
  }

  const sourceInfo = result ? SOURCE_LABEL[result.source] : null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: '#8b5cf620' }]}>
          <Sparkles color="#8b5cf6" size={22} />
        </View>
        <View>
          <Text style={styles.pageTitle}>Extrair Specs</Text>
          <Text style={styles.pageSub}>Powered by Claude AI</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Marca</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setPicking('brand')}>
            <Text style={[styles.selectorText, !brand && styles.placeholder]}>
              {brand || 'Selecione a marca'}
            </Text>
            <ChevronDown color="#6b7280" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Modelo</Text>
          <TouchableOpacity
            style={[styles.selector, !brand && styles.selectorDisabled]}
            onPress={() => brand && setPicking('model')}>
            <Text style={[styles.selectorText, !model && styles.placeholder]}>
              {model || 'Selecione o modelo'}
            </Text>
            <ChevronDown color="#6b7280" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Versão</Text>
          <TouchableOpacity
            style={[styles.selector, !model && styles.selectorDisabled]}
            onPress={() => model && setPicking('version')}>
            <Text style={[styles.selectorText, !version && styles.placeholder]}>
              {version || 'Selecione a versão'}
            </Text>
            <ChevronDown color="#6b7280" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ano</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setPicking('year')}>
            <Text style={styles.selectorText}>{year}</Text>
            <ChevronDown color="#6b7280" size={16} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleExtract}
          disabled={loading}
          activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Search color="#fff" size={18} /><Text style={styles.btnText}>Buscar Especificações</Text></>
          }
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingHint}>Consultando banco e agente de IA...</Text>
        )}
      </View>

      {result && (
        <View style={styles.resultContainer}>
          {sourceInfo && (
            <View style={[styles.sourceBadge, { backgroundColor: `${sourceInfo.color}20`, borderColor: sourceInfo.color }]}>
              <Text style={[styles.sourceText, { color: sourceInfo.color }]}>{sourceInfo.text}</Text>
            </View>
          )}

          <Text style={styles.vehicleName}>
            {result.vehicle.brand} {result.vehicle.model} {result.vehicle.version}
          </Text>
          <Text style={styles.vehicleYear}>{result.vehicle.yearModel}</Text>
          {result.spec?.pdfSourceFile ? (
            <Text style={styles.pdfSourceText}>Ficha: {String(result.spec.pdfSourceFile)}</Text>
          ) : null}

          <View style={styles.specsGrid}>
            {HERO_FIELDS.map(field => {
              const val = result.spec?.[field.key]
              if (val == null) return null
              return (
                <View key={field.key} style={styles.specCard}>
                  <Text style={styles.specValue}>{formatSpecValue(val, field)}</Text>
                  <Text style={styles.specLabel}>{field.label}</Text>
                </View>
              )
            })}
          </View>

          <Text style={styles.reportTitle}>Relatório completo</Text>
          <SpecReport spec={result.spec} />

          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Fazer nova busca</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0a0f1e' },
  content:      { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  iconBox:      { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pageTitle:    { fontSize: 22, fontWeight: 'bold', color: '#f5f5f5' },
  pageSub:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  form: {
    backgroundColor: '#111827', borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: '#1f2937',
    marginBottom: 24, gap: 16
  },
  inputGroup:   { gap: 6 },
  inputLabel:   { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  selector: {
    backgroundColor: '#0a0f1e', borderRadius: 10,
    borderWidth: 1, borderColor: '#1f2937',
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  selectorDisabled: { opacity: 0.4 },
  selectorText: { color: '#f5f5f5', fontSize: 15 },
  placeholder:  { color: '#4b5563' },
  btn: {
    backgroundColor: '#8b5cf6', borderRadius: 12,
    paddingVertical: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4
  },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  loadingHint:  { textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: -8 },
  backBtn:      { marginBottom: 20 },
  backText:     { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  optionCard: {
    backgroundColor: '#111827', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#1f2937', marginBottom: 10
  },
  optionCardSelected: { borderColor: '#8b5cf6', backgroundColor: '#1a0f2e' },
  optionText:   { fontSize: 15, color: '#f5f5f5', fontWeight: '500' },
  resultContainer: { gap: 16 },
  sourceBadge: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start'
  },
  sourceText:   { fontSize: 13, fontWeight: '600' },
  vehicleName:  { fontSize: 20, fontWeight: 'bold', color: '#f5f5f5', marginTop: 4 },
  vehicleYear:  { fontSize: 14, color: '#6b7280' },
  pdfSourceText:{ fontSize: 12, color: '#3b82f6', marginTop: 2 },
  specsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  specCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#111827',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center'
  },
  specValue:    { fontSize: 22, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 4 },
  specLabel:    { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  reportTitle: {
    fontSize: 12, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 8
  },
  clearBtn:     { alignItems: 'center', paddingVertical: 12 },
  clearText:    { color: '#8b5cf6', fontSize: 14, fontWeight: '600' }
})
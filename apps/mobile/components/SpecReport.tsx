import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native'
import { SPEC_CATEGORIES, formatSpecValue, SpecField } from '@/constants/specCategories'

type Spec = Record<string, unknown> | null | undefined

interface Props {
  spec: Spec
  /** Quando informado, o relatório vira uma comparação lado a lado (A = spec, B = specB). */
  specB?: Spec
  defaultOpenFirst?: boolean
}

function isFilled(v: unknown) {
  return v !== null && v !== undefined
}

function isTruthy(v: unknown) {
  return v === 1 || v === true
}

function countFilled(fields: SpecField[], s: Spec) {
  if (!s) return 0
  return fields.filter(f => isFilled(s[f.key])).length
}

function getBetter(field: SpecField, a: unknown, b: unknown): 'A' | 'B' | null {
  if (field.type === 'bool') {
    const av = isTruthy(a)
    const bv = isTruthy(b)
    if (!isFilled(a) || !isFilled(b) || av === bv) return null
    return av ? 'A' : 'B'
  }
  if (!isFilled(a) || !isFilled(b)) return null
  const an = Number(a)
  const bn = Number(b)
  if (an === bn) return null
  return an > bn ? 'A' : 'B'
}

export default function SpecReport({ spec, specB, defaultOpenFirst = true }: Props) {
  const isCompare = specB !== undefined
  const [openCategory, setOpenCategory] = useState<string | null>(
    defaultOpenFirst ? SPEC_CATEGORIES[0].name : null
  )

  if (!spec) {
    return <Text style={styles.empty}>Sem especificações disponíveis.</Text>
  }

  function toggle(name: string) {
    setOpenCategory(prev => (prev === name ? null : name))
  }

  return (
    <View style={styles.container}>
      {SPEC_CATEGORIES.map(category => {
        const isOpen = openCategory === category.name
        const filledA = countFilled(category.fields, spec)
        const filledB = isCompare ? countFilled(category.fields, specB) : null

        return (
          <View key={category.name} style={styles.categoryCard}>
            <TouchableOpacity style={styles.categoryHeader} onPress={() => toggle(category.name)} activeOpacity={0.7}>
              <Text style={styles.categoryTitle}>{category.name}</Text>
              <View style={styles.categoryHeaderRight}>
                <Text style={styles.categoryCount}>
                  {isCompare ? `${filledA}/${category.fields.length} · ${filledB}/${category.fields.length}` : `${filledA}/${category.fields.length}`}
                </Text>
                {isOpen ? <ChevronUp color="#6b7280" size={16} /> : <ChevronDown color="#6b7280" size={16} />}
              </View>
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.fieldsList}>
                {category.fields.map(field => {
                  const aVal = spec[field.key]

                  if (!isCompare) {
                    return (
                      <View key={field.key} style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>{field.label}</Text>
                        {field.type === 'bool' ? (
                          isTruthy(aVal)
                            ? <Check color="#10b981" size={16} />
                            : <Text style={styles.cross}>{isFilled(aVal) ? '✗' : '—'}</Text>
                        ) : (
                          <Text style={styles.fieldValue}>{formatSpecValue(aVal, field)}</Text>
                        )}
                      </View>
                    )
                  }

                  const bVal = specB?.[field.key]
                  const better = getBetter(field, aVal, bVal)

                  return (
                    <View key={field.key} style={styles.compareRow}>
                      <View style={[styles.compareCell, styles.compareCellLeft]}>
                        {field.type === 'bool' ? (
                          isTruthy(aVal)
                            ? <Check color={better === 'A' ? '#10b981' : '#9ca3af'} size={16} />
                            : <Text style={styles.cross}>{isFilled(aVal) ? '✗' : '—'}</Text>
                        ) : (
                          <Text style={[styles.compareValue, better === 'A' && styles.winnerText]}>
                            {formatSpecValue(aVal, field)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.compareLabel}>{field.label}</Text>
                      <View style={[styles.compareCell, styles.compareCellRight]}>
                        {field.type === 'bool' ? (
                          isTruthy(bVal)
                            ? <Check color={better === 'B' ? '#10b981' : '#9ca3af'} size={16} />
                            : <Text style={styles.cross}>{isFilled(bVal) ? '✗' : '—'}</Text>
                        ) : (
                          <Text style={[styles.compareValue, better === 'B' && styles.winnerText]}>
                            {formatSpecValue(bVal, field)}
                          </Text>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { gap: 10 },
  empty:      { color: '#6b7280', textAlign: 'center', marginTop: 20 },
  categoryCard: {
    backgroundColor: '#111827', borderRadius: 14,
    borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden'
  },
  categoryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14
  },
  categoryHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryTitle: { fontSize: 13, fontWeight: '700', color: '#f5f5f5' },
  categoryCount: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  fieldsList: { borderTopWidth: 1, borderTopColor: '#1f2937' },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1a2333'
  },
  fieldLabel: { fontSize: 13, color: '#9ca3af', flex: 1, paddingRight: 10 },
  fieldValue: { fontSize: 13, fontWeight: '600', color: '#f5f5f5' },
  cross:      { fontSize: 14, color: '#ef4444' },
  compareRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a2333'
  },
  compareCell:     { flex: 1, alignItems: 'center' },
  compareCellLeft: { alignItems: 'flex-end', paddingRight: 10 },
  compareCellRight:{ alignItems: 'flex-start', paddingLeft: 10 },
  compareValue:    { fontSize: 12, color: '#f5f5f5', fontWeight: '500' },
  winnerText:      { color: '#10b981', fontWeight: '700' },
  compareLabel: {
    width: 140, textAlign: 'center', fontSize: 10.5,
    color: '#6b7280', fontWeight: '500', paddingHorizontal: 4
  },
})

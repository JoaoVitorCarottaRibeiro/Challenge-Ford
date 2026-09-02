import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { router } from 'expo-router'
import { storage } from '@/services/api'
import api from '@/services/api'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin() {
    setError('')

    if (!email || !password) {
      setError('Preencha email e senha.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      await storage.set('access_token', data.accessToken)
      await storage.set('refresh_token', data.refreshToken)
      await storage.set('user_role', data.role)
      await storage.set('user_email', email)
      router.replace('/(tabs)')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Email ou senha inválidos.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>🚗</Text>
        </View>
        <Text style={styles.title}>Ford Pickup Intel</Text>
        <Text style={styles.subtitle}>Inteligência Competitiva Automotiva</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={email}
            onChangeText={t => { setEmail(t); setError('') }}
            placeholder="seu@email.com"
            placeholderTextColor="#4b5563"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={password}
            onChangeText={t => { setPassword(t); setError('') }}
            placeholder="••••••••"
            placeholderTextColor="#4b5563"
            secureTextEntry
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Entrar</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Ford Pickup Intel © 2025 — FIAP</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0a0f1e' },
  content:         { flex: 1, justifyContent: 'center', padding: 24 },
  logo: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#1F3A6E', alignItems: 'center',
    justifyContent: 'center', alignSelf: 'center', marginBottom: 16
  },
  logoIcon:        { fontSize: 32 },
  title:           { fontSize: 26, fontWeight: 'bold', color: '#f5f5f5', textAlign: 'center' },
  subtitle:        { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  form: {
    backgroundColor: '#111827', borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: '#1f2937'
  },
  label:           { fontSize: 13, fontWeight: '600', color: '#d1d5db', marginBottom: 6 },
  input: {
    backgroundColor: '#0a0f1e', borderRadius: 10, borderWidth: 1,
    borderColor: '#1f2937', color: '#f5f5f5', padding: 12,
    fontSize: 14, marginBottom: 16
  },
  inputError:      { borderColor: '#ef4444' },
  errorBox: {
    backgroundColor: '#ef444420', borderRadius: 8, borderWidth: 1,
    borderColor: '#ef4444', padding: 10, marginBottom: 12
  },
  errorText:       { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  button: {
    backgroundColor: '#1F3A6E', borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 4
  },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  footer:          { textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 32 }
})
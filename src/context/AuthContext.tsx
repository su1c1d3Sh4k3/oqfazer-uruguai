/**
 * AuthContext — Sistema de autenticação Uruguai Descontos
 *
 * REGRAS DE OURO (não violar):
 * 1. NUNCA usar await com supabase.auth.signOut() — pode travar para sempre
 * 2. Login = signInWithPassword + fetchProfile + setCurrentUser. Só isso.
 * 3. Logout = limpar localStorage + reload da página. Sem signOut().
 * 4. Sem onAuthStateChange — causa race conditions com login()
 * 5. Timeout de segurança no init — loading NUNCA fica true pra sempre
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase, rowToUser } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  password?: string
  firstLoginAt: number
  role?: 'user' | 'establishment' | 'admin'
  managedPlaceId?: string
  name?: string
  cpf?: string
  phone?: string
  travelPeriod?: string
  ci?: string
  responsibleName?: string
  deletionRequested?: boolean
  firstCheckInAt?: number
}

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  login: (email: string, pass: string) => Promise<User | null>
  logout: () => void
  updateProfile: (data: Partial<User>, silent?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Busca o perfil do usuário na tabela profiles */
async function fetchProfile(userId: string, email: string): Promise<User | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Auth] Erro ao buscar perfil:', error.message)
      return null
    }
    if (!profile) {
      console.error('[Auth] Perfil não encontrado para:', userId)
      return null
    }
    return rowToUser(profile, email) as User
  } catch (e) {
    console.error('[Auth] Exceção ao buscar perfil:', e)
    return null
  }
}

/** Remove tokens do Supabase do localStorage (síncrono, nunca falha) */
function clearTokens() {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('sb-'))
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    // localStorage indisponível — nada a fazer
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Inicialização: verifica se existe sessão válida ──────────────
  useEffect(() => {
    let active = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          if (active) setLoading(false)
          return
        }

        // Token expirado? Limpa e segue sem usuário
        const expiresAt = session.expires_at
        if (expiresAt && expiresAt < Math.floor(Date.now() / 1000)) {
          clearTokens()
          if (active) setLoading(false)
          return
        }

        // Token válido — busca perfil
        const user = await fetchProfile(session.user.id, session.user.email || '')
        if (active) {
          setCurrentUser(user) // null se perfil não existe, tudo bem
          setLoading(false)
        }
      } catch (e) {
        console.error('[Auth] Erro na inicialização:', e)
        if (active) setLoading(false)
      }
    }

    init()

    // Timeout de segurança: loading NUNCA fica true por mais de 5 segundos
    const safetyTimeout = setTimeout(() => {
      if (active) setLoading(false)
    }, 5000)

    return () => {
      active = false
      clearTimeout(safetyTimeout)
    }
  }, [])

  // ── Login ─────────────────────────────────────────────────────────
  const login = async (email: string, pass: string): Promise<User | null> => {
    // Limpa tokens antigos (síncrono, instantâneo)
    clearTokens()

    // Autentica no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    })

    if (error) {
      const isInvalid = error.message.includes('Invalid login credentials')
      toast.error(isInvalid ? 'Credenciais inválidas' : 'Erro ao fazer login', {
        description: isInvalid ? 'Verifique seu e-mail e senha.' : error.message,
      })
      return null
    }

    if (!data.user) {
      toast.error('Erro ao fazer login', { description: 'Resposta inesperada do servidor.' })
      return null
    }

    // Busca perfil
    const user = await fetchProfile(data.user.id, data.user.email || '')

    if (!user) {
      toast.error('Perfil não encontrado', {
        description: 'Contate o administrador para verificar sua conta.',
      })
      clearTokens()
      return null
    }

    setCurrentUser(user)

    const greetings: Record<string, string> = {
      admin: 'Bem-vindo ao painel administrativo.',
      establishment: 'Bem-vindo ao painel da empresa.',
      user: 'Bem-vindo(a) de volta!',
    }
    toast.success('Login realizado!', {
      description: greetings[user.role || 'user'],
    })

    return user
  }

  // ── Logout ────────────────────────────────────────────────────────
  const logout = () => {
    // 1. Limpa estado React imediatamente
    setCurrentUser(null)
    // 2. Limpa tokens (síncrono)
    clearTokens()
    // 3. Reload da página — cria Supabase client limpo do zero
    window.location.href = '/'
    // NOTA: NÃO chamamos signOut() — pode travar indefinidamente
  }

  // ── Atualizar perfil ──────────────────────────────────────────────
  const updateProfile = async (data: Partial<User>, silent = false) => {
    if (!currentUser) return

    const dbData: Record<string, any> = {}
    if (data.name !== undefined) dbData.name = data.name
    if (data.cpf !== undefined) dbData.cpf = data.cpf
    if (data.phone !== undefined) dbData.phone = data.phone
    if (data.travelPeriod !== undefined) dbData.travel_period = data.travelPeriod
    if (data.ci !== undefined) dbData.ci = data.ci
    if (data.responsibleName !== undefined) dbData.responsible_name = data.responsibleName
    if (data.deletionRequested !== undefined) dbData.deletion_requested = data.deletionRequested
    if (data.firstCheckInAt !== undefined) dbData.first_check_in_at = data.firstCheckInAt
    if (data.managedPlaceId !== undefined) dbData.managed_place_id = data.managedPlaceId
    if (data.role !== undefined) dbData.role = data.role
    if (data.email !== undefined) dbData.email = data.email

    dbData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('profiles')
      .update(dbData)
      .eq('id', currentUser.id)

    if (error) {
      toast.error('Erro ao atualizar perfil')
      return
    }

    if (data.password) {
      const { error: pwdError } = await supabase.auth.updateUser({ password: data.password })
      if (pwdError) {
        toast.error('Erro ao atualizar senha')
        return
      }
    }

    if (data.email && data.email !== currentUser.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: data.email })
      if (emailError) {
        toast.error('Erro ao atualizar e-mail')
        return
      }
    }

    setCurrentUser((prev) => (prev ? { ...prev, ...data } : null))

    if (!silent) {
      toast.success('Perfil atualizado com sucesso!')
    }
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { currentUser, loading, login, logout, updateProfile } },
    children,
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

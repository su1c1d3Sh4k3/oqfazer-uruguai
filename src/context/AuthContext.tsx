import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
  login: (email: string, pass: string) => Promise<boolean>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>, silent?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) return null
    return rowToUser(profile, email) as User
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const user = await fetchProfile(session.user.id, session.user.email || '')
          setCurrentUser(user)
        }
      } catch (err) {
        console.error('Error fetching session profile:', err)
      } finally {
        setLoading(false)
      }
    }).catch((err) => {
      console.error('Error getting session:', err)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await fetchProfile(session.user.id, session.user.email || '')
          setCurrentUser(user)
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
        }
      } catch (err) {
        console.error('Error on auth state change:', err)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const login = async (email: string, pass: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Credenciais inválidas', {
          description: 'Verifique seu e-mail e senha.',
        })
      } else {
        toast.error('Erro ao fazer login', {
          description: error.message,
        })
      }
      return false
    }

    if (data.user) {
      const user = await fetchProfile(data.user.id, data.user.email || '')
      if (user) {
        setCurrentUser(user)
        toast.success('Login realizado com sucesso!', {
          description:
            user.role === 'establishment' ? 'Bem-vindo ao painel.' : 'Bem-vindo(a) de volta.',
        })
        return true
      }
    }

    return false
  }

  const logout = async () => {
    // 1. Clear local state immediately
    setCurrentUser(null)

    // 2. Try Supabase signOut
    const { error } = await supabase.auth.signOut().catch(() => ({ error: { message: 'network' } }))

    // 3. If signOut failed, force-clear session from storage
    if (error) {
      console.error('signOut error, clearing session manually:', error)
      const storageKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      if (storageKey) localStorage.removeItem(storageKey)
    }

    toast.success('Você saiu da conta.', {
      description: 'Sessão encerrada com segurança.',
    })

    // 4. Force full reload to clear all in-memory state
    window.location.href = '/'
  }

  const updateProfile = async (data: Partial<User>, silent = false) => {
    if (!currentUser) return

    // Map camelCase to snake_case for DB
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

    const { error, count } = await supabase
      .from('profiles')
      .update(dbData)
      .eq('id', currentUser.id)
      .select('id', { count: 'exact', head: true })

    if (error) {
      toast.error('Erro ao atualizar perfil')
      return
    }

    if (count === 0) {
      toast.error('Erro ao atualizar perfil', { description: 'Nenhum registro foi atualizado. Verifique suas permissões.' })
      return
    }

    // Update password via Supabase Auth if provided
    if (data.password) {
      const { error: pwdError } = await supabase.auth.updateUser({
        password: data.password,
      })
      if (pwdError) {
        toast.error('Erro ao atualizar senha')
        return
      }
    }

    // Update email via Supabase Auth if changed
    if (data.email && data.email !== currentUser.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: data.email,
      })
      if (emailError) {
        toast.error('Erro ao atualizar e-mail')
        return
      }
    }

    // Update local state only after DB success
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

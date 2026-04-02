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
  logout: () => void
  updateProfile: (data: Partial<User>, silent?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAndSetProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && profile) {
        setCurrentUser(rowToUser(profile, email) as User)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchAndSetProfile(session.user.id, session.user.email || '')
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAndSetProfile(session.user.id, session.user.email || '')
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchAndSetProfile])

  const login = async (email: string, pass: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
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

    // onAuthStateChange handles setCurrentUser — just return success
    toast.success('Login realizado com sucesso!')
    return true
  }

  const logout = () => {
    setCurrentUser(null)

    // Clear session from storage immediately
    try {
      const storageKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      if (storageKey) localStorage.removeItem(storageKey)
    } catch {}

    // Fire and forget signOut
    supabase.auth.signOut().catch(() => {})

    toast.success('Você saiu da conta.', {
      description: 'Sessão encerrada com segurança.',
    })

    // Force full reload to clear all in-memory state
    window.location.href = '/'
  }

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

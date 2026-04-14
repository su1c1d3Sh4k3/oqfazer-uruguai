import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>, silent?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Limpa todos os tokens do Supabase do localStorage
function clearSupabaseTokens() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-'))
      .forEach((k) => localStorage.removeItem(k))
  } catch (e) {
    console.warn('[Auth] Falha ao limpar tokens:', e)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Flag para evitar que onAuthStateChange e login() disputem setCurrentUser
  const loginInProgressRef = useRef(false)

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Auth] Erro ao buscar perfil:', error.message, error.code)
      return null
    }
    if (!profile) {
      console.error('[Auth] Perfil não encontrado para userId:', userId)
      return null
    }
    return rowToUser(profile, email) as User
  }, [])

  // Recupera sessão no mount + escuta mudanças
  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      try {
        if (session?.user) {
          const expiresAt = session.expires_at
          if (expiresAt && expiresAt < Math.floor(Date.now() / 1000)) {
            // Token expirado — limpa tudo
            clearSupabaseTokens()
            await supabase.auth.signOut().catch(() => {})
            setLoading(false)
            return
          }
          const user = await fetchProfile(session.user.id, session.user.email || '')
          if (!cancelled) setCurrentUser(user)
        }
      } catch (err) {
        console.error('[Auth] Erro ao recuperar sessão:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }).catch((err) => {
      console.error('[Auth] getSession falhou:', err)
      if (!cancelled) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          // Se login() está em andamento, ele próprio faz o setCurrentUser
          if (loginInProgressRef.current) return
          const user = await fetchProfile(session.user.id, session.user.email || '')
          if (!cancelled) setCurrentUser(user)
        } else if (event === 'SIGNED_OUT') {
          if (!cancelled) setCurrentUser(null)
        }
      } catch (err) {
        console.error('[Auth] onAuthStateChange erro:', err)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const login = async (email: string, pass: string): Promise<User | null> => {
    loginInProgressRef.current = true
    try {
      // Limpa qualquer sessão residual antes de tentar novo login
      clearSupabaseTokens()
      await supabase.auth.signOut().catch(() => {})

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
        return null
      }

      if (!data.user) {
        toast.error('Erro ao fazer login', { description: 'Nenhum usuário retornado.' })
        return null
      }

      const user = await fetchProfile(data.user.id, data.user.email || '')
      if (!user) {
        toast.error('Erro ao carregar perfil', {
          description: 'Perfil não encontrado. Contate o administrador.',
        })
        // Limpa sessão Supabase que ficou ativa sem perfil
        await supabase.auth.signOut().catch(() => {})
        return null
      }

      setCurrentUser(user)
      toast.success('Login realizado com sucesso!', {
        description:
          user.role === 'establishment' ? 'Bem-vindo ao painel.' : 'Bem-vindo(a) de volta.',
      })
      return user
    } finally {
      loginInProgressRef.current = false
    }
  }

  const logout = async () => {
    setCurrentUser(null)
    clearSupabaseTokens()
    // signOut no servidor (fire-and-forget)
    supabase.auth.signOut().catch(() => {})
    // Reload garante estado 100% limpo
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

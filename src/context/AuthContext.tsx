import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface User {
  id: string
  email: string
  firstLoginAt: number
  role?: 'user' | 'establishment'
  managedPlaceId?: string
  name?: string
  cpf?: string
  phone?: string
  travelPeriod?: string
}

interface AuthContextType {
  currentUser: User | null
  login: (email: string, pass: string) => void
  loginEstablishment: (placeId: string, pass: string) => void
  register: (email: string, pass: string, extraData?: Partial<User>) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('@uruguai:user', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('@uruguai:user')
    }
  }, [currentUser])

  const login = (email: string, _: string) => {
    const users = JSON.parse(localStorage.getItem('@uruguai:users_db') || '{}')
    const existing = users[email]
    const firstLoginAt = existing ? existing.firstLoginAt : Date.now()

    if (!existing) {
      users[email] = { email, firstLoginAt, role: 'user' }
      localStorage.setItem('@uruguai:users_db', JSON.stringify(users))
    }

    setCurrentUser({ id: email, email, firstLoginAt, role: 'user', ...existing })
    toast.success('Login realizado com sucesso!', {
      description: 'Bem-vindo(a) de volta ao Uruguai.',
    })
  }

  const loginEstablishment = (placeId: string, _: string) => {
    const users = JSON.parse(localStorage.getItem('@uruguai:users_db') || '{}')
    const email = `empresa_${placeId}@bnu.com`
    const existing = users[email]
    const firstLoginAt = existing ? existing.firstLoginAt : Date.now()

    if (!existing) {
      users[email] = { email, firstLoginAt, role: 'establishment', managedPlaceId: placeId }
      localStorage.setItem('@uruguai:users_db', JSON.stringify(users))
    }

    setCurrentUser({
      id: email,
      email,
      firstLoginAt,
      role: 'establishment',
      managedPlaceId: placeId,
    })
    toast.success('Login empresarial realizado com sucesso!', {
      description: 'Bem-vindo ao seu painel de gestão.',
    })
  }

  const register = (email: string, _: string, extraData?: Partial<User>) => {
    const users = JSON.parse(localStorage.getItem('@uruguai:users_db') || '{}')
    const firstLoginAt = Date.now()

    users[email] = { email, firstLoginAt, role: 'user', ...extraData }
    localStorage.setItem('@uruguai:users_db', JSON.stringify(users))

    setCurrentUser({ id: email, email, firstLoginAt, role: 'user', ...extraData })
    toast.success('Conta criada com sucesso!', {
      description: 'Sua jornada de descontos começa agora.',
    })
  }

  const logout = () => {
    setCurrentUser(null)
    toast.success('Você saiu da conta.', {
      description: 'Sessão encerrada com segurança.',
    })
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { currentUser, login, loginEstablishment, register, logout } },
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

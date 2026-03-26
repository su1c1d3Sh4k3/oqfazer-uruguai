import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface User {
  id: string
  email: string
  password?: string
  firstLoginAt: number
  role?: 'user' | 'establishment'
  managedPlaceId?: string
  name?: string
  cpf?: string
  phone?: string
  travelPeriod?: string
  ci?: string
  responsibleName?: string
  deletionRequested?: boolean
}

interface AuthContextType {
  currentUser: User | null
  login: (email: string, pass: string) => boolean
  logout: () => void
  updateProfile: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const initDb = () => {
  const saved = localStorage.getItem('@uruguai:users_db')
  if (!saved) {
    const defaultDb = {
      'user@bnu.com': {
        email: 'user@bnu.com',
        password: '123',
        role: 'user',
        name: 'Usuário Teste',
        firstLoginAt: Date.now(),
      },
      'empresa@bnu.com': {
        email: 'empresa@bnu.com',
        password: '123',
        role: 'establishment',
        managedPlaceId: '1',
        responsibleName: 'Admin',
        ci: '123456',
        phone: '999999999',
        firstLoginAt: Date.now(),
      },
      'contato@brasileirosnouruguai.com.br': {
        email: 'contato@brasileirosnouruguai.com.br',
        password: '1234',
        role: 'establishment',
        managedPlaceId: 'cafe-pajaros',
        responsibleName: 'Admin BNU',
        firstLoginAt: Date.now(),
      },
    }
    localStorage.setItem('@uruguai:users_db', JSON.stringify(defaultDb))
    return defaultDb
  }
  return JSON.parse(saved)
}

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
    initDb()
  }, [])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('@uruguai:user', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('@uruguai:user')
    }
  }, [currentUser])

  const login = (email: string, pass: string) => {
    const users = JSON.parse(localStorage.getItem('@uruguai:users_db') || '{}')
    const existing = users[email]

    if (!existing) {
      toast.error('Conta não encontrada', {
        description: 'Entre em contato com a administração para obter seu acesso.',
      })
      return false
    }

    if (existing.password && existing.password !== pass) {
      toast.error('Senha incorreta')
      return false
    }

    if (!existing.firstLoginAt) {
      existing.firstLoginAt = Date.now()
      users[email] = existing
      localStorage.setItem('@uruguai:users_db', JSON.stringify(users))
    }

    setCurrentUser({ id: email, ...existing })
    toast.success('Login realizado com sucesso!', {
      description:
        existing.role === 'establishment' ? 'Bem-vindo ao painel.' : 'Bem-vindo(a) de volta.',
    })
    return true
  }

  const logout = () => {
    setCurrentUser(null)
    toast.success('Você saiu da conta.', {
      description: 'Sessão encerrada com segurança.',
    })
  }

  const updateProfile = (data: Partial<User>) => {
    if (!currentUser) return
    const users = JSON.parse(localStorage.getItem('@uruguai:users_db') || '{}')
    const oldEmail = currentUser.email
    const newEmail = data.email || oldEmail

    const updatedUser = { ...currentUser, ...data, id: newEmail }

    if (newEmail !== oldEmail) {
      users[newEmail] = updatedUser
      delete users[oldEmail]
    } else {
      users[oldEmail] = updatedUser
    }

    localStorage.setItem('@uruguai:users_db', JSON.stringify(users))
    setCurrentUser(updatedUser)
    toast.success('Perfil atualizado com sucesso!')
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { currentUser, login, logout, updateProfile } },
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

import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface User {
  id: string
  email: string
}

interface AuthContextType {
  currentUser: User | null
  login: (email: string, pass: string) => void
  register: (email: string, pass: string) => void
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
    setCurrentUser({ id: email, email })
    toast.success('Login realizado com sucesso!', {
      description: 'Bem-vindo(a) de volta ao Uruguai.',
    })
  }

  const register = (email: string, _: string) => {
    setCurrentUser({ id: email, email })
    toast.success('Conta criada com sucesso!', {
      description: 'Sua jornada de descontos começa agora.',
    })
  }

  const logout = () => {
    setCurrentUser(null)
    toast.success('Você saiu da conta.', {
      description: 'Seus dados estão salvos com segurança.',
    })
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { currentUser, login, register, logout } },
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

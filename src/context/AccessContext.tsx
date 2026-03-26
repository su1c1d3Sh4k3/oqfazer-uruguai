import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

interface AccessContextType {
  firstCheckIn: number | null
  isExpired: boolean
  placeCheckIns: Record<string, number>
  recordCheckIn: (placeId: string) => void
  getPlaceCheckIn: (placeId: string) => number | null
  isGranted: boolean
  grantAccess: (pwd: string) => boolean
  revokeAccess: () => void
}

const AccessContext = createContext<AccessContextType | undefined>(undefined)

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()

  const checkInKey = currentUser ? `@uruguai:checkins_${currentUser.id}` : '@uruguai:checkins_guest'
  const firstCheckInKey = currentUser
    ? `@uruguai:firstcheckin_${currentUser.id}`
    : '@uruguai:firstcheckin_guest'

  const [placeCheckIns, setPlaceCheckIns] = useState<Record<string, number>>({})
  const [firstCheckIn, setFirstCheckIn] = useState<number | null>(null)
  const [isGranted, setIsGranted] = useState<boolean>(() => {
    return localStorage.getItem('@uruguai:admin') === 'true'
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(checkInKey)
      setPlaceCheckIns(stored ? JSON.parse(stored) : {})

      const storedFirst = localStorage.getItem(firstCheckInKey)
      setFirstCheckIn(storedFirst ? parseInt(storedFirst, 10) : null)
    } catch {
      setPlaceCheckIns({})
      setFirstCheckIn(null)
    }
  }, [checkInKey, firstCheckInKey])

  useEffect(() => {
    localStorage.setItem(checkInKey, JSON.stringify(placeCheckIns))
  }, [placeCheckIns, checkInKey])

  useEffect(() => {
    if (firstCheckIn) {
      localStorage.setItem(firstCheckInKey, firstCheckIn.toString())
    }
  }, [firstCheckIn, firstCheckInKey])

  const recordCheckIn = (placeId: string) => {
    const now = Date.now()
    if (!firstCheckIn) {
      setFirstCheckIn(now)
    }
    setPlaceCheckIns((prev) => ({ ...prev, [placeId]: now }))
  }

  const getPlaceCheckIn = (placeId: string) => placeCheckIns[placeId] || null

  const isExpired = currentUser?.firstLoginAt
    ? Date.now() > currentUser.firstLoginAt + 20 * 24 * 60 * 60 * 1000
    : false

  // Trigger Summary Email when expired
  useEffect(() => {
    if (currentUser && isExpired) {
      const emailSentKey = `@uruguai:summary_sent_${currentUser.id}`
      if (!localStorage.getItem(emailSentKey)) {
        const visitedCount = Object.keys(placeCheckIns).length
        toast.success('Resumo da Viagem Enviado!', {
          description: `Um e-mail automático foi enviado para ${currentUser.email} contendo a lista de todos os ${visitedCount} locais e passeios que você visitou. Guarde as memórias e compartilhe com os amigos!`,
          duration: 12000,
        })
        localStorage.setItem(emailSentKey, 'true')
      }
    }
  }, [currentUser, isExpired, placeCheckIns])

  const grantAccess = (pwd: string) => {
    if (pwd === '1234') {
      setIsGranted(true)
      localStorage.setItem('@uruguai:admin', 'true')
      return true
    }
    return false
  }

  const revokeAccess = () => {
    setIsGranted(false)
    localStorage.removeItem('@uruguai:admin')
  }

  return React.createElement(
    AccessContext.Provider,
    {
      value: {
        firstCheckIn,
        isExpired,
        placeCheckIns,
        recordCheckIn,
        getPlaceCheckIn,
        isGranted,
        grantAccess,
        revokeAccess,
      },
    },
    children,
  )
}

export function useAccess() {
  const context = useContext(AccessContext)
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider')
  }
  return context
}

import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'

export interface AccessRecord {
  placeId: string
  timestamp: number
  expiresAt: number
}

interface AccessContextType {
  accesses: AccessRecord[]
  checkIn: (placeId: string) => void
  getPlaceStatus: (placeId: string) => 'active' | 'expired' | 'none'
  getPlaceCheckIn: (placeId: string) => number | null
  recordCheckIn: (placeId: string) => void
  isExpired: boolean
  isGranted: boolean
}

const AccessContext = createContext<AccessContextType | undefined>(undefined)

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, updateProfile } = useAuth()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const [accesses, setAccesses] = useState<AccessRecord[]>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:accesses')
      if (!saved) {
        // Mock data to demonstrate dynamic coloring system
        return [
          { placeId: '1', timestamp: Date.now() - 1000, expiresAt: Date.now() + 3600000 }, // Active
          { placeId: '3', timestamp: Date.now() - 86400000, expiresAt: Date.now() - 80000000 }, // Expired
        ]
      }
      return JSON.parse(saved)
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('@uruguai:accesses', JSON.stringify(accesses))
  }, [accesses])

  const checkIn = (placeId: string) => {
    setAccesses((prev) => {
      const filtered = prev.filter((a) => a.placeId !== placeId)
      return [
        ...filtered,
        {
          placeId,
          timestamp: Date.now(),
          expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours duration
        },
      ]
    })

    if (currentUser?.role === 'user' && !currentUser.firstCheckInAt) {
      updateProfile({ firstCheckInAt: Date.now() }, true)
    }

    toast.success('Check-in realizado com sucesso!', {
      description: 'Aproveite seus benefícios no estabelecimento.',
    })
  }

  const getPlaceStatus = (placeId: string) => {
    const record = accesses.find((a) => a.placeId === placeId)
    if (!record) return 'none'
    return Date.now() > record.expiresAt ? 'expired' : 'active'
  }

  const getPlaceCheckIn = (placeId: string): number | null => {
    const record = accesses.find((a) => a.placeId === placeId)
    return record ? record.timestamp : null
  }

  const recordCheckIn = (placeId: string) => {
    checkIn(placeId)
  }

  const isExpired =
    currentUser?.role === 'user' && currentUser.firstCheckInAt
      ? now > currentUser.firstCheckInAt + 20 * 24 * 60 * 60 * 1000
      : false

  const isGranted = currentUser?.role === 'establishment'

  return React.createElement(
    AccessContext.Provider,
    {
      value: {
        accesses,
        checkIn,
        getPlaceStatus,
        getPlaceCheckIn,
        recordCheckIn,
        isExpired,
        isGranted,
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

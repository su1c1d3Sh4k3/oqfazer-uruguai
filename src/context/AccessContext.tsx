import React, { createContext, useContext, useEffect, useState } from 'react'

interface AccessContextType {
  firstCheckIn: number | null
  isExpired: boolean
  placeCheckIns: Record<string, number>
  recordCheckIn: (placeId: string) => void
  getPlaceCheckIn: (placeId: string) => number | null
}

const AccessContext = createContext<AccessContextType | undefined>(undefined)

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [firstCheckIn, setFirstCheckIn] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('@uruguai:checkin')
      return stored ? parseInt(stored, 10) : null
    } catch {
      return null
    }
  })

  const [placeCheckIns, setPlaceCheckIns] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('@uruguai:placeCheckIns')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    if (firstCheckIn) {
      localStorage.setItem('@uruguai:checkin', firstCheckIn.toString())
    }
  }, [firstCheckIn])

  useEffect(() => {
    localStorage.setItem('@uruguai:placeCheckIns', JSON.stringify(placeCheckIns))
  }, [placeCheckIns])

  const recordCheckIn = (placeId: string) => {
    const now = Date.now()
    if (!firstCheckIn) {
      setFirstCheckIn(now)
    }
    setPlaceCheckIns((prev) => ({ ...prev, [placeId]: now }))
  }

  const getPlaceCheckIn = (placeId: string) => placeCheckIns[placeId] || null

  // Expires 10 days after first check-in
  const isExpired = firstCheckIn ? Date.now() > firstCheckIn + 10 * 24 * 60 * 60 * 1000 : false

  return React.createElement(
    AccessContext.Provider,
    { value: { firstCheckIn, isExpired, placeCheckIns, recordCheckIn, getPlaceCheckIn } },
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

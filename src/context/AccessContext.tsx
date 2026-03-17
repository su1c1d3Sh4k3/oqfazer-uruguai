import React, { createContext, useContext, useEffect, useState } from 'react'

interface AccessContextType {
  firstCheckIn: number | null
  isExpired: boolean
  recordCheckIn: () => void
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

  useEffect(() => {
    if (firstCheckIn) {
      localStorage.setItem('@uruguai:checkin', firstCheckIn.toString())
    }
  }, [firstCheckIn])

  const recordCheckIn = () => {
    if (!firstCheckIn) {
      setFirstCheckIn(Date.now())
    }
  }

  // Expires 10 days after first check-in
  const isExpired = firstCheckIn ? Date.now() > firstCheckIn + 10 * 24 * 60 * 60 * 1000 : false

  return React.createElement(
    AccessContext.Provider,
    { value: { firstCheckIn, isExpired, recordCheckIn } },
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

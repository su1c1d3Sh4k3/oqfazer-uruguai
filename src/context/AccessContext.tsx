import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import { sendTemplatedEmail } from '@/lib/emailService'

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
  const [accesses, setAccesses] = useState<AccessRecord[]>([])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch access records when user changes
  useEffect(() => {
    if (!currentUser?.id) {
      setAccesses([])
      return
    }

    const fetchAccesses = async () => {
      const { data, error } = await supabase
        .from('access_records')
        .select('*')
        .eq('user_id', currentUser.id)

      if (!error && data) {
        setAccesses(
          data.map((row: any) => ({
            placeId: row.place_id,
            timestamp: row.timestamp,
            expiresAt: row.expires_at,
          })),
        )
      }
    }

    fetchAccesses()
  }, [currentUser?.id])

  const checkIn = async (placeId: string) => {
    if (!currentUser) return

    const newRecord: AccessRecord = {
      placeId,
      timestamp: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    }

    // Optimistic update
    setAccesses((prev) => {
      const filtered = prev.filter((a) => a.placeId !== placeId)
      return [...filtered, newRecord]
    })

    // Upsert to Supabase
    const { error } = await supabase.from('access_records').upsert(
      {
        user_id: currentUser.id,
        place_id: placeId,
        timestamp: newRecord.timestamp,
        expires_at: newRecord.expiresAt,
      },
      { onConflict: 'user_id,place_id' },
    )

    if (error) {
      console.error('Error recording check-in:', error)
    }

    // Increment check-in count on place
    const { error: rpcError } = await supabase.rpc('increment_place_metric', {
      p_place_id: placeId,
      p_metric: 'check_in_count',
    })
    if (rpcError) {
      console.error('Error incrementing check_in_count:', rpcError)
    }

    // Set firstCheckInAt if first time
    if (currentUser.role === 'user' && !currentUser.firstCheckInAt) {
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

  const expirationEmailSentRef = useRef(false)

  useEffect(() => {
    if (!isExpired || !currentUser?.email || expirationEmailSentRef.current) return
    const key = `@uruguai:expiration_email_sent_${currentUser.id}`
    if (localStorage.getItem(key)) return
    expirationEmailSentRef.current = true
    localStorage.setItem(key, '1')
    sendTemplatedEmail('expiration', currentUser.email, 'Seu periodo de acesso expirou', {
      nome: currentUser.name || currentUser.email,
      email: currentUser.email,
      data_expiracao: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    }).catch(console.error)
  }, [isExpired, currentUser?.email, currentUser?.id, currentUser?.name])

  const isGranted = currentUser?.role === 'establishment' || currentUser?.role === 'admin'

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

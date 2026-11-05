import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import { sendTemplatedEmail } from '@/lib/emailService'
import type { AppliedDiscount } from '@/data/places'
import { CHECKIN_DURATION_MS, TRIAL_DAYS, getTrialStart } from '@/lib/utils'

export interface AccessRecord {
  placeId: string
  timestamp: number
  expiresAt: number
  discount?: AppliedDiscount | null
}

/** Cupom de sorteio da conta 'voucher': um check-in, num restaurante só */
export interface VoucherState {
  placeId: string
  /** Desconto específico; vazio = desconto padrão do restaurante */
  discount?: string
  hoursOnly: boolean
  expiresAt?: number
  status: 'available' | 'used' | 'expired'
}

const VOUCHER_ERRORS: Record<string, string> = {
  VOUCHER_ALREADY_USED: 'Este cupom já foi utilizado.',
  VOUCHER_EXPIRED: 'Este cupom expirou.',
  VOUCHER_PLACE_UNAVAILABLE: 'O restaurante do cupom está indisponível no momento.',
  VOUCHER_NO_DISCOUNT_NOW: 'Fora do horário de desconto do restaurante.',
}

interface AccessContextType {
  accesses: AccessRecord[]
  checkIn: (placeId: string, discount?: AppliedDiscount | null) => void
  getPlaceStatus: (placeId: string) => 'active' | 'expired' | 'none'
  getPlaceCheckIn: (placeId: string) => number | null
  getPlaceCheckInDiscount: (placeId: string) => AppliedDiscount | null
  recordCheckIn: (placeId: string, discount?: AppliedDiscount | null) => void
  isExpired: boolean
  isGranted: boolean
  voucher: VoucherState | null
  /** Usa o cupom (check-in único). Retorna false se não foi gravado. */
  redeemVoucher: (currentDiscount: AppliedDiscount | null) => Promise<boolean>
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
            discount: row.discount ?? null,
          })),
        )
      }
    }

    fetchAccesses()
  }, [currentUser?.id])

  const checkIn = async (placeId: string, discount: AppliedDiscount | null = null) => {
    // Agência só consulta os estabelecimentos; não faz check-in
    // Conta cupom faz check-in só pelo redeemVoucher
    if (!currentUser || currentUser.role === 'agency' || currentUser.role === 'voucher') return

    // O desconto vale conforme o momento do check-in (snapshot)
    const newRecord: AccessRecord = {
      placeId,
      timestamp: Date.now(),
      expiresAt: Date.now() + CHECKIN_DURATION_MS,
      discount,
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
        discount,
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

  const getPlaceCheckInDiscount = (placeId: string): AppliedDiscount | null =>
    accesses.find((a) => a.placeId === placeId)?.discount ?? null

  const recordCheckIn = (placeId: string, discount: AppliedDiscount | null = null) => {
    checkIn(placeId, discount)
  }

  const trialStart = currentUser ? getTrialStart(currentUser) : undefined
  const isExpired =
    currentUser?.role === 'user' && trialStart
      ? now > trialStart + TRIAL_DAYS * 24 * 60 * 60 * 1000
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

  const voucher: VoucherState | null =
    currentUser?.role === 'voucher' && currentUser.voucherPlaceId
      ? {
          placeId: currentUser.voucherPlaceId,
          discount: currentUser.voucherDiscount,
          hoursOnly: !!currentUser.voucherHoursOnly,
          expiresAt: currentUser.voucherExpiresAt,
          status:
            currentUser.voucherUsedAt ||
            accesses.some((a) => a.placeId === currentUser.voucherPlaceId)
              ? 'used'
              : currentUser.voucherExpiresAt && now > currentUser.voucherExpiresAt
                ? 'expired'
                : 'available',
        }
      : null

  // O check-in do cupom é validado e gravado no banco (RPC use_voucher)
  const redeemVoucher = async (currentDiscount: AppliedDiscount | null) => {
    if (!voucher || voucher.status !== 'available') return false
    const { data, error } = await supabase.rpc('use_voucher', {
      p_label: currentDiscount?.label ?? null,
      p_description: currentDiscount?.description ?? null,
    })
    if (error || !data) {
      const code = Object.keys(VOUCHER_ERRORS).find((k) => error?.message?.includes(k))
      toast.error('Não foi possível usar o cupom', {
        description: code ? VOUCHER_ERRORS[code] : 'Verifique sua conexão e tente novamente.',
      })
      return false
    }
    setAccesses((prev) => [
      ...prev.filter((a) => a.placeId !== data.placeId),
      {
        placeId: data.placeId,
        timestamp: data.timestamp,
        expiresAt: data.expiresAt,
        discount: data.discount,
      },
    ])
    toast.success('Cupom utilizado!', {
      description: 'Mostre o ticket no restaurante para receber o desconto.',
    })
    return true
  }

  return React.createElement(
    AccessContext.Provider,
    {
      value: {
        accesses,
        checkIn,
        getPlaceStatus,
        getPlaceCheckIn,
        getPlaceCheckInDiscount,
        recordCheckIn,
        isExpired,
        isGranted,
        voucher,
        redeemVoucher,
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

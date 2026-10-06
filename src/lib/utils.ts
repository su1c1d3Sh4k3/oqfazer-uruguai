import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type {
  AppliedDiscount,
  DailyHours,
  DiscountRule,
  Place,
  PriceLevel,
  TimeShift,
} from '@/data/places'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

/**
 * Returns a Date object representing the current date and time in Brasília (America/Sao_Paulo).
 * Use UTC methods (getUTCDay, getUTCHours, etc.) on the returned Date to get the correct SP time values.
 * This avoids any local timezone DST gaps or string parsing inconsistencies.
 */
export function getSpDate(timestamp?: number): Date {
  const date = timestamp ? new Date(timestamp) : new Date()
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false, // Ensures 24h format consistently
  }

  const formatter = new Intl.DateTimeFormat('en-US', options)
  const parts = formatter.formatToParts(date)
  const getPart = (type: string) => {
    const part = parts.find((p) => p.type === type)
    return part ? parseInt(part.value, 10) : 0
  }

  const year = getPart('year')
  const month = getPart('month') - 1
  const day = getPart('day')
  let hour = getPart('hour')
  // Safely handle environments where hour12: false might still return 24 instead of 0
  if (hour === 24) hour = 0
  const minute = getPart('minute')
  const second = getPart('second')

  return new Date(Date.UTC(year, month, day, hour, minute, second))
}

/** Validade de um check-in (ticket, status no mapa e registro no banco). */
export const CHECKIN_DURATION_MS = 24 * 60 * 60 * 1000

/** Converts "HH:MM" to minutes since midnight for reliable numeric comparison. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Minutos desde a meia-noite no fuso padrão do app. */
function spMinutes(timestamp?: number) {
  const spDate = getSpDate(timestamp)
  return { day: spDate.getUTCDay(), minutes: spDate.getUTCHours() * 60 + spDate.getUTCMinutes() }
}

/** Intervalos do dia — registros antigos têm só openTime/closeTime. */
export function getShifts(hours?: DailyHours): TimeShift[] {
  if (!hours) return []
  if (hours.shifts && hours.shifts.length > 0) return hours.shifts
  if (hours.openTime && hours.closeTime) {
    return [{ openTime: hours.openTime, closeTime: hours.closeTime }]
  }
  return []
}

/** Intervalo que termina no dia seguinte (fechamento <= abertura). */
function crossesMidnight(shift: TimeShift) {
  return timeToMinutes(shift.closeTime) <= timeToMinutes(shift.openTime)
}

export function isPlaceOpen(operatingHours?: DailyHours[], timestamp?: number): boolean {
  if (!operatingHours || operatingHours.length === 0) return false

  const { day: currentDay, minutes: nowMinutes } = spMinutes(timestamp)
  const todayHours = operatingHours.find((h) => h.day === currentDay)
  const yesterdayDay = currentDay === 0 ? 6 : currentDay - 1
  const yesterdayHours = operatingHours.find((h) => h.day === yesterdayDay)

  // 1. Ainda dentro de um intervalo de ontem que passou da meia-noite
  if (yesterdayHours?.isOpen) {
    for (const shift of getShifts(yesterdayHours)) {
      if (crossesMidnight(shift) && nowMinutes < timeToMinutes(shift.closeTime)) return true
    }
  }

  // 2. Intervalos de hoje
  if (todayHours?.isOpen) {
    for (const shift of getShifts(todayHours)) {
      const open = timeToMinutes(shift.openTime)
      const close = timeToMinutes(shift.closeTime)
      if (crossesMidnight(shift) ? nowMinutes >= open : nowMinutes >= open && nowMinutes < close) {
        return true
      }
    }
  }

  return false
}

/**
 * Valida os horários: intervalos do mesmo dia não podem se sobrepor, só o último
 * pode passar da meia-noite, e esse não pode invadir o primeiro intervalo do dia seguinte.
 * Retorna mensagens de erro (vazio = válido).
 */
export function validateOperatingHours(operatingHours: DailyHours[]): string[] {
  const errors: string[] = []
  const label = (day: number) => DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? String(day)

  for (const hours of operatingHours) {
    if (!hours.isOpen) continue
    const shifts = getShifts(hours)
    if (shifts.length === 0) {
      errors.push(`${label(hours.day)}: adicione ao menos um intervalo.`)
      continue
    }
    for (let i = 0; i < shifts.length; i++) {
      const s = shifts[i]
      if (!s.openTime || !s.closeTime) {
        errors.push(`${label(hours.day)}: preencha início e fim de todos os intervalos.`)
        continue
      }
      if (crossesMidnight(s) && i < shifts.length - 1) {
        errors.push(`${label(hours.day)}: só o último intervalo pode passar da meia-noite.`)
      }
      if (i > 0 && timeToMinutes(s.openTime) < timeToMinutes(shifts[i - 1].closeTime)) {
        errors.push(`${label(hours.day)}: intervalos sobrepostos (${shifts[i - 1].closeTime} > ${s.openTime}).`)
      }
    }

    const last = shifts[shifts.length - 1]
    if (last.openTime && last.closeTime && crossesMidnight(last)) {
      const nextHours = operatingHours.find((h) => h.day === (hours.day + 1) % 7)
      const nextFirst = nextHours?.isOpen ? getShifts(nextHours)[0] : undefined
      if (nextFirst && timeToMinutes(last.closeTime) > timeToMinutes(nextFirst.openTime)) {
        errors.push(
          `${label(hours.day)}: o intervalo até ${last.closeTime} conflita com a abertura de ${label(nextHours!.day)} (${nextFirst.openTime}).`,
        )
      }
    }
  }
  return errors
}

/** Janela diária [start, end); end <= start atravessa a meia-noite; start == end = dia todo. */
function inDailyWindow(nowMinutes: number, startTime: string, endTime: string) {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  if (start === end) return true
  return end > start ? nowMinutes >= start && nowMinutes < end : nowMinutes >= start || nowMinutes < end
}

export function isFlashOfferActive(place: Place, timestamp = Date.now()) {
  return !!place.flashOffer && place.flashOffer.expiresAt > timestamp
}

/**
 * Desconto válido agora. Prioridade: Oferta Relâmpago > regra por horário > badge fixo.
 * Lugares com regras por horário ficam sem desconto fora dos intervalos (retorna null).
 */
export function getCurrentDiscount(place: Place, timestamp = Date.now()): AppliedDiscount | null {
  if (isFlashOfferActive(place, timestamp)) {
    return {
      source: 'flash',
      label: `${place.flashOffer!.percentage}% OFF`,
      description: place.flashOffer!.description,
    }
  }
  const rules = place.discountRules ?? []
  if (rules.length > 0) {
    const { minutes } = spMinutes(timestamp)
    const rule = rules.find((r) => inDailyWindow(minutes, r.startTime, r.endTime))
    return rule
      ? { source: 'rule', label: rule.label, description: rule.description || place.discountDescription }
      : null
  }
  if (!place.discountBadge) return null
  return { source: 'badge', label: place.discountBadge, description: place.discountDescription }
}

/** Próxima regra de desconto a começar (as regras valem todos os dias). */
export function getNextDiscountRule(place: Place, timestamp = Date.now()): DiscountRule | null {
  const rules = place.discountRules ?? []
  if (rules.length === 0) return null
  const { minutes } = spMinutes(timestamp)
  const until = (r: DiscountRule) => (timeToMinutes(r.startTime) - minutes + 1440) % 1440
  return [...rules].sort((a, b) => until(a) - until(b))[0]
}

/** Texto curto do desconto para cards e badges. */
export function getDiscountBadgeText(place: Place, timestamp = Date.now()): string {
  const current = getCurrentDiscount(place, timestamp)
  if (current) return current.label
  const next = getNextDiscountRule(place, timestamp)
  return next ? `${next.label} às ${next.startTime}` : ''
}

/** Ativo, ou desativado temporariamente com data de reativação já passada. */
export function isPlaceActive(place: Place, timestamp = Date.now()) {
  if (place.isActive !== false) return true
  return !!place.reactivateAt && Date.parse(place.reactivateAt) <= timestamp
}

/** Agência vê apenas passeios. */
export function canRoleViewPlace(place: Place, role?: string) {
  return role === 'agency' ? place.type === 'tour' : true
}

export const PRICE_LEVELS: { value: PriceLevel; label: string; description: string }[] = [
  { value: 1, label: '$', description: 'Econômico' },
  { value: 2, label: '$$', description: 'Moderado' },
  { value: 3, label: '$$$', description: 'Sofisticado' },
]

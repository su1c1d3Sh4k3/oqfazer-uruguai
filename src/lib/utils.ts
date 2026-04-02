import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DailyHours } from '@/data/places'

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

/** Converts "HH:MM" to minutes since midnight for reliable numeric comparison. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function isPlaceOpen(operatingHours?: DailyHours[], timestamp?: number): boolean {
  if (!operatingHours || operatingHours.length === 0) return false

  const spDate = getSpDate(timestamp)
  const currentDay = spDate.getUTCDay()
  const currentHour = spDate.getUTCHours()
  const currentMinute = spDate.getUTCMinutes()
  const nowMinutes = currentHour * 60 + currentMinute

  const todayHours = operatingHours.find((h) => h.day === currentDay)
  const yesterdayDay = currentDay === 0 ? 6 : currentDay - 1
  const yesterdayHours = operatingHours.find((h) => h.day === yesterdayDay)

  // 1. Check if we are still within yesterday's shift that crossed midnight
  if (yesterdayHours?.isOpen) {
    const yOpen = timeToMinutes(yesterdayHours.openTime)
    const yClose = timeToMinutes(yesterdayHours.closeTime)
    if (yClose <= yOpen && nowMinutes < yClose) {
      return true
    }
  }

  // 2. Check today's shift
  if (todayHours?.isOpen) {
    const tOpen = timeToMinutes(todayHours.openTime)
    const tClose = timeToMinutes(todayHours.closeTime)
    if (tClose <= tOpen) {
      // Shift crosses midnight into tomorrow. Open if past today's open time.
      if (nowMinutes >= tOpen) {
        return true
      }
    } else {
      // Standard daytime shift
      if (nowMinutes >= tOpen && nowMinutes < tClose) {
        return true
      }
    }
  }

  return false
}

/* General utility functions (exposes cn) */
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
 * Returns a Date object initialized with the current date and time in Brasília (America/Sao_Paulo).
 * This ensures consistency in operations regardless of the user's local timezone settings.
 */
export function getSpDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

export function isPlaceOpen(operatingHours?: DailyHours[]): boolean {
  if (!operatingHours || operatingHours.length === 0) return false

  const spDate = getSpDate()
  const currentDay = spDate.getDay()
  const currentHour = spDate.getHours()
  const currentMinute = spDate.getMinutes()
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

  const todayHours = operatingHours.find((h) => h.day === currentDay)
  const yesterdayDay = currentDay === 0 ? 6 : currentDay - 1
  const yesterdayHours = operatingHours.find((h) => h.day === yesterdayDay)

  // 1. Check if we are still within yesterday's shift that crossed midnight
  if (
    yesterdayHours?.isOpen &&
    yesterdayHours.closeTime < yesterdayHours.openTime &&
    currentTimeStr <= yesterdayHours.closeTime
  ) {
    return true
  }

  // 2. Check today's shift
  if (todayHours?.isOpen) {
    if (todayHours.closeTime < todayHours.openTime) {
      // Shift crosses midnight into tomorrow. We are open if we are past today's open time.
      if (currentTimeStr >= todayHours.openTime) {
        return true
      }
    } else {
      // Standard daytime shift
      if (currentTimeStr >= todayHours.openTime && currentTimeStr <= todayHours.closeTime) {
        return true
      }
    }
  }

  return false
}

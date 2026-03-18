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

export function isPlaceOpen(operatingHours?: DailyHours[]): boolean {
  if (!operatingHours || operatingHours.length === 0) return false

  const now = new Date()
  const currentDay = now.getDay()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

  const todayHours = operatingHours.find((h) => h.day === currentDay)
  let isOpenToday = false

  if (todayHours?.isOpen) {
    if (todayHours.closeTime < todayHours.openTime) {
      if (currentTimeStr >= todayHours.openTime) {
        isOpenToday = true
      }
    } else {
      if (currentTimeStr >= todayHours.openTime && currentTimeStr <= todayHours.closeTime) {
        isOpenToday = true
      }
    }
  }

  const yesterdayDay = currentDay === 0 ? 6 : currentDay - 1
  const yesterdayHours = operatingHours.find((h) => h.day === yesterdayDay)
  if (
    !isOpenToday &&
    yesterdayHours?.isOpen &&
    yesterdayHours.closeTime < yesterdayHours.openTime
  ) {
    if (currentTimeStr <= yesterdayHours.closeTime) {
      return true
    }
  }

  return isOpenToday
}

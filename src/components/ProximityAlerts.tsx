import { useEffect, useRef, useMemo } from 'react'
import { useGeo } from '@/context/GeoContext'
import { usePlaces } from '@/context/PlacesContext'
import { useAccess } from '@/context/AccessContext'
import { toast } from 'sonner'

export function ProximityAlerts() {
  const { location, calculateDistance } = useGeo()
  const { places } = usePlaces()
  const { accesses } = useAccess()
  const alerted = useRef<Set<string>>(new Set())

  const placeCheckIns = useMemo(() => {
    if (!accesses) return {}
    return accesses.reduce(
      (acc, curr) => {
        acc[curr.placeId] = curr.timestamp
        return acc
      },
      {} as Record<string, number>,
    )
  }, [accesses])

  useEffect(() => {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!location) return

    places.forEach((place) => {
      if (placeCheckIns[place.id]) return
      if (alerted.current.has(place.id)) return

      if (!place.discountBadge && !place.discountDescription) return

      const dist = calculateDistance(place.coordinates.lat, place.coordinates.lng)
      if (dist !== null && dist <= 0.5) {
        alerted.current.add(place.id)

        const alertTitle = `Lembrete Amigável`
        const alertBody = `Você está bem perto de ${place.name}! Aproveite para visitar e usar seu benefício de ${place.discountBadge}.`

        toast.message(alertTitle, {
          description: alertBody,
          style: {
            backgroundColor: '#FFD700',
            color: '#000',
            borderColor: '#E6C200',
            fontWeight: 'bold',
          },
          duration: 10000,
        })

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(alertTitle, {
            body: alertBody,
            icon: '/favicon.ico',
          })
        }
      }
    })
  }, [location, places, placeCheckIns, calculateDistance])

  return null
}

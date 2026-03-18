import { useEffect, useRef } from 'react'
import { useGeo } from '@/context/GeoContext'
import { usePlaces } from '@/context/PlacesContext'
import { useAccess } from '@/context/AccessContext'
import { toast } from 'sonner'

export function ProximityAlerts() {
  const { location, calculateDistance } = useGeo()
  const { places } = usePlaces()
  const { placeCheckIns } = useAccess()
  const alerted = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!location) return

    places.forEach((place) => {
      if (placeCheckIns[place.id]) return // Já fez check-in, ignora o alerta
      if (alerted.current.has(place.id)) return // Já alertou na sessão

      // Tem algum tipo de desconto válido?
      if (!place.discountBadge && !place.discountDescription) return

      const dist = calculateDistance(place.coordinates.lat, place.coordinates.lng)
      if (dist !== null && dist <= 0.5) {
        alerted.current.add(place.id)
        toast.message(`Alerta de Proximidade`, {
          description: `Você está perto de ${place.name}! Aproveite seu cupom de desconto.`,
          style: {
            backgroundColor: '#FFD700',
            color: '#000',
            borderColor: '#E6C200',
            fontWeight: 'bold',
          },
          duration: 10000,
        })
      }
    })
  }, [location, places, placeCheckIns, calculateDistance])

  return null
}

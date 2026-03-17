import React, { createContext, useContext, useEffect, useState } from 'react'

interface GeoContextType {
  location: { lat: number; lng: number } | null
  error: string | null
  calculateDistance: (lat: number, lng: number) => number | null
}

const GeoContext = createContext<GeoContextType | undefined>(undefined)

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (err) => {
          setError(err.message)
        },
      )
    } else {
      setError('Geolocalização não suportada')
    }
  }, [])

  const calculateDistance = (lat2: number, lng2: number) => {
    if (!location) return null
    const lat1 = location.lat
    const lng1 = location.lng
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLng = deg2rad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
  }

  return React.createElement(
    GeoContext.Provider,
    { value: { location, error, calculateDistance } },
    children,
  )
}

export function useGeo() {
  const context = useContext(GeoContext)
  if (context === undefined) {
    throw new Error('useGeo must be used within a GeoProvider')
  }
  return context
}

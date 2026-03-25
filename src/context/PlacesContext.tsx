import React, { createContext, useContext, useEffect, useState } from 'react'
import { Place, DEFAULT_PLACES, DEFAULT_CATEGORIES } from '@/data/places'

interface PlacesContextType {
  places: Place[]
  categories: string[]
  addPlace: (p: Place) => void
  updatePlace: (id: string, p: Partial<Place>) => void
  deletePlace: (id: string) => void
  addCategory: (c: string) => void
  deleteCategory: (c: string) => void
  recordAccess: (id: string) => void
  recordCouponClick: (id: string) => void
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined)

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:places')
      if (saved) {
        let parsed = JSON.parse(saved)

        // Migration to fix Parrilla del Sur Address data mismatch if user already cached it
        parsed = parsed.map((p: Place) => {
          if (p.id === '1' && p.address && p.address.includes('Rambla')) {
            return {
              ...p,
              address: 'San José 1065, 11100 Montevideo',
              coordinates: { lat: -34.9063, lng: -56.1905 },
            }
          }
          return p
        })

        const missingDefaults = DEFAULT_PLACES.filter(
          (dp) => !parsed.some((p: Place) => p.id === dp.id),
        )
        return [...parsed, ...missingDefaults]
      }
      return DEFAULT_PLACES
    } catch {
      return DEFAULT_PLACES
    }
  })

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:categories')
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES
    } catch {
      return DEFAULT_CATEGORIES
    }
  })

  useEffect(() => {
    localStorage.setItem('@uruguai:places', JSON.stringify(places))
  }, [places])

  useEffect(() => {
    localStorage.setItem('@uruguai:categories', JSON.stringify(categories))
  }, [categories])

  const addPlace = (p: Place) => setPlaces((prev) => [...prev, p])
  const updatePlace = (id: string, data: Partial<Place>) =>
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  const deletePlace = (id: string) => setPlaces((prev) => prev.filter((p) => p.id !== id))

  const addCategory = (c: string) => {
    if (!categories.includes(c)) setCategories((prev) => [...prev, c])
  }
  const deleteCategory = (c: string) => setCategories((prev) => prev.filter((cat) => cat !== c))

  const recordAccess = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, accessCount: (p.accessCount || 0) + 1 } : p)),
    )
  }

  const recordCouponClick = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, couponClickCount: (p.couponClickCount || 0) + 1 } : p,
      ),
    )
  }

  return React.createElement(
    PlacesContext.Provider,
    {
      value: {
        places,
        categories,
        addPlace,
        updatePlace,
        deletePlace,
        addCategory,
        deleteCategory,
        recordAccess,
        recordCouponClick,
      },
    },
    children,
  )
}

export function usePlaces() {
  const context = useContext(PlacesContext)
  if (context === undefined) {
    throw new Error('usePlaces must be used within a PlacesProvider')
  }
  return context
}

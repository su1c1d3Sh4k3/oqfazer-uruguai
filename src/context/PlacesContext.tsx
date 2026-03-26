import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  Place,
  FlashOffer,
  DEFAULT_PLACES,
  DEFAULT_CATEGORIES,
  DEFAULT_CITIES,
  DEFAULT_BADGES,
} from '@/data/places'

interface PlacesContextType {
  places: Place[]
  categories: string[]
  cities: string[]
  badges: string[]
  addPlace: (p: Place) => void
  updatePlace: (id: string, p: Partial<Place>) => void
  deletePlace: (id: string) => void
  addCategory: (c: string) => void
  deleteCategory: (c: string) => void
  addCity: (c: string) => void
  deleteCity: (c: string) => void
  addBadge: (b: string) => void
  deleteBadge: (b: string) => void
  recordAccess: (id: string) => void
  recordCouponClick: (id: string) => void
  createFlashOffer: (id: string, offer: FlashOffer | undefined) => void
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined)

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:places')
      let parsed: Place[] = []

      if (saved) {
        parsed = JSON.parse(saved)
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
        parsed = [...parsed, ...missingDefaults]
      } else {
        parsed = [...DEFAULT_PLACES]
      }

      const missingPajaros = !parsed.some(
        (p: Place) => p.id === 'cafe-pajaros' || p.name === 'Café de los Pájaros',
      )
      if (missingPajaros) {
        parsed.push({
          id: 'cafe-pajaros',
          name: 'Café de los Pájaros',
          description: 'Um charmoso café para aproveitar o melhor do Uruguai.',
          category: 'Cafeterias',
          city: 'Montevideo',
          address: 'Montevideo',
          coordinates: { lat: -34.9063, lng: -56.1905 },
          galleryImages: ['https://img.usecurling.com/p/800/600?q=cafe'],
          coverImage: 'https://img.usecurling.com/p/800/600?q=coffee',
          discountBadge: '10% OFF',
          discountDescription: '10% de desconto no total da conta.',
          operatingHours: [],
          accessCount: 0,
          couponClickCount: 0,
        })
      }

      return parsed
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

  const [cities, setCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:cities')
      return saved ? JSON.parse(saved) : DEFAULT_CITIES
    } catch {
      return DEFAULT_CITIES
    }
  })

  const [badges, setBadges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:badges')
      return saved ? JSON.parse(saved) : DEFAULT_BADGES
    } catch {
      return DEFAULT_BADGES
    }
  })

  useEffect(() => {
    localStorage.setItem('@uruguai:places', JSON.stringify(places))
  }, [places])

  useEffect(() => {
    localStorage.setItem('@uruguai:categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('@uruguai:cities', JSON.stringify(cities))
  }, [cities])

  useEffect(() => {
    localStorage.setItem('@uruguai:badges', JSON.stringify(badges))
  }, [badges])

  const addPlace = (p: Place) => setPlaces((prev) => [...prev, p])
  const updatePlace = (id: string, data: Partial<Place>) =>
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  const deletePlace = (id: string) => setPlaces((prev) => prev.filter((p) => p.id !== id))

  const addCategory = (c: string) => {
    if (!categories.includes(c)) setCategories((prev) => [...prev, c])
  }
  const deleteCategory = (c: string) => setCategories((prev) => prev.filter((cat) => cat !== c))

  const addCity = (c: string) => {
    if (!cities.includes(c)) setCities((prev) => [...prev, c])
  }
  const deleteCity = (c: string) => setCities((prev) => prev.filter((city) => city !== c))

  const addBadge = (b: string) => {
    if (!badges.includes(b)) setBadges((prev) => [...prev, b])
  }
  const deleteBadge = (b: string) => setBadges((prev) => prev.filter((badge) => badge !== b))

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

  const createFlashOffer = (id: string, offer: FlashOffer | undefined) => {
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, flashOffer: offer } : p)))
  }

  return React.createElement(
    PlacesContext.Provider,
    {
      value: {
        places,
        categories,
        cities,
        badges,
        addPlace,
        updatePlace,
        deletePlace,
        addCategory,
        deleteCategory,
        addCity,
        deleteCity,
        addBadge,
        deleteBadge,
        recordAccess,
        recordCouponClick,
        createFlashOffer,
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

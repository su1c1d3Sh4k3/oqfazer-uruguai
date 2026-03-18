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
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined)

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:places')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure any newly added default places (like the new tours) are included
        // if they haven't been saved yet.
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

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === '@uruguai:places' && e.newValue) {
        setPlaces(JSON.parse(e.newValue))
      }
      if (e.key === '@uruguai:categories' && e.newValue) {
        setCategories(JSON.parse(e.newValue))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const addPlace = (p: Place) => setPlaces((prev) => [...prev, p])
  const updatePlace = (id: string, data: Partial<Place>) =>
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  const deletePlace = (id: string) => setPlaces((prev) => prev.filter((p) => p.id !== id))

  const addCategory = (c: string) => {
    if (!categories.includes(c)) setCategories((prev) => [...prev, c])
  }
  const deleteCategory = (c: string) => setCategories((prev) => prev.filter((cat) => cat !== c))

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

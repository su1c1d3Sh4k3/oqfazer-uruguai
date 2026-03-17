import React, { createContext, useContext, useEffect, useState } from 'react'
import { Restaurant, DEFAULT_RESTAURANTS } from '@/data/restaurants'

interface RestaurantsContextType {
  restaurants: Restaurant[]
  addRestaurant: (r: Restaurant) => void
  updateRestaurant: (id: string, r: Partial<Restaurant>) => void
  deleteRestaurant: (id: string) => void
}

const RestaurantsContext = createContext<RestaurantsContextType | undefined>(undefined)

export function RestaurantsProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const saved = localStorage.getItem('@uruguai:restaurants')
      return saved ? JSON.parse(saved) : DEFAULT_RESTAURANTS
    } catch {
      return DEFAULT_RESTAURANTS
    }
  })

  useEffect(() => {
    localStorage.setItem('@uruguai:restaurants', JSON.stringify(restaurants))
  }, [restaurants])

  const addRestaurant = (r: Restaurant) => setRestaurants((prev) => [...prev, r])
  const updateRestaurant = (id: string, data: Partial<Restaurant>) =>
    setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)))
  const deleteRestaurant = (id: string) => setRestaurants((prev) => prev.filter((r) => r.id !== id))

  return React.createElement(
    RestaurantsContext.Provider,
    { value: { restaurants, addRestaurant, updateRestaurant, deleteRestaurant } },
    children,
  )
}

export function useRestaurants() {
  const context = useContext(RestaurantsContext)
  if (context === undefined) {
    throw new Error('useRestaurants must be used within a RestaurantsProvider')
  }
  return context
}

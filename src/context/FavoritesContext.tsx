import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'

interface FavoritesContextType {
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])

  // Fetch favorites when user changes
  useEffect(() => {
    if (!currentUser?.id) {
      setFavorites([])
      return
    }

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('place_id')
        .eq('user_id', currentUser.id)

      if (!error && data) {
        setFavorites(data.map((r: any) => r.place_id))
      }
    }

    fetchFavorites()
  }, [currentUser?.id])

  const toggleFavorite = async (id: string) => {
    if (!currentUser?.id) return

    const isFav = favorites.includes(id)

    if (isFav) {
      // Optimistic remove
      setFavorites((prev) => prev.filter((favId) => favId !== id))
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('place_id', id)
      if (error) {
        setFavorites((prev) => [...prev, id])
        console.error('Error removing favorite:', error)
      }
    } else {
      // Optimistic add
      setFavorites((prev) => [...prev, id])
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: currentUser.id, place_id: id })
      if (error) {
        setFavorites((prev) => prev.filter((favId) => favId !== id))
        console.error('Error adding favorite:', error)
      }
    }
  }

  const isFavorite = (id: string) => favorites.includes(id)

  return React.createElement(
    FavoritesContext.Provider,
    { value: { favorites, toggleFavorite, isFavorite } },
    children,
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

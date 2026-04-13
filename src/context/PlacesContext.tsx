import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Place, FlashOffer } from '@/data/places'
import { supabase, placeToRow, partialPlaceToRow, rowToPlace } from '@/lib/supabase'
import { toast } from 'sonner'

interface PlacesContextType {
  places: Place[]
  categories: string[]
  cities: string[]
  badges: string[]
  loading: boolean
  addPlace: (p: Place) => Promise<void>
  updatePlace: (id: string, p: Partial<Place>) => Promise<void>
  deletePlace: (id: string) => Promise<void>
  addCategory: (c: string) => Promise<void>
  deleteCategory: (c: string) => Promise<void>
  addCity: (c: string) => Promise<void>
  deleteCity: (c: string) => Promise<void>
  addBadge: (b: string) => Promise<void>
  deleteBadge: (b: string) => Promise<void>
  recordAccess: (id: string) => void
  recordCouponClick: (id: string) => void
  recordHighlightClick: (id: string) => void
  createFlashOffer: (id: string, offer: FlashOffer | undefined) => Promise<void>
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined)

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [badges, setBadges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all data on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [placesRes, catsRes, citiesRes, badgesRes] = await Promise.all([
          supabase.from('places').select('*').order('display_order', { ascending: true, nullsFirst: false }),
          supabase.from('categories').select('name'),
          supabase.from('cities').select('name'),
          supabase.from('badges').select('name'),
        ])

        if (placesRes.data) {
          setPlaces(placesRes.data.map((row: any) => rowToPlace(row) as Place))
        }
        if (catsRes.data) {
          setCategories(catsRes.data.map((r: any) => r.name))
        }
        if (citiesRes.data) {
          setCities(citiesRes.data.map((r: any) => r.name))
        }
        if (badgesRes.data) {
          setBadges(badgesRes.data.map((r: any) => r.name))
        }
      } catch (err) {
        console.error('Error fetching places data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  const addPlace = async (p: Place) => {
    const row = placeToRow(p)
    // Optimistic update
    setPlaces((prev) => [...prev, p])

    const { error } = await supabase.from('places').insert(row)
    if (error) {
      // Revert
      setPlaces((prev) => prev.filter((x) => x.id !== p.id))
      toast.error('Erro ao cadastrar local')
      console.error(error)
    }
  }

  const updatePlace = async (id: string, data: Partial<Place>) => {
    // Save backup for rollback
    const backup = places.find((p) => p.id === id)
    // Optimistic update
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))

    // Only convert the keys that were actually provided — prevents overwriting other fields
    const updateData = partialPlaceToRow(data)
    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase.from('places').update(updateData).eq('id', id)
    if (error) {
      // Rollback on error
      if (backup) setPlaces((prev) => prev.map((p) => (p.id === id ? backup : p)))
      console.error('Error updating place:', error)
      toast.error('Erro ao atualizar local')
    }
  }

  const deletePlace = async (id: string) => {
    const backup = places.find((p) => p.id === id)
    setPlaces((prev) => prev.filter((p) => p.id !== id))

    const { error } = await supabase.from('places').delete().eq('id', id)
    if (error) {
      if (backup) setPlaces((prev) => [...prev, backup])
      toast.error('Erro ao excluir local')
      console.error(error)
    }
  }

  const addCategory = async (c: string) => {
    if (categories.includes(c)) return
    setCategories((prev) => [...prev, c])
    const { error } = await supabase.from('categories').insert({ name: c })
    if (error) {
      setCategories((prev) => prev.filter((cat) => cat !== c))
      toast.error('Erro ao adicionar categoria')
    }
  }

  const deleteCategory = async (c: string) => {
    setCategories((prev) => prev.filter((cat) => cat !== c))
    const { error } = await supabase.from('categories').delete().eq('name', c)
    if (error) {
      setCategories((prev) => [...prev, c])
      toast.error('Erro ao remover categoria')
    }
  }

  const addCity = async (c: string) => {
    if (cities.includes(c)) return
    setCities((prev) => [...prev, c])
    const { error } = await supabase.from('cities').insert({ name: c })
    if (error) {
      setCities((prev) => prev.filter((city) => city !== c))
      toast.error('Erro ao adicionar cidade')
    }
  }

  const deleteCity = async (c: string) => {
    setCities((prev) => prev.filter((city) => city !== c))
    const { error } = await supabase.from('cities').delete().eq('name', c)
    if (error) {
      setCities((prev) => [...prev, c])
      toast.error('Erro ao remover cidade')
    }
  }

  const addBadge = async (b: string) => {
    if (badges.includes(b)) return
    setBadges((prev) => [...prev, b])
    const { error } = await supabase.from('badges').insert({ name: b })
    if (error) {
      setBadges((prev) => prev.filter((badge) => badge !== b))
      toast.error('Erro ao adicionar badge')
    }
  }

  const deleteBadge = async (b: string) => {
    setBadges((prev) => prev.filter((badge) => badge !== b))
    const { error } = await supabase.from('badges').delete().eq('name', b)
    if (error) {
      setBadges((prev) => [...prev, b])
      toast.error('Erro ao remover badge')
    }
  }

  const incrementMetric = async (id: string, metric: string) => {
    const { error } = await supabase.rpc('increment_place_metric', {
      p_place_id: id,
      p_metric: metric,
    })
    if (error) {
      console.error(`Error incrementing ${metric} for ${id}:`, error)
    }
  }

  const recordAccess = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, accessCount: (p.accessCount || 0) + 1 } : p)),
    )
    incrementMetric(id, 'access_count')
  }

  const recordCouponClick = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, couponClickCount: (p.couponClickCount || 0) + 1 } : p,
      ),
    )
    incrementMetric(id, 'coupon_click_count')
  }

  const recordHighlightClick = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, highlightClickCount: (p.highlightClickCount || 0) + 1 } : p,
      ),
    )
    incrementMetric(id, 'highlight_click_count')
  }

  const createFlashOffer = async (id: string, offer: FlashOffer | undefined) => {
    const backup = places.find((p) => p.id === id)
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, flashOffer: offer } : p)))
    const { error } = await supabase
      .from('places')
      .update({ flash_offer: offer ?? null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      if (backup) setPlaces((prev) => prev.map((p) => (p.id === id ? backup : p)))
      console.error('Error updating flash offer:', error)
      toast.error('Erro ao atualizar oferta relâmpago')
    }
  }

  return React.createElement(
    PlacesContext.Provider,
    {
      value: {
        places,
        categories,
        cities,
        badges,
        loading,
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
        recordHighlightClick,
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

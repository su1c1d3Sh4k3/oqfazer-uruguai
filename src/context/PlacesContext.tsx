import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Place, FlashOffer } from '@/data/places'
import { supabase, placeToRow, partialPlaceToRow, rowToPlace } from '@/lib/supabase'
import { canRoleViewPlace, isPlaceActive } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export interface City {
  name: string
  lat: number | null
  lng: number | null
  country: string
}

interface PlacesContextType {
  /** Lugares visíveis para quem está navegando (ativos + regra do perfil). */
  places: Place[]
  /** Todos os lugares carregados — para painéis admin/empresa. */
  allPlaces: Place[]
  categories: string[]
  cities: string[]
  cityData: City[]
  countries: string[]
  badges: string[]
  loading: boolean
  addPlace: (p: Place) => Promise<void>
  updatePlace: (id: string, p: Partial<Place>) => Promise<boolean>
  setPlaceActive: (id: string, active: boolean, reactivateAt?: string | null) => Promise<boolean>
  deletePlace: (id: string) => Promise<void>
  addCategory: (c: string) => Promise<void>
  deleteCategory: (c: string) => Promise<void>
  addCity: (c: string) => Promise<void>
  deleteCity: (c: string) => Promise<void>
  updateCityCoordinates: (name: string, lat: number | null, lng: number | null) => Promise<void>
  updateCityCountry: (name: string, country: string) => Promise<void>
  addBadge: (b: string) => Promise<void>
  deleteBadge: (b: string) => Promise<void>
  recordAccess: (id: string) => void
  recordCouponClick: (id: string) => void
  recordHighlightClick: (id: string) => void
  createFlashOffer: (id: string, offer: FlashOffer | undefined) => Promise<void>
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined)

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const [allPlaces, setPlaces] = useState<Place[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [cityData, setCityData] = useState<City[]>([])
  const [badges, setBadges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const places = allPlaces
  const cities = cityData.map((c) => c.name)
  const countries = useMemo(
    () => [...new Set(cityData.map((c) => c.country))].sort(),
    [cityData],
  )

  // Desativação temporária expira sozinha — reavalia a cada minuto
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const role = currentUser?.role
  const visiblePlaces = useMemo(
    () => allPlaces.filter((p) => isPlaceActive(p, now) && canRoleViewPlace(p, role)),
    [allPlaces, now, role],
  )

  // Recarrega ao trocar de usuário: admin e empresa enxergam lugares inativos (RLS)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const fetchPlaces = () =>
          supabase.from('places').select('*').order('display_order', { ascending: true, nullsFirst: false })
        const [firstPlacesRes, catsRes, citiesRes, badgesRes] = await Promise.all([
          fetchPlaces(),
          supabase.from('categories').select('name'),
          supabase.from('cities').select('name, lat, lng, country'),
          supabase.from('badges').select('name'),
        ])
        // Tabela pesada (imagens base64): com cache frio a consulta pode estourar o timeout
        const placesRes = firstPlacesRes.error ? await fetchPlaces() : firstPlacesRes

        if (placesRes.data) {
          setPlaces(placesRes.data.map((row: any) => rowToPlace(row) as Place))
        }
        if (catsRes.data) {
          setCategories(catsRes.data.map((r: any) => r.name))
        }
        if (citiesRes.data) {
          setCityData(
            citiesRes.data.map((r: any) => ({
              name: r.name,
              lat: r.lat,
              lng: r.lng,
              country: r.country || 'Uruguai',
            })),
          )
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
  }, [currentUser?.id, role])

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
      if (error.message?.includes('PLACE_HAS_ACTIVE_CHECKINS')) {
        toast.error('Não é possível desativar', {
          description: 'Este local tem check-ins ativos. Tente novamente quando expirarem.',
        })
      } else {
        toast.error('Erro ao atualizar local')
      }
      return false
    }
    return true
  }

  const countActiveCheckIns = async (placeId: string) => {
    const { count, error } = await supabase
      .from('access_records')
      .select('id', { count: 'exact', head: true })
      .eq('place_id', placeId)
      .gt('expires_at', Date.now())
    if (error) console.error('Error counting active check-ins:', error)
    return count ?? 0
  }

  const setPlaceActive = async (id: string, active: boolean, reactivateAt: string | null = null) => {
    if (!active) {
      const activeCheckIns = await countActiveCheckIns(id)
      if (activeCheckIns > 0) {
        toast.error('Não é possível desativar', {
          description: `Este local tem ${activeCheckIns} check-in(s) ativo(s). Tente novamente quando expirarem.`,
        })
        return false
      }
    }
    return updatePlace(id, { isActive: active, reactivateAt: active ? null : reactivateAt })
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
    setCityData((prev) => [...prev, { name: c, lat: null, lng: null, country: 'Uruguai' }])
    const { error } = await supabase.from('cities').insert({ name: c })
    if (error) {
      setCityData((prev) => prev.filter((city) => city.name !== c))
      toast.error('Erro ao adicionar cidade')
    }
  }

  const deleteCity = async (c: string) => {
    const backup = cityData.find((city) => city.name === c)
    setCityData((prev) => prev.filter((city) => city.name !== c))
    const { error } = await supabase.from('cities').delete().eq('name', c)
    if (error) {
      if (backup) setCityData((prev) => [...prev, backup])
      toast.error('Erro ao remover cidade')
    }
  }

  const updateCityCoordinates = async (name: string, lat: number | null, lng: number | null) => {
    const backup = cityData.find((c) => c.name === name)
    setCityData((prev) => prev.map((c) => (c.name === name ? { ...c, lat, lng } : c)))
    const { error } = await supabase.from('cities').update({ lat, lng }).eq('name', name)
    if (error) {
      if (backup) setCityData((prev) => prev.map((c) => (c.name === name ? backup : c)))
      toast.error('Erro ao atualizar coordenadas')
      console.error(error)
    }
  }

  const updateCityCountry = async (name: string, country: string) => {
    const backup = cityData.find((c) => c.name === name)
    setCityData((prev) => prev.map((c) => (c.name === name ? { ...c, country } : c)))
    const { error } = await supabase.from('cities').update({ country }).eq('name', name)
    if (error) {
      if (backup) setCityData((prev) => prev.map((c) => (c.name === name ? backup : c)))
      toast.error('Erro ao atualizar país')
      console.error(error)
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
        places: visiblePlaces,
        allPlaces,
        categories,
        cities,
        cityData,
        countries,
        badges,
        loading,
        addPlace,
        updatePlace,
        setPlaceActive,
        deletePlace,
        addCategory,
        deleteCategory,
        addCity,
        deleteCity,
        updateCityCoordinates,
        updateCityCountry,
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

import { usePlaces } from '@/context/PlacesContext'
import { PlaceCard } from '@/components/PlaceCard'
import { useState, useMemo } from 'react'
import { Trophy, CheckCircle2 } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  PlaceFilters,
  filterPlaces,
  useCityCountryMap,
  usePlaceFilters,
} from '@/components/PlaceFilters'

export default function TopRestaurants() {
  const { places } = usePlaces()
  const { currentUser } = useAuth()
  const [filter, setFilter] = useState<'all' | '30d'>('all')
  const { filters, setFilters } = usePlaceFilters()
  const cityCountry = useCityCountryMap()

  const restaurants = useMemo(
    () => places.filter((p) => p.type !== 'tour' && p.category !== 'Passeios'),
    [places],
  )

  const allRankedPlaces = useMemo(() => {
    return filterPlaces(restaurants, filters, cityCountry)
      .map((p) => {
        const baseCheckins = p.checkInCount || 0
        return {
          ...p,
          displayCheckins: filter === 'all' ? baseCheckins : Math.floor(baseCheckins * 0.35),
        }
      })
      .sort((a, b) => b.displayCheckins - a.displayCheckins)
  }, [restaurants, filters, cityCountry, filter])

  const topPlaces = useMemo(() => allRankedPlaces.slice(0, 20), [allRankedPlaces])

  const isCompany = currentUser?.role === 'establishment'
  const managedPlaceId = currentUser?.managedPlaceId

  const companyRankIndex = useMemo(() => {
    if (!isCompany || !managedPlaceId) return -1
    return allRankedPlaces.findIndex((p) => p.id === managedPlaceId)
  }, [isCompany, managedPlaceId, allRankedPlaces])

  const companyPlace = companyRankIndex !== -1 ? allRankedPlaces[companyRankIndex] : null
  const showCompanyAtBottom = isCompany && companyRankIndex >= 20 && companyPlace

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-6 md:px-8 md:pt-8 w-full max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-brand-yellow/20 p-2 rounded-xl text-brand-yellow">
              <Trophy className="h-8 w-8 drop-shadow-sm" />
            </div>
            <h1 className="font-display text-2xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Top Restaurantes
            </h1>
          </div>
          <p className="text-slate-500 font-medium md:text-lg">
            Os locais mais frequentados pela nossa comunidade.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto flex">
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(v) => v && setFilter(v as 'all' | '30d')}
              className="justify-start md:justify-center w-full"
            >
              <ToggleGroupItem
                value="all"
                className="rounded-lg font-bold data-[state=on]:bg-secondary data-[state=on]:text-white flex-1 md:flex-none px-4"
              >
                Geral
              </ToggleGroupItem>
              <ToggleGroupItem
                value="30d"
                className="rounded-lg font-bold data-[state=on]:bg-secondary data-[state=on]:text-white flex-1 md:flex-none px-4"
              >
                Últimos 30 Dias
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <PlaceFilters places={restaurants} value={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
        {topPlaces.map((place, index) => {
          const isMyPlace = isCompany && place.id === managedPlaceId

          return (
            <div
              key={place.id}
              className={cn('animate-fade-in-up relative pt-4 pl-4', isMyPlace && 'z-20')}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  'absolute top-0 left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full font-black shadow-lg border-2 border-white text-lg',
                  index === 0
                    ? 'bg-brand-yellow text-slate-900'
                    : index === 1
                      ? 'bg-slate-300 text-slate-800'
                      : index === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-white',
                  isMyPlace && 'ring-4 ring-brand-yellow/50',
                )}
              >
                {index + 1}
              </div>
              <div
                className={cn(
                  'h-full rounded-2xl transition-all',
                  isMyPlace && 'ring-4 ring-brand-yellow ring-offset-2',
                )}
              >
                <PlaceCard place={place} />
              </div>
              <div className="absolute top-7 right-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border border-slate-100 flex items-center gap-1.5 font-bold text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-secondary" /> {place.displayCheckins}
              </div>
            </div>
          )
        })}
      </div>

      {topPlaces.length === 0 && (
        <div className="py-20 text-center text-slate-500 font-medium">
          Nenhum estabelecimento encontrado com os filtros atuais.
        </div>
      )}

      {showCompanyAtBottom && companyPlace && (
        <div className="mt-8 pt-8 border-t border-slate-200 animate-fade-in-up">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="font-display text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="h-6 w-6 text-brand-yellow" /> Sua Posição no Ranking
            </h2>
            <p className="text-slate-500 font-medium">
              Continue incentivando check-ins para subir no ranking!
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="relative pt-4 pl-4 z-20">
              <div className="absolute top-0 left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full font-black shadow-lg border-2 border-white text-base bg-slate-800 text-white ring-4 ring-brand-yellow/50">
                #{companyRankIndex + 1}
              </div>
              <div className="h-full rounded-2xl ring-4 ring-brand-yellow ring-offset-2">
                <PlaceCard place={companyPlace} />
              </div>
              <div className="absolute top-7 right-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border border-slate-100 flex items-center gap-1.5 font-bold text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-secondary" /> {companyPlace.displayCheckins}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

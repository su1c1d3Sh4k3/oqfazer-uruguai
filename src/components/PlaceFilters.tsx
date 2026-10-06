import { useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Place } from '@/data/places'
import { usePlaces } from '@/context/PlacesContext'
import { cn, getCurrentDiscount, isPlaceOpen, PRICE_LEVELS } from '@/lib/utils'

export type SortKey = 'recommended' | 'recent' | 'alpha' | 'distance'

export interface PlaceFilterState {
  search: string
  city: string
  country: string
  category: string
  type: string
  price: string
  openNow: boolean
  discountNow: boolean
  sort: SortKey
}

const ALL = 'Todas'

export const DEFAULT_FILTERS: PlaceFilterState = {
  search: '',
  city: ALL,
  country: ALL,
  category: ALL,
  type: ALL,
  price: ALL,
  openNow: false,
  discountNow: false,
  sort: 'recommended',
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recomendados' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'alpha', label: 'Ordem alfabética' },
  { value: 'distance', label: 'Mais próximos' },
]

const TYPE_OPTIONS = [
  { value: ALL, label: 'Todos' },
  { value: 'restaurant', label: 'Locais' },
  { value: 'tour', label: 'Passeios' },
]

export function usePlaceFilters() {
  const [filters, setFilters] = useState<PlaceFilterState>(DEFAULT_FILTERS)
  return { filters, setFilters }
}

/** Aplica os filtros (não ordena). */
export function filterPlaces(
  places: Place[],
  f: PlaceFilterState,
  cityCountry: Map<string, string>,
  now = Date.now(),
) {
  const query = f.search.trim().toLowerCase()
  return places.filter((p) => {
    if (query.length >= 3 && !p.name.toLowerCase().includes(query)) return false
    if (f.city !== ALL && p.city !== f.city) return false
    if (f.country !== ALL && (cityCountry.get(p.city) ?? 'Uruguai') !== f.country) return false
    if (f.category !== ALL && p.category !== f.category) return false
    if (f.type === 'tour' && p.type !== 'tour') return false
    if (f.type === 'restaurant' && p.type === 'tour') return false
    if (f.price !== ALL && String(p.priceLevel ?? '') !== f.price) return false
    if (f.openNow && (p.type === 'tour' || !isPlaceOpen(p.operatingHours, now))) return false
    if (f.discountNow && !getCurrentDiscount(p, now)) return false
    return true
  })
}

/** Ordenação escolhida pelo usuário; 'recommended' devolve null (cada tela usa a sua). */
export function sortPlaces(
  places: Place[],
  sort: SortKey,
  calculateDistance: (lat: number, lng: number) => number | null,
): Place[] | null {
  switch (sort) {
    case 'recent':
      return [...places].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    case 'alpha':
      return [...places].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    case 'distance': {
      const dist = (p: Place) => calculateDistance(p.coordinates.lat, p.coordinates.lng) ?? Infinity
      return [...places].sort((a, b) => dist(a) - dist(b))
    }
    default:
      return null
  }
}

export function useCityCountryMap() {
  const { cityData } = usePlaces()
  return useMemo(() => new Map(cityData.map((c) => [c.name, c.country])), [cityData])
}

interface Props {
  /** Lugares-base da tela — as opções dos filtros vêm deles. */
  places: Place[]
  value: PlaceFilterState
  onChange: (value: PlaceFilterState) => void
  showType?: boolean
  showSort?: boolean
  showOpenNow?: boolean
  className?: string
}

export function PlaceFilters({
  places,
  value,
  onChange,
  showType = false,
  showSort = false,
  showOpenNow = true,
  className,
}: Props) {
  const cityCountry = useCityCountryMap()

  const options = useMemo(() => {
    const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return {
      categories: uniq(places.map((p) => p.category)),
      cities: uniq(
        places
          .filter((p) => value.country === ALL || (cityCountry.get(p.city) ?? 'Uruguai') === value.country)
          .map((p) => p.city),
      ),
      countries: uniq(places.map((p) => cityCountry.get(p.city) ?? 'Uruguai')),
      hasPrices: places.some((p) => p.priceLevel),
      types: new Set(places.map((p) => (p.type === 'tour' ? 'tour' : 'restaurant'))),
    }
  }, [places, cityCountry, value.country])

  const set = <K extends keyof PlaceFilterState>(key: K, v: PlaceFilterState[K]) =>
    // Trocar de país invalida a cidade escolhida
    onChange({ ...value, [key]: v, ...(key === 'country' ? { city: ALL } : {}) })

  const isDirty = (Object.keys(DEFAULT_FILTERS) as (keyof PlaceFilterState)[]).some(
    (k) => k !== 'search' && value[k] !== DEFAULT_FILTERS[k],
  )

  const chip = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors shadow-sm',
      active
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    )

  const dropdown = (
    key: keyof PlaceFilterState,
    placeholder: string,
    items: { value: string; label: string }[],
    defaultValue: string = ALL,
  ) => {
    const current = String(value[key])
    const active = current !== defaultValue
    const currentLabel = items.find((i) => i.value === current)?.label
    return (
      <DropdownMenu key={key}>
        <DropdownMenuTrigger asChild>
          <button className={chip(active)}>
            {active ? currentLabel : placeholder}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        {/* no-drag: o mapa ignora arrastes iniciados nos menus */}
        <DropdownMenuContent align="start" className="no-drag w-[220px] max-h-[300px] overflow-y-auto">
          <DropdownMenuRadioGroup value={current} onValueChange={(v) => set(key, v as never)}>
            {items.map((item) => (
              <DropdownMenuRadioItem key={item.value} value={item.value}>
                {item.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={cn('hide-scrollbar flex overflow-x-auto py-1', className)}>
      <div className="flex items-center gap-2">
        {showSort &&
          dropdown('sort', 'Ordenar', SORT_OPTIONS, 'recommended')}

        {showOpenNow && (
          <button onClick={() => set('openNow', !value.openNow)} className={chip(value.openNow)}>
            Aberto Agora
          </button>
        )}

        <button onClick={() => set('discountNow', !value.discountNow)} className={chip(value.discountNow)}>
          Com Desconto Agora
        </button>

        {dropdown('category', 'Categorias', [
          { value: ALL, label: 'Todas' },
          ...options.categories.map((c) => ({ value: c, label: c })),
        ])}

        {options.countries.length > 1 &&
          dropdown('country', 'País', [
            { value: ALL, label: 'Todos' },
            ...options.countries.map((c) => ({ value: c, label: c })),
          ])}

        {dropdown('city', 'Cidades', [
          { value: ALL, label: 'Todas' },
          ...options.cities.map((c) => ({ value: c, label: c })),
        ])}

        {showType && options.types.size > 1 && dropdown('type', 'Tipo', TYPE_OPTIONS)}

        {options.hasPrices &&
          dropdown('price', 'Preço', [
            { value: ALL, label: 'Todos' },
            ...PRICE_LEVELS.map((p) => ({ value: String(p.value), label: `${p.label} · ${p.description}` })),
          ])}

        {isDirty && (
          <button
            onClick={() => onChange({ ...DEFAULT_FILTERS, search: value.search })}
            className="flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-500"
          >
            <X className="h-4 w-4" /> Limpar
          </button>
        )}
      </div>
    </div>
  )
}

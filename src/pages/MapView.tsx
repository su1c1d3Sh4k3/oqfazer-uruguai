import { MapPin, Filter, Navigation } from 'lucide-react'
import { useState, useMemo } from 'react'
import { usePlaces } from '@/context/PlacesContext'
import { useGeo } from '@/context/GeoContext'
import { Link } from 'react-router-dom'
import { isPlaceOpen, cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function MapView() {
  const { places, categories } = usePlaces()
  const { location } = useGeo()
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)

  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [openNow, setOpenNow] = useState(false)

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (categoryFilter !== 'Todas' && p.category !== categoryFilter) return false
      if (openNow && !isPlaceOpen(p.operatingHours)) return false
      return true
    })
  }, [places, categoryFilter, openNow])

  // Map centered specifically around Pocitos, Montevideo (-34.910, -56.151)
  const POCITOS_LAT = -34.91
  const POCITOS_LNG = -56.151

  // Expanded bounding box to ensure other cities are visible if zoomed out,
  // but heavily weighting towards Montevideo/Pocitos for the main view.
  const boundsMargin = 0.06 // Approx 6km radius for detailed view
  const minLat = POCITOS_LAT - boundsMargin
  const maxLat = POCITOS_LAT + boundsMargin
  const minLng = POCITOS_LNG - boundsMargin
  const maxLng = POCITOS_LNG + boundsMargin

  const latRange = maxLat - minLat
  const lngRange = maxLng - minLng

  const getTop = (lat: number) => {
    const p = ((maxLat - lat) / latRange) * 100
    // Allow pins to render outside the strict 0-100% viewport safely
    return `${p}%`
  }

  const getLeft = (lng: number) => {
    const p = ((lng - minLng) / lngRange) * 100
    return `${p}%`
  }

  return (
    <div
      className="animate-fade-in relative h-full w-full overflow-hidden bg-[#eef0f2]"
      onClick={() => setSelectedPlace(null)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      ></div>

      <div className="absolute left-1/2 top-4 z-50 flex w-[90%] max-w-md -translate-x-1/2 flex-col gap-3 rounded-2xl border border-white/50 bg-white/90 p-3 shadow-xl backdrop-blur-md sm:flex-row">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-white">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Categoria" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as Categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex h-10 items-center justify-between gap-3 rounded-xl border bg-white px-4 py-2 sm:w-auto sm:justify-start">
          <Label
            htmlFor="map-open-now"
            className="cursor-pointer whitespace-nowrap text-sm font-bold text-slate-700"
          >
            Aberto Agora
          </Label>
          <Switch id="map-open-now" checked={openNow} onCheckedChange={setOpenNow} />
        </div>
      </div>

      <div className="absolute inset-0">
        {filteredPlaces.map((place) => {
          const isOpen = isPlaceOpen(place.operatingHours)
          const isFeatured = place.featured

          const markerColor = isFeatured
            ? 'bg-[#FFD700] border-[#E6C200] text-black'
            : isOpen
              ? 'bg-[#2E8B57] border-[#1F633D] text-white'
              : 'bg-[#003399] border-[#002266] text-white'
          const iconColor = isFeatured ? 'fill-black/20' : 'fill-white/20'

          return (
            <div
              key={place.id}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ top: getTop(place.coordinates.lat), left: getLeft(place.coordinates.lng) }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPlace(place.id)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300',
                  selectedPlace === place.id
                    ? 'z-30 scale-125 ring-4 ring-primary/30'
                    : 'hover:scale-110',
                  markerColor,
                )}
              >
                <MapPin className={cn('h-5 w-5', iconColor)} />
              </button>

              {selectedPlace === place.id && (
                <div className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-1/2 z-40 mb-3 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl">
                  <div className="p-3 text-center">
                    <h3 className="mb-1 truncate font-bold leading-tight text-slate-900">
                      {place.name}
                    </h3>
                    <div className="mb-3 flex items-center justify-center gap-2">
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {place.category}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {isOpen ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                    <Link
                      to={`/place/${place.id}`}
                      className="flex w-full items-center justify-center rounded-lg bg-secondary py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                  <div className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-[6px] border-transparent border-t-white"></div>
                </div>
              )}
            </div>
          )
        })}

        {location && (
          <div
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ top: getTop(location.lat), left: getLeft(location.lng) }}
          >
            <div className="relative flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center">
                <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-md">
                  <Navigation className="h-3 w-3 rotate-45 fill-white text-white" />
                </span>
              </div>
              <div className="absolute top-full mt-1 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                Sua localização
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

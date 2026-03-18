import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { usePlaces } from '@/context/PlacesContext'
import { useGeo } from '@/context/GeoContext'
import { Link } from 'react-router-dom'
import { isPlaceOpen, cn } from '@/lib/utils'

export default function MapView() {
  const { places } = usePlaces()
  const { location } = useGeo()
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)

  const lats = places.map((p) => p.coordinates.lat)
  const lngs = places.map((p) => p.coordinates.lng)

  const minLat = places.length ? Math.min(...lats) - 0.1 : -35.1
  const maxLat = places.length ? Math.max(...lats) + 0.1 : -34.0
  const minLng = places.length ? Math.min(...lngs) - 0.1 : -58.5
  const maxLng = places.length ? Math.max(...lngs) + 0.1 : -54.0

  const getTop = (lat: number) => {
    const p = ((maxLat - lat) / (maxLat - minLat)) * 100
    return `${Math.max(5, Math.min(95, p))}%`
  }

  const getLeft = (lng: number) => {
    const p = ((lng - minLng) / (maxLng - minLng)) * 100
    return `${Math.max(5, Math.min(95, p))}%`
  }

  return (
    <div
      className="animate-fade-in relative h-full w-full overflow-hidden bg-[#e5e3df]"
      onClick={() => setSelectedPlace(null)}
    >
      <img
        src="https://img.usecurling.com/p/1200/800?q=map&color=gray"
        alt="Map background"
        className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-multiply"
      />

      {places.map((place) => {
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
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ top: getTop(place.coordinates.lat), left: getLeft(place.coordinates.lng) }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPlace(place.id)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-transform',
                selectedPlace === place.id
                  ? 'scale-125 z-30 ring-4 ring-primary/30'
                  : 'hover:scale-110',
                markerColor,
              )}
            >
              <MapPin className={cn('h-5 w-5', iconColor)} />
            </button>

            {selectedPlace === place.id && (
              <div className="absolute bottom-full left-1/2 mb-3 w-48 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 z-40 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl">
                <div className="p-3 text-center">
                  <h3 className="mb-1 font-bold leading-tight text-slate-900">{place.name}</h3>
                  <span className="mb-3 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {place.category}
                  </span>
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
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ top: getTop(location.lat), left: getLeft(location.lng) }}
        >
          <div className="relative flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center">
              <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-5 w-5 rounded-full border-2 border-white bg-blue-500 shadow-md"></span>
            </div>
            <div className="absolute top-full mt-1 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white shadow-md">
              Sua localização
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

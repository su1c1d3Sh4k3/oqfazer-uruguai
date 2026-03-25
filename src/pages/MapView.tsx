import { MapPin, Filter, Navigation, Plus, Minus } from 'lucide-react'
import { useState, useMemo, useRef } from 'react'
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

  const [centerLat, setCenterLat] = useState(-34.91)
  const [centerLng, setCenterLng] = useState(-56.151)
  const [zoom, setZoom] = useState(1)

  const activePointers = useRef(new Map<number, { x: number; y: number }>())
  const mapRef = useRef<HTMLDivElement>(null)

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (categoryFilter !== 'Todas' && p.category !== categoryFilter) return false
      if (openNow && !isPlaceOpen(p.operatingHours)) return false
      return true
    })
  }, [places, categoryFilter, openNow])

  const boundsMargin = 0.06 / zoom
  const minLat = centerLat - boundsMargin
  const maxLat = centerLat + boundsMargin
  const minLng = centerLng - boundsMargin
  const maxLng = centerLng + boundsMargin

  const latRange = maxLat - minLat
  const lngRange = maxLng - minLng

  const getTop = (lat: number) => {
    const p = ((maxLat - lat) / latRange) * 100
    return `${p}%`
  }

  const getLeft = (lng: number) => {
    const p = ((lng - minLng) / lngRange) * 100
    return `${p}%`
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('.no-drag')) return
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return

    const oldPos = activePointers.current.get(e.pointerId)!
    const oldPointers = Array.from(activePointers.current.values())

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const newPointers = Array.from(activePointers.current.values())

    if (activePointers.current.size === 1) {
      const dx = e.clientX - oldPos.x
      const dy = e.clientY - oldPos.y
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect()
        const dLng = -(dx / rect.width) * lngRange
        const dLat = (dy / rect.height) * latRange
        setCenterLng((prev) => prev + dLng)
        setCenterLat((prev) => prev + dLat)
      }
    } else if (activePointers.current.size === 2) {
      const prevDist = Math.hypot(
        oldPointers[0].x - oldPointers[1].x,
        oldPointers[0].y - oldPointers[1].y,
      )
      const newDist = Math.hypot(
        newPointers[0].x - newPointers[1].x,
        newPointers[0].y - newPointers[1].y,
      )
      if (prevDist > 0) {
        const scale = newDist / prevDist
        setZoom((prev) => Math.max(0.2, Math.min(prev * scale, 20)))
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as Element).closest('.no-drag')) return
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.2, Math.min(prev * zoomFactor, 20)))
  }

  return (
    <div
      ref={mapRef}
      className="animate-fade-in relative flex-1 w-full min-h-[calc(100vh-140px)] overflow-hidden bg-[#eef0f2] touch-none cursor-grab active:cursor-grabbing"
      onClick={() => setSelectedPlace(null)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
          backgroundSize: `${30 * Math.max(0.5, zoom)}px ${30 * Math.max(0.5, zoom)}px`,
          backgroundPosition: `${centerLng * 10000 * zoom}px ${-centerLat * 10000 * zoom}px`,
        }}
      ></div>

      <div className="no-drag absolute left-1/2 top-4 z-50 flex w-[90%] max-w-md -translate-x-1/2 flex-col gap-3 rounded-2xl border border-white/50 bg-white/90 p-3 shadow-xl backdrop-blur-md sm:flex-row cursor-auto">
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

      <div className="no-drag absolute right-4 bottom-24 z-50 flex flex-col gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.5, 20))}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.2, z / 1.5))}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Minus className="h-5 w-5" />
        </button>
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
                  'no-drag flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300',
                  selectedPlace === place.id
                    ? 'z-30 scale-125 ring-4 ring-primary/30'
                    : 'hover:scale-110',
                  markerColor,
                )}
              >
                <MapPin className={cn('h-5 w-5', iconColor)} />
              </button>

              {selectedPlace !== place.id && (
                <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-sm border border-slate-200 pointer-events-none transition-opacity">
                  {place.name}
                </div>
              )}

              {selectedPlace === place.id && (
                <div className="no-drag animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-1/2 z-40 mb-3 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl cursor-auto">
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

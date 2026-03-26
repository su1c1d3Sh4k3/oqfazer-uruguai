import { MapPin, Filter, Navigation, Plus, Minus } from 'lucide-react'
import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { usePlaces } from '@/context/PlacesContext'
import { useGeo } from '@/context/GeoContext'
import { useAccess } from '@/context/AccessContext'
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

const TILE_SIZE = 256

function latLngToPx(lat: number, lng: number, z: number) {
  const latRad = (lat * Math.PI) / 180
  const n = Math.pow(2, z)
  const x = ((lng + 180) / 360) * n * TILE_SIZE
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE_SIZE
  return { x, y }
}

function pxToLatLng(x: number, y: number, z: number) {
  const n = Math.pow(2, z)
  const lng = (x / (TILE_SIZE * n)) * 360 - 180
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / (TILE_SIZE * n))))
  const lat = (latRad * 180) / Math.PI
  return { lat, lng }
}

export default function MapView() {
  const { places, categories, cities } = usePlaces()
  const { location } = useGeo()
  const { getPlaceStatus } = useAccess()
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)

  const [cityFilter, setCityFilter] = useState('Todas')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [openNow, setOpenNow] = useState(false)

  const [centerLat, setCenterLat] = useState(-34.91)
  const [centerLng, setCenterLng] = useState(-56.151)
  const [zoom, setZoom] = useState(14.5)

  const activePointers = useRef(new Map<number, { x: number; y: number }>())
  const isDragging = useRef(false)
  const mapOffset = useRef({ x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(null)

  useEffect(() => {
    if (cityFilter === 'Punta del Este') {
      setCenterLat(-34.966)
      setCenterLng(-54.945)
      setZoom(15)
    } else if (cityFilter === 'Colonia del Sacramento') {
      setCenterLat(-34.472)
      setCenterLng(-57.852)
      setZoom(15.5)
    } else if (cityFilter === 'Montevideo') {
      setCenterLat(-34.915)
      setCenterLng(-56.149)
      setZoom(14.5)
    }
  }, [cityFilter])

  useLayoutEffect(() => {
    mapOffset.current = { x: 0, y: 0 }
    if (mapRef.current) mapRef.current.style.transform = `translate(0px, 0px)`
    if (popupRef.current) popupRef.current.style.transform = `translate(0px, 0px)`
  }, [centerLat, centerLng, zoom])

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (p.type === 'tour' || p.category.toLowerCase() === 'passeios') return false
      if (cityFilter !== 'Todas' && p.city !== cityFilter) return false
      if (categoryFilter !== 'Todas' && p.category !== categoryFilter) return false
      if (openNow && !isPlaceOpen(p.operatingHours)) return false
      return true
    })
  }, [places, cityFilter, categoryFilter, openNow])

  const selectedPlaceData = useMemo(() => {
    return selectedPlace ? places.find((p) => p.id === selectedPlace) : null
  }, [selectedPlace, places])

  const mapZoom = Math.floor(zoom)
  const scale = Math.pow(2, zoom - mapZoom)

  const centerPx = latLngToPx(centerLat, centerLng, mapZoom)

  const [dims, setDims] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 600,
  })

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const screenLeftPx = centerPx.x - dims.w / 2 / scale
  const screenTopPx = centerPx.y - dims.h / 2 / scale

  const startCol = Math.floor(screenLeftPx / TILE_SIZE)
  const startRow = Math.floor(screenTopPx / TILE_SIZE)
  const endCol = Math.floor((screenLeftPx + dims.w / scale) / TILE_SIZE)
  const endRow = Math.floor((screenTopPx + dims.h / scale) / TILE_SIZE)

  const tiles = []
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      tiles.push({
        url: `https://mt0.google.com/vt/lyrs=m&hl=pt-BR&x=${col}&y=${row}&z=${mapZoom}`,
        left: col * TILE_SIZE - screenLeftPx,
        top: row * TILE_SIZE - screenTopPx,
        key: `${mapZoom}-${col}-${row}`,
      })
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('.no-drag')) return
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = false
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

      mapOffset.current.x += dx
      mapOffset.current.y += dy

      if (Math.hypot(mapOffset.current.x, mapOffset.current.y) > 3) {
        isDragging.current = true
      }

      if (mapRef.current) {
        mapRef.current.style.transform = `translate(${mapOffset.current.x}px, ${mapOffset.current.y}px)`
      }
      if (popupRef.current) {
        popupRef.current.style.transform = `translate(${mapOffset.current.x}px, ${mapOffset.current.y}px)`
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
      if (prevDist > 0 && newDist > 0) {
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        frameRef.current = requestAnimationFrame(() => {
          setZoom((prev) => Math.max(2, Math.min(prev + Math.log2(newDist / prevDist), 19)))
        })
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId)
    e.currentTarget.releasePointerCapture(e.pointerId)

    if (activePointers.current.size === 0) {
      if (mapOffset.current.x !== 0 || mapOffset.current.y !== 0) {
        const newCenterX = centerPx.x - mapOffset.current.x / scale
        const newCenterY = centerPx.y - mapOffset.current.y / scale
        const newCenter = pxToLatLng(newCenterX, newCenterY, mapZoom)

        setCenterLng(newCenter.lng)
        setCenterLat(newCenter.lat)
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as Element).closest('.no-drag')) return
    setZoom((prev) => Math.max(2, Math.min(prev + (e.deltaY > 0 ? -0.5 : 0.5), 19)))
  }

  return (
    <div
      className="animate-fade-in relative flex-1 w-full min-h-[calc(100vh-140px)] overflow-hidden bg-[#eef0f2] touch-none cursor-grab active:cursor-grabbing"
      onClick={() => {
        if (!isDragging.current) setSelectedPlace(null)
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <div className="absolute inset-0 z-10 w-full h-full will-change-transform" ref={mapRef}>
        <div
          className="absolute inset-0 origin-top-left will-change-transform"
          style={{ transform: `scale(${scale})` }}
        >
          {tiles.map((t) => (
            <img
              key={t.key}
              src={t.url}
              className="absolute pointer-events-none select-none"
              style={{ left: t.left, top: t.top, width: TILE_SIZE, height: TILE_SIZE }}
              alt=""
              loading="lazy"
              draggable={false}
            />
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {filteredPlaces.map((place) => {
            const markerPx = latLngToPx(place.coordinates.lat, place.coordinates.lng, mapZoom)
            const left = (markerPx.x - screenLeftPx) * scale
            const top = (markerPx.y - screenTopPx) * scale

            if (left < -50 || left > dims.w + 50 || top < -50 || top > dims.h + 50) return null

            const status = getPlaceStatus(place.id)
            let markerBg = 'bg-blue-600'
            let markerBorder = 'border-white'
            let iconColor = 'text-white fill-blue-500'

            if (status === 'active') {
              markerBg = 'bg-[#FFD700]'
              markerBorder = 'border-white'
              iconColor = 'text-black fill-yellow-400'
            } else if (status === 'expired') {
              markerBg = 'bg-slate-400'
              markerBorder = 'border-white'
              iconColor = 'text-white fill-slate-300'
            }

            return (
              <div
                key={place.id}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all',
                  selectedPlace === place.id ? 'z-30' : 'z-20',
                )}
                style={{ top, left }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    if (!isDragging.current) setSelectedPlace(place.id)
                  }}
                  className={cn(
                    'no-drag flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-md transition-transform duration-200',
                    selectedPlace === place.id
                      ? 'scale-125 ring-4 ring-primary/20'
                      : 'hover:scale-110',
                    markerBg,
                    markerBorder,
                  )}
                >
                  <MapPin className={cn('h-5 w-5', iconColor)} />
                </button>

                {selectedPlace !== place.id && (
                  <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-sm border border-slate-200 pointer-events-none transition-opacity">
                    {place.name}
                  </div>
                )}
              </div>
            )
          })}

          {location && (
            <div
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500"
              style={{
                left: (latLngToPx(location.lat, location.lng, mapZoom).x - screenLeftPx) * scale,
                top: (latLngToPx(location.lat, location.lng, mapZoom).y - screenTopPx) * scale,
              }}
            >
              <div className="relative flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center">
                  <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-md">
                    <Navigation className="h-3 w-3 rotate-45 fill-white text-white" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interface overlay: Filters */}
      <div className="no-drag absolute left-1/2 top-4 z-40 flex w-[94%] max-w-[500px] -translate-x-1/2 flex-row gap-1.5 rounded-2xl border border-white/50 bg-white/95 p-1.5 shadow-lg backdrop-blur-md items-center cursor-auto">
        <div className="flex-1 min-w-0">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="h-9 w-full min-w-0 bg-white px-2.5 text-xs rounded-xl border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-semibold text-slate-700">
                  <SelectValue placeholder="Cidades" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Cidades</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-0">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-full min-w-0 bg-white px-2.5 text-xs rounded-xl border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-semibold text-slate-700">
                  <SelectValue placeholder="Categoria" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Categorias</SelectItem>
              {categories
                .filter((c) => c.toLowerCase() !== 'passeios')
                .map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white px-2.5 border border-slate-200 shadow-sm">
          <Label
            htmlFor="map-open-now"
            className="cursor-pointer whitespace-nowrap text-[11px] font-bold text-slate-700"
          >
            Aberto
          </Label>
          <Switch
            id="map-open-now"
            className="scale-75 origin-right"
            checked={openNow}
            onCheckedChange={setOpenNow}
          />
        </div>
      </div>

      {/* Interface overlay: Zoom Controls */}
      <div className="no-drag absolute right-4 bottom-24 z-40 flex flex-col gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(z + 1, 19))}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(2, z - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Minus className="h-5 w-5" />
        </button>
      </div>

      {/* Popups rendered over everything else (Z-50) */}
      <div ref={popupRef} className="absolute inset-0 pointer-events-none z-50 overflow-visible">
        {selectedPlaceData &&
          (() => {
            const markerPx = latLngToPx(
              selectedPlaceData.coordinates.lat,
              selectedPlaceData.coordinates.lng,
              mapZoom,
            )
            const left = (markerPx.x - screenLeftPx) * scale
            const top = (markerPx.y - screenTopPx) * scale

            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                style={{ top, left }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="no-drag animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-1/2 mb-6 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] cursor-auto">
                  <div className="p-4 text-center">
                    <h3 className="mb-1 truncate font-display text-lg font-bold leading-tight text-slate-900">
                      {selectedPlaceData.name}
                    </h3>
                    <div className="mb-4 flex items-center justify-center gap-2">
                      <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {selectedPlaceData.category}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {isPlaceOpen(selectedPlaceData.operatingHours) ? 'Aberto agora' : 'Fechado'}
                      </span>
                    </div>
                    <Link
                      to={`/place/${selectedPlaceData.id}`}
                      className="flex w-full items-center justify-center rounded-xl bg-secondary py-2.5 text-sm font-bold text-secondary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                  <div className="absolute left-1/2 top-full -mt-[1px] -translate-x-1/2 border-[8px] border-transparent border-t-white"></div>
                </div>
              </div>
            )
          })()}
      </div>
    </div>
  )
}

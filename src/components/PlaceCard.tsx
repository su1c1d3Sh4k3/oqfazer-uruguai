import { Heart, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Place } from '@/data/places'
import { useFavorites } from '@/context/FavoritesContext'
import { useGeo } from '@/context/GeoContext'
import { useAuth } from '@/context/AuthContext'
import { cn, isPlaceOpen } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface PlaceCardProps {
  place: Place
  activeCheckIn?: boolean
}

export function PlaceCard({ place, activeCheckIn }: PlaceCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { calculateDistance } = useGeo()
  const { currentUser } = useAuth()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const favorite = isFavorite(place.id)
  const dist = calculateDistance(place.coordinates.lat, place.coordinates.lng)
  const displayDistance = dist ? `${dist.toFixed(1)} km` : 'Calculando...'
  const isTour = place.type === 'tour'
  const isOpen = !isTour && isPlaceOpen(place.operatingHours)
  const isCompany = currentUser?.role === 'establishment'

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(place.id)
  }

  return (
    <Link to={`/place/${place.id}`} className="group block h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100">
          <img
            src={place.coverImage}
            alt={place.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 items-start">
            {activeCheckIn && (
              <Badge className="border-none bg-green-500 font-bold text-white shadow-md hover:bg-green-600">
                Check-in Ativo
              </Badge>
            )}
            <Badge className="border-none bg-brand-yellow font-bold text-brand-yellow-foreground shadow-md hover:bg-brand-yellow/90">
              {place.discountBadge}
            </Badge>
            {!isTour && (
              <Badge
                className={cn(
                  'border-none font-bold shadow-md',
                  isOpen
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                    : 'bg-slate-600 text-white hover:bg-slate-700',
                )}
              >
                {isOpen ? 'Aberto Agora' : 'Fechado'}
              </Badge>
            )}
          </div>
          {!isCompany && (
            <button
              onClick={handleFavoriteClick}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white active:scale-95"
            >
              <Heart
                className={cn('h-5 w-5 transition-colors', {
                  'animate-heart-pop fill-primary text-primary': favorite,
                })}
              />
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h3 className="line-clamp-1 font-display text-lg font-bold leading-tight text-slate-900">
                {place.name}
              </h3>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                {place.category}
              </p>
            </div>
          </div>
          <div className="mt-auto flex items-center pt-3 text-sm text-slate-500">
            <MapPin className="mr-1 h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">
              {isTour ? place.city : `${displayDistance} • ${place.city}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

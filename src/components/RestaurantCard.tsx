import { Heart, Star, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Restaurant } from '@/data/restaurants'
import { useFavorites } from '@/context/FavoritesContext'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface RestaurantCardProps {
  restaurant: Restaurant
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(restaurant.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(restaurant.id)
  }

  return (
    <Link to={`/restaurant/${restaurant.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-3 top-3">
            <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md">
              {restaurant.discountBadge}
            </Badge>
          </div>
          <button
            onClick={handleFavoriteClick}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 backdrop-blur-sm transition-all hover:bg-white active:scale-95"
          >
            <Heart
              className={cn('h-5 w-5 transition-colors', {
                'fill-primary text-primary animate-heart-pop': favorite,
              })}
            />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold leading-tight text-slate-900 line-clamp-1">
                {restaurant.name}
              </h3>
              <p className="text-sm text-slate-500">{restaurant.category}</p>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-sm font-medium text-orange-700">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{restaurant.rating}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm text-slate-500">
            <MapPin className="mr-1 h-4 w-4 shrink-0" />
            <span className="truncate">
              {restaurant.distance} • {restaurant.address.split(' - ')[1]}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

import { useFavorites } from '@/context/FavoritesContext'
import { RESTAURANTS } from '@/data/restaurants'
import { RestaurantCard } from '@/components/RestaurantCard'
import { HeartCrack, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function Favorites() {
  const { favorites } = useFavorites()
  const navigate = useNavigate()

  const favoriteRestaurants = RESTAURANTS.filter((r) => favorites.includes(r.id))

  return (
    <div className="flex h-full flex-col px-4 pb-8 pt-4 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
          Meus Favoritos
        </h1>
        {favoriteRestaurants.length > 0 && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {favoriteRestaurants.length} salvos
          </span>
        )}
      </div>

      {favoriteRestaurants.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center animate-fade-in-up pb-20 text-center">
          <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-slate-100">
            <HeartCrack className="h-12 w-12 text-slate-300" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold text-slate-900">
            Nenhum favorito ainda
          </h2>
          <p className="mb-8 max-w-sm text-slate-500">
            Você ainda não salvou nenhum restaurante. Explore as opções e guarde seus favoritos para
            acessar os descontos mais rápido!
          </p>
          <Button size="lg" className="rounded-full px-8 shadow-md" onClick={() => navigate('/')}>
            <Search className="mr-2 h-5 w-5" />
            Explorar Restaurantes
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteRestaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <RestaurantCard restaurant={restaurant} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

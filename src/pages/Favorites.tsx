import { useAuth } from '@/context/AuthContext'
import { useFavorites } from '@/context/FavoritesContext'
import { usePlaces } from '@/context/PlacesContext'
import { PlaceCard } from '@/components/PlaceCard'
import { HeartCrack, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate, Link } from 'react-router-dom'

export default function Favorites() {
  const { currentUser } = useAuth()
  const { favorites } = useFavorites()
  const { places } = usePlaces()
  const navigate = useNavigate()

  if (!currentUser) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center h-full px-4 py-20 text-center">
        <HeartCrack className="h-16 w-16 text-slate-300 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4 font-display">Acesse sua conta</h2>
        <p className="text-slate-500 font-medium mb-8 max-w-sm">
          Faça login para salvar seus locais favoritos e acessá-los de qualquer dispositivo com a
          nossa nuvem.
        </p>
        <Button asChild size="lg" className="rounded-xl px-8 font-bold shadow-md">
          <Link to="/auth">Fazer Login</Link>
        </Button>
      </div>
    )
  }

  const favoritePlaces = places.filter((p) => favorites.includes(p.id))

  return (
    <div className="flex h-full flex-col px-4 pb-8 pt-4 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
          Meus Favoritos
        </h1>
        {favoritePlaces.length > 0 && (
          <span className="rounded-full bg-secondary/20 px-3 py-1 text-sm font-bold text-slate-800">
            {favoritePlaces.length} salvos
          </span>
        )}
      </div>

      {favoritePlaces.length === 0 ? (
        <div className="animate-fade-in-up flex flex-1 flex-col items-center justify-center pb-20 text-center">
          <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-slate-100">
            <HeartCrack className="h-12 w-12 text-slate-300" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold text-slate-900">
            Nenhum favorito ainda
          </h2>
          <p className="mb-8 max-w-sm font-medium text-slate-500">
            Você ainda não salvou nenhuma atividade. Explore as opções pelo Uruguai e guarde seus
            favoritos!
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 font-bold shadow-md"
            onClick={() => navigate('/')}
          >
            <Search className="mr-2 h-5 w-5" />
            Explorar Locais
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoritePlaces.map((place, index) => (
            <div
              key={place.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PlaceCard place={place} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useRestaurants } from '@/context/RestaurantsContext'
import { useGeo } from '@/context/GeoContext'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

export default function Index() {
  const { restaurants } = useRestaurants()
  const { calculateDistance } = useGeo()
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }))

  const [selectedCity, setSelectedCity] = useState('Todas')
  const [selectedCategory, setSelectedCategory] = useState('Todas')

  const CITIES = ['Todas', 'Montevideo', 'Punta del Este', 'Colonia del Sacramento']
  const CATEGORIES = ['Todas', ...Array.from(new Set(restaurants.map((r) => r.category)))]

  const filteredRestaurants = useMemo(() => {
    let result = restaurants
    if (selectedCity !== 'Todas') result = result.filter((r) => r.city === selectedCity)
    if (selectedCategory !== 'Todas') result = result.filter((r) => r.category === selectedCategory)

    return result.sort((a, b) => {
      const distA = calculateDistance(a.coordinates.lat, a.coordinates.lng) || 9999
      const distB = calculateDistance(b.coordinates.lat, b.coordinates.lng) || 9999
      return distA - distB
    })
  }, [restaurants, selectedCity, selectedCategory, calculateDistance])

  const featured = restaurants.filter((r) => r.featured)

  return (
    <div className="flex flex-col gap-6 pb-8 pt-4 md:px-8 md:pt-8">
      {featured.length > 0 && (
        <section className="px-4 md:px-0">
          <h2 className="mb-3 font-display text-xl font-bold text-slate-900 md:text-2xl">
            Destaques da Semana
          </h2>
          <Carousel plugins={[plugin.current]} className="w-full" opts={{ loop: true }}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {featured.map((restaurant) => (
                <CarouselItem
                  key={`feat-${restaurant.id}`}
                  className="pl-2 md:basis-3/4 md:pl-4 lg:basis-2/3 xl:basis-1/2"
                >
                  <Link to={`/restaurant/${restaurant.id}`}>
                    <div className="group relative h-48 w-full overflow-hidden rounded-2xl md:h-64">
                      <img
                        src={restaurant.coverImage}
                        alt={restaurant.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4 md:p-6">
                        <Badge className="mb-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary border-none">
                          {restaurant.discountBadge}
                        </Badge>
                        <h3 className="font-display text-xl font-bold text-white md:text-3xl">
                          {restaurant.name}
                        </h3>
                        <p className="text-sm text-slate-200 md:text-base">
                          {restaurant.city} • {restaurant.category}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>
      )}

      <section className="px-4 md:px-0 flex flex-col gap-4">
        <div className="hide-scrollbar -mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  selectedCity === city
                    ? 'bg-secondary text-slate-900 shadow-md'
                    : 'bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
        <div className="hide-scrollbar -mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl">
            Descubra Mais
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRestaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <RestaurantCard restaurant={restaurant} />
            </div>
          ))}
          {filteredRestaurants.length === 0 && (
            <p className="col-span-full py-8 text-center text-slate-500">
              Nenhum local encontrado para os filtros selecionados.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

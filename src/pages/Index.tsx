import { RESTAURANTS } from '@/data/restaurants'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = [
  'Todos',
  'Hamburgueria',
  'Pizzaria',
  'Japonês',
  'Cafeteria',
  'Mexicano',
  'Steakhouse',
]

export default function Index() {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }))
  const featured = RESTAURANTS.filter((r) => r.featured)

  return (
    <div className="flex flex-col gap-6 pb-8 pt-4 md:px-8 md:pt-8">
      {/* Featured Banner */}
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
                      <Badge className="mb-2 bg-secondary text-secondary-foreground shadow-sm">
                        {restaurant.discountBadge}
                      </Badge>
                      <h3 className="font-display text-xl font-bold text-white md:text-3xl">
                        {restaurant.name}
                      </h3>
                      <p className="text-sm text-slate-200 md:text-base">
                        {restaurant.category} • {restaurant.distance}
                      </p>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      {/* Categories */}
      <section className="px-4 md:px-0">
        <div className="hide-scrollbar -mx-4 flex overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div className="flex gap-2">
            {CATEGORIES.map((category, i) => (
              <button
                key={category}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  i === 0
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 md:px-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl">
            Mais Populares
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {RESTAURANTS.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <RestaurantCard restaurant={restaurant} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

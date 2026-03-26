import { usePlaces } from '@/context/PlacesContext'
import { useGeo } from '@/context/GeoContext'
import { PlaceCard } from '@/components/PlaceCard'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { isPlaceOpen } from '@/lib/utils'
import { Zap, Timer, Search } from 'lucide-react'

export default function Index() {
  const { places, categories, cities } = usePlaces()
  const { calculateDistance } = useGeo()
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }))

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('Todas')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [selectedType, setSelectedType] = useState('Todos')
  const [openNowOnly, setOpenNowOnly] = useState(false)

  const CITIES = ['Todas', ...cities]
  const TYPES = ['Todos', 'Locais', 'Passeio']
  const CATEGORIES = ['Todas', ...categories]

  const activeFlashOffers = useMemo(() => {
    return places.filter((p) => p.flashOffer && p.flashOffer.expiresAt > Date.now())
  }, [places])

  const filteredPlaces = useMemo(() => {
    let result = places

    if (searchQuery.trim().length >= 3) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      )
    }

    if (selectedCity !== 'Todas') result = result.filter((p) => p.city === selectedCity)
    if (selectedCategory !== 'Todas') result = result.filter((p) => p.category === selectedCategory)

    if (selectedType === 'Locais') {
      result = result.filter((p) => p.type !== 'tour')
    } else if (selectedType === 'Passeio') {
      result = result.filter((p) => p.type === 'tour')
    }

    if (openNowOnly) {
      result = result.filter((p) => isPlaceOpen(p.operatingHours))
    }

    return result.sort((a, b) => {
      const distA = calculateDistance(a.coordinates.lat, a.coordinates.lng) || 9999
      const distB = calculateDistance(b.coordinates.lat, b.coordinates.lng) || 9999
      return distA - distB
    })
  }, [
    places,
    searchQuery,
    selectedCity,
    selectedCategory,
    selectedType,
    openNowOnly,
    calculateDistance,
  ])

  const featured = places.filter((p) => p.featured)

  return (
    <div className="flex flex-col gap-6 pb-8 pt-4 md:px-8 md:pt-8">
      {activeFlashOffers.length > 0 && (
        <section className="px-4 md:px-0 mb-2 animate-fade-in-up">
          <h2 className="mb-3 font-display text-xl font-bold text-red-600 flex items-center gap-2">
            <Zap className="h-5 w-5 fill-current" /> Ofertas Relâmpago
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFlashOffers.map((place) => (
              <Link
                key={`flash-${place.id}`}
                to={`/place/${place.id}`}
                className="group relative rounded-2xl border border-red-100 bg-red-50 p-3 shadow-sm transition-all hover:shadow-md hover:border-red-200 overflow-hidden block"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-red-100/50">
                    <img
                      src={place.coverImage}
                      alt={place.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 w-fit px-2 py-0.5 rounded-full mb-1">
                      <Timer className="h-3 w-3" /> {place.flashOffer?.durationLabel}
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight line-clamp-1">
                      {place.name}
                    </h3>
                    <p className="text-red-600 font-black text-xl">
                      {place.flashOffer?.percentage}% OFF
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="px-4 md:px-0">
          <h2 className="mb-3 font-display text-xl font-bold text-slate-900 md:text-2xl">
            Destaques da Semana
          </h2>
          <Carousel plugins={[plugin.current]} className="w-full" opts={{ loop: true }}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {featured.map((place) => (
                <CarouselItem
                  key={`feat-${place.id}`}
                  className="pl-2 md:basis-3/4 md:pl-4 lg:basis-2/3 xl:basis-1/2"
                >
                  <Link to={`/place/${place.id}`}>
                    <div className="group relative h-48 w-full overflow-hidden rounded-2xl md:h-64">
                      <img
                        src={place.coverImage}
                        alt={place.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4 md:p-6">
                        <Badge className="mb-2 border-none bg-brand-yellow text-brand-yellow-foreground shadow-sm hover:bg-brand-yellow/90">
                          {place.discountBadge}
                        </Badge>
                        <h3 className="font-display text-xl font-bold text-white md:text-3xl">
                          {place.name}
                        </h3>
                        <p className="text-sm text-slate-200 md:text-base">
                          {place.city} • {place.category}
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

      <section className="flex flex-col gap-4 px-4 md:px-0">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar estabelecimentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 w-full rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary/20 text-base"
          />
        </div>

        <div className="hide-scrollbar -mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="hide-scrollbar -mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  selectedCity === city
                    ? 'bg-secondary text-secondary-foreground shadow-md'
                    : 'border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div className="hide-scrollbar -mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tipo:
              </span>
              {TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    selectedType === type
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm shrink-0 w-fit">
            <Switch
              id="open-now"
              checked={openNowOnly}
              onCheckedChange={setOpenNowOnly}
              className="data-[state=checked]:bg-secondary"
            />
            <Label htmlFor="open-now" className="cursor-pointer font-bold text-slate-700">
              Aberto Agora
            </Label>
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
          {filteredPlaces.map((place, index) => (
            <div
              key={place.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PlaceCard place={place} />
            </div>
          ))}
          {filteredPlaces.length === 0 && (
            <p className="col-span-full py-8 text-center text-slate-500">
              Nenhuma atividade encontrada para os filtros selecionados.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

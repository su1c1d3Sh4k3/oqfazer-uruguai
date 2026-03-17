import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Heart, Share2, Ticket, Clock, Info, QrCode } from 'lucide-react'
import { useFavorites } from '@/context/FavoritesContext'
import { useRestaurants } from '@/context/RestaurantsContext'
import { useGeo } from '@/context/GeoContext'
import { useAccess } from '@/context/AccessContext'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function RestaurantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { restaurants } = useRestaurants()
  const { calculateDistance } = useGeo()
  const { isExpired, recordCheckIn } = useAccess()

  const restaurant = restaurants.find((r) => r.id === id)

  if (!restaurant)
    return <div className="p-8 text-center text-xl font-bold">Local não encontrado</div>

  const favorite = isFavorite(restaurant.id)
  const dist = calculateDistance(restaurant.coordinates.lat, restaurant.coordinates.lng)
  const displayDistance = dist ? `${dist.toFixed(1)} km` : 'Calculando...'

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: restaurant.name, url: window.location.href })
    }
  }

  return (
    <div className="relative flex flex-col lg:flex-row lg:h-full lg:overflow-hidden">
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-md backdrop-blur-md transition-transform hover:scale-105 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="flex-1 overflow-y-auto hide-scrollbar lg:border-r">
        <div className="relative bg-slate-900">
          <Carousel opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {restaurant.galleryImages.map((img, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-[4/3] w-full md:aspect-[16/9] lg:aspect-[3/2]">
                    <img
                      src={img}
                      alt={`Foto ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden lg:block">
              <CarouselPrevious className="left-4 bg-white/50 hover:bg-white border-none" />
              <CarouselNext className="right-4 bg-white/50 hover:bg-white border-none" />
            </div>
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-medium z-10 lg:hidden">
              1 / 5 Fotos
            </div>
          </Carousel>
        </div>

        <div className="hidden lg:block p-8">
          <h3 className="font-display text-xl font-bold mb-4">Localização</h3>
          <MapSection
            lat={restaurant.coordinates.lat}
            lng={restaurant.coordinates.lng}
            address={restaurant.address}
            distance={displayDistance}
          />
        </div>
      </div>

      <div className="flex-1 bg-white lg:w-[480px] lg:flex-none lg:overflow-y-auto hide-scrollbar pb-24 lg:pb-0">
        <div className="p-5 md:p-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-primary tracking-wider uppercase bg-primary/10 px-2 py-1 rounded-md">
              {restaurant.category}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 transition-transform hover:scale-105"
              >
                <Share2 className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={() => toggleFavorite(restaurant.id)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 transition-transform hover:scale-105"
              >
                <Heart
                  className={cn(
                    'h-5 w-5',
                    favorite ? 'fill-primary text-primary animate-heart-pop' : 'text-slate-600',
                  )}
                />
              </button>
            </div>
          </div>

          <h1 className="mb-2 font-display text-3xl font-bold leading-tight text-slate-900">
            {restaurant.name}
          </h1>
          <p className="text-lg text-slate-500 font-medium mb-4">{restaurant.city}</p>

          <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-slate-600 border-b pb-6">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 bg-secondary/20 px-2 py-1 rounded-md">
              <Star className="h-4 w-4 fill-secondary text-secondary" /> {restaurant.rating}
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-slate-400" /> {displayDistance}
            </div>
            <div className="flex items-center gap-1.5 font-medium text-green-600">
              <Clock className="h-4 w-4" /> Aberto agora
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-secondary/30 bg-secondary/10 p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-slate-900">
              <Ticket className="h-6 w-6 text-secondary" />
              <h3 className="font-display text-lg font-bold">Oferta Exclusiva</h3>
            </div>
            <p className="mb-3 text-2xl font-black text-slate-900">{restaurant.discountBadge}</p>
            <p className="text-sm leading-relaxed text-slate-700 font-medium">
              {restaurant.discountDescription}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="mb-3 font-display text-xl font-bold text-slate-900">Sobre</h3>
            <p className="leading-relaxed text-slate-600">{restaurant.description}</p>
          </div>

          <div className="mb-8 lg:hidden">
            <h3 className="mb-3 font-display text-xl font-bold text-slate-900">Localização</h3>
            <MapSection
              lat={restaurant.coordinates.lat}
              lng={restaurant.coordinates.lng}
              address={restaurant.address}
              distance={displayDistance}
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-blue-50/50 border border-blue-100 p-4 text-sm text-slate-600">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              Mostre o QR Code gerado no momento de pedir a conta para aplicar seu benefício. Válido
              por 10 dias após o primeiro uso no app.
            </p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 pb-safe lg:sticky lg:border-none lg:bg-transparent lg:px-8 lg:pb-8 shadow-[0_-10px_15px_-3px_rgb(0,0,0,0.05)] lg:shadow-none">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                onClick={recordCheckIn}
                className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Gerar QR Code de Desconto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              {isExpired ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in text-center">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
                    <Info className="h-8 w-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Acesso Expirado</h2>
                  <p className="text-slate-600 max-w-xs">
                    Seu período de 10 dias de descontos chegou ao fim. Esperamos que tenha
                    aproveitado sua viagem ao Uruguai!
                  </p>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-center font-display text-2xl">
                      Seu Desconto
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-fade-in">
                    <div className="rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-sm">
                      <QrCode className="h-48 w-48 text-slate-900" strokeWidth={1} />
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-3xl font-black text-slate-900 tracking-widest bg-slate-100 px-4 py-2 rounded-lg">
                        URU-{Math.floor(Math.random() * 9000) + 1000}
                      </p>
                      <p className="mt-4 text-sm font-bold text-secondary flex items-center justify-center gap-2 uppercase tracking-wide">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                        </span>
                        Válido neste estabelecimento
                      </p>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

function MapSection({ lat, lng, address, distance }: any) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-40 w-full bg-slate-100">
        <img
          src={`https://img.usecurling.com/p/800/400?q=map&color=blue`}
          alt="Map placeholder"
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float">
          <MapPin className="h-10 w-10 text-primary drop-shadow-md fill-primary/20" />
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-bold text-slate-900 truncate">{address}</p>
          <p className="text-sm text-slate-500 font-medium mt-0.5">A {distance} de você</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 font-semibold shadow-sm shrink-0"
            >
              Como chegar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center font-display">Abrir navegação com</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button variant="outline" asChild className="h-12 text-lg font-medium">
                <a
                  href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Waze
                </a>
              </Button>
              <Button variant="outline" asChild className="h-12 text-lg font-medium">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Maps
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

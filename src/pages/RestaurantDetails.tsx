import { useParams, useNavigate } from 'react-router-dom'
import { RESTAURANTS } from '@/data/restaurants'
import { ArrowLeft, MapPin, Star, Heart, Share2, Ticket, Clock, Info, QrCode } from 'lucide-react'
import { useFavorites } from '@/context/FavoritesContext'
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

  const restaurant = RESTAURANTS.find((r) => r.id === id)

  if (!restaurant) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Restaurante não encontrado</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Voltar ao Início
          </Button>
        </div>
      </div>
    )
  }

  const favorite = isFavorite(restaurant.id)

  return (
    <div className="relative flex flex-col lg:flex-row lg:h-full lg:overflow-hidden">
      {/* Mobile Back Button (Floating) */}
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-md backdrop-blur-md transition-transform hover:scale-105 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Left Column (Images & Map on Desktop) */}
      <div className="flex-1 overflow-y-auto hide-scrollbar lg:border-r">
        {/* Gallery Carousel */}
        <div className="relative bg-slate-100">
          <Carousel opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {restaurant.galleryImages.map((img, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-[4/3] w-full md:aspect-[16/9] lg:aspect-[3/2]">
                    <img
                      src={img}
                      alt={`Gallery ${index}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden lg:block">
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </div>
          </Carousel>
        </div>

        {/* Map Section (Desktop flows here, Mobile below content) */}
        <div className="hidden lg:block p-8">
          <h3 className="font-display text-xl font-bold mb-4">Localização</h3>
          <MapSection address={restaurant.address} distance={restaurant.distance} />
        </div>
      </div>

      {/* Right Column (Info & Actions) */}
      <div className="flex-1 bg-slate-50 lg:w-[480px] lg:flex-none lg:overflow-y-auto hide-scrollbar pb-24 lg:pb-0">
        <div className="p-5 md:p-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-primary">{restaurant.category}</span>
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105">
                <Share2 className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={() => toggleFavorite(restaurant.id)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105"
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

          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1 font-medium text-slate-900">
              <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
              {restaurant.rating}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {restaurant.distance}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Aberto agora
            </div>
          </div>

          {/* Discount Highlight Box */}
          <div className="mb-8 rounded-2xl border-2 border-secondary/20 bg-secondary/5 p-5">
            <div className="mb-2 flex items-center gap-2 text-secondary">
              <Ticket className="h-6 w-6" />
              <h3 className="font-display text-lg font-bold">Oferta Exclusiva</h3>
            </div>
            <p className="mb-3 text-2xl font-bold text-slate-900">{restaurant.discountBadge}</p>
            <p className="text-sm leading-relaxed text-slate-700">
              {restaurant.discountDescription}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="mb-3 font-display text-xl font-bold text-slate-900">Sobre</h3>
            <p className="leading-relaxed text-slate-600">{restaurant.description}</p>
          </div>

          {/* Map Section Mobile */}
          <div className="mb-8 lg:hidden">
            <h3 className="mb-3 font-display text-xl font-bold text-slate-900">Localização</h3>
            <MapSection address={restaurant.address} distance={restaurant.distance} />
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p>
              Mostre o QR Code gerado para o garçom no momento de pedir a conta para aplicar o
              desconto.
            </p>
          </div>
        </div>

        {/* Sticky Bottom Action (Mobile) / Fixed Action (Desktop) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 pb-safe lg:sticky lg:border-none lg:bg-transparent lg:px-8 lg:pb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-14 w-full rounded-2xl text-lg font-bold shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Gerar QR Code de Desconto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center font-display text-2xl">
                  Seu Desconto
                </DialogTitle>
                <DialogDescription className="text-center">
                  Apresente este código no {restaurant.name}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center space-y-6 py-6 animate-fade-in">
                <div className="rounded-xl border-4 border-slate-100 bg-white p-4 shadow-inner">
                  {/* Pseudo QR Code */}
                  <QrCode className="h-48 w-48 text-slate-900" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-slate-900 tracking-widest">
                    SVR-{Math.floor(Math.random() * 9000) + 1000}
                  </p>
                  <p className="mt-2 text-sm text-secondary font-medium flex items-center justify-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                    </span>
                    Válido por 15:00
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

function MapSection({ address, distance }: { address: string; distance: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="relative h-40 w-full bg-slate-200">
        <img
          src={`https://img.usecurling.com/p/800/400?q=map&color=gray`}
          alt="Map placeholder"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium text-slate-900">{address}</p>
          <p className="text-sm text-slate-500">A {distance} de você</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full">
          Como chegar
        </Button>
      </div>
    </div>
  )
}

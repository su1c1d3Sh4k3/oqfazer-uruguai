import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Star,
  Heart,
  Share2,
  Ticket,
  Clock,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useFavorites } from '@/context/FavoritesContext'
import { usePlaces } from '@/context/PlacesContext'
import { useGeo } from '@/context/GeoContext'
import { useAccess } from '@/context/AccessContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn, DAYS_OF_WEEK, isPlaceOpen } from '@/lib/utils'
import { PlaceMapSection } from '@/components/PlaceMapSection'
import { PlaceCheckInTicket } from '@/components/PlaceCheckInTicket'

export default function PlaceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { places } = usePlaces()
  const { calculateDistance } = useGeo()
  const { isExpired, getPlaceCheckIn, recordCheckIn } = useAccess()
  const [showCheckInDialog, setShowCheckInDialog] = useState(false)

  const place = places.find((p) => p.id === id)

  if (!place) return <div className="p-8 text-center text-xl font-bold">Local não encontrado</div>

  const isTour = place.type === 'tour'
  const favorite = isFavorite(place.id)
  const dist = calculateDistance(place.coordinates.lat, place.coordinates.lng)
  const displayDistance = dist ? `${dist.toFixed(1)} km` : 'Calculando...'
  const checkInTime = getPlaceCheckIn(place.id)
  const isOpen = isPlaceOpen(place.operatingHours)

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: place.name, url: window.location.href })
  }

  const handleCheckInConfirm = () => {
    if (isExpired) {
      toast.error('Acesso Expirado', {
        description: 'Seu período de 10 dias de benefícios chegou ao fim.',
      })
      return
    }
    recordCheckIn(place.id)
    setShowCheckInDialog(false)
  }

  return (
    <div className="relative flex flex-col lg:h-full lg:flex-row lg:overflow-hidden">
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-md backdrop-blur-md transition-transform hover:scale-105 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="hide-scrollbar flex-1 overflow-y-auto lg:border-r">
        <div className="relative bg-slate-900">
          <Carousel opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {place.galleryImages.map((img, index) => (
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
              <CarouselPrevious className="border-none bg-white/50 left-4 hover:bg-white" />
              <CarouselNext className="border-none bg-white/50 right-4 hover:bg-white" />
            </div>
            <div className="absolute bottom-4 right-4 z-10 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white lg:hidden">
              Fotos
            </div>
          </Carousel>
        </div>

        <div className="hidden p-8 lg:block">
          <h3 className="mb-4 font-display text-xl font-bold">Localização</h3>
          <PlaceMapSection
            lat={place.coordinates.lat}
            lng={place.coordinates.lng}
            address={place.address}
            distance={displayDistance}
          />
        </div>
      </div>

      <div className="hide-scrollbar flex-1 bg-white pb-24 lg:w-[480px] lg:flex-none lg:overflow-y-auto lg:pb-0">
        <div className="p-5 md:p-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              {place.category}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 transition-transform hover:scale-105"
              >
                <Share2 className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={() => toggleFavorite(place.id)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 transition-transform hover:scale-105"
              >
                <Heart
                  className={cn(
                    'h-5 w-5',
                    favorite ? 'animate-heart-pop fill-primary text-primary' : 'text-slate-600',
                  )}
                />
              </button>
            </div>
          </div>

          <h1 className="mb-2 font-display text-3xl font-bold leading-tight text-slate-900">
            {place.name}
          </h1>
          <p className="mb-4 font-medium text-slate-500 text-lg">{place.city}</p>

          <div className="mb-8 flex flex-wrap items-center gap-4 border-b pb-6 text-sm text-slate-600">
            <div className="flex items-center gap-1.5 rounded-md bg-secondary/20 px-2 py-1 font-bold text-slate-900">
              <Star className="h-4 w-4 fill-secondary text-secondary" /> {place.rating}
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-slate-400" /> {displayDistance}
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 font-medium',
                isOpen ? 'text-green-600' : 'text-red-500',
              )}
            >
              <Clock className="h-4 w-4" /> {isOpen ? 'Aberto agora' : 'Fechado'}
            </div>
          </div>

          {!isTour && checkInTime && <PlaceCheckInTicket checkInTime={checkInTime} />}

          {isTour ? (
            <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg text-primary">Cupom de Desconto</h3>
              </div>
              <p className="mb-4 text-sm text-slate-700 font-medium">{place.discountDescription}</p>
              <div className="mb-4 rounded-xl border-2 border-dashed border-primary/30 bg-white p-4 text-center">
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Código do Cupom
                </span>
                <span className="font-mono text-2xl font-black text-slate-900">
                  {place.couponCode}
                </span>
              </div>
              <Button asChild className="h-12 w-full font-bold text-base shadow-md">
                <a href={place.bookingUrl} target="_blank" rel="noreferrer">
                  Reservar Agora <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          ) : (
            <div className="mb-8 rounded-2xl border border-secondary/30 bg-secondary/10 p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-900">
                <Ticket className="h-6 w-6 text-secondary" />
                <h3 className="font-display text-lg font-bold">Oferta Exclusiva</h3>
              </div>
              <p className="mb-3 text-2xl font-black text-slate-900">{place.discountBadge}</p>
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                {place.discountDescription}
              </p>
            </div>
          )}

          {place.operatingHours && place.operatingHours.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 font-display text-xl font-bold text-slate-900">
                Horários de Funcionamento
              </h3>
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                {DAYS_OF_WEEK.map((day) => {
                  const hours = place.operatingHours?.find((h) => h.day === day.value)
                  const isToday = new Date().getDay() === day.value
                  return (
                    <div
                      key={day.value}
                      className={cn(
                        'flex justify-between text-sm',
                        isToday ? 'font-bold text-primary' : 'text-slate-600 font-medium',
                      )}
                    >
                      <span>{day.label}</span>
                      <span>
                        {hours?.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Fechado'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="mb-3 font-display text-xl font-bold text-slate-900">Sobre</h3>
            <p className="leading-relaxed text-slate-600">{place.description}</p>
          </div>

          {isTour && (
            <div className="mb-8 space-y-6">
              {place.included && place.included.length > 0 && (
                <div>
                  <h3 className="mb-3 font-display text-lg font-bold">O que está incluído</h3>
                  <ul className="space-y-2">
                    {place.included.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="h-5 w-5 text-green-500" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {place.availableDays && place.availableDays.length > 0 && (
                <div>
                  <h3 className="mb-3 font-display text-lg font-bold">Dias disponíveis</h3>
                  <div className="flex flex-wrap gap-2">
                    {place.availableDays.map((day) => (
                      <Badge key={day} variant="outline" className="bg-slate-50">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-8 lg:hidden">
            <h3 className="mb-3 font-display text-xl font-bold text-slate-900">Localização</h3>
            <PlaceMapSection
              lat={place.coordinates.lat}
              lng={place.coordinates.lng}
              address={place.address}
              distance={displayDistance}
            />
          </div>
        </div>

        {!isTour && !checkInTime && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 pb-safe shadow-[0_-10px_15px_-3px_rgb(0,0,0,0.05)] lg:sticky lg:border-none lg:bg-transparent lg:px-8 lg:pb-8 lg:shadow-none">
            <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
              <Button
                size="lg"
                onClick={() => setShowCheckInDialog(true)}
                className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Realizar Check-in
              </Button>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Confirmar Check-in</DialogTitle>
                  <DialogDescription className="text-base pt-2">
                    Atenção: O check-in ativará seu desconto neste estabelecimento pelas próximas 24
                    horas. Certifique-se de estar no local antes de prosseguir.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 pt-4 justify-end">
                  <Button variant="outline" onClick={() => setShowCheckInDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCheckInConfirm}>Confirmar Check-in</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}

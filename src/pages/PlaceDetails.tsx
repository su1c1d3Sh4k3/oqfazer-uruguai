import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Heart,
  Share2,
  Ticket,
  Clock,
  ExternalLink,
  CheckCircle2,
  CalendarDays,
  Instagram,
  Globe,
  Zap,
  Timer,
  Loader2,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { cn, DAYS_OF_WEEK, isPlaceOpen, getSpDate } from '@/lib/utils'
import { PlaceMapSection } from '@/components/PlaceMapSection'
import { PlaceCheckInTicket } from '@/components/PlaceCheckInTicket'
import { PrivateReviews } from '@/components/PrivateReviews'

export default function PlaceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { places, recordAccess, recordCouponClick } = usePlaces()
  const { calculateDistance } = useGeo()
  const { isExpired, getPlaceCheckIn, recordCheckIn } = useAccess()
  const [showCheckInDialog, setShowCheckInDialog] = useState(false)
  const [isCheckInLoading, setIsCheckInLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const hasTrackedAccess = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const place = places.find((p) => p.id === id)
  const isCompany = currentUser?.role === 'establishment'

  useEffect(() => {
    if (place) {
      document.title = `${place.name} | O que Fazer no Uruguai?`
      if (!hasTrackedAccess.current) {
        recordAccess(place.id)
        hasTrackedAccess.current = true
      }
      setIsCheckInLoading(true)
      const timer = setTimeout(() => {
        setIsCheckInLoading(false)
      }, 800)
      return () => clearTimeout(timer)
    }
    return () => {
      document.title = 'O que Fazer no Uruguai by Brasileiros no Uruguai'
    }
  }, [place, recordAccess])

  if (!place) return <div className="p-8 text-center text-xl font-bold">Local não encontrado</div>

  const isTour = place.type === 'tour'
  const favorite = isFavorite(place.id)
  const dist = calculateDistance(place.coordinates.lat, place.coordinates.lng)
  const displayDistance = dist ? `${dist.toFixed(1)} km` : 'Calculando...'
  const checkInTime = getPlaceCheckIn(place.id)
  const isOpen = !isTour && isPlaceOpen(place.operatingHours)
  const isFlashOfferActive = place.flashOffer && place.flashOffer.expiresAt > Date.now()

  const handleShare = async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title: place.name, url })
        return
      } catch (error: any) {
        console.error('Error sharing:', error)
        if (error.name === 'AbortError') {
          return
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado!', {
        description: 'O link do local foi copiado para sua área de transferência.',
      })
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleCouponClick = () => {
    recordCouponClick(place.id)
  }

  const handleCheckInConfirm = () => {
    if (!currentUser) {
      toast.error('Login necessário', {
        description: 'Faça login na sua conta para realizar o check-in.',
      })
      navigate('/auth')
      return
    }

    if (isExpired) {
      toast.error('Acesso Expirado', {
        description: 'Seu período de benefícios chegou ao fim.',
      })
      return
    }
    recordCheckIn(place.id)
    setShowCheckInDialog(false)
    toast.success('Check-in realizado com sucesso!', {
      description: 'Este local foi adicionado ao seu histórico de visitas.',
    })
  }

  const handleAddToCalendar = (type: 'google' | 'apple') => {
    const start = new Date()
    start.setDate(start.getDate() + 1) // Tomorrow
    start.setHours(9, 0, 0)
    const end = new Date(start)
    end.setHours(18, 0, 0)

    const formatICSDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '')

    if (type === 'google') {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        place.name,
      )}&dates=${formatICSDate(start)}/${formatICSDate(end)}&details=${encodeURIComponent(
        place.description,
      )}&location=${encodeURIComponent(place.address)}`
      window.open(url, '_blank')
    } else {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${place.name}
DESCRIPTION:${place.description}
LOCATION:${place.address}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
END:VEVENT
END:VCALENDAR`
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', `${place.name.replace(/\s+/g, '_')}.ics`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="relative flex flex-col lg:h-full lg:flex-row lg:overflow-hidden">
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-md backdrop-blur-md transition-transform hover:scale-105 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="hide-scrollbar flex-1 overflow-y-auto lg:border-r bg-slate-50">
        <div className="relative bg-slate-900 lg:hidden">
          <Carousel opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {place.galleryImages.map((img, index) => (
                <CarouselItem key={index}>
                  <div
                    className={cn(
                      'w-full bg-slate-100',
                      isTour ? 'aspect-[4/3]' : 'aspect-[4/3] md:aspect-[16/9]',
                    )}
                  >
                    <img
                      src={img}
                      alt={`Foto ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute bottom-4 right-4 z-10 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
              Fotos
            </div>
          </Carousel>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-1 bg-slate-900 p-1 shrink-0">
          {place.galleryImages.slice(0, 2).map((img, index) => (
            <div
              key={index}
              className={cn(
                'relative w-full overflow-hidden bg-slate-100 group',
                isTour ? 'aspect-[4/3]' : 'aspect-[4/3] xl:aspect-[3/2]',
              )}
            >
              <img
                src={img}
                alt={`Foto ${index + 1}`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {index === 1 && place.galleryImages.length > 2 && (
                <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white shadow-md backdrop-blur-sm flex items-center gap-2 cursor-default border border-white/10">
                  <span className="flex h-2 w-2 rounded-full bg-brand-yellow animate-pulse"></span>+
                  {place.galleryImages.length - 2} fotos
                </div>
              )}
            </div>
          ))}
        </div>

        {!isTour && (
          <div className="hidden p-8 lg:block">
            <h3 className="mb-4 font-display text-xl font-bold">Localização</h3>
            <PlaceMapSection
              lat={place.coordinates.lat}
              lng={place.coordinates.lng}
              address={place.address}
              distance={displayDistance}
            />
          </div>
        )}
      </div>

      <div className="hide-scrollbar flex-1 bg-white pb-24 lg:w-[480px] lg:flex-none lg:overflow-y-auto lg:pb-0">
        <div className="p-5 md:p-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              {place.category}
            </span>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 transition-transform hover:scale-105">
                    <CalendarDays className="h-4 w-4 text-slate-600" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle className="text-center font-display">
                      Adicionar ao Calendário
                    </DialogTitle>
                    <DialogDescription className="text-center">
                      Agende sua visita para {place.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-4">
                    <Button onClick={() => handleAddToCalendar('google')} variant="outline">
                      Google Calendar
                    </Button>
                    <Button onClick={() => handleAddToCalendar('apple')} variant="outline">
                      Apple Calendar (.ics)
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <button
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 transition-transform hover:scale-105"
              >
                <Share2 className="h-4 w-4 text-slate-600" />
              </button>

              {!isCompany && (
                <button
                  onClick={() => {
                    if (!currentUser) navigate('/auth')
                    else toggleFavorite(place.id)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 transition-transform hover:scale-105"
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      favorite ? 'animate-heart-pop fill-primary text-primary' : 'text-slate-600',
                    )}
                  />
                </button>
              )}
            </div>
          </div>

          <h1 className="mb-2 font-display text-3xl font-bold leading-tight text-slate-900">
            {place.name}
          </h1>
          <p className="mb-4 font-medium text-slate-500 text-lg">{place.city}</p>

          <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-6 text-sm text-slate-600">
            {!isTour && (
              <>
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 text-slate-400" /> {displayDistance}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1.5 font-medium',
                    isOpen ? 'text-secondary' : 'text-red-500',
                  )}
                >
                  <Clock className="h-4 w-4" /> {isOpen ? 'Aberto agora' : 'Fechado'}
                </div>
              </>
            )}
            {isTour && place.duration && (
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="h-4 w-4 text-slate-400" /> Duração: {place.duration}
              </div>
            )}
            {isTour && place.departureCity && (
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-slate-400" /> Saída de: {place.departureCity}
              </div>
            )}
          </div>

          {(place.instagramUrl || place.websiteUrl) && (
            <div className="mb-8 flex flex-wrap items-center gap-3">
              {place.instagramUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-full gap-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-pink-200"
                >
                  <a href={place.instagramUrl} target="_blank" rel="noreferrer">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                </Button>
              )}
              {place.websiteUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-full gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                >
                  <a href={place.websiteUrl} target="_blank" rel="noreferrer">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                </Button>
              )}
            </div>
          )}

          {!isTour &&
            !isCompany &&
            (isCheckInLoading ? (
              <div className="mb-8 flex justify-center items-center py-8 rounded-3xl border border-slate-100 bg-slate-50 shadow-inner">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-3 text-sm font-bold text-slate-500">
                  Verificando status do check-in...
                </span>
              </div>
            ) : (
              checkInTime && <PlaceCheckInTicket checkInTime={checkInTime} />
            ))}

          {isFlashOfferActive && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm relative overflow-hidden animate-in fade-in zoom-in duration-500">
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                <Timer className="h-3 w-3" /> {place.flashOffer?.durationLabel}
              </div>
              <div className="mb-2 flex items-center gap-2 text-red-600">
                <Zap className="h-6 w-6 fill-current drop-shadow-sm" />
                <h3 className="font-display text-lg font-bold">Oferta Relâmpago!</h3>
              </div>
              <p className="mb-3 text-4xl font-black text-red-600 tracking-tight">
                {place.flashOffer?.percentage}% OFF
              </p>
              <p className="text-sm font-medium leading-relaxed text-red-800 bg-white/50 p-3 rounded-xl border border-red-100">
                {place.flashOffer?.description}
              </p>
            </div>
          )}

          {isTour ? (
            <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg text-primary">Cupom de Desconto</h3>
              </div>
              <p className="mb-4 text-sm text-slate-700 font-medium leading-relaxed">
                {place.discountDescription}
              </p>
              {place.couponCode && (
                <div className="mb-4 rounded-xl border-2 border-dashed border-primary/30 bg-white p-4 text-center">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">
                    Código do Cupom
                  </span>
                  <span className="font-mono text-2xl font-black text-slate-900">
                    {place.couponCode}
                  </span>
                </div>
              )}
              {isCompany ? (
                <Button
                  disabled
                  className="h-12 w-full font-bold text-base shadow-md opacity-50 cursor-not-allowed"
                >
                  Resgate restrito para Conta Empresa
                </Button>
              ) : (
                <Button
                  asChild
                  className="h-12 w-full font-bold text-base shadow-md"
                  onClick={handleCouponClick}
                >
                  <a href={place.bookingUrl} target="_blank" rel="noreferrer">
                    Acessar Site e Reservar <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          ) : (
            !isFlashOfferActive && (
              <div className="mb-8 rounded-2xl border border-brand-yellow/50 bg-brand-yellow/10 p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-slate-900">
                  <Ticket className="h-6 w-6 text-brand-yellow drop-shadow-sm" />
                  <h3 className="font-display text-lg font-bold">Oferta Exclusiva</h3>
                </div>
                <p className="mb-3 text-2xl font-black text-slate-900">{place.discountBadge}</p>
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  {place.discountDescription}
                </p>
              </div>
            )
          )}

          {!isTour && place.operatingHours && place.operatingHours.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 font-display text-xl font-bold text-slate-900">
                Horários de Funcionamento
              </h3>
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                {DAYS_OF_WEEK.map((day) => {
                  const hours = place.operatingHours?.find((h) => h.day === day.value)
                  const isToday = getSpDate().getUTCDay() === day.value
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
                        <CheckCircle2 className="h-5 w-5 text-secondary" /> {item}
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

          {!isTour && (
            <div className="mb-8 lg:hidden">
              <h3 className="mb-3 font-display text-xl font-bold text-slate-900">Localização</h3>
              <PlaceMapSection
                lat={place.coordinates.lat}
                lng={place.coordinates.lng}
                address={place.address}
                distance={displayDistance}
              />
            </div>
          )}

          {!isCompany && <PrivateReviews placeId={place.id} checkInTime={checkInTime} />}
        </div>

        {!isTour && !checkInTime && !isCheckInLoading && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 pb-safe shadow-[0_-10px_15px_-3px_rgb(0,0,0,0.05)] lg:sticky lg:border-none lg:bg-transparent lg:px-8 lg:pb-8 lg:shadow-none">
            {isCompany ? (
              <Button
                disabled
                className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl opacity-50 cursor-not-allowed"
              >
                Check-in restrito para Conta Empresa
              </Button>
            ) : (
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
                      Atenção: O check-in adicionará este local ao seu histórico de progresso e
                      ativará seu desconto pelas próximas 24 horas. Certifique-se de estar no local.
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}

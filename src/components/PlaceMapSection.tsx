import { MapPin, MapPinOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MapSectionProps {
  lat?: number
  lng?: number
  address: string
  distance: string
}

export function PlaceMapSection({ lat, lng, address, distance }: MapSectionProps) {
  const [isLoading, setIsLoading] = useState(true)

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return (
      <div className="flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
        <MapPinOff className="mb-3 h-10 w-10 text-slate-400" />
        <p className="font-medium text-slate-600">Localização no mapa indisponível</p>
        <p className="mt-1 text-sm text-slate-500">{address}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-56 w-full shrink-0 bg-slate-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <Skeleton className="absolute inset-0 h-full w-full" />
            <MapPin className="relative h-8 w-8 animate-pulse text-slate-400" />
          </div>
        )}
        <iframe
          title={`Mapa de ${address}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${lat},${lng}&hl=pt-BR&z=15&output=embed`}
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 border-t border-slate-100 bg-white p-4 sm:flex-row sm:items-center">
        <div className="w-full min-w-0 flex-1 pr-4">
          <p className="truncate font-bold text-slate-900">{address}</p>
          <p className="mt-0.5 text-sm font-medium text-slate-500">A {distance} de você</p>
        </div>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl font-semibold shadow-sm sm:flex-none"
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir no Maps
            </a>
          </Button>
          <Button
            asChild
            variant="default"
            size="sm"
            className="flex-1 rounded-xl bg-secondary font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90 sm:flex-none"
          >
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Como chegar
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

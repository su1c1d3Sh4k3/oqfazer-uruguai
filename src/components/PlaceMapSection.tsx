import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface MapSectionProps {
  lat?: number
  lng?: number
  address: string
  distance: string
}

export function PlaceMapSection({ lat, lng, address, distance }: MapSectionProps) {
  const [isLoading, setIsLoading] = useState(true)

  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)

  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&hl=pt-BR&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=pt-BR&z=15&output=embed`

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
          src={embedUrl}
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 border-t border-slate-100 bg-white p-4 sm:flex-row sm:items-center">
        <div className="w-full min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">{address}</p>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {distance && distance !== 'Calculando...'
              ? `A ${distance} de você`
              : 'Distância indisponível'}
          </p>
        </div>
      </div>
    </div>
  )
}

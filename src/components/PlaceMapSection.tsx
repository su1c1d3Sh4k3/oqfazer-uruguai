import { MapPin } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MapSectionProps {
  lat: number
  lng: number
  address: string
  distance: string
}

export function PlaceMapSection({ lat, lng, address, distance }: MapSectionProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-56 w-full bg-slate-100">
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
          src={`https://maps.google.com/maps?q=${lat},${lng}&t=m&z=16&output=embed&iwloc=near`}
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100 bg-white p-4">
        <div className="min-w-0 flex-1 w-full pr-4">
          <p className="truncate font-bold text-slate-900">{address}</p>
          <p className="mt-0.5 text-sm font-medium text-slate-500">A {distance} de você</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none rounded-xl font-semibold shadow-sm"
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir no Maps
            </a>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="flex-1 sm:flex-none rounded-xl bg-secondary font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90"
              >
                Como chegar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle className="font-display text-center">Abrir navegação com</DialogTitle>
              </DialogHeader>
              <div className="mt-4 flex flex-col gap-3">
                <Button asChild className="h-12 text-lg font-medium">
                  <a
                    href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Waze
                  </a>
                </Button>
                <Button asChild className="h-12 text-lg font-medium">
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
    </div>
  )
}

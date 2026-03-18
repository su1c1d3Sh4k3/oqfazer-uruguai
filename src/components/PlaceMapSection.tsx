import { MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MapSectionProps {
  lat: number
  lng: number
  address: string
  distance: string
}

export function PlaceMapSection({ lat, lng, address, distance }: MapSectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-40 w-full bg-slate-100">
        <img
          src={`https://img.usecurling.com/p/800/400?q=map&color=blue`}
          alt="Map placeholder"
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float">
          <MapPin className="h-10 w-10 fill-primary/20 text-primary drop-shadow-md" />
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <div className="min-w-0 flex-1 pr-4">
          <p className="truncate font-bold text-slate-900">{address}</p>
          <p className="mt-0.5 text-sm font-medium text-slate-500">A {distance} de você</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="shrink-0 rounded-xl bg-secondary font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90"
            >
              Como chegar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center font-display">Abrir navegação com</DialogTitle>
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
  )
}

import { MapPin, Search } from 'lucide-react'
import { usePlaces } from '@/context/PlacesContext'
import { Link } from 'react-router-dom'

export default function MapView() {
  const { places } = usePlaces()

  return (
    <div className="animate-fade-in relative h-full w-full overflow-hidden bg-slate-100">
      <img
        src="https://img.usecurling.com/p/1200/800?q=street%20map&color=blue"
        alt="Map background"
        className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale-[0.3]"
      />

      <div className="absolute left-4 right-4 top-4 z-10 md:left-8 md:w-96">
        <div className="flex items-center rounded-full border border-slate-100 bg-white px-4 py-3 shadow-lg">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar no Uruguai..."
            className="ml-3 flex-1 bg-transparent text-sm font-medium outline-none"
          />
        </div>
      </div>

      {places.slice(0, 5).map((place, index) => {
        // Randomize mock positions for the mockup map view
        const top = 20 + index * 13 + '%'
        const left = 20 + index * 15 + '%'

        return (
          <div key={place.id} className="absolute z-20" style={{ top, left }}>
            <Link to={`/place/${place.id}`} className="group relative flex flex-col items-center">
              <div className="pointer-events-none absolute -top-14 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="whitespace-nowrap rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-bold shadow-xl">
                  {place.name}
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-primary">
                    {place.city}
                  </div>
                </div>
                <div className="absolute left-1/2 top-[calc(100%-4px)] h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-100 bg-white"></div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg transition-transform hover:scale-110">
                <MapPin className="h-5 w-5 fill-primary/20" />
              </div>
            </Link>
          </div>
        )
      })}

      <div className="absolute left-[30%] top-[60%] z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-secondary shadow-sm"></span>
        </div>
        <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-secondary backdrop-blur-sm shadow-sm">
          Você está aqui
        </div>
      </div>
    </div>
  )
}

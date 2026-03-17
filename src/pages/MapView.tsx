import { MapPin, Search } from 'lucide-react'
import { RESTAURANTS } from '@/data/restaurants'
import { Link } from 'react-router-dom'

export default function MapView() {
  // A visual representation of a map since we don't have a real map library like Google Maps or Mapbox installed
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100 animate-fade-in">
      <img
        src="https://img.usecurling.com/p/1200/800?q=street%20map&color=gray"
        alt="Map background"
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />

      {/* Search overlay for map */}
      <div className="absolute left-4 right-4 top-4 z-10 md:left-8 md:w-96">
        <div className="flex items-center rounded-full bg-white px-4 py-3 shadow-lg">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar nesta área..."
            className="ml-3 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Mock Pins */}
      {RESTAURANTS.slice(0, 4).map((restaurant, index) => {
        // Randomize positions for the mockup
        const top = 20 + index * 15 + '%'
        const left = 20 + index * 20 + '%'

        return (
          <div key={restaurant.id} className="absolute z-20" style={{ top, left }}>
            <Link
              to={`/restaurant/${restaurant.id}`}
              className="group relative flex flex-col items-center"
            >
              <div className="absolute -top-12 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-bold shadow-xl">
                  {restaurant.name}
                  <div className="text-xs text-primary">{restaurant.discountBadge}</div>
                </div>
                <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 bg-white"></div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110">
                <MapPin className="h-5 w-5" />
              </div>
            </Link>
          </div>
        )
      })}

      {/* User Location Pin */}
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></span>
        </div>
      </div>
    </div>
  )
}

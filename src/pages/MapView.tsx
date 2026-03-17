import { MapPin, Search } from 'lucide-react'
import { useRestaurants } from '@/context/RestaurantsContext'
import { Link } from 'react-router-dom'

export default function MapView() {
  const { restaurants } = useRestaurants()

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100 animate-fade-in">
      <img
        src="https://img.usecurling.com/p/1200/800?q=street%20map&color=blue"
        alt="Map background"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />

      <div className="absolute left-4 right-4 top-4 z-10 md:left-8 md:w-96">
        <div className="flex items-center rounded-full bg-white px-4 py-3 shadow-lg border border-slate-100">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar no Uruguai..."
            className="ml-3 flex-1 bg-transparent text-sm outline-none font-medium"
          />
        </div>
      </div>

      {restaurants.slice(0, 5).map((restaurant, index) => {
        // Randomize mock positions for the mockup map view
        const top = 20 + index * 13 + '%'
        const left = 20 + index * 15 + '%'

        return (
          <div key={restaurant.id} className="absolute z-20" style={{ top, left }}>
            <Link
              to={`/restaurant/${restaurant.id}`}
              className="group relative flex flex-col items-center"
            >
              <div className="absolute -top-14 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
                <div className="whitespace-nowrap rounded-xl bg-white px-3 py-2 text-sm font-bold shadow-xl border border-slate-100">
                  {restaurant.name}
                  <div className="text-[10px] text-primary uppercase mt-0.5 tracking-wider">
                    {restaurant.city}
                  </div>
                </div>
                <div className="absolute left-1/2 top-[calc(100%-4px)] h-3 w-3 -translate-x-1/2 rotate-45 bg-white border-r border-b border-slate-100"></div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110 border-2 border-white">
                <MapPin className="h-5 w-5 fill-primary/20" />
              </div>
            </Link>
          </div>
        )
      })}

      <div className="absolute left-[30%] top-[60%] z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-sm"></span>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[10px] font-bold text-blue-800 bg-white/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
          Você está aqui
        </div>
      </div>
    </div>
  )
}

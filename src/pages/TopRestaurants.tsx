import { usePlaces } from '@/context/PlacesContext'
import { PlaceCard } from '@/components/PlaceCard'
import { useState, useMemo } from 'react'
import { Trophy, CheckCircle2 } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export default function TopRestaurants() {
  const { places } = usePlaces()
  const [filter, setFilter] = useState<'all' | '30d'>('all')

  const topPlaces = useMemo(() => {
    return places
      .filter((p) => p.type !== 'tour' && p.category !== 'Passeios')
      .map((p) => {
        const baseCheckins = p.checkInCount || 0
        return {
          ...p,
          displayCheckins: filter === 'all' ? baseCheckins : Math.floor(baseCheckins * 0.35),
        }
      })
      .sort((a, b) => b.displayCheckins - a.displayCheckins)
      .slice(0, 20)
  }, [places, filter])

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-6 md:px-8 md:pt-8 w-full max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-brand-yellow/20 p-2 rounded-xl text-brand-yellow">
              <Trophy className="h-8 w-8 drop-shadow-sm" />
            </div>
            <h1 className="font-display text-2xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Top Restaurantes
            </h1>
          </div>
          <p className="text-slate-500 font-medium md:text-lg">
            Os locais mais frequentados pela nossa comunidade.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto flex">
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(v) => v && setFilter(v as 'all' | '30d')}
              className="justify-start md:justify-center w-full"
            >
              <ToggleGroupItem
                value="all"
                className="rounded-lg font-bold data-[state=on]:bg-secondary data-[state=on]:text-white flex-1 md:flex-none px-4"
              >
                Geral
              </ToggleGroupItem>
              <ToggleGroupItem
                value="30d"
                className="rounded-lg font-bold data-[state=on]:bg-secondary data-[state=on]:text-white flex-1 md:flex-none px-4"
              >
                Últimos 30 Dias
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
        {topPlaces.map((place, index) => (
          <div
            key={place.id}
            className="animate-fade-in-up relative pt-4 pl-4"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`absolute top-0 left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full font-black shadow-lg border-2 border-white text-lg ${
                index === 0
                  ? 'bg-brand-yellow text-slate-900'
                  : index === 1
                    ? 'bg-slate-300 text-slate-800'
                    : index === 2
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-white'
              }`}
            >
              {index + 1}
            </div>
            <PlaceCard place={place} />
            <div className="absolute top-7 right-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border border-slate-100 flex items-center gap-1.5 font-bold text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-secondary" /> {place.displayCheckins}
            </div>
          </div>
        ))}
      </div>

      {topPlaces.length === 0 && (
        <div className="py-20 text-center text-slate-500 font-medium">
          Nenhum estabelecimento encontrado com os filtros atuais.
        </div>
      )}
    </div>
  )
}

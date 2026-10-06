import { useState, useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, Check } from 'lucide-react'
import { usePlaces } from '@/context/PlacesContext'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (id: string) => void
}

export function PlaceSearchCombobox({ value, onChange }: Props) {
  const { allPlaces: places } = usePlaces()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedPlace = useMemo(() => places.find((p) => p.id === value), [places, value])

  const filteredPlaces = useMemo(() => {
    if (search.length < 3) return []
    const lowerSearch = search.toLowerCase()
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) || p.city.toLowerCase().includes(lowerSearch),
    )
  }, [places, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-background"
        >
          <span className="truncate">
            {selectedPlace ? selectedPlace.name : 'Selecione o local...'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar local (min. 3 letras)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {search.length < 3 ? (
            <p className="text-xs text-center text-muted-foreground py-4">
              Digite pelo menos 3 caracteres...
            </p>
          ) : filteredPlaces.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground py-4">
              Nenhum local encontrado.
            </p>
          ) : (
            <div className="space-y-1">
              {filteredPlaces.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground',
                    value === p.id && 'bg-primary/10 text-primary font-medium hover:bg-primary/20',
                  )}
                  onClick={() => {
                    onChange(p.id)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{p.city}</span>
                  </div>
                  {value === p.id && <Check className="h-4 w-4 shrink-0 ml-2" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

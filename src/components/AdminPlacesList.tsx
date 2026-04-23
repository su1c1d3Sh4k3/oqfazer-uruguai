import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Edit, Trash2, Search, Filter, User } from 'lucide-react'
import { Place } from '@/data/places'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useMemo } from 'react'

interface Props {
  places: Place[]
  categories: string[]
  onEdit: (place: Place) => void
  onDelete: (id: string) => void
  establishmentUsers?: any[]
}

export function AdminPlacesList({ places, categories, onEdit, onDelete, establishmentUsers = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')

  const ownerByPlaceId = useMemo(() => {
    const map = new Map<string, any>()
    for (const u of establishmentUsers) {
      if (u.managed_place_id) map.set(u.managed_place_id, u)
    }
    return map
  }, [establishmentUsers])

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCat = categoryFilter === 'Todas' || p.category === categoryFilter
      return matchName && matchCat
    })
  }, [places, searchTerm, categoryFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-background">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[120px]">Imagem</TableHead>
              <TableHead className="w-[80px]">Ordem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlaces.map((place) => (
              <TableRow key={place.id}>
                <TableCell>
                  <div className="w-20">
                    <AspectRatio
                      ratio={4 / 3}
                      className="bg-muted rounded-md overflow-hidden border border-border/50"
                    >
                      <img
                        src={place.coverImage}
                        alt={place.name}
                        className="object-cover w-full h-full"
                      />
                    </AspectRatio>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-muted-foreground">
                  {place.order ?? '-'}
                </TableCell>
                <TableCell className="font-medium">{place.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-medium bg-background">
                    {place.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{place.city}</TableCell>
                <TableCell>
                  {place.type === 'tour' ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold">
                      Passeio
                    </Badge>
                  ) : (
                    <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20 border-none font-bold">
                      Local
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const owner = ownerByPlaceId.get(place.id)
                    if (!owner) return <span className="text-muted-foreground text-xs">—</span>
                    return (
                      <div className="flex items-start gap-1.5">
                        <User className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight truncate max-w-[140px]">
                            {owner.responsible_name || owner.name || '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {owner.email}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(place)}
                      className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(place.id)}
                      className="h-8 w-8 text-slate-500 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredPlaces.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  Nenhum local encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredPlaces.map((place) => (
          <Card key={place.id} className="overflow-hidden shadow-sm">
            <div className="flex gap-3 p-3">
              <div className="w-24 shrink-0">
                <AspectRatio
                  ratio={4 / 3}
                  className="bg-muted rounded-md overflow-hidden border border-border/50"
                >
                  <img
                    src={place.coverImage}
                    alt={place.name}
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-1 overflow-hidden">
                <h3 className="font-bold text-sm leading-tight truncate">{place.name}</h3>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background">
                    Ordem: {place.order ?? '-'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background">
                    {place.category}
                  </Badge>
                  <span className="truncate">{place.city}</span>
                </div>
                {(() => {
                  const owner = ownerByPlaceId.get(place.id)
                  if (!owner) return null
                  return (
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="text-[10px] text-blue-600 font-medium truncate">
                        {owner.responsible_name || owner.name || owner.email}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>
            <div className="bg-muted/30 px-3 py-2 border-t border-border/50 flex items-center justify-between">
              {place.type === 'tour' ? (
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                  Passeio
                </Badge>
              ) : (
                <Badge className="bg-secondary/10 text-secondary border-none text-[10px] font-bold">
                  Local
                </Badge>
              )}
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(place)
                  }}
                  className="h-8 w-8 text-slate-500 hover:text-primary bg-background shadow-sm border border-border/50"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(place.id)
                  }}
                  className="h-8 w-8 text-slate-500 hover:text-destructive bg-background shadow-sm border border-border/50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredPlaces.length === 0 && (
          <div className="text-center text-muted-foreground py-8">Nenhum local encontrado.</div>
        )}
      </div>
    </div>
  )
}

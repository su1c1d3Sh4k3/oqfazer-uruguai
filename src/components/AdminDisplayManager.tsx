import { useState, useMemo, useEffect } from 'react'
import { usePlaces } from '@/context/PlacesContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Star, GripVertical, Trash2, Plus, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AdminDisplayManager() {
  const { places, updatePlace } = usePlaces()

  // Destaques State
  const featuredPlaces = useMemo(() => {
    return places
      .filter((p) => p.featured)
      .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
  }, [places])

  const [searchHighlight, setSearchHighlight] = useState('')
  const [selectedHighlight, setSelectedHighlight] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const searchResults = useMemo(() => {
    if (searchHighlight.length < 3) return []
    return places.filter(
      (p) => !p.featured && p.name.toLowerCase().includes(searchHighlight.toLowerCase()),
    )
  }, [searchHighlight, places])

  const handleAddHighlight = () => {
    if (!selectedHighlight) return
    if (featuredPlaces.length >= 10) {
      toast.error('Limite atingido', { description: 'Você pode ter no máximo 10 destaques.' })
      return
    }
    const newOrder = featuredPlaces.length + 1
    updatePlace(selectedHighlight, { featured: true, featuredOrder: newOrder })
    setSelectedHighlight('')
    setSearchHighlight('')
    setIsSearchOpen(false)
    toast.success('Destaque adicionado!')
  }

  const handleRemoveHighlight = (id: string) => {
    updatePlace(id, { featured: false, featuredOrder: undefined })
    toast.success('Destaque removido!')
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const newOrderList = [...featuredPlaces]
    const draggedIdx = newOrderList.findIndex((p) => p.id === draggedId)
    const targetIdx = newOrderList.findIndex((p) => p.id === targetId)

    if (draggedIdx === -1 || targetIdx === -1) return

    const [draggedItem] = newOrderList.splice(draggedIdx, 1)
    newOrderList.splice(targetIdx, 0, draggedItem)

    newOrderList.forEach((place, index) => {
      const newOrder = index + 1
      if (place.featuredOrder !== newOrder) {
        updatePlace(place.id, { featuredOrder: newOrder })
      }
    })

    setDraggedId(null)
    toast.success('Ordem dos destaques atualizada!')
  }

  // Ordering State
  const orderedPlaces = useMemo(() => {
    return places
      .filter((p) => typeof p.order === 'number')
      .sort((a, b) => (a.order as number) - (b.order as number))
      .slice(0, 20)
  }, [places])

  const [searchOrder, setSearchOrder] = useState('')
  const [selectedOrder, setSelectedOrder] = useState('')
  const [isSearchOrderOpen, setIsSearchOrderOpen] = useState(false)
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)

  const searchOrderResults = useMemo(() => {
    if (searchOrder.length < 3) return []
    return places.filter(
      (p) =>
        typeof p.order !== 'number' && p.name.toLowerCase().includes(searchOrder.toLowerCase()),
    )
  }, [searchOrder, places])

  const handleAddOrder = () => {
    if (!selectedOrder) return
    if (orderedPlaces.length >= 20) {
      toast.error('Limite atingido', { description: 'Você pode ordenar no máximo 20 locais.' })
      return
    }
    const newOrder = orderedPlaces.length + 1
    updatePlace(selectedOrder, { order: newOrder })
    setSelectedOrder('')
    setSearchOrder('')
    setIsSearchOrderOpen(false)
    toast.success('Local adicionado à ordenação!')
  }

  const handleRemoveOrder = (id: string) => {
    updatePlace(id, { order: undefined })
    const newOrderList = orderedPlaces.filter((p) => p.id !== id)
    newOrderList.forEach((place, index) => {
      const newOrder = index + 1
      if (place.order !== newOrder) {
        updatePlace(place.id, { order: newOrder })
      }
    })
    toast.success('Local removido da ordenação!')
  }

  const handleOrderDragStart = (e: React.DragEvent, id: string) => {
    setDraggedOrderId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleOrderDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleOrderDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedOrderId || draggedOrderId === targetId) return

    const newOrderList = [...orderedPlaces]
    const draggedIdx = newOrderList.findIndex((p) => p.id === draggedOrderId)
    const targetIdx = newOrderList.findIndex((p) => p.id === targetId)

    if (draggedIdx === -1 || targetIdx === -1) return

    const [draggedItem] = newOrderList.splice(draggedIdx, 1)
    newOrderList.splice(targetIdx, 0, draggedItem)

    newOrderList.forEach((place, index) => {
      const newOrder = index + 1
      if (place.order !== newOrder) {
        updatePlace(place.id, { order: newOrder })
      }
    })

    setDraggedOrderId(null)
    toast.success('Ordem de exibição atualizada!')
  }

  useEffect(() => {
    const withOrder = places
      .filter((p) => typeof p.order === 'number')
      .sort((a, b) => (a.order as number) - (b.order as number))
    let needsUpdate = false

    if (withOrder.length > 20) needsUpdate = true
    else {
      for (let i = 0; i < withOrder.length; i++) {
        if (withOrder[i].order !== i + 1) {
          needsUpdate = true
          break
        }
      }
    }

    if (needsUpdate) {
      const timer = setTimeout(() => {
        withOrder.forEach((p, i) => {
          if (i < 20) {
            if (p.order !== i + 1) updatePlace(p.id, { order: i + 1 })
          } else {
            updatePlace(p.id, { order: undefined })
          }
        })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [places, updatePlace])

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-yellow fill-current" />
            <CardTitle>Gerenciar Destaques</CardTitle>
          </div>
          <CardDescription>
            Selecione até 10 locais ou passeios para aparecerem no carrossel de destaques da página
            inicial. Arraste as linhas para reordenar a exibição.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-center max-w-lg relative">
            <div className="relative flex-1">
              <Input
                placeholder="Selecione um local para destacar..."
                value={searchHighlight}
                onChange={(e) => {
                  setSearchHighlight(e.target.value)
                  setSelectedHighlight('')
                  setIsSearchOpen(e.target.value.length >= 3)
                }}
                onFocus={() => {
                  if (searchHighlight.length >= 3) setIsSearchOpen(true)
                }}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
              />
              {isSearchOpen && searchHighlight.length >= 3 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">
                      Nenhum local encontrado.
                    </div>
                  ) : (
                    searchResults.map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          'p-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0',
                          selectedHighlight === p.id && 'bg-slate-50 font-medium',
                        )}
                        onClick={() => {
                          setSelectedHighlight(p.id)
                          setSearchHighlight(p.name)
                          setIsSearchOpen(false)
                        }}
                      >
                        {p.name} <span className="text-slate-400 text-xs ml-1">({p.city})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleAddHighlight}
              disabled={featuredPlaces.length >= 10 || !selectedHighlight}
              className="gap-2 shrink-0 bg-[#8291c4] hover:bg-[#7280af] text-white"
            >
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden mt-4">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12 text-center"></TableHead>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Cliques</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredPlaces.map((p, i) => (
                  <TableRow
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, p.id)}
                    className={cn(
                      'cursor-move transition-colors hover:bg-slate-50 bg-white',
                      draggedId === p.id && 'bg-slate-100 opacity-50',
                    )}
                  >
                    <TableCell className="text-center text-slate-300">
                      <GripVertical className="h-5 w-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-500">{i + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium bg-white text-slate-700">
                        {p.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-600">
                      {(p.highlightClickCount || 0).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHighlight(p.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer relative z-10"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {featuredPlaces.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500 bg-white">
                      Nenhum destaque configurado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            {featuredPlaces.length} de 10 destaques utilizados.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-slate-500" />
            <CardTitle>Ordem de Exibição (Explorar)</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Selecione até 20 locais para a curadoria manual da página inicial (Nível 1). Arraste as
            linhas para reordenar a exibição. Locais não incluídos usarão a ordenação automática
            (Nível 2).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-center max-w-lg relative">
            <div className="relative flex-1">
              <Input
                placeholder="Selecione um local para ordenar..."
                value={searchOrder}
                onChange={(e) => {
                  setSearchOrder(e.target.value)
                  setSelectedOrder('')
                  setIsSearchOrderOpen(e.target.value.length >= 3)
                }}
                onFocus={() => {
                  if (searchOrder.length >= 3) setIsSearchOrderOpen(true)
                }}
                onBlur={() => setTimeout(() => setIsSearchOrderOpen(false), 200)}
              />
              {isSearchOrderOpen && searchOrder.length >= 3 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchOrderResults.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">
                      Nenhum local encontrado.
                    </div>
                  ) : (
                    searchOrderResults.map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          'p-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0',
                          selectedOrder === p.id && 'bg-slate-50 font-medium',
                        )}
                        onClick={() => {
                          setSelectedOrder(p.id)
                          setSearchOrder(p.name)
                          setIsSearchOrderOpen(false)
                        }}
                      >
                        {p.name} <span className="text-slate-400 text-xs ml-1">({p.city})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleAddOrder}
              disabled={orderedPlaces.length >= 20 || !selectedOrder}
              className="gap-2 shrink-0 bg-[#8291c4] hover:bg-[#7280af] text-white"
            >
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden mt-4">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12 text-center"></TableHead>
                  <TableHead className="w-16 text-center">Pos</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedPlaces.map((p, i) => (
                  <TableRow
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleOrderDragStart(e, p.id)}
                    onDragOver={handleOrderDragOver}
                    onDrop={(e) => handleOrderDrop(e, p.id)}
                    className={cn(
                      'cursor-move transition-colors hover:bg-slate-50 bg-white',
                      draggedOrderId === p.id && 'bg-slate-100 opacity-50',
                    )}
                  >
                    <TableCell className="text-center text-slate-300">
                      <GripVertical className="h-5 w-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-500">{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      {p.name}
                      {p.featured && (
                        <Star className="inline-block ml-2 h-3 w-3 text-brand-yellow fill-current" />
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">{p.city}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOrder(p.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer relative z-10"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orderedPlaces.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500 bg-white">
                      Nenhuma ordenação manual configurada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            {orderedPlaces.length} de 20 posições utilizadas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

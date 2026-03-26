import { useState, useMemo } from 'react'
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

export function AdminDisplayManager() {
  const { places, updatePlace } = usePlaces()

  // Destaques State
  const featuredPlaces = useMemo(() => places.filter((p) => p.featured), [places])
  const [selectedHighlight, setSelectedHighlight] = useState('')

  // Ordering State
  const [orders, setOrders] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    places.forEach((p) => {
      init[p.id] = p.order !== undefined ? String(p.order) : ''
    })
    return init
  })
  const [searchOrder, setSearchOrder] = useState('')

  const handleAddHighlight = () => {
    if (!selectedHighlight) return
    if (featuredPlaces.length >= 10) {
      toast.error('Limite atingido', { description: 'Você pode ter no máximo 10 destaques.' })
      return
    }
    updatePlace(selectedHighlight, { featured: true })
    setSelectedHighlight('')
    toast.success('Destaque adicionado!')
  }

  const handleRemoveHighlight = (id: string) => {
    updatePlace(id, { featured: false })
    toast.success('Destaque removido!')
  }

  const handleOrderChange = (id: string, value: string) => {
    setOrders((prev) => ({ ...prev, [id]: value }))
  }

  const handleSaveOrders = () => {
    let changed = 0
    Object.entries(orders).forEach(([id, val]) => {
      const p = places.find((x) => x.id === id)
      if (p) {
        const numVal = val === '' ? undefined : parseInt(val, 10)
        if (p.order !== numVal) {
          updatePlace(id, { order: numVal })
          changed++
        }
      }
    })
    if (changed > 0) {
      toast.success('Ordenação atualizada!', { description: `${changed} locais reordenados.` })
    } else {
      toast.info('Nenhuma alteração de ordem detectada.')
    }
  }

  const orderedList = useMemo(() => {
    return places
      .filter((p) => p.name.toLowerCase().includes(searchOrder.toLowerCase()))
      .sort((a, b) => {
        const orderA = orders[a.id] ? parseInt(orders[a.id]) : 999999
        const orderB = orders[b.id] ? parseInt(orders[b.id]) : 999999
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name)
      })
  }, [places, orders, searchOrder])

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
            inicial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-center max-w-lg">
            <Select value={selectedHighlight} onValueChange={setSelectedHighlight}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um local para destacar..." />
              </SelectTrigger>
              <SelectContent>
                {places
                  .filter((p) => !p.featured)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddHighlight}
              disabled={featuredPlaces.length >= 10 || !selectedHighlight}
              className="gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden mt-4">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredPlaces.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-center font-bold text-slate-400">{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHighlight(p.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {featuredPlaces.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-slate-500">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-slate-500" />
                <CardTitle>Ordem de Exibição (Explorar)</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Defina a prioridade de exibição dos locais na página inicial. Números menores
                aparecem primeiro.
              </CardDescription>
            </div>
            <Button onClick={handleSaveOrders} className="gap-2 font-bold shadow-sm">
              Salvar Ordenação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Buscar para reordenar..."
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
            />
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-24 text-center">Prioridade</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Cidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        placeholder="-"
                        value={orders[p.id]}
                        onChange={(e) => handleOrderChange(p.id, e.target.value)}
                        className="w-16 text-center mx-auto"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.name}
                      {p.featured && (
                        <Star className="inline-block ml-2 h-3 w-3 text-brand-yellow fill-current" />
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">{p.city}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Place } from '@/data/places'
import { usePlaces } from '@/context/PlacesContext'
import { isPlaceActive } from '@/lib/utils'
import { toast } from 'sonner'

/** Status + ação de ativar/desativar um local (somente admin). */
export function PlaceActiveToggle({ place }: { place: Place }) {
  const { setPlaceActive } = usePlaces()
  const [open, setOpen] = useState(false)
  const [reactivateDate, setReactivateDate] = useState('')
  const [saving, setSaving] = useState(false)

  const active = isPlaceActive(place)
  const reactivateLabel =
    !active && place.reactivateAt
      ? new Date(place.reactivateAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : null

  const handleActivate = async () => {
    setSaving(true)
    if (await setPlaceActive(place.id, true)) toast.success(`${place.name} reativado`)
    setSaving(false)
  }

  const handleDeactivate = async () => {
    setSaving(true)
    // Reativa às 00:00 (horário de Brasília) do dia escolhido
    const reactivateAt = reactivateDate ? new Date(`${reactivateDate}T00:00:00-03:00`).toISOString() : null
    if (await setPlaceActive(place.id, false, reactivateAt)) {
      toast.success(`${place.name} desativado`, {
        description: reactivateAt ? `Volta automaticamente em ${new Date(reactivateAt).toLocaleDateString('pt-BR')}.` : undefined,
      })
      setOpen(false)
      setReactivateDate('')
    }
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-2">
      {active ? (
        <Badge className="border-none bg-green-50 font-bold text-green-700 hover:bg-green-50">Ativo</Badge>
      ) : (
        <Badge className="border-none bg-slate-200 font-bold text-slate-600 hover:bg-slate-200">
          Inativo{reactivateLabel ? ` até ${reactivateLabel}` : ''}
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        disabled={saving}
        onClick={(e) => {
          e.stopPropagation()
          if (active) setOpen(true)
          else handleActivate()
        }}
        className={active ? 'h-8 w-8 text-slate-500 hover:text-destructive' : 'h-8 w-8 text-slate-500 hover:text-green-600'}
        title={active ? 'Desativar' : 'Reativar'}
      >
        <Power className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desativar {place.name}?</DialogTitle>
            <DialogDescription>
              O local deixa de aparecer no app (inclusive nos favoritos dos usuários) até ser
              reativado. Não é possível desativar enquanto houver check-ins ativos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reativar automaticamente em (opcional)</Label>
            <Input
              type="date"
              value={reactivateDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setReactivateDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={saving}>
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { usePlaces } from '@/context/PlacesContext'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AdminPlaceForm } from '@/components/AdminPlaceForm'
import { AdminCategoryManager } from '@/components/AdminCategoryManager'
import { Place } from '@/data/places'
import { Badge } from '@/components/ui/badge'

export default function Admin() {
  const { places, categories, addPlace, updatePlace, deletePlace } = usePlaces()
  const [editing, setEditing] = useState<Place | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleSave = (data: Place) => {
    if (editing) {
      updatePlace(data.id, data)
    } else {
      addPlace(data)
    }
    setEditing(null)
    setIsAdding(false)
  }

  return (
    <div className="animate-fade-in mx-auto w-full max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">Admin do App</h1>
      </div>

      <AdminCategoryManager />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-slate-900">Locais e Passeios</h2>
        <Button onClick={() => setIsAdding(true)} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Novo Local
        </Button>
      </div>

      <div className="grid gap-4">
        {places.map((p) => (
          <div
            key={p.id}
            className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:p-6"
          >
            <div className="flex items-center gap-4">
              <img src={p.coverImage} alt={p.name} className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                    {p.type === 'tour' ? 'Passeio' : 'Restaurante'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {p.city} • {p.category}
                </p>
              </div>
            </div>
            <div className="flex gap-2 self-end md:self-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setEditing(p)}
                className="rounded-xl"
              >
                <Edit className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deletePlace(p.id)}
                className="rounded-xl"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {places.length === 0 && (
          <p className="py-10 text-center text-slate-500">Nenhum local cadastrado.</p>
        )}
      </div>

      <Dialog
        open={isAdding || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setIsAdding(false)
            setEditing(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? 'Editar Local' : 'Novo Local'}
            </DialogTitle>
          </DialogHeader>
          {(isAdding || editing) && (
            <AdminPlaceForm
              initialData={editing || undefined}
              categories={categories}
              onSave={handleSave}
              onCancel={() => {
                setIsAdding(false)
                setEditing(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

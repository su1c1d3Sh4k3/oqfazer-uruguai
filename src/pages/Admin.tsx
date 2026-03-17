import { useRestaurants } from '@/context/RestaurantsContext'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AdminRestaurantForm } from '@/components/AdminRestaurantForm'
import { Restaurant } from '@/data/restaurants'

export default function Admin() {
  const { restaurants, addRestaurant, updateRestaurant, deleteRestaurant } = useRestaurants()
  const [editing, setEditing] = useState<Restaurant | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleSave = (data: Restaurant) => {
    if (editing) {
      updateRestaurant(data.id, data)
    } else {
      addRestaurant(data)
    }
    setEditing(null)
    setIsAdding(false)
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">
          Admin de Locais
        </h1>
        <Button onClick={() => setIsAdding(true)} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Novo Local
        </Button>
      </div>

      <div className="grid gap-4">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div className="flex items-center gap-4">
              <img src={r.coverImage} alt={r.name} className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <h3 className="font-bold text-lg text-slate-900">{r.name}</h3>
                <p className="text-sm text-slate-500">
                  {r.city} • {r.category}
                </p>
              </div>
            </div>
            <div className="flex gap-2 self-end md:self-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setEditing(r)}
                className="rounded-xl"
              >
                <Edit className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteRestaurant(r.id)}
                className="rounded-xl"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {restaurants.length === 0 && (
          <p className="text-center text-slate-500 py-10">Nenhum restaurante cadastrado.</p>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              {editing ? 'Editar Restaurante' : 'Novo Restaurante'}
            </DialogTitle>
          </DialogHeader>
          {(isAdding || editing) && (
            <AdminRestaurantForm
              initialData={editing || undefined}
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

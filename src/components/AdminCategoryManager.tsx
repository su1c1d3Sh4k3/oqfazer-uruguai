import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { usePlaces } from '@/context/PlacesContext'

export function AdminCategoryManager() {
  const { categories, addCategory, deleteCategory } = usePlaces()
  const [newCat, setNewCat] = useState('')

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-display text-xl font-bold text-slate-900">Gerenciar Categorias</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Badge key={c} variant="secondary" className="px-3 py-1 text-sm font-bold">
            {c}
            <button onClick={() => deleteCategory(c)} className="ml-2 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex max-w-sm gap-2">
        <Input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Nova categoria..."
        />
        <Button
          onClick={() => {
            if (newCat) {
              addCategory(newCat)
              setNewCat('')
            }
          }}
        >
          Adicionar
        </Button>
      </div>
    </div>
  )
}

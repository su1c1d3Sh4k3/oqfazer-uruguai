import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { usePlaces } from '@/context/PlacesContext'

export function AdminCategoryManager() {
  const {
    categories,
    addCategory,
    deleteCategory,
    cities,
    addCity,
    deleteCity,
    badges,
    addBadge,
    deleteBadge,
  } = usePlaces()

  const ManagerSection = ({
    title,
    items,
    onAdd,
    onDelete,
    placeholder,
  }: {
    title: string
    items: string[]
    onAdd: (v: string) => void
    onDelete: (v: string) => void
    placeholder: string
  }) => {
    const [val, setVal] = useState('')
    return (
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-display text-xl font-bold text-slate-900">{title}</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="px-3 py-1 text-sm font-bold">
              {item}
              <button onClick={() => onDelete(item)} className="ml-2 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex max-w-sm gap-2">
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && val) {
                onAdd(val)
                setVal('')
              }
            }}
          />
          <Button
            onClick={() => {
              if (val) {
                onAdd(val)
                setVal('')
              }
            }}
          >
            Adicionar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <ManagerSection
        title="Gerenciar Categorias"
        items={categories}
        onAdd={addCategory}
        onDelete={deleteCategory}
        placeholder="Nova categoria..."
      />
      <ManagerSection
        title="Gerenciar Cidades"
        items={cities}
        onAdd={addCity}
        onDelete={deleteCity}
        placeholder="Nova cidade..."
      />
      <ManagerSection
        title="Gerenciar Badges de Desconto"
        items={badges}
        onAdd={addBadge}
        onDelete={deleteBadge}
        placeholder="Novo badge (ex: 20% OFF)..."
      />
    </div>
  )
}

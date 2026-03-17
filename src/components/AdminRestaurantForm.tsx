import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Restaurant } from '@/data/restaurants'

interface Props {
  initialData?: Restaurant
  onSave: (data: Restaurant) => void
  onCancel: () => void
}

export function AdminRestaurantForm({ initialData, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<Partial<Restaurant>>(
    initialData || {
      id: Math.random().toString(36).substr(2, 9),
      galleryImages: ['', '', '', '', ''],
      coordinates: { lat: 0, lng: 0 },
    },
  )

  const handleChange = (field: keyof Restaurant, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...(formData.galleryImages || ['', '', '', '', ''])]
    newGallery[index] = value
    handleChange('galleryImages', newGallery)
  }

  const handleCoords = (field: 'lat' | 'lng', value: string) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: { ...(prev.coordinates || { lat: 0, lng: 0 }), [field]: parseFloat(value) || 0 },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData as Restaurant)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input
            value={formData.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cidade</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            required
          >
            <option value="">Selecione</option>
            <option value="Montevideo">Montevideo</option>
            <option value="Punta del Este">Punta del Este</option>
            <option value="Colonia del Sacramento">Colonia del Sacramento</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Badge de Desconto (ex: 20% OFF)</Label>
          <Input
            value={formData.discountBadge || ''}
            onChange={(e) => handleChange('discountBadge', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição do Estabelecimento</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Detalhes da Regra do Desconto</Label>
        <Textarea
          value={formData.discountDescription || ''}
          onChange={(e) => handleChange('discountDescription', e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Endereço Completo</Label>
          <Input
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>URL Imagem de Capa</Label>
          <Input
            value={formData.coverImage || ''}
            onChange={(e) => handleChange('coverImage', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input
            type="number"
            step="any"
            value={formData.coordinates?.lat || ''}
            onChange={(e) => handleCoords('lat', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input
            type="number"
            step="any"
            value={formData.coordinates?.lng || ''}
            onChange={(e) => handleCoords('lng', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>URLs das 5 Imagens da Galeria</Label>
        {[0, 1, 2, 3, 4].map((i) => (
          <Input
            key={i}
            value={formData.galleryImages?.[i] || ''}
            onChange={(e) => handleGalleryChange(i, e.target.value)}
            placeholder={`Imagem ${i + 1}`}
            required
          />
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar Restaurante</Button>
      </div>
    </form>
  )
}

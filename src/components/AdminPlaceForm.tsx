import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Place } from '@/data/places'

interface Props {
  initialData?: Place
  categories: string[]
  onSave: (data: Place) => void
  onCancel: () => void
}

export function AdminPlaceForm({ initialData, categories, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<Partial<Place>>(
    initialData || {
      id: Math.random().toString(36).substr(2, 9),
      type: 'restaurant',
      galleryImages: ['', '', '', '', ''],
      coordinates: { lat: 0, lng: 0 },
    },
  )

  const handleChange = (field: keyof Place, value: any) => {
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
    onSave(formData as Place)
  }

  const isTour = formData.type === 'tour'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Local</Label>
          <Input
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={formData.type} onValueChange={(v) => handleChange('type', v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restaurant">Restaurante/Bar</SelectItem>
              <SelectItem value="tour">Passeio/Atividade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={formData.category || ''}
            onValueChange={(v) => handleChange('category', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Select value={formData.city || ''} onValueChange={(v) => handleChange('city', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Montevideo">Montevideo</SelectItem>
              <SelectItem value="Punta del Este">Punta del Este</SelectItem>
              <SelectItem value="Colonia del Sacramento">Colonia del Sacramento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isTour && (
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="font-bold text-primary">Informações do Passeio</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>O que está incluído (separar por vírgula)</Label>
              <Input
                value={formData.included?.join(', ') || ''}
                onChange={(e) =>
                  handleChange(
                    'included',
                    e.target.value.split(',').map((s) => s.trim()),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Dias disponíveis (separar por vírgula)</Label>
              <Input
                value={formData.availableDays?.join(', ') || ''}
                onChange={(e) =>
                  handleChange(
                    'availableDays',
                    e.target.value.split(',').map((s) => s.trim()),
                  )
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL de Reserva</Label>
              <Input
                value={formData.bookingUrl || ''}
                onChange={(e) => handleChange('bookingUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Código do Cupom</Label>
              <Input
                value={formData.couponCode || ''}
                onChange={(e) => handleChange('couponCode', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Badge de Desconto (ex: 20% OFF)</Label>
        <Input
          value={formData.discountBadge || ''}
          onChange={(e) => handleChange('discountBadge', e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
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
        <Button type="submit">Salvar Local</Button>
      </div>
    </form>
  )
}

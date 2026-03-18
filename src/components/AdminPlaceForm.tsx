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
import { Place, createDefaultHours } from '@/data/places'
import { AdminHoursForm } from './AdminHoursForm'
import { Download, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  initialData?: Place
  categories: string[]
  onSave: (data: Place) => void
  onCancel?: () => void
}

export function AdminPlaceForm({ initialData, categories, onSave, onCancel }: Props) {
  const [importUrl, setImportUrl] = useState('')
  const [formData, setFormData] = useState<Partial<Place>>(() => {
    if (initialData) {
      return {
        ...initialData,
        operatingHours: initialData.operatingHours || createDefaultHours(),
      }
    }
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: 'restaurant',
      galleryImages: ['', '', '', '', ''],
      coordinates: { lat: 0, lng: 0 },
      operatingHours: createDefaultHours(),
    }
  })

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
    if (!initialData) {
      toast.success('Estabelecimento salvo com sucesso!')
    }
  }

  const handleImportUrl = () => {
    if (!importUrl) return
    try {
      const url = new URL(importUrl)
      const slug = url.pathname.split('/').filter(Boolean).pop()
      if (!slug) throw new Error('URL inválida')

      const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

      let category = 'Passeios'
      if (slug.includes('bodega')) category = 'Vinícolas'
      if (slug.includes('restaurante')) category = 'Restaurantes'

      setFormData((prev) => ({
        ...prev,
        type: 'tour',
        name,
        bookingUrl: importUrl,
        category,
        discountBadge: '5% OFF',
        description: `Experiência imperdível: ${name}. Reservando com o nosso link exclusivo você garante descontos especiais.`,
        discountDescription:
          'Utilize o nosso cupom BNU5 ao finalizar sua compra no site do parceiro.',
        couponCode: 'BNU5',
        duration: name.includes('Almoço') ? 'Dia inteiro (4 a 6 horas)' : '2 a 3 horas',
        departureCity: 'Montevideo ou Punta del Este',
        included: ['Guia especializado', 'Entrada no local'],
        availableDays: ['Terça-feira', 'Quinta-feira', 'Sábado'],
        coverImage: `https://img.usecurling.com/p/800/600?q=${category === 'Vinícolas' ? 'vineyard' : 'tour'}&color=blue`,
        galleryImages: Array(5).fill(
          `https://img.usecurling.com/p/800/600?q=${category === 'Vinícolas' ? 'wine' : 'city'}&color=blue`,
        ),
      }))
      toast.success('Dados importados!', { description: 'Verifique e edite os campos abaixo.' })
    } catch (e) {
      toast.error('URL não reconhecida', {
        description: 'Certifique-se de usar um link da página de passeios.',
      })
    }
  }

  const isTour = formData.type === 'tour'

  return (
    <div className="space-y-6">
      {!initialData && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <Label className="text-primary font-bold flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Importar Passeio do Site Oficial
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://brasileirosnouruguai.com.br/passeios/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="bg-white"
            />
            <Button
              type="button"
              onClick={handleImportUrl}
              variant="secondary"
              className="shrink-0 gap-2"
            >
              <Download className="h-4 w-4" /> Importar
            </Button>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Preenche automaticamente os campos a partir do link do passeio.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome do Local / Passeio</Label>
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
                <SelectItem value="restaurant">Estabelecimento / Check-in</SelectItem>
                <SelectItem value="tour">Passeio / Link de Reserva</SelectItem>
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
            <Input
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Ex: Montevideo"
              required
            />
          </div>
        </div>

        {!isTour && (
          <AdminHoursForm
            hours={formData.operatingHours || []}
            onChange={(h) => handleChange('operatingHours', h)}
          />
        )}

        {isTour && (
          <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-bold text-primary">Informações Específicas do Passeio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração do Passeio</Label>
                <Input
                  value={formData.duration || ''}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="Ex: Meio dia (4h)"
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade de Saída</Label>
                <Input
                  value={formData.departureCity || ''}
                  onChange={(e) => handleChange('departureCity', e.target.value)}
                  placeholder="Ex: Montevideo"
                />
              </div>
            </div>
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
                <Label>URL Oficial de Reserva</Label>
                <Input
                  value={formData.bookingUrl || ''}
                  onChange={(e) => handleChange('bookingUrl', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Código do Cupom de Desconto</Label>
                <Input
                  value={formData.couponCode || ''}
                  onChange={(e) => handleChange('couponCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Badge de Desconto (ex: 20% OFF ou Brinde)</Label>
          <Input
            value={formData.discountBadge || ''}
            onChange={(e) => handleChange('discountBadge', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Descrição Curta</Label>
          <Textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Regras / Como usar o Desconto</Label>
          <Textarea
            value={formData.discountDescription || ''}
            onChange={(e) => handleChange('discountDescription', e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Endereço de Encontro / Localização</Label>
            <Input
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>URL Imagem de Capa (Proporção 4:3 para tours)</Label>
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
              className="mb-2"
              value={formData.galleryImages?.[i] || ''}
              onChange={(e) => handleGalleryChange(i, e.target.value)}
              placeholder={`Imagem ${i + 1}`}
              required
            />
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">Salvar Registro</Button>
        </div>
      </form>
    </div>
  )
}

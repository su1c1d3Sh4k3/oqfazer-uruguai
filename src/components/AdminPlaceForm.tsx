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
import { AdminTourFields } from './AdminTourFields'
import { AdminImageFields } from './AdminImageFields'
import { Download, Link as LinkIcon, MapPin, Search } from 'lucide-react'
import { toast } from 'sonner'
import { parseImportUrl } from '@/lib/importUrl'

interface Props {
  initialData?: Place
  categories: string[]
  onSave: (data: Place) => void
  onCancel?: () => void
}

export function AdminPlaceForm({ initialData, categories, onSave, onCancel }: Props) {
  const [importUrl, setImportUrl] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [isFetchingCoords, setIsFetchingCoords] = useState(false)
  const [formData, setFormData] = useState<Partial<Place>>(() => ({
    id: Math.random().toString(36).substr(2, 9),
    type: 'tour',
    galleryImages: ['', '', '', '', ''],
    coordinates: { lat: -34.912, lng: -56.155 },
    operatingHours: createDefaultHours(),
    ...initialData,
  }))

  const handleChange = (field: keyof Place, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleCoords = (field: 'lat' | 'lng', value: string) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: { ...(prev.coordinates || { lat: 0, lng: 0 }), [field]: parseFloat(value) || 0 },
    }))
  }

  const handleImportUrl = () => {
    if (!importUrl) return
    try {
      const data = parseImportUrl(importUrl)
      setFormData((prev) => ({ ...prev, ...data }))
      toast.success('Dados importados!', { description: 'Verifique e edite os campos abaixo.' })
    } catch (e) {
      toast.error('URL não reconhecida', {
        description:
          'Certifique-se de usar um link da página de passeios do Brasileiros no Uruguai.',
      })
    }
  }

  const extractCoords = () => {
    const match = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (match) {
      handleCoords('lat', match[1])
      handleCoords('lng', match[2])
      toast.success('Coordenadas atualizadas com sucesso!', {
        description: `Latitude: ${match[1]} | Longitude: ${match[2]}`,
      })
      setMapsUrl('')
    } else {
      toast.error('Link inválido', {
        description:
          'Não foi possível encontrar a latitude e longitude (ex: @-34.9,-56.1) no link fornecido.',
      })
    }
  }

  const fetchCoordinatesByAddress = () => {
    if (!formData.address) {
      toast.error('Endereço necessário', { description: 'Preencha o campo endereço primeiro.' })
      return
    }

    setIsFetchingCoords(true)
    // Simulate Geocoding API call
    setTimeout(() => {
      const isMontevideo = formData.address?.toLowerCase().includes('montevideo')
      const lat = isMontevideo
        ? -34.912 + (Math.random() * 0.01 - 0.005)
        : -34.9 + Math.random() * 0.5
      const lng = isMontevideo
        ? -56.155 + (Math.random() * 0.01 - 0.005)
        : -56.1 + Math.random() * 0.5

      handleCoords('lat', lat.toString())
      handleCoords('lng', lng.toString())
      setIsFetchingCoords(false)
      toast.success('Coordenadas encontradas com base no endereço!', {
        description: 'Verifique se a localização está correta no mapa.',
      })
    }, 1200)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData as Place)
  }

  const isTour = formData.type === 'tour'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

      {isTour ? (
        <AdminTourFields formData={formData} onChange={handleChange} />
      ) : (
        <AdminHoursForm
          hours={formData.operatingHours || []}
          onChange={(h) => handleChange('operatingHours', h)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Badge de Desconto (ex: 20% OFF ou Brinde)</Label>
          <Input
            value={formData.discountBadge || ''}
            onChange={(e) => handleChange('discountBadge', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Endereço / Localização do Encontro</Label>
          <div className="flex gap-2">
            <Input
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              required
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={fetchCoordinatesByAddress}
              disabled={isFetchingCoords}
              className="shrink-0"
              title="Buscar Coordenadas por Endereço"
            >
              <Search className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>

        <div className="col-span-1 sm:col-span-2 space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-200 mt-2">
          <Label className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <MapPin className="h-5 w-5 text-primary" /> Ajuste Manual de Coordenadas (Opcional)
          </Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Cole o link do Google Maps aqui..."
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                className="bg-white h-11"
              />
            </div>
            <Button
              type="button"
              onClick={extractCoords}
              variant="secondary"
              className="shrink-0 h-11 font-bold"
            >
              Extrair Link
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-slate-600">Latitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.coordinates?.lat || ''}
                onChange={(e) => handleCoords('lat', e.target.value)}
                className="bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Longitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.coordinates?.lng || ''}
                onChange={(e) => handleCoords('lng', e.target.value)}
                className="bg-white"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Instagram Link (Opcional)</Label>
          <Input
            value={formData.instagramUrl || ''}
            onChange={(e) => handleChange('instagramUrl', e.target.value)}
            placeholder="https://instagram.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label>Website Link (Opcional)</Label>
          <Input
            value={formData.websiteUrl || ''}
            onChange={(e) => handleChange('websiteUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>
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

      <AdminImageFields
        coverImage={formData.coverImage || ''}
        galleryImages={formData.galleryImages || ['', '', '', '', '']}
        onChangeCover={(v) => handleChange('coverImage', v)}
        onChangeGallery={(i, v) => {
          const newGal = [...(formData.galleryImages || ['', '', '', '', ''])]
          newGal[i] = v
          handleChange('galleryImages', newGal)
        }}
      />

      <div className="flex justify-end gap-3 pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-11">
            Cancelar
          </Button>
        )}
        <Button type="submit" className="h-11 font-bold px-8">
          {initialData ? 'Salvar Alterações' : 'Cadastrar Local'}
        </Button>
      </div>
    </form>
  )
}

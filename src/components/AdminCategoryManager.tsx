import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, MessageCircle, MapPin, Pencil, Check, Mail, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { usePlaces } from '@/context/PlacesContext'
import type { City } from '@/context/PlacesContext'
import { getAppSetting, setAppSetting } from '@/lib/appSettings'
import { toast } from 'sonner'
import { AdminEmailSettings } from './AdminEmailSettings'

function CityManagerSection({
  cityData,
  places,
  onAdd,
  onDelete,
  onUpdateCoordinates,
  onUpdateCountry,
  onMove,
}: {
  cityData: City[]
  places: { city: string; coordinates: { lat: number; lng: number } }[]
  onAdd: (name: string) => void
  onDelete: (name: string) => void
  onUpdateCoordinates: (name: string, lat: number | null, lng: number | null) => Promise<void>
  onUpdateCountry: (name: string, country: string) => Promise<void>
  onMove: (name: string, direction: -1 | 1) => void
}) {
  const [newCity, setNewCity] = useState('')
  const [editingCity, setEditingCity] = useState<string | null>(null)
  const [editLat, setEditLat] = useState('')
  const [editLng, setEditLng] = useState('')
  const [editCountry, setEditCountry] = useState('')

  const getAutoCoords = (cityName: string) => {
    const cityPlaces = places.filter(
      (p) => p.city === cityName && p.coordinates.lat !== 0 && p.coordinates.lng !== 0,
    )
    if (cityPlaces.length === 0) return null
    const lat = cityPlaces.reduce((s, p) => s + p.coordinates.lat, 0) / cityPlaces.length
    const lng = cityPlaces.reduce((s, p) => s + p.coordinates.lng, 0) / cityPlaces.length
    return { lat: +lat.toFixed(4), lng: +lng.toFixed(4) }
  }

  const startEdit = (city: City) => {
    setEditingCity(city.name)
    setEditCountry(city.country)
    if (city.lat != null && city.lng != null) {
      setEditLat(String(city.lat))
      setEditLng(String(city.lng))
    } else {
      const auto = getAutoCoords(city.name)
      setEditLat(auto ? String(auto.lat) : '')
      setEditLng(auto ? String(auto.lng) : '')
    }
  }

  const saveEdit = async () => {
    if (!editingCity) return
    const lat = editLat ? parseFloat(editLat) : null
    const lng = editLng ? parseFloat(editLng) : null
    if ((lat != null && isNaN(lat)) || (lng != null && isNaN(lng))) {
      toast.error('Coordenadas inválidas')
      return
    }
    await onUpdateCoordinates(editingCity, lat, lng)
    const country = editCountry.trim()
    if (country && country !== cityData.find((c) => c.name === editingCity)?.country) {
      await onUpdateCountry(editingCity, country)
    }
    toast.success(`${editingCity} atualizada!`)
    setEditingCity(null)
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 font-display text-xl font-bold text-slate-900 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" /> Gerenciar Cidades
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Use as setas para definir a ordem em que as cidades aparecem nos filtros do app.
      </p>

      <div className="mb-4 space-y-2">
        {cityData.map((city, index) => {
          const auto = getAutoCoords(city.name)
          const hasCustom = city.lat != null && city.lng != null
          const displayLat = hasCustom ? city.lat : auto?.lat
          const displayLng = hasCustom ? city.lng : auto?.lng
          const isEditing = editingCity === city.name

          return (
            <div
              key={city.name}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{city.name}</span>
                  <span className="text-xs font-medium text-slate-500">{city.country}</span>
                  {hasCustom ? (
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      CUSTOM
                    </span>
                  ) : displayLat != null ? (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      AUTO
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      SEM COORDS
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Input
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      placeholder="País"
                      className="h-8 text-xs max-w-[120px]"
                    />
                    <Input
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value)}
                      placeholder="Latitude (ex: -34.966)"
                      className="h-8 text-xs max-w-[160px]"
                    />
                    <Input
                      value={editLng}
                      onChange={(e) => setEditLng(e.target.value)}
                      placeholder="Longitude (ex: -54.945)"
                      className="h-8 text-xs max-w-[160px]"
                    />
                    <Button size="sm" className="h-8 px-3" onClick={saveEdit}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3"
                      onClick={() => setEditingCity(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {displayLat != null && displayLng != null
                      ? `${displayLat}, ${displayLng}`
                      : 'Cadastre lugares nesta cidade para gerar coordenadas automáticas'}
                  </p>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onMove(city.name, -1)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Subir"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onMove(city.name, 1)}
                    disabled={index === cityData.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Descer"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => startEdit(city)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-primary transition-colors"
                    title="Editar país e coordenadas"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(city.name)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remover cidade"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex max-w-sm gap-2">
        <Input
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          placeholder="Nova cidade..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newCity) {
              onAdd(newCity)
              setNewCity('')
            }
          }}
        />
        <Button
          onClick={() => {
            if (newCity) {
              onAdd(newCity)
              setNewCity('')
            }
          }}
        >
          Adicionar
        </Button>
      </div>
    </div>
  )
}

export function AdminCategoryManager() {
  const {
    categories,
    addCategory,
    deleteCategory,
    cities,
    cityData,
    addCity,
    deleteCity,
    updateCityCoordinates,
    updateCityCountry,
    moveCity,
    moveCategory,
    badges,
    addBadge,
    deleteBadge,
    allPlaces: places,
  } = usePlaces()

  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [smtpTestEmail, setSmtpTestEmail] = useState('suicideshake@gmail.com')
  const [smtpSending, setSmtpSending] = useState(false)
  const [smtpResult, setSmtpResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSmtpTest = async () => {
    if (!smtpTestEmail) {
      toast.error('Informe um email de destino.')
      return
    }
    setSmtpSending(true)
    setSmtpResult(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({
            to: smtpTestEmail,
            subject: '[Teste SMTP] Uruguai Descontos - Disparo via Admin',
          }),
        }
      )
      const json = await res.json()
      if (json.success) {
        setSmtpResult({ success: true, message: json.message })
        toast.success(`Email enviado para ${smtpTestEmail}!`)
      } else {
        setSmtpResult({ success: false, message: json.error || 'Erro desconhecido' })
        toast.error(`Falha: ${json.error}`)
      }
    } catch (err) {
      const msg = String(err)
      setSmtpResult({ success: false, message: msg })
      toast.error(`Erro: ${msg}`)
    } finally {
      setSmtpSending(false)
    }
  }

  useEffect(() => {
    getAppSetting('whatsapp_support').then(setWhatsappNumber)
  }, [])

  const handleSaveWhatsapp = async () => {
    const cleaned = whatsappNumber.replace(/\D/g, '')
    if (!cleaned) {
      toast.error('Informe um número válido.')
      return
    }
    const success = await setAppSetting('whatsapp_support', cleaned)
    if (success) {
      setWhatsappNumber(cleaned)
      toast.success('Número do WhatsApp de suporte atualizado!')
    } else {
      toast.error('Erro ao salvar. Verifique se a tabela app_settings existe no Supabase.')
    }
  }

  const ManagerSection = ({
    title,
    items,
    onAdd,
    onDelete,
    onMove,
    placeholder,
  }: {
    title: string
    items: string[]
    onAdd: (v: string) => void
    onDelete: (v: string) => void
    /** Se informado, mostra setas para ordenar (ordem usada nos filtros) */
    onMove?: (v: string, direction: -1 | 1) => void
    placeholder: string
  }) => {
    const [val, setVal] = useState('')
    return (
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={`${onMove ? 'mb-1' : 'mb-4'} font-display text-xl font-bold text-slate-900`}>{title}</h2>
        {onMove && (
          <p className="mb-4 text-xs text-muted-foreground">
            Use as setas para definir a ordem em que aparecem nos filtros do app.
          </p>
        )}
        <div className="mb-4 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge key={item} variant="secondary" className="px-3 py-1 text-sm font-bold">
              {onMove && (
                <button
                  onClick={() => onMove(item, -1)}
                  disabled={index === 0}
                  className="mr-1 hover:text-primary disabled:opacity-30"
                  title="Mover para antes"
                >
                  <ChevronUp className="h-3 w-3 -rotate-90" />
                </button>
              )}
              {item}
              {onMove && (
                <button
                  onClick={() => onMove(item, 1)}
                  disabled={index === items.length - 1}
                  className="ml-1 hover:text-primary disabled:opacity-30"
                  title="Mover para depois"
                >
                  <ChevronDown className="h-3 w-3 -rotate-90" />
                </button>
              )}
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
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-display text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" /> Configurações Gerais
        </h2>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">
              WhatsApp de Suporte (número completo com DDI)
            </Label>
            <p className="text-xs text-muted-foreground">
              Usado no botão "Reportar problema com cupom". Formato: 5511999999999
            </p>
            <div className="flex gap-2">
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="5547999999999"
              />
              <Button onClick={handleSaveWhatsapp} className="shrink-0">
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-display text-xl font-bold text-slate-900 flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" /> Teste SMTP Relay
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Envia um email de teste via smtp-relay.gmail.com (porta 587) para verificar a configuracao.
        </p>
        <div className="space-y-3 max-w-md">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Email de destino</Label>
            <Input
              value={smtpTestEmail}
              onChange={(e) => setSmtpTestEmail(e.target.value)}
              placeholder="email@exemplo.com"
              type="email"
            />
          </div>
          <Button
            onClick={handleSmtpTest}
            disabled={smtpSending}
            className="gap-2"
          >
            {smtpSending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <><Mail className="h-4 w-4" /> Enviar Email de Teste</>
            )}
          </Button>
          {smtpResult && (
            <div className={`mt-3 rounded-xl border p-4 text-sm ${
              smtpResult.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {smtpResult.success ? '✔' : '✘'} {smtpResult.message}
            </div>
          )}
        </div>
      </div>

      <AdminEmailSettings />

      <ManagerSection
        title="Gerenciar Categorias"
        items={categories}
        onAdd={addCategory}
        onDelete={deleteCategory}
        onMove={moveCategory}
        placeholder="Nova categoria..."
      />
      <CityManagerSection
        cityData={cityData}
        places={places}
        onAdd={addCity}
        onDelete={deleteCity}
        onUpdateCoordinates={updateCityCoordinates}
        onUpdateCountry={updateCityCountry}
        onMove={moveCity}
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

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, MessageCircle } from 'lucide-react'
import { usePlaces } from '@/context/PlacesContext'
import { getAppSetting, setAppSetting } from '@/lib/appSettings'
import { toast } from 'sonner'

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

  const [whatsappNumber, setWhatsappNumber] = useState('')

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

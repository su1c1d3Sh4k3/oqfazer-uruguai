import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Place } from '@/data/places'

interface Props {
  formData: Partial<Place>
  onChange: (field: keyof Place, value: any) => void
}

export function AdminTourFields({ formData, onChange }: Props) {
  const [includedText, setIncludedText] = useState(formData.included?.join(', ') || '')
  const [daysText, setDaysText] = useState(formData.availableDays?.join(', ') || '')

  const processCommaSeparated = (text: string): string[] => {
    return text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="font-bold text-primary text-lg">Informações Específicas do Passeio</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Duração do Passeio</Label>
          <Input
            value={formData.duration || ''}
            onChange={(e) => onChange('duration', e.target.value)}
            placeholder="Ex: Meio dia (4h)"
          />
        </div>
        <div className="space-y-2">
          <Label>Cidade de Saída</Label>
          <Input
            value={formData.departureCity || ''}
            onChange={(e) => onChange('departureCity', e.target.value)}
            placeholder="Ex: Montevideo"
          />
        </div>
        <div className="space-y-2">
          <Label>O que está incluído (separar por vírgula)</Label>
          <Input
            value={includedText}
            onChange={(e) => setIncludedText(e.target.value)}
            onBlur={() => {
              const items = processCommaSeparated(includedText)
              onChange('included', items)
              setIncludedText(items.join(', '))
            }}
            placeholder="Guia, Transporte..."
          />
        </div>
        <div className="space-y-2">
          <Label>Dias disponíveis (separar por vírgula)</Label>
          <Input
            value={daysText}
            onChange={(e) => setDaysText(e.target.value)}
            onBlur={() => {
              const items = processCommaSeparated(daysText)
              onChange('availableDays', items)
              setDaysText(items.join(', '))
            }}
            placeholder="Segunda, Quarta... ou Todos os Dias"
          />
        </div>
        <div className="space-y-2">
          <Label>URL Oficial de Reserva</Label>
          <Input
            value={formData.bookingUrl || ''}
            onChange={(e) => onChange('bookingUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Nome Cupom</Label>
          <Input
            value={formData.couponCode || ''}
            onChange={(e) => onChange('couponCode', e.target.value)}
            placeholder="BNU5"
          />
        </div>
      </div>
    </div>
  )
}

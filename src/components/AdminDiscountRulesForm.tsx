import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DiscountRule } from '@/data/places'
import { timeToMinutes } from '@/lib/utils'

interface Props {
  rules: DiscountRule[]
  onChange: (rules: DiscountRule[]) => void
}

/** Intervalos de desconto não podem se sobrepor (considerando a virada da meia-noite). */
export function validateDiscountRules(rules: DiscountRule[]): string[] {
  const errors: string[] = []
  const toRanges = (r: DiscountRule): [number, number][] => {
    const start = timeToMinutes(r.startTime)
    const end = timeToMinutes(r.endTime)
    if (start === end) return [[0, 1440]]
    return end > start ? [[start, end]] : [[start, 1440], [0, end]]
  }
  rules.forEach((r, i) => {
    if (!r.startTime || !r.endTime || !r.label.trim()) {
      errors.push(`Desconto ${i + 1}: preencha início, fim e o desconto.`)
    }
  })
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      if (!rules[i].startTime || !rules[i].endTime || !rules[j].startTime || !rules[j].endTime) continue
      const overlap = toRanges(rules[i]).some(([a1, a2]) =>
        toRanges(rules[j]).some(([b1, b2]) => a1 < b2 && b1 < a2),
      )
      if (overlap) errors.push(`Os descontos ${i + 1} e ${j + 1} têm horários sobrepostos.`)
    }
  }
  return errors
}

export function AdminDiscountRulesForm({ rules, onChange }: Props) {
  const change = (index: number, field: keyof DiscountRule, value: string) =>
    onChange(rules.map((r, i) => (i === index ? { ...r, [field]: value } : r)))

  const add = () =>
    onChange([
      ...rules,
      { id: Math.random().toString(36).slice(2, 10), startTime: '', endTime: '', label: '' },
    ])

  const remove = (index: number) => onChange(rules.filter((_, i) => i !== index))

  const errors = validateDiscountRules(rules)

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      <div>
        <h3 className="font-bold text-slate-900">Descontos por Horário (Opcional)</h3>
        <p className="text-xs text-slate-500">
          Valem todos os dias. Se houver algum intervalo cadastrado, o check-in só fica disponível
          dentro deles e o desconto aplicado é o do horário do check-in. A Oferta Relâmpago tem
          prioridade. Sem intervalos, vale o Badge de Desconto fixo.
        </p>
      </div>

      {rules.map((rule, index) => (
        <div
          key={rule.id}
          className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="time"
              value={rule.startTime}
              onChange={(e) => change(index, 'startTime', e.target.value)}
              className="w-32 bg-white"
              required
            />
            <span className="text-sm font-medium text-slate-500">até</span>
            <Input
              type="time"
              value={rule.endTime}
              onChange={(e) => change(index, 'endTime', e.target.value)}
              className="w-32 bg-white"
              required
            />
            <Input
              value={rule.label}
              onChange={(e) => change(index, 'label', e.target.value)}
              placeholder="Ex.: 10% OFF ou Drink grátis"
              className="min-w-[180px] flex-1 bg-white"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="h-8 w-8 text-slate-400 hover:text-destructive"
              title="Remover desconto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Input
            value={rule.description || ''}
            onChange={(e) => change(index, 'description', e.target.value)}
            placeholder="Regras deste desconto (opcional — senão usa 'Como usar o Desconto')"
            className="bg-white"
          />
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" onClick={add} className="gap-1 px-2 text-primary">
        <Plus className="h-4 w-4" /> Adicionar desconto por horário
      </Button>

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

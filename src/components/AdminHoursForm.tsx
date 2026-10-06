import { Plus, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DailyHours, TimeShift } from '@/data/places'
import { DAYS_OF_WEEK, getShifts, validateOperatingHours } from '@/lib/utils'

interface Props {
  hours: DailyHours[]
  onChange: (hours: DailyHours[]) => void
}

/** Mantém openTime/closeTime espelhando o primeiro intervalo (compatibilidade). */
function withShifts(day: DailyHours, shifts: TimeShift[]): DailyHours {
  return {
    ...day,
    shifts,
    openTime: shifts[0]?.openTime ?? '',
    closeTime: shifts[0]?.closeTime ?? '',
  }
}

export function AdminHoursForm({ hours, onChange }: Props) {
  const getDay = (day: number): DailyHours =>
    hours.find((h) => h.day === day) || {
      day,
      isOpen: false,
      openTime: '09:00',
      closeTime: '18:00',
    }

  const updateDay = (day: number, updated: DailyHours) => {
    const exists = hours.some((h) => h.day === day)
    const next = exists
      ? hours.map((h) => (h.day === day ? updated : h))
      : [...hours, updated].sort((a, b) => a.day - b.day)
    onChange(next)
  }

  const toggleOpen = (day: number, isOpen: boolean) => {
    const current = getDay(day)
    const shifts = getShifts(current)
    updateDay(
      day,
      withShifts(
        { ...current, isOpen },
        shifts.length > 0 ? shifts : [{ openTime: '09:00', closeTime: '18:00' }],
      ),
    )
  }

  const changeShift = (day: number, index: number, field: keyof TimeShift, value: string) => {
    const current = getDay(day)
    const shifts = getShifts(current).map((s, i) => (i === index ? { ...s, [field]: value } : s))
    updateDay(day, withShifts(current, shifts))
  }

  const addShift = (day: number) => {
    const current = getDay(day)
    const shifts = getShifts(current)
    const last = shifts[shifts.length - 1]
    updateDay(
      day,
      withShifts(current, [...shifts, { openTime: last?.closeTime || '14:00', closeTime: '' }]),
    )
  }

  const removeShift = (day: number, index: number) => {
    const current = getDay(day)
    updateDay(day, withShifts(current, getShifts(current).filter((_, i) => i !== index)))
  }

  const errors = validateOperatingHours(hours)

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      <div>
        <h3 className="font-bold text-slate-900">Horário de Funcionamento</h3>
        <p className="text-xs text-slate-500">
          Adicione quantos intervalos precisar (ex.: 06:00 às 13:00 e 14:00 às 20:00). O último
          intervalo pode terminar após a meia-noite, desde que antes da abertura do dia seguinte.
        </p>
      </div>
      {DAYS_OF_WEEK.map((day) => {
        const dHours = getDay(day.value)
        const shifts = getShifts(dHours)
        return (
          <div
            key={day.value}
            className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-none last:pb-0 sm:flex-row sm:items-start"
          >
            <div className="flex w-40 items-center gap-2 sm:pt-2">
              <Checkbox
                id={`day-${day.value}`}
                checked={dHours.isOpen}
                onCheckedChange={(c) => toggleOpen(day.value, c === true)}
              />
              <Label htmlFor={`day-${day.value}`} className="cursor-pointer font-medium">
                {day.label}
              </Label>
            </div>
            {dHours.isOpen ? (
              <div className="flex flex-col gap-2">
                {shifts.map((shift, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={shift.openTime}
                      onChange={(e) => changeShift(day.value, index, 'openTime', e.target.value)}
                      className="w-32"
                      required
                    />
                    <span className="text-sm font-medium text-slate-500">até</span>
                    <Input
                      type="time"
                      value={shift.closeTime}
                      onChange={(e) => changeShift(day.value, index, 'closeTime', e.target.value)}
                      className="w-32"
                      required
                    />
                    {shifts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeShift(day.value, index)}
                        className="h-8 w-8 text-slate-400 hover:text-destructive"
                        title="Remover intervalo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addShift(day.value)}
                  className="w-fit gap-1 px-2 text-primary"
                >
                  <Plus className="h-4 w-4" /> Adicionar intervalo
                </Button>
              </div>
            ) : (
              <span className="text-sm font-medium text-slate-500 italic py-2 sm:py-2">
                Fechado
              </span>
            )}
          </div>
        )
      })}
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

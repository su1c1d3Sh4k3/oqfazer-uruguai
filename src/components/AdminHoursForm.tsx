import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { DailyHours } from '@/data/places'
import { DAYS_OF_WEEK } from '@/lib/utils'

interface Props {
  hours: DailyHours[]
  onChange: (hours: DailyHours[]) => void
}

export function AdminHoursForm({ hours, onChange }: Props) {
  const handleHourChange = (day: number, field: keyof DailyHours, value: any) => {
    onChange(hours.map((h) => (h.day === day ? { ...h, [field]: value } : h)))
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      <h3 className="font-bold text-slate-900">Horário de Funcionamento</h3>
      {DAYS_OF_WEEK.map((day) => {
        const dHours = hours.find((h) => h.day === day.value) || {
          day: day.value,
          isOpen: false,
          openTime: '00:00',
          closeTime: '00:00',
        }
        return (
          <div key={day.value} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex w-40 items-center gap-2">
              <Checkbox
                id={`day-${day.value}`}
                checked={dHours.isOpen}
                onCheckedChange={(c) => handleHourChange(day.value, 'isOpen', c === true)}
              />
              <Label htmlFor={`day-${day.value}`} className="cursor-pointer font-medium">
                {day.label}
              </Label>
            </div>
            {dHours.isOpen ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={dHours.openTime}
                  onChange={(e) => handleHourChange(day.value, 'openTime', e.target.value)}
                  className="w-32"
                  required
                />
                <span className="text-sm font-medium text-slate-500">até</span>
                <Input
                  type="time"
                  value={dHours.closeTime}
                  onChange={(e) => handleHourChange(day.value, 'closeTime', e.target.value)}
                  className="w-32"
                  required
                />
              </div>
            ) : (
              <span className="text-sm font-medium text-slate-500 italic py-2 sm:py-0">
                Fechado
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

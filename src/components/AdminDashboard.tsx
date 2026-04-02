import { useState, useEffect, useCallback } from 'react'
import { usePlaces } from '@/context/PlacesContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  MousePointerClick,
  Eye,
  Ticket,
  Download,
  FileText,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { DateRange } from 'react-day-picker'

export function AdminDashboard() {
  const { places } = usePlaces()

  const [filterType, setFilterType] = useState<string>('30days')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  useEffect(() => {
    const today = new Date()
    switch (filterType) {
      case 'today':
        setDateRange({ from: startOfDay(today), to: endOfDay(today) })
        break
      case 'yesterday':
        setDateRange({ from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) })
        break
      case '7days':
        setDateRange({ from: subDays(today, 7), to: today })
        break
      case '30days':
        setDateRange({ from: subDays(today, 30), to: today })
        break
    }
  }, [filterType])

  // Multiplier set to 1 — shows real data from Supabase
  const multiplier = 1

  const totalAccesses = Math.floor(
    places.reduce((sum, p) => sum + (p.accessCount || 0), 0) * multiplier,
  )
  const totalClicks = Math.floor(
    places.reduce((sum, p) => sum + (p.couponClickCount || 0), 0) * multiplier,
  )

  const toursByAccess = [...places]
    .filter((p) => p.type === 'tour')
    .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
    .slice(0, 10)
    .map((p) => ({ ...p, accessCount: Math.floor((p.accessCount || 0) * multiplier) }))

  const topCoupons = [...places]
    .filter((p) => p.discountBadge)
    .sort((a, b) => (b.couponClickCount || 0) - (a.couponClickCount || 0))
    .slice(0, 10)
    .map((p) => ({ ...p, couponClickCount: Math.floor((p.couponClickCount || 0) * multiplier) }))

  const exportExcel = useCallback(async () => {
    const { data: reviews } = await supabase.from('reviews').select('*')

    const BOM = '\uFEFF'
    let csvContent = BOM + 'Estabelecimento;Visualizacoes;Cliques\n'

    places
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .forEach((p) => {
        csvContent += `"${p.name}";${p.accessCount || 0};${p.couponClickCount || 0}\n`
      })

    csvContent += '\nComentarios e Feedbacks Privados\n'
    csvContent += 'Data;Usuario;Estabelecimento;Nota;Comentario\n'

    ;(reviews || []).forEach((r: any) => {
      const rDate = new Date(r.date)
      const inRange =
        dateRange?.from && dateRange?.to ? rDate >= dateRange.from && rDate <= dateRange.to : true

      if (inRange) {
        const pName = places.find((p) => p.id === r.place_id)?.name || 'Desconhecido'
        const cleanComment = r.comment ? r.comment.replace(/"/g, '""') : ''
        csvContent += `"${rDate.toLocaleDateString()}";"${r.user_email}";"${pName}";${r.rating};"${cleanComment}"\n`
      }
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'relatorio_desempenho_bnu.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório exportado com sucesso!')
  }, [places, dateRange])

  const exportPDF = () => {
    window.print()
    toast.success('Preparando PDF para impressão...')
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Relatórios de Desempenho</h2>
            <p className="text-sm text-muted-foreground">
              Analise e exporte os dados do aplicativo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={exportPDF}
              className="gap-2 bg-background font-medium"
            >
              <FileText className="h-4 w-4" />{' '}
              <span className="hidden sm:inline">Exportar (PDF)</span>
            </Button>
            <Button onClick={exportExcel} className="gap-2 font-medium">
              <Download className="h-4 w-4" />{' '}
              <span className="hidden sm:inline">Baixar Excel</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/50">
          <span className="text-sm font-medium text-foreground">Período:</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Período Específico</SelectItem>
            </SelectContent>
          </Select>

          {filterType === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-[260px] justify-start text-left font-normal bg-background',
                    !dateRange && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                        {format(dateRange.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Total de Visualizações
              </p>
              <p className="text-3xl font-black text-primary">{totalAccesses.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/5 border-secondary/20 shadow-none">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <MousePointerClick className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Cliques em Cupons/Reservas
              </p>
              <p className="text-3xl font-black text-secondary">{totalClicks.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-500" /> Passeios Mais Acessados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="divide-y">
              {toursByAccess.map((tour, i) => (
                <div
                  key={tour.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold w-4">{i + 1}.</span>
                    <div>
                      <p className="font-bold text-sm leading-tight text-foreground">{tour.name}</p>
                      <p className="text-xs text-muted-foreground">{tour.city}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    <Eye className="h-3 w-3 mr-1" /> {tour.accessCount || 0}
                  </Badge>
                </div>
              ))}
              {toursByAccess.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhum dado encontrado para este período.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-slate-500" /> Cupons Mais Utilizados (Cliques)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="divide-y">
              {topCoupons.map((place, i) => (
                <div
                  key={place.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold w-4">{i + 1}.</span>
                    <div>
                      <p className="font-bold text-sm leading-tight text-foreground">
                        {place.name}
                      </p>
                      <p className="text-xs text-brand-yellow font-bold">{place.discountBadge}</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-mono">
                    <MousePointerClick className="h-3 w-3 mr-1" /> {place.couponClickCount || 0}
                  </Badge>
                </div>
              ))}
              {topCoupons.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhum dado encontrado para este período.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

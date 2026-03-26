import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'

export function PlaceCheckInTicket({ checkInTime }: { checkInTime: number }) {
  const [reportOpen, setReportOpen] = useState(false)
  const [issue, setIssue] = useState('')

  const expirationTime = checkInTime + 86400000
  const isExpired = Date.now() > expirationTime

  const handleReport = () => {
    if (!issue.trim()) {
      toast.error('Descreva o problema antes de enviar.')
      return
    }
    toast.success('Problema reportado com sucesso', {
      description: 'Nossa equipe de suporte entrará em contato via WhatsApp.',
    })
    setReportOpen(false)
    setIssue('')
  }

  if (isExpired) {
    return (
      <div className="mb-8 rounded-2xl bg-slate-100 p-6 text-center text-slate-500 shadow-sm">
        <XCircle className="mx-auto mb-2 h-8 w-8 text-slate-400" />
        <p className="font-bold">Check-in Expirado</p>
        <p className="text-sm">Você já utilizou o desconto deste estabelecimento.</p>
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-br from-secondary to-[#106A2E] p-6 text-white shadow-xl">
      <div className="mb-4 flex items-center gap-3">
        <CheckCircle2 className="h-8 w-8 text-white" />
        <h3 className="font-display text-xl font-bold">Check-in Ativo</h3>
      </div>
      <div className="mb-4 space-y-3 rounded-xl bg-white/15 p-4 backdrop-blur-sm border border-white/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-50 font-medium">Check-in:</span>
          <span className="font-bold">{format(new Date(checkInTime), 'dd/MM/yyyy - HH:mm')}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-50 font-medium">Expira:</span>
          <span className="font-bold">
            {format(new Date(expirationTime), 'dd/MM/yyyy - HH:mm')}
          </span>
        </div>
      </div>
      <div className="rounded-xl bg-white p-4 text-center shadow-inner">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-secondary">
          Validação Oficial
        </p>
        <p className="text-lg font-black leading-tight text-slate-900">
          esse cupom vale até
          <br />
          <span className="text-xl text-secondary">
            {format(new Date(expirationTime), 'dd/MM/yyyy')} às{' '}
            {format(new Date(expirationTime), 'HH:mm')}
          </span>
        </p>
      </div>

      <div className="mt-4 text-center">
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild>
            <button className="text-xs text-white/80 hover:text-white underline flex items-center justify-center gap-1 mx-auto transition-colors">
              <AlertTriangle className="h-3 w-3" /> Reportar problema com o cupom
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md text-slate-900 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-primary flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Reportar Problema
              </DialogTitle>
              <DialogDescription>
                Teve algum problema com o reconhecimento do desconto no estabelecimento? Descreva
                abaixo para a nossa equipe.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Ex: O gerente não reconheceu a oferta..."
              className="mt-2 min-h-[120px] resize-none"
            />
            <Button onClick={handleReport} className="mt-4 w-full h-11 font-bold">
              Enviar Reporte
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

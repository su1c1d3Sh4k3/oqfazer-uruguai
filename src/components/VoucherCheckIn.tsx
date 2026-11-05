import { useState } from 'react'
import { format } from 'date-fns'
import { Gift, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAccess, type VoucherState } from '@/context/AccessContext'
import type { AppliedDiscount, DiscountRule } from '@/data/places'
import { subscribeLink, useSupportWhatsapp } from './VoucherBanner'

interface Props {
  placeId: string
  /** Desconto vigente do restaurante agora (null fora das janelas de desconto) */
  currentDiscount: AppliedDiscount | null
  /** O restaurante tem desconto agora (sem regras de horário, sempre true) */
  canCheckInNow: boolean
  nextRule: DiscountRule | null
}

/** Desconto que o cupom dá agora — null quando não pode ser usado neste momento. */
function voucherDiscountNow(voucher: VoucherState, props: Props): AppliedDiscount | null {
  if (!voucher.discount) return props.currentDiscount
  if (voucher.hoursOnly && !props.canCheckInNow) return null
  return { source: 'voucher', label: voucher.discount }
}

/** Destaque do cupom na página do restaurante do sorteio, enquanto ele vale. */
export function VoucherCard({ placeId, ...rest }: Props) {
  const { voucher } = useAccess()
  if (!voucher || voucher.placeId !== placeId || voucher.status !== 'available') return null
  const now = voucherDiscountNow(voucher, { placeId, ...rest })
  return (
    <div className="mb-8 rounded-2xl border-2 border-dashed border-brand-yellow bg-brand-yellow/10 p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-slate-900">
        <Gift className="h-6 w-6 text-primary" />
        <h3 className="font-display text-lg font-bold">Seu cupom do sorteio</h3>
      </div>
      <p className="mb-2 text-2xl font-black text-slate-900">
        {voucher.discount || now?.label || 'Desconto do restaurante'}
      </p>
      <p className="text-sm font-medium text-slate-600">
        Vale para um único check-in neste restaurante
        {voucher.expiresAt && `, até ${format(new Date(voucher.expiresAt), 'dd/MM/yyyy')}`}.
        {(!voucher.discount || voucher.hoursOnly) && ' Válido nos horários de desconto do restaurante.'}
      </p>
    </div>
  )
}

/** Barra de check-in da conta cupom (substitui a barra normal). */
export function VoucherCheckInBar(props: Props) {
  const { voucher, redeemVoucher } = useAccess()
  const whatsapp = useSupportWhatsapp()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!voucher) return null
  const barClass = 'h-auto min-h-14 w-full whitespace-normal rounded-2xl py-3 text-base font-bold shadow-xl'

  // Outro restaurante, ou cupom já usado: convite para assinar
  if (voucher.placeId !== props.placeId || voucher.status === 'used') {
    return (
      <Button asChild className={barClass}>
        <a
          href={whatsapp ? subscribeLink(whatsapp) : 'https://brasileirosnouruguai.com.br'}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Sparkles className="mr-2 h-5 w-5 text-brand-yellow" />
          Assine o guia para fazer check-in aqui
        </a>
      </Button>
    )
  }

  if (voucher.status === 'expired') {
    return (
      <Button disabled className={`${barClass} cursor-not-allowed opacity-70`}>
        Seu cupom expirou
        {voucher.expiresAt && ` em ${format(new Date(voucher.expiresAt), 'dd/MM/yyyy')}`}
      </Button>
    )
  }

  const discount = voucherDiscountNow(voucher, props)
  if (!discount) {
    return (
      <Button disabled className={`${barClass} cursor-not-allowed opacity-70`}>
        {props.nextRule
          ? `Seu cupom vale a partir das ${props.nextRule.startTime}`
          : 'Fora do horário de desconto'}
      </Button>
    )
  }

  const handleConfirm = async () => {
    setSaving(true)
    const ok = await redeemVoucher(discount)
    setSaving(false)
    if (ok) setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Gift className="mr-2 h-5 w-5" /> Usar meu cupom
      </Button>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Usar o cupom agora?</DialogTitle>
          <DialogDescription className="pt-2 text-base">
            O cupom é de uso único: ao confirmar, o desconto fica ativo pelas próximas 24 horas e
            não poderá ser usado de novo. Use quando estiver no restaurante.
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-xl bg-brand-yellow/20 px-4 py-3 text-sm font-bold text-slate-900">
          Desconto: {discount.label}
        </p>
        <div className="mt-4 flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usar cupom
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

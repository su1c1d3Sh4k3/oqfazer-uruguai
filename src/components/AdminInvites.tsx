import { useEffect, useState } from 'react'
import { Mail, Copy, Send, Ban, Loader2, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { PlaceSearchCombobox } from './PlaceSearchCombobox'
import { supabase, checkWrite, writeFailMessage } from '@/lib/supabase'
import { INVITE_ROLE_LABELS, INVITE_VALID_DAYS, InviteRole, inviteLink } from '@/lib/accounts'
import { sendTemplatedEmail } from '@/lib/emailService'
import { useAuth } from '@/context/AuthContext'
import { usePlaces } from '@/context/PlacesContext'

type InviteStatus = 'pending' | 'used' | 'expired' | 'revoked'

function inviteStatus(inv: any): InviteStatus {
  if (inv.revoked_at) return 'revoked'
  if (inv.used_at) return 'used'
  if (new Date(inv.expires_at).getTime() < Date.now()) return 'expired'
  return 'pending'
}

const STATUS_BADGE: Record<InviteStatus, { label: string; className: string }> = {
  pending: { label: 'Aguardando', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  used: { label: 'Utilizado', className: 'bg-green-50 text-green-600 border-green-200' },
  expired: { label: 'Expirado', className: 'bg-slate-50 text-slate-500' },
  revoked: { label: 'Cancelado', className: 'bg-red-50 text-red-600 border-red-200' },
}

const formatDate = (d: string | number) =>
  new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

/** Fim do dia escolhido (yyyy-mm-dd) no fuso do app */
const endOfDay = (date: string) => new Date(`${date}T23:59:59-03:00`).toISOString()

/** Data (yyyy-mm-dd) daqui a N dias no fuso do app */
const inDays = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
    timeZone: 'America/Sao_Paulo',
  })

const EMPTY_FORM = () => ({
  email: '',
  role: 'user' as InviteRole,
  managedPlaceId: '',
  voucherPlaceId: '',
  discountMode: 'default' as 'default' | 'custom',
  voucherDiscount: '',
  hoursOnly: false,
  validUntil: inDays(30),
})

async function sendInviteEmail(inv: any, placeName?: string) {
  if (inv.role === 'voucher') {
    return sendTemplatedEmail('voucher', inv.email, 'Você ganhou um cupom no O que Fazer no Uruguai?', {
      email: inv.email,
      restaurante: placeName || 'restaurante parceiro',
      desconto: inv.voucher_discount || 'desconto exclusivo',
      link: inviteLink(inv.token),
      validade: formatDate(inv.voucher_expires_at || inv.expires_at),
    })
  }
  return sendTemplatedEmail('invite', inv.email, 'Seu convite para o O que Fazer no Uruguai?', {
    email: inv.email,
    tipo_conta: INVITE_ROLE_LABELS[inv.role as InviteRole] || inv.role,
    link: inviteLink(inv.token),
    validade: new Date(inv.expires_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  })
}

function copyLink(token: string) {
  navigator.clipboard
    .writeText(inviteLink(token))
    .then(() => toast.success('Link do convite copiado!'))
    .catch(() => toast.error('Não foi possível copiar. Link: ' + inviteLink(token)))
}

/** Convites individuais: um email, um tipo de conta travado, uso único. */
export function AdminInvites({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { currentUser } = useAuth()
  const [invites, setInvites] = useState<any[]>([])
  const { allPlaces } = usePlaces()
  const placeName = (id?: string | null) => allPlaces.find((p) => p.id === id)?.name
  const [form, setForm] = useState(EMPTY_FORM)
  // Cupons: quando o ganhador usou (voucher_used_at do perfil criado pelo convite)
  const [voucherUsage, setVoucherUsage] = useState<Record<string, number | null>>({})
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadInvites = async () => {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setInvites(data || [])
    const userIds = (data || []).filter((i) => i.role === 'voucher' && i.used_by).map((i) => i.used_by)
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, voucher_used_at')
        .in('id', userIds)
      setVoucherUsage(Object.fromEntries((profiles || []).map((p) => [p.id, p.voucher_used_at])))
    }
  }

  useEffect(() => {
    loadInvites()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = form.email.trim().toLowerCase()
    if (form.role === 'establishment' && !form.managedPlaceId) {
      toast.error('Escolha o estabelecimento que essa conta vai gerenciar.')
      return
    }
    const isVoucher = form.role === 'voucher'
    if (isVoucher) {
      const place = allPlaces.find((p) => p.id === form.voucherPlaceId)
      if (!place) {
        toast.error('Escolha o restaurante do cupom.')
        return
      }
      if (place.type === 'tour') {
        toast.error('O cupom de sorteio vale apenas para restaurantes.')
        return
      }
      if (form.discountMode === 'custom' && !form.voucherDiscount.trim()) {
        toast.error('Informe o desconto do cupom (ex.: 20% OFF).')
        return
      }
      if (!form.validUntil || form.validUntil < inDays(0)) {
        toast.error('A validade do cupom precisa ser hoje ou uma data futura.')
        return
      }
    }

    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).limit(1)
    if (existing?.length) {
      toast.error('Já existe uma conta com este e-mail.')
      return
    }

    setSaving(true)
    const id = crypto.randomUUID()
    const result = await checkWrite(
      supabase
        .from('invites')
        .insert({
          id,
          email,
          role: form.role,
          managed_place_id: form.role === 'establishment' ? form.managedPlaceId : null,
          created_by: currentUser?.id,
          ...(isVoucher && {
            voucher_place_id: form.voucherPlaceId,
            voucher_discount: form.discountMode === 'custom' ? form.voucherDiscount.trim() : null,
            voucher_hours_only: form.discountMode === 'custom' && form.hoursOnly,
            voucher_expires_at: endOfDay(form.validUntil),
            // O link do convite vale enquanto o cupom valer
            expires_at: endOfDay(form.validUntil),
          }),
        })
        .select('id'),
    )
    if (!result.ok) {
      setSaving(false)
      toast.error('Erro ao criar convite', { description: writeFailMessage(result) })
      return
    }

    const { data: inv } = await supabase.from('invites').select('*').eq('id', id).single()
    const sent = inv ? await sendInviteEmail(inv, placeName(inv.voucher_place_id)) : { success: false }
    setSaving(false)

    if (sent.success) {
      toast.success(`Convite enviado para ${email}!`)
    } else {
      toast.warning('Convite criado, mas o e-mail não foi enviado.', {
        description: 'Use o botão de copiar link na lista para enviar manualmente.',
      })
    }
    setForm(EMPTY_FORM())
    onOpenChange(false)
    loadInvites()
  }

  // Reenviar renova a validade (convite expirado volta a valer por 7 dias).
  // Cupom: a validade é a definida na criação — vencido, só criando outro.
  const resend = async (inv: any) => {
    if (inv.role === 'voucher') {
      if (new Date(inv.expires_at).getTime() < Date.now()) {
        toast.error('Este cupom já venceu. Crie um novo convite de cupom.')
        return
      }
      setBusyId(inv.id)
      const sent = await sendInviteEmail(inv, placeName(inv.voucher_place_id))
      setBusyId(null)
      if (sent.success) toast.success(`Cupom reenviado para ${inv.email}!`)
      else toast.error('Falha ao enviar e-mail', { description: sent.error })
      return
    }
    setBusyId(inv.id)
    const expires_at = new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const result = await checkWrite(
      supabase.from('invites').update({ expires_at }).eq('id', inv.id).select('id'),
    )
    if (!result.ok) {
      setBusyId(null)
      toast.error('Erro ao renovar convite', { description: writeFailMessage(result) })
      return
    }
    const sent = await sendInviteEmail({ ...inv, expires_at })
    setBusyId(null)
    if (sent.success) toast.success(`Convite reenviado para ${inv.email}!`)
    else toast.error('Falha ao enviar e-mail', { description: sent.error })
    loadInvites()
  }

  const revoke = async (inv: any) => {
    if (!confirm(`Cancelar o convite de ${inv.email}? O link deixará de funcionar.`)) return
    setBusyId(inv.id)
    const result = await checkWrite(
      supabase
        .from('invites')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', inv.id)
        .select('id'),
    )
    setBusyId(null)
    if (!result.ok) {
      toast.error('Erro ao cancelar convite', { description: writeFailMessage(result) })
      return
    }
    toast.success('Convite cancelado.')
    loadInvites()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar para o app</DialogTitle>
            <DialogDescription>
              A pessoa recebe um link por e-mail, de uso único, que cria a conta já com o tipo
              escolhido. Vale por {INVITE_VALID_DAYS} dias (cupom: até a validade escolhida).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="pessoa@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as InviteRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário Comum</SelectItem>
                  <SelectItem value="establishment">Empresa / Estabelecimento</SelectItem>
                  <SelectItem value="agency">Agência (vê apenas restaurantes)</SelectItem>
                  <SelectItem value="voucher">Cupom de restaurante (sorteio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'voucher' && (
              <div className="space-y-4 rounded-xl border border-brand-yellow/60 bg-brand-yellow/10 p-4">
                <p className="text-xs text-slate-600">
                  A conta vê os restaurantes do guia, mas só pode fazer <strong>um check-in</strong>,
                  no restaurante escolhido. Depois disso recebe o convite para assinar.
                </p>
                <div className="space-y-2">
                  <Label>Restaurante</Label>
                  <PlaceSearchCombobox
                    value={form.voucherPlaceId}
                    onChange={(v) => setForm({ ...form, voucherPlaceId: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desconto</Label>
                  <Select
                    value={form.discountMode}
                    onValueChange={(v) => setForm({ ...form, discountMode: v as 'default' | 'custom' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Desconto padrão do restaurante</SelectItem>
                      <SelectItem value="custom">Desconto específico</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.discountMode === 'default' ? (
                    <p className="text-xs text-muted-foreground">
                      Vale o desconto em vigor no momento do check-in, com os horários de desconto
                      do restaurante.
                    </p>
                  ) : (
                    <>
                      <Input
                        value={form.voucherDiscount}
                        maxLength={80}
                        onChange={(e) => setForm({ ...form, voucherDiscount: e.target.value })}
                        placeholder="Ex: 20% OFF"
                      />
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={form.hoursOnly}
                          onCheckedChange={(v) => setForm({ ...form, hoursOnly: v === true })}
                          className="mt-0.5"
                        />
                        <span>
                          Só nos horários de desconto do restaurante
                          <span className="block text-xs text-muted-foreground">
                            Desmarcado: o cupom vale em qualquer horário.
                          </span>
                        </span>
                      </label>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Válido até</Label>
                  <Input
                    type="date"
                    required
                    min={inDays(0)}
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  />
                </div>
              </div>
            )}
            {form.role === 'establishment' && (
              <div className="space-y-2">
                <Label>Estabelecimento Vinculado</Label>
                <PlaceSearchCombobox
                  value={form.managedPlaceId}
                  onChange={(v) => setForm({ ...form, managedPlaceId: v })}
                />
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar Convite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {invites.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Convites</h3>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {invites.map((inv) => {
              const status = inviteStatus(inv)
              const isVoucherInvite = inv.role === 'voucher'
              const usedAt = isVoucherInvite && inv.used_by ? voucherUsage[inv.used_by] : null
              const badge =
                isVoucherInvite && status === 'used'
                  ? usedAt
                    ? { label: `Cupom usado em ${formatDate(usedAt)}`, className: STATUS_BADGE.used.className }
                    : { label: 'Conta criada', className: 'bg-amber-50 text-amber-700 border-amber-200' }
                  : STATUS_BADGE[status]
              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border/50 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    {isVoucherInvite && (
                      <p className="flex items-center gap-1 text-xs font-medium text-slate-700">
                        <Gift className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">
                          {placeName(inv.voucher_place_id) || 'Restaurante removido'} ·{' '}
                          {inv.voucher_discount || 'desconto padrão'}
                          {inv.voucher_discount && inv.voucher_hours_only && ' (nos horários de desconto)'}
                          {inv.voucher_expires_at && ` · válido até ${formatDate(inv.voucher_expires_at)}`}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {INVITE_ROLE_LABELS[inv.role as InviteRole] || inv.role} · enviado em{' '}
                      {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                      {status === 'pending' &&
                        ` · expira em ${new Date(inv.expires_at).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                    {status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Copiar link"
                        onClick={() => copyLink(inv.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {(status === 'pending' || status === 'expired') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500"
                        title="Reenviar e-mail"
                        disabled={busyId === inv.id}
                        onClick={() => resend(inv)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {(status === 'pending' || status === 'expired') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        title="Cancelar convite"
                        disabled={busyId === inv.id}
                        onClick={() => revoke(inv)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

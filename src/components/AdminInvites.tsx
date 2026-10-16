import { useEffect, useState } from 'react'
import { Mail, Copy, Send, Ban, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { PlaceSearchCombobox } from './PlaceSearchCombobox'
import { supabase, checkWrite, writeFailMessage } from '@/lib/supabase'
import { INVITE_ROLE_LABELS, INVITE_VALID_DAYS, InviteRole, inviteLink } from '@/lib/accounts'
import { sendTemplatedEmail } from '@/lib/emailService'
import { useAuth } from '@/context/AuthContext'

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

async function sendInviteEmail(inv: any) {
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
  const [form, setForm] = useState<{ email: string; role: InviteRole; managedPlaceId: string }>({
    email: '',
    role: 'user',
    managedPlaceId: '',
  })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadInvites = async () => {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setInvites(data || [])
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
        })
        .select('id'),
    )
    if (!result.ok) {
      setSaving(false)
      toast.error('Erro ao criar convite', { description: writeFailMessage(result) })
      return
    }

    const { data: inv } = await supabase.from('invites').select('*').eq('id', id).single()
    const sent = inv ? await sendInviteEmail(inv) : { success: false }
    setSaving(false)

    if (sent.success) {
      toast.success(`Convite enviado para ${email}!`)
    } else {
      toast.warning('Convite criado, mas o e-mail não foi enviado.', {
        description: 'Use o botão de copiar link na lista para enviar manualmente.',
      })
    }
    setForm({ email: '', role: 'user', managedPlaceId: '' })
    onOpenChange(false)
    loadInvites()
  }

  // Reenviar renova a validade (convite expirado volta a valer por 7 dias)
  const resend = async (inv: any) => {
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
              A pessoa recebe um link por e-mail, válido por {INVITE_VALID_DAYS} dias e de uso
              único, que cria a conta já com o tipo escolhido.
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
                </SelectContent>
              </Select>
            </div>
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
              const badge = STATUS_BADGE[status]
              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border/50 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
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

import { useState } from 'react'
import { Check, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { callAccounts } from '@/lib/accounts'
import { sendTemplatedEmail } from '@/lib/emailService'

/** Solicitações feitas pela tela pública /cadastro, aguardando o admin. */
export function AdminSignupRequests({
  requests,
  onChange,
}: {
  requests: any[]
  onChange: () => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  if (requests.length === 0) return null

  const approve = async (u: any) => {
    setBusyId(u.id)
    const result = await callAccounts('approve', { userId: u.id }, true)
    setBusyId(null)
    if (!result.success) {
      toast.error('Erro ao aprovar', { description: result.error })
      return
    }
    toast.success(`Cadastro de ${u.name || u.email} aprovado!`)
    sendTemplatedEmail('signup_approved', u.email, 'Seu cadastro foi aprovado!', {
      nome: u.name || u.email,
      email: u.email,
      link: `${window.location.origin}/auth`,
    }).catch(console.error)
    onChange()
  }

  const reject = async (u: any) => {
    if (!confirm(`Recusar e excluir a solicitação de ${u.name || u.email}?`)) return
    setBusyId(u.id)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ userId: u.id, action: 'delete' }),
    })
    const result = await res.json().catch(() => ({ success: false }))
    setBusyId(null)
    if (!result.success) {
      toast.error('Erro ao recusar: ' + (result.error || 'Erro desconhecido'))
      return
    }
    toast.success('Solicitação recusada.')
    onChange()
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-600" />
        <h3 className="font-semibold text-amber-900">
          Solicitações de cadastro aguardando aprovação ({requests.length})
        </h3>
      </div>
      <div className="space-y-2">
        {requests.map((u) => (
          <div
            key={u.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white border border-amber-100 p-4"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{u.name || '-'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {u.email} | Tel: {u.phone || '-'}
                {u.travel_period ? ` | Viagem: ${u.travel_period}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {u.adults ?? 1} adulto{(u.adults ?? 1) > 1 ? 's' : ''}
                {(u.children ?? 0) > 0 && ` + ${u.children} criança${u.children > 1 ? 's' : ''}`}
                {u.first_login_at && ` · solicitado em ${new Date(u.first_login_at).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === u.id}
                onClick={() => reject(u)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" /> Recusar
              </Button>
              <Button size="sm" disabled={busyId === u.id} onClick={() => approve(u)}>
                <Check className="h-4 w-4 mr-1" /> Aprovar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

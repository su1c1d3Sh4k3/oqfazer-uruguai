import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MailOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { callAccounts, INVITE_ROLE_LABELS, InviteRole } from '@/lib/accounts'
import { sendTemplatedEmail } from '@/lib/emailService'

interface InviteInfo {
  email: string
  role: InviteRole
  placeName: string | null
}

// Aceite de convite: o tipo de conta (e o estabelecimento) vêm travados do
// convite — a pessoa só define a senha e completa os dados.
export default function AcceptInvite() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    travelPeriod: '',
    adults: 1,
    children: 0,
    password: '',
    confirm: '',
  })

  useEffect(() => {
    callAccounts('invite-info', { token }).then((result) => {
      if (result.success) {
        setInvite({ email: result.email, role: result.role, placeName: result.placeName })
      } else {
        setError(result.error || 'Convite inválido.')
      }
    })
  }, [token])

  const set = (field: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invite) return
    if (form.password !== form.confirm) {
      toast.error('As senhas não coincidem.')
      return
    }
    setIsLoading(true)
    const { confirm: _, ...payload } = form
    const result = await callAccounts('accept-invite', { token, ...payload })
    if (!result.success) {
      setIsLoading(false)
      toast.error('Não foi possível criar a conta', { description: result.error })
      return
    }

    sendTemplatedEmail('welcome', invite.email, 'Bem-vindo ao O que Fazer no Uruguai!', {
      nome: form.name || invite.email,
      email: invite.email,
    }).catch(console.error)

    const user = await login(invite.email, form.password)
    setIsLoading(false)
    if (!user) {
      navigate('/auth')
      return
    }
    navigate(user.role === 'establishment' ? '/empresa' : user.role === 'agency' ? '/' : '/profile')
  }

  const isUser = invite?.role === 'user'

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[calc(100vh-140px)] py-10">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <MailOpen className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Criar sua conta</h1>
          {invite && (
            <p className="text-slate-500 text-sm mt-2">
              Convite para <strong>{invite.email}</strong> como{' '}
              <strong>{INVITE_ROLE_LABELS[invite.role]}</strong>
              {invite.placeName && (
                <>
                  {' '}de <strong>{invite.placeName}</strong>
                </>
              )}
              .
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/auth">Ir para o Login</Link>
            </Button>
          </div>
        ) : !invite ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">Verificando convite...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-name">
                {invite.role === 'establishment' ? 'Nome do responsável' : 'Nome completo'}
              </Label>
              <Input
                id="inv-name"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-phone">Telefone / WhatsApp</Label>
              <Input
                id="inv-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            {isUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="inv-travel">Período da viagem (opcional)</Label>
                  <Input
                    id="inv-travel"
                    value={form.travelPeriod}
                    onChange={(e) => set('travelPeriod', e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="Ex: 10/12/2026 a 20/12/2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inv-adults">Adultos</Label>
                    <Input
                      id="inv-adults"
                      type="number"
                      min={1}
                      max={20}
                      value={form.adults}
                      onChange={(e) => set('adults', parseInt(e.target.value) || 1)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inv-children">Crianças (3 a 7 anos)</Label>
                    <Input
                      id="inv-children"
                      type="number"
                      min={0}
                      max={20}
                      value={form.children}
                      onChange={(e) => set('children', parseInt(e.target.value) || 0)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="inv-pwd">Senha</Label>
              <Input
                id="inv-pwd"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="h-12 rounded-xl"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-confirm">Confirmar senha</Label>
              <Input
                id="inv-confirm"
                type="password"
                required
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-bold rounded-xl mt-2"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>
              ) : (
                'Criar minha conta'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

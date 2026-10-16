import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { callAccounts } from '@/lib/accounts'

// Solicitação pública de cadastro: a conta nasce bloqueada e só passa a
// funcionar depois que o admin aprova no painel (Usuários → Solicitações).
export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    travelPeriod: '',
    adults: 1,
    children: 0,
    password: '',
    confirm: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (field: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('As senhas não coincidem.')
      return
    }
    setIsLoading(true)
    const { confirm: _, ...payload } = form
    const result = await callAccounts('request-signup', payload)
    setIsLoading(false)
    if (!result.success) {
      toast.error('Não foi possível enviar o cadastro', { description: result.error })
      return
    }
    setSent(true)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[calc(100vh-140px)] py-10">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        {sent ? (
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4 text-secondary">
              <MailCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-display">Cadastro enviado!</h1>
            <p className="text-slate-500 text-sm mt-2">
              Seu cadastro será analisado pela nossa equipe. Você receberá um e-mail em{' '}
              <strong>{form.email}</strong> assim que ele for aprovado.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/">Voltar para o início</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <UserPlus className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 font-display">Solicitar Cadastro</h1>
              <p className="text-slate-500 text-sm mt-2">
                Preencha seus dados. O acesso é liberado após a aprovação da nossa equipe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="su-name">Nome completo</Label>
                <Input
                  id="su-name"
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">E-mail</Label>
                <Input
                  id="su-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-phone">Telefone / WhatsApp</Label>
                <Input
                  id="su-phone"
                  required
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-travel">Período da viagem (opcional)</Label>
                <Input
                  id="su-travel"
                  value={form.travelPeriod}
                  onChange={(e) => set('travelPeriod', e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder="Ex: 10/12/2026 a 20/12/2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="su-adults">Adultos</Label>
                  <Input
                    id="su-adults"
                    type="number"
                    min={1}
                    max={20}
                    value={form.adults}
                    onChange={(e) => set('adults', parseInt(e.target.value) || 1)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-children">Crianças (3 a 7 anos)</Label>
                  <Input
                    id="su-children"
                    type="number"
                    min={0}
                    max={20}
                    value={form.children}
                    onChange={(e) => set('children', parseInt(e.target.value) || 0)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-pwd">Senha</Label>
                <Input
                  id="su-pwd"
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
                <Label htmlFor="su-confirm">Confirmar senha</Label>
                <Input
                  id="su-confirm"
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
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  'Enviar cadastro'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Já tem conta?{' '}
              <Link to="/auth" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

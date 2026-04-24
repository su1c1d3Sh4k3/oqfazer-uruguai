import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Store } from 'lucide-react'
import { toast } from 'sonner'
import { CompanyDashboard } from '@/components/CompanyDashboard'

export default function EstablishmentAdmin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { login, currentUser } = useAuth()
  const navigate = useNavigate()

  if (currentUser?.role === 'establishment') {
    return (
      <div className="flex h-full flex-col px-4 pb-12 pt-4 md:px-8 md:pt-8 w-full animate-fade-in">
        <CompanyDashboard />
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    try {
      const user = await login(email, password)
      if (user) {
        navigate(`/empresa?tab=edit`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ email: forgotEmail, redirectTo: window.location.origin + '/reset-password' }),
        },
      )
      const result = await res.json()
      if (result.success) {
        toast.success('Link enviado!', {
          description: 'Verifique a caixa de entrada da sua empresa.',
        })
      } else {
        toast.error('Erro ao enviar link', { description: result.error || 'Erro desconhecido' })
      }
    } catch {
      toast.error('Erro ao enviar link de recuperação.')
    }
    setShowForgot(false)
    setForgotEmail('')
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Acesso Empresa</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gerencie sua página e acompanhe suas métricas de desempenho.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-email">E-mail de Acesso</Label>
            <Input
              id="company-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="contato@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="company-pwd">Senha</Label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
            <Input
              id="company-pwd"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={!email || !password || isLoading}
            className="mt-2 h-12 w-full rounded-xl text-base font-bold"
          >
            {isLoading ? 'Acessando...' : 'Acessar Painel'}
          </Button>
        </form>

        <Dialog open={showForgot} onOpenChange={setShowForgot}>
          <DialogContent className="sm:max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Recuperar Senha Empresarial</DialogTitle>
              <DialogDescription>
                Informe o e-mail de acesso para receber o link de redefinição.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleForgot} className="mt-2 space-y-3">
              <Input
                type="email"
                placeholder="contato@empresa.com"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Enviar link de recuperação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

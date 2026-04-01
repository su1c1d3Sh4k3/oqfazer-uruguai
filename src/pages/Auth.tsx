import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Compass } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const success = await login(email, password)
      if (success) {
        // Fetch profile to determine role
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profile?.role === 'establishment') {
            navigate('/empresa')
          } else {
            navigate('/profile')
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + '/auth',
    })

    if (error) {
      toast.error('Erro ao enviar link', { description: error.message })
    } else {
      toast.success('Link enviado!', {
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      })
    }
    setShowForgot(false)
    setForgotEmail('')
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[calc(100vh-140px)] py-10">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Compass className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Bem-vindo(a)</h1>
          <p className="text-slate-500 text-sm mt-2">
            Faça login para acessar sua conta. O cadastro de novos usuários é restrito.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-pwd">Senha</Label>
              <Dialog open={showForgot} onOpenChange={setShowForgot}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Esqueci a senha
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Recuperar Senha</DialogTitle>
                    <DialogDescription>
                      Digite seu e-mail para receber o link de recuperação.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleForgot} className="mt-2 space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder="seu@email.com"
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
            <Input
              id="login-pwd"
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
            disabled={isLoading}
            className="w-full h-12 text-base font-bold rounded-xl mt-2"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}

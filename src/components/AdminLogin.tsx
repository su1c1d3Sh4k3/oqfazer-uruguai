import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import logoUrl from '@/assets/favicon-bnu-9afaa.jpg'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Props {
  onLogin: (pwd: string) => boolean
}

export function AdminLogin({ onLogin }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (typeof onLogin === 'function') {
      if (onLogin(password)) {
        setError('')
      } else {
        setError('Senha incorreta')
      }
    } else {
      setError('Erro interno de login. Recarregue a página.')
    }
  }

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    toast.success('Solicitação enviada!', {
      description: 'As instruções foram enviadas para o e-mail do administrador master.',
    })
    setShowForgot(false)
    setForgotEmail('')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl border border-border/50 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 overflow-hidden rounded-full flex items-center justify-center mb-2 shadow-sm border border-border/50 bg-white">
            <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-primary">Acesso Restrito</h1>
            <div className="flex flex-col mt-2">
              <span className="text-sm font-bold text-foreground tracking-tight">
                O que Fazer no Uruguai?
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                por Brasileiros no Uruguai
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha de Administrador</Label>
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
                    <DialogTitle>Recuperar Senha Admin</DialogTitle>
                    <DialogDescription>
                      Informe o e-mail master para receber as instruções de recuperação de acesso.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleForgot} className="mt-2 space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder="admin@brasileirosnouruguai.com.br"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                    <Button type="submit" className="w-full">
                      Enviar instruções
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Digite a senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <Button type="submit" className="w-full h-11 text-base font-medium">
            Acessar Painel
          </Button>
        </form>
      </div>
    </div>
  )
}

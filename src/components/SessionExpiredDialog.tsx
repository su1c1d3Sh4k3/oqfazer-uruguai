import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
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

/**
 * Aparece quando a sessão do Supabase cai com o usuário ainda na tela.
 * Login aqui NÃO recarrega a página — o que estava digitado nos formulários continua lá.
 */
export function SessionExpiredDialog() {
  const { currentUser, login, logout, dismissSessionExpired } = useAuth()
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await login(email, password)
    setSubmitting(false)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && dismissSessionExpired()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Sua sessão expirou
          </DialogTitle>
          <DialogDescription className="text-left">
            Enquanto você não entrar de novo, <strong>nenhuma alteração será salva</strong>. Entre
            abaixo — o que você digitou nos formulários continua na tela — e clique em salvar
            novamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-email">E-mail</Label>
            <Input
              id="session-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-password">Senha</Label>
            <Input
              id="session-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar novamente'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={logout}>
            Sair da conta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase redirects with hash fragments containing access_token and type=recovery
    // We need to let Supabase client pick up the session from the URL
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      // Supabase client auto-detects the hash and sets the session
      // Wait a moment for it to process
      const checkSession = async () => {
        // Give Supabase a moment to process the hash
        await new Promise((r) => setTimeout(r, 1000))
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSessionReady(true)
        } else {
          setError('Link de recuperação inválido ou expirado. Solicite um novo link.')
        }
      }
      checkSession()
    } else if (hash && hash.includes('error')) {
      const params = new URLSearchParams(hash.substring(1))
      const errorDesc = params.get('error_description')
      setError(errorDesc || 'Link de recuperação inválido ou expirado.')
    } else {
      // No hash tokens - check if there's already an active session from a previous redirect
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true)
        } else {
          setError('Acesse esta página através do link enviado por email.')
        }
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast.error('Erro ao redefinir senha: ' + error.message)
      } else {
        toast.success('Senha redefinida com sucesso!')
        // Clear hash from URL
        window.location.hash = ''
        setTimeout(() => navigate('/auth'), 1500)
      }
    } catch {
      toast.error('Erro inesperado ao redefinir senha.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[calc(100vh-140px)] py-10">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <KeyRound className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Redefinir Senha</h1>
          <p className="text-slate-500 text-sm mt-2">
            Digite sua nova senha abaixo.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/auth')}
            >
              Voltar para o Login
            </Button>
          </div>
        ) : !sessionReady ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">Verificando link de recuperação...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="Repita a nova senha"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-bold rounded-xl mt-2"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redefinindo...</>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

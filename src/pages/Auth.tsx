import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regCpf, setRegCpf] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regTravelPeriod, setRegTravelPeriod] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login(email, password)
    navigate('/profile')
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Senhas incompatíveis', {
        description: 'A senha e a confirmação devem ser iguais.',
      })
      return
    }
    register(email, password, {
      name: regName,
      cpf: regCpf,
      phone: regPhone,
      travelPeriod: regTravelPeriod,
    })
    navigate('/profile')
  }

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    toast.success('Link enviado!', {
      description: 'Verifique sua caixa de entrada para redefinir a senha.',
    })
    setShowForgot(false)
    setForgotEmail('')
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    value = value.replace(/(\d{3})(\d)/, '$1.$2')
    value = value.replace(/(\d{3})(\d)/, '$1.$2')
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    setRegCpf(value)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2')
    value = value.replace(/(\d)(\d{4})$/, '$1-$2')
    setRegPhone(value)
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
            Salve seus locais favoritos e progresso pelo Uruguai na nuvem.
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 h-12 bg-slate-100 rounded-xl p-1">
            <TabsTrigger value="login" className="rounded-lg font-bold">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg font-bold">
              Cadastro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
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
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl mt-2">
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="João da Silva"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    required
                    value={regCpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    required
                    value={regPhone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Período da Viagem</Label>
                  <Input
                    required
                    value={regTravelPeriod}
                    onChange={(e) => setRegTravelPeriod(e.target.value)}
                    placeholder="Ex: 10/12 a 20/12"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl"
                    placeholder="Mínimo 6 chars"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha</Label>
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-xl"
                    placeholder="Repita a senha"
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="w-full h-12 text-base font-bold rounded-xl mt-4"
              >
                Criar Conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

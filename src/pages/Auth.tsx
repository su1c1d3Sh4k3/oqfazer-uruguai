import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Compass } from 'lucide-react'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login(email, password)
    navigate('/profile')
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    register(email, password)
    navigate('/profile')
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[calc(100vh-140px)]">
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
                <Label htmlFor="login-pwd">Senha</Label>
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
                <Label htmlFor="reg-email">E-mail</Label>
                <Input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-pwd">Senha</Label>
                <Input
                  id="reg-pwd"
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
                variant="secondary"
                className="w-full h-12 text-base font-bold rounded-xl mt-2"
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

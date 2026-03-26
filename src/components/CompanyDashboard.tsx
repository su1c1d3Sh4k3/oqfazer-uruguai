import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePlaces } from '@/context/PlacesContext'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminPlaceForm } from './AdminPlaceForm'
import { toast } from 'sonner'
import { Eye, MousePointerClick, CheckCircle2, ShieldCheck, Pencil } from 'lucide-react'

export function CompanyDashboard() {
  const { currentUser, logout } = useAuth()
  const { places, updatePlace, categories } = usePlaces()
  const [searchParams] = useSearchParams()

  const defaultTab = searchParams.get('tab') === 'edit' ? 'edit' : 'metrics'

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const managedPlace = places.find((p) => p.id === currentUser?.managedPlaceId)

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (newPwd.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    // Simulate API call
    setTimeout(() => {
      toast.success('Senha atualizada com sucesso!')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    }, 800)
  }

  if (!managedPlace) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-2">Estabelecimento não encontrado</h2>
        <p className="text-slate-500 mb-6">Não foi possível carregar os dados do seu negócio.</p>
        <Button onClick={logout}>Sair da Conta</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
            Painel da Empresa
          </h1>
          <p className="text-slate-500 font-medium">
            Gerenciando: <strong className="text-slate-700">{managedPlace.name}</strong>
          </p>
        </div>
        <Button variant="outline" onClick={logout} className="rounded-xl shadow-sm bg-white">
          Sair da Conta
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 max-w-[400px] mb-6 bg-slate-100/50 p-1 rounded-xl h-12">
          <TabsTrigger value="metrics" className="rounded-lg font-bold">
            Métricas e Conta
          </TabsTrigger>
          <TabsTrigger value="edit" className="rounded-lg font-bold">
            Editar Estabelecimento
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="metrics"
          className="space-y-8 animate-in fade-in duration-500 outline-none"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20 shadow-none">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Visualizações
                  </p>
                  <p className="text-3xl font-black text-primary">
                    {managedPlace.accessCount || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/5 border-secondary/20 shadow-none">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Check-ins Feitos
                  </p>
                  <p className="text-3xl font-black text-secondary">
                    {managedPlace.checkInCount || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-brand-yellow/10 border-brand-yellow/30 shadow-none">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                  <MousePointerClick className="h-6 w-6 text-brand-yellow drop-shadow-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Cliques no Cupom
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {managedPlace.couponClickCount || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-6 w-6 text-slate-400" />
              <h2 className="font-display text-xl font-bold text-slate-900">Segurança da Conta</h2>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-pwd">Senha Atual</Label>
                <Input
                  id="current-pwd"
                  type="password"
                  required
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pwd">Nova Senha</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pwd">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-pwd"
                    type="password"
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto h-12 px-8 font-bold rounded-xl shadow-md mt-2"
              >
                Atualizar Senha
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="animate-in fade-in duration-500 outline-none">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm w-full max-w-none">
            <div className="flex items-center gap-3 mb-6">
              <Pencil className="h-6 w-6 text-slate-400" />
              <h2 className="font-display text-xl font-bold text-slate-900">
                Editar Estabelecimento
              </h2>
            </div>
            <AdminPlaceForm
              initialData={managedPlace}
              categories={categories}
              onSave={(data) => {
                updatePlace(managedPlace.id, data)
                toast.success('Estabelecimento atualizado com sucesso!')
              }}
              isCompanyView
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

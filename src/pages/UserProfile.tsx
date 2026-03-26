import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserCircle, Mail, Phone, MapPin, CalendarDays, LogOut, ShieldCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function UserProfile() {
  const { currentUser, logout, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    travelPeriod: '',
  })
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [pwdForm, setPwdForm] = useState({ oldPwd: '', newPwd: '', confirmPwd: '' })

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        cpf: currentUser.cpf || '',
        phone: currentUser.phone || '',
        travelPeriod: currentUser.travelPeriod || '',
      })
    }
  }, [currentUser])

  if (!currentUser || currentUser.role !== 'user') {
    return <Navigate to="/" replace />
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile(formData)
  }

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdForm.newPwd !== pwdForm.confirmPwd) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (pwdForm.newPwd.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    toast.success('Senha atualizada com sucesso!')
    setIsPasswordModalOpen(false)
    setPwdForm({ oldPwd: '', newPwd: '', confirmPwd: '' })
  }

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4 animate-in fade-in duration-500 flex-1">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900 flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" /> Meu Perfil
          </h1>
          <p className="text-slate-500 mt-2">Mantenha seus dados atualizados.</p>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
        >
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200 rounded-2xl overflow-hidden mb-6">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl text-slate-800">Informações Pessoais</CardTitle>
            <CardDescription className="mt-1">
              Estes são os dados informados durante o seu cadastro.
            </CardDescription>
          </div>
          <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <ShieldCheck className="h-4 w-4" /> Alterar Senha
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription>Crie uma nova senha segura para o seu acesso.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSavePassword} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input
                    type="password"
                    required
                    value={pwdForm.oldPwd}
                    onChange={(e) => setPwdForm({ ...pwdForm, oldPwd: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    required
                    value={pwdForm.newPwd}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input
                    type="password"
                    required
                    value={pwdForm.confirmPwd}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPwd: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Salvar Nova Senha
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 flex items-center gap-2">
                  <UserCircle className="h-4 w-4" /> Nome Completo
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white border-slate-200 font-medium h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> E-mail (Acesso)
                </Label>
                <Input
                  readOnly
                  value={currentUser.email}
                  className="bg-slate-50 border-slate-200 font-medium h-11 text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> CPF
                </Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="bg-white border-slate-200 font-medium h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white border-slate-200 font-medium h-11"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-500 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Período da Viagem
                </Label>
                <Input
                  value={formData.travelPeriod}
                  onChange={(e) => setFormData({ ...formData, travelPeriod: e.target.value })}
                  className="bg-white border-slate-200 font-medium h-11"
                  placeholder="Ex: 10/12 a 20/12"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="h-11 px-8 font-bold rounded-xl shadow-md">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

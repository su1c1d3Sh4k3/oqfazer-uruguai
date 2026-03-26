import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePlaces } from '@/context/PlacesContext'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminPlaceForm } from './AdminPlaceForm'
import { toast } from 'sonner'
import {
  Eye,
  MousePointerClick,
  CheckCircle2,
  ShieldCheck,
  Pencil,
  MessageSquare,
  Star,
  Send,
  Building,
} from 'lucide-react'

export function CompanyDashboard() {
  const { currentUser, updateProfile } = useAuth()
  const { places, updatePlace } = usePlaces()
  const [searchParams] = useSearchParams()

  const defaultTab = searchParams.get('tab') === 'edit' ? 'edit' : 'metrics'

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const [regInfo, setRegInfo] = useState({
    responsibleName: currentUser?.responsibleName || '',
    ci: currentUser?.ci || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
  })

  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')

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
    updateProfile({ password: newPwd })
    toast.success('Senha atualizada com sucesso!')
    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
  }

  const handleSaveRegInfo = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile(regInfo)
  }

  const handleRequestDeletion = () => {
    if (
      confirm(
        'Tem certeza que deseja solicitar a exclusão da sua conta? Isso será analisado pela administração.',
      )
    ) {
      updateProfile({ deletionRequested: true })
    }
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactSubject || !contactMessage) return
    const body = encodeURIComponent(contactMessage)
    window.location.href = `mailto:contato@brasileirosnouruguai.com.br?subject=Contato do Parceiro do App - ${contactSubject}&body=${body}`
    toast.success('Mensagem preparada!', {
      description: 'Seu cliente de e-mail foi aberto com os detalhes.',
    })
    setContactSubject('')
    setContactMessage('')
  }

  if (!managedPlace) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-2">Estabelecimento não encontrado</h2>
        <p className="text-slate-500 mb-6">Não foi possível carregar os dados do seu negócio.</p>
      </div>
    )
  }

  const reviews = JSON.parse(localStorage.getItem('@uruguai:reviews') || '[]')
  const myReviews = reviews
    .filter((r: any) => r.placeId === managedPlace.id)
    .sort((a: any, b: any) => b.date - a.date)

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
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 max-w-3xl mb-6 bg-slate-100/50 p-1 rounded-xl h-auto md:h-12 gap-1 md:gap-0">
          <TabsTrigger value="metrics" className="rounded-lg font-bold">
            Métricas e Conta
          </TabsTrigger>
          <TabsTrigger value="edit" className="rounded-lg font-bold">
            Editar Estabelecimento
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg font-bold">
            Avaliações
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg font-bold">
            Contato
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

          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm max-w-2xl mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Building className="h-6 w-6 text-slate-400" />
              <h2 className="font-display text-xl font-bold text-slate-900">
                Informações de Registro
              </h2>
            </div>
            <form onSubmit={handleSaveRegInfo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Responsável</Label>
                  <Input
                    required
                    value={regInfo.responsibleName}
                    onChange={(e) => setRegInfo({ ...regInfo, responsibleName: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cédula de Identidade (CI)</Label>
                  <Input
                    required
                    value={regInfo.ci}
                    onChange={(e) => setRegInfo({ ...regInfo, ci: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    required
                    value={regInfo.phone}
                    onChange={(e) => setRegInfo({ ...regInfo, phone: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail de Acesso</Label>
                  <Input
                    type="email"
                    required
                    value={regInfo.email}
                    onChange={(e) => setRegInfo({ ...regInfo, email: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
              <Button type="submit" className="h-11 px-8 font-bold mt-2">
                Salvar Informações
              </Button>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-6 w-6 text-slate-400" />
              <h2 className="font-display text-xl font-bold text-slate-900">Segurança da Conta</h2>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pwd">Nova Senha</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="h-11 rounded-xl"
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
                    className="h-11 rounded-xl"
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
              <Button type="submit" className="h-11 px-8 font-bold shadow-md mt-2">
                Atualizar Senha
              </Button>
            </form>
          </div>

          <div className="bg-red-50 rounded-3xl p-6 md:p-8 border border-red-100 shadow-sm max-w-2xl mt-6">
            <h3 className="font-bold text-red-800 mb-2">Zona de Perigo</h3>
            <p className="text-sm text-red-600 mb-4">
              Ao solicitar a exclusão da sua conta, o administrador master será notificado. Esta
              ação não pode ser desfeita após a aprovação e o seu estabelecimento será desvinculado
              do sistema.
            </p>
            <Button
              variant="destructive"
              onClick={handleRequestDeletion}
              disabled={currentUser?.deletionRequested}
              className="font-bold"
            >
              {currentUser?.deletionRequested
                ? 'Exclusão Solicitada'
                : 'Solicitar Exclusão de Conta'}
            </Button>
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
              categories={[]}
              onSave={(data) => {
                updatePlace(managedPlace.id, data)
                toast.success('Estabelecimento atualizado com sucesso!')
              }}
              isCompanyView
            />
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="animate-in fade-in duration-500 outline-none">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-brand-yellow" />
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Avaliações dos Clientes
                </h2>
              </div>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold">
                {myReviews.length} avaliações
              </div>
            </div>

            {myReviews.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                Nenhuma avaliação recebida até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myReviews.map((r: any) => (
                  <div key={r.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
                      <p className="font-bold text-slate-800 text-sm truncate pr-2">
                        {r.userEmail}
                      </p>
                      <div className="flex items-center gap-1 bg-brand-yellow/10 text-brand-yellow px-2 py-1 rounded-md text-sm font-bold shrink-0">
                        <Star className="h-3.5 w-3.5 fill-current" /> {r.rating}.0
                      </div>
                    </div>
                    <p className="text-slate-600 font-medium text-sm mb-3">
                      {r.comment || <em className="text-slate-400">Sem comentário em texto</em>}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Enviado em {new Date(r.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="animate-in fade-in duration-500 outline-none">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h2 className="font-display text-xl font-bold text-slate-900">
                Contato com a Administração
              </h2>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Envie suas dúvidas, sugestões ou pedidos de ajuda diretamente para a equipe do
              Brasileiros no Uruguai.
            </p>
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Select value={contactSubject} onValueChange={setContactSubject} required>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Selecione o motivo do contato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dúvidas">Dúvidas</SelectItem>
                    <SelectItem value="Sugestões">Sugestões</SelectItem>
                    <SelectItem value="Ajuda">Ajuda / Suporte Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <div className="relative">
                  <Textarea
                    placeholder="Descreva aqui os detalhes..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value.slice(0, 500))}
                    className="min-h-[150px] resize-none rounded-xl bg-slate-50"
                    maxLength={500}
                    required
                  />
                  <span
                    className={`absolute bottom-3 right-3 text-xs font-bold ${contactMessage.length >= 500 ? 'text-red-500' : 'text-slate-400'}`}
                  >
                    {contactMessage.length}/500
                  </span>
                </div>
              </div>
              <Button type="submit" className="h-12 px-8 font-bold rounded-xl shadow-md w-full">
                <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

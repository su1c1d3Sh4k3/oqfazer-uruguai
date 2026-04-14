import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, UserPlus, Download, Check, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PlaceSearchCombobox } from './PlaceSearchCombobox'
import { supabase } from '@/lib/supabase'

export function AdminUsersList() {
  const [users, setUsers] = useState<any[]>([])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})

  const loadUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*')
    if (!error && data) {
      setUsers(data)
    } else {
      setUsers([])
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const { total, newThisMonth } = useMemo(() => {
    let newUsers = 0
    users.forEach((u) => {
      if (u.first_login_at) {
        const d = new Date(u.first_login_at)
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          newUsers++
        }
      }
    })
    return { total: users.length, newThisMonth: newUsers }
  }, [users, currentMonth, currentYear])

  const handleOpenDialog = (user?: any) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        role: user.role,
        name: user.name || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
        ci: user.ci || '',
        responsibleName: user.responsible_name || '',
        managedPlaceId: user.managed_place_id || '',
        travelPeriod: user.travel_period || '',
        password: '',
      })
    } else {
      setEditingUser(null)
      setFormData({ role: 'user', email: '', password: '', name: '', phone: '' })
    }
    setIsDialogOpen(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email) {
      toast.error('Email é obrigatório.')
      return
    }

    if (editingUser) {
      // Update existing profile — admin pode alterar qualquer campo
      const updateData: Record<string, any> = {
        role: formData.role,
        name: formData.name || null,
        phone: formData.phone || null,
        cpf: formData.cpf || null,
        ci: formData.ci || null,
        responsible_name: formData.responsibleName || null,
        managed_place_id: formData.managedPlaceId || null,
        travel_period: formData.travelPeriod || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingUser.id)

      if (error) {
        toast.error('Erro ao atualizar usuário')
        console.error(error)
        return
      }

      // Se admin alterou a senha
      if (formData.password) {
        toast.info('Nota: alteração de senha requer acesso admin no Supabase Dashboard.')
      }

      toast.success('Usuário atualizado!')
    } else {
      // Create new user via Supabase Auth
      if (!formData.password) {
        toast.error('Senha é obrigatória para novos usuários.')
        return
      }

      // Salva a sessão do admin antes do signUp (signUp troca a sessão)
      const { data: { session: adminSession } } = await supabase.auth.getSession()

      // Use signUp to create user (will trigger the profile creation trigger)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError || !authData.user) {
        // Restaura sessão admin em caso de erro
        if (adminSession) {
          await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          })
        }
        toast.error('Erro ao criar usuário: ' + (authError?.message || 'Erro desconhecido'))
        return
      }

      // Restaura a sessão do admin para que o upsert rode com permissões admin
      if (adminSession) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      // Pequeno delay para garantir que o trigger handle_new_user() completou
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Upsert the profile with additional data (handles race condition with trigger)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: formData.email,
        role: formData.role,
        name: formData.name || null,
        phone: formData.phone || null,
        cpf: formData.cpf || null,
        ci: formData.ci || null,
        responsible_name: formData.responsibleName || null,
        managed_place_id: formData.managedPlaceId || null,
        travel_period: formData.travelPeriod || null,
        first_login_at: new Date().toISOString(),
      }, { onConflict: 'id' })

      if (profileError) {
        console.error('Error updating profile:', profileError)
        toast.error('Usuário criado mas houve erro ao salvar dados do perfil.')
      } else {
        toast.success('Usuário criado com sucesso!')
      }
    }

    loadUsers()
    setIsDialogOpen(false)
  }

  const handleDelete = async (userId: string) => {
    if (confirm('Confirmar exclusão permanente deste usuário?')) {
      // Delete profile (cascade will handle)
      const { error } = await supabase.from('profiles').delete().eq('id', userId)
      if (error) {
        toast.error('Erro ao remover usuário')
        console.error(error)
        return
      }
      toast.success('Usuário removido.')
      loadUsers()
    }
  }

  const exportExcel = () => {
    const BOM = '\uFEFF'
    let csvContent = BOM + 'Nome/Responsavel;Email;Telefone;CPF/CI;Tipo;Data de Cadastro;Status\n'

    users.forEach((u) => {
      const name = u.name || u.responsible_name || ''
      const cleanName = name.replace(/"/g, '""')
      const email = u.email || ''
      const phone = u.phone || ''
      const doc = u.cpf || u.ci || ''
      const role = u.role === 'establishment' ? 'Empresa' : u.role === 'admin' ? 'Admin' : 'Usuário'
      const date = u.first_login_at ? new Date(u.first_login_at).toLocaleDateString() : ''
      const status = u.deletion_requested ? 'Exclusão Solicitada' : 'Ativo'

      csvContent += `"${cleanName}";"${email}";"${phone}";"${doc}";"${role}";"${date}";"${status}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'usuarios_bnu.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório de usuários exportado com sucesso!')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">Gerenciamento Centralizado de Contas</h2>
          <p className="text-sm text-muted-foreground">
            Crie, edite e acompanhe solicitações de exclusão de usuários e empresas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <UserPlus className="h-4 w-4" /> Nova Conta
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Conta' : 'Criar Nova Conta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário Comum</SelectItem>
                  <SelectItem value="establishment">Empresa / Estabelecimento</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail (Login)</Label>
                <Input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label>{editingUser ? 'Nova Senha (opcional)' : 'Senha'}</Label>
                <Input
                  required={!editingUser}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Deixe vazio para manter' : ''}
                />
              </div>
            </div>

            {formData.role === 'establishment' ? (
              <>
                <div className="space-y-2">
                  <Label>Estabelecimento Vinculado</Label>
                  <PlaceSearchCombobox
                    value={formData.managedPlaceId || ''}
                    onChange={(v) => setFormData({ ...formData, managedPlaceId: v })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Responsável</Label>
                    <Input
                      value={formData.responsibleName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, responsibleName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CI (Cédula de Identidade)</Label>
                    <Input
                      value={formData.ci || ''}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input
                      value={formData.cpf || ''}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período da Viagem</Label>
                    <Input
                      value={formData.travelPeriod || ''}
                      onChange={(e) => setFormData({ ...formData, travelPeriod: e.target.value })}
                      placeholder="Ex: 10/12/2024 a 20/12/2024"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit">Salvar Conta</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Total de Contas</p>
              <p className="text-3xl font-black text-foreground">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Novas neste mês</p>
              <p className="text-3xl font-black text-foreground">{newThisMonth}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Identificação</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users
              .sort((a, b) => (b.first_login_at || 0) - (a.first_login_at || 0))
              .map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <p>{u.name || u.responsible_name || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                      Doc: {u.cpf || u.ci || '-'} | Tel: {u.phone || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{u.email}</p>
                  </TableCell>
                  <TableCell>
                    {u.role === 'establishment' ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        Empresa
                      </Badge>
                    ) : u.role === 'admin' ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-600">
                        Usuário
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.deletion_requested ? (
                      <Badge variant="destructive" className="animate-pulse">
                        Exclusão Solicitada
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-green-50 text-green-600 border-green-200"
                      >
                        Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 items-center">
                      {u.deletion_requested && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(u.id)}
                          className="h-8 text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" /> Aprovar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(u)}
                        className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(u.id)}
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

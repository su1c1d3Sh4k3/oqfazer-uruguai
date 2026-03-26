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
import { Users, UserPlus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function AdminUsersList() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    try {
      const db = JSON.parse(localStorage.getItem('@uruguai:users_db') || '{}')
      setUsers(Object.values(db))
    } catch {
      setUsers([])
    }
  }, [])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const { total, newThisMonth } = useMemo(() => {
    let newUsers = 0
    users.forEach((u) => {
      if (u.firstLoginAt) {
        const d = new Date(u.firstLoginAt)
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          newUsers++
        }
      }
    })
    return { total: users.length, newThisMonth: newUsers }
  }, [users, currentMonth, currentYear])

  const exportExcel = () => {
    let csvContent = 'Nome,Email,CPF,Telefone,Periodo de Viagem,Tipo,Data de Cadastro\n'

    users.forEach((u) => {
      const name = u.name ? u.name.replace(/"/g, '""') : ''
      const email = u.email || ''
      const cpf = u.cpf || ''
      const phone = u.phone || ''
      const travel = u.travelPeriod ? u.travelPeriod.replace(/"/g, '""') : ''
      const role = u.role === 'establishment' ? 'Empresa' : 'Usuário'
      const date = u.firstLoginAt ? new Date(u.firstLoginAt).toLocaleDateString() : ''

      csvContent += `"${name}","${email}","${cpf}","${phone}","${travel}","${role}","${date}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'usuarios_bnu.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">Gerenciamento de Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Monitore a base de clientes e empresas ativas no aplicativo.
          </p>
        </div>
        <Button onClick={exportExcel} className="gap-2 shrink-0">
          <Download className="h-4 w-4" /> Exportar Dados
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Total de Usuários</p>
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
              <p className="text-sm font-bold text-muted-foreground">Novos neste mês</p>
              <p className="text-3xl font-black text-foreground">{newThisMonth}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone / CPF</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users
              .sort((a, b) => (b.firstLoginAt || 0) - (a.firstLoginAt || 0))
              .map((u, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{u.name || '-'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span>{u.phone || '-'}</span>
                      <span className="text-muted-foreground">{u.cpf || ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.role === 'establishment' ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        Empresa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-600">
                        Usuário
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {u.firstLoginAt ? new Date(u.firstLoginAt).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

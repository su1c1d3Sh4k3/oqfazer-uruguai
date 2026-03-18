import { useState } from 'react'
import { AdminPlaceForm } from '@/components/AdminPlaceForm'
import { AdminCategoryManager } from '@/components/AdminCategoryManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccess } from '@/context/AccessContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldAlert, LogOut, LayoutDashboard, Plus, Tags } from 'lucide-react'
import logoUrl from '@/assets/favicon-bnu-9afaa.jpg'

export default function Admin() {
  const { isGranted, grantAccess, revokeAccess } = useAccess()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (grantAccess(password)) {
      setError('')
    } else {
      setError('Senha incorreta')
    }
  }

  if (!isGranted) {
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

          <form onSubmit={handleLogin} className="space-y-4 mt-8">
            <div className="space-y-2">
              <Label htmlFor="password">Senha de Administrador</Label>
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

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border/50">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-full flex items-center justify-center shadow-sm border border-border/50 bg-white shrink-0">
            <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight leading-none mb-1.5">
              Painel de Controle
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-primary tracking-tight">
                O que Fazer no Uruguai?
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider hidden sm:inline-block mt-0.5">
                {' '}
                | por Brasileiros no Uruguai
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={revokeAccess} className="gap-2 shrink-0 h-10">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair do Painel</span>
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="w-full space-y-6">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 overflow-x-auto flex-nowrap hide-scrollbar">
          <TabsTrigger
            value="dashboard"
            className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger
            value="add"
            className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Local</span>
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Tags className="h-4 w-4" />
            <span>Categorias</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 outline-none">
          <div className="bg-card rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
            <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-2">
              <ShieldAlert className="h-10 w-10 text-primary/40" />
            </div>
            <h2 className="text-xl font-semibold">Bem-vindo ao Painel Administrativo</h2>
            <p className="text-muted-foreground max-w-md">
              Use as abas acima para adicionar novos locais recomendados ou gerenciar as categorias
              existentes no aplicativo "O que Fazer no Uruguai?".
            </p>
          </div>
        </TabsContent>

        <TabsContent value="add" className="mt-0 outline-none">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Cadastrar Novo Estabelecimento
              </h2>
            </div>
            <div className="p-6">
              <AdminPlaceForm />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-0 outline-none">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" /> Gerenciar Categorias
              </h2>
            </div>
            <div className="p-6">
              <AdminCategoryManager />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

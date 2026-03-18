import { useState } from 'react'
import { AdminPlaceForm } from '@/components/AdminPlaceForm'
import { AdminCategoryManager } from '@/components/AdminCategoryManager'
import { AdminPlacesList } from '@/components/AdminPlacesList'
import { AdminLogin } from '@/components/AdminLogin'
import { Button } from '@/components/ui/button'
import { useAccess } from '@/context/AccessContext'
import { usePlaces } from '@/context/PlacesContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, Plus, Tags, List } from 'lucide-react'
import logoUrl from '@/assets/favicon-bnu-9afaa.jpg'
import { Place } from '@/data/places'
import { toast } from 'sonner'

export default function Admin() {
  const { isGranted, grantAccess, revokeAccess } = useAccess()
  const { places, addPlace, updatePlace, deletePlace, categories } = usePlaces()
  const [activeTab, setActiveTab] = useState('list')
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined)

  if (!isGranted) {
    return <AdminLogin onLogin={grantAccess} />
  }

  const handleEdit = (place: Place) => {
    setEditingPlace(place)
    setActiveTab('form')
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este local permanentemente?')) {
      deletePlace(id)
      toast.success('Local excluído com sucesso')
    }
  }

  const handleSave = (place: Place) => {
    if (editingPlace) {
      updatePlace(place.id, place)
      toast.success('Local atualizado com sucesso!')
    } else {
      addPlace({ ...place, id: place.id || Math.random().toString(36).substr(2, 9) })
      toast.success('Novo local cadastrado com sucesso!')
    }
    setEditingPlace(undefined)
    setActiveTab('list')
  }

  const handleTabChange = (val: string) => {
    if (val === 'form' && activeTab !== 'form') {
      setEditingPlace(undefined)
    }
    setActiveTab(val)
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 overflow-x-auto flex-nowrap hide-scrollbar">
          <TabsTrigger
            value="list"
            className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Locais Cadastrados</span>
          </TabsTrigger>
          <TabsTrigger
            value="form"
            className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{editingPlace ? 'Editar Local' : 'Novo Local'}</span>
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Tags className="h-4 w-4" />
            <span>Categorias</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0 outline-none">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Lista de Estabelecimentos e Passeios</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie todos os locais ativos disponíveis no aplicativo.
            </p>
          </div>
          <AdminPlacesList places={places} onEdit={handleEdit} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="form" className="mt-0 outline-none">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />{' '}
                {editingPlace ? 'Editar' : 'Cadastrar Novo'} Estabelecimento
              </h2>
            </div>
            <div className="p-6">
              <AdminPlaceForm
                key={editingPlace?.id || 'new'}
                initialData={editingPlace}
                categories={categories}
                onSave={handleSave}
                onCancel={() => handleTabChange('list')}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-0 outline-none">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden p-6">
            <AdminCategoryManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

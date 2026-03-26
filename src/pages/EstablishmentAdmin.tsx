import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePlaces } from '@/context/PlacesContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Check, ChevronsUpDown, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function EstablishmentAdmin() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)

  const { places } = usePlaces()
  const { loginEstablishment } = useAuth()
  const navigate = useNavigate()

  const filteredPlaces = useMemo(() => {
    if (searchQuery.length < 3) return []
    const lowerQ = searchQuery.toLowerCase()
    return places.filter((p) => p.name.toLowerCase().includes(lowerQ))
  }, [places, searchQuery])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlaceId || !password) return
    loginEstablishment(selectedPlaceId, password)
    navigate(`/profile?tab=edit`)
  }

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    toast.success('Link enviado!', {
      description: 'Verifique a caixa de entrada da sua empresa.',
    })
    setShowForgot(false)
    setForgotEmail('')
  }

  const selectedPlace = places.find((p) => p.id === selectedPlaceId)

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Acesso Empresa</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gerencie sua página e acompanhe suas métricas.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex flex-col space-y-2">
            <Label>Estabelecimento</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="h-12 w-full justify-between rounded-xl border-slate-200 font-normal"
                >
                  <span className="truncate">
                    {selectedPlace ? selectedPlace.name : 'Selecione o seu local...'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] rounded-xl p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Digite 3 letras ou mais..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    {searchQuery.length > 0 && searchQuery.length < 3 && (
                      <div className="p-4 text-center text-sm text-slate-500">
                        Digite pelo menos 3 caracteres...
                      </div>
                    )}
                    {searchQuery.length >= 3 && filteredPlaces.length === 0 && (
                      <CommandEmpty>Nenhum local encontrado.</CommandEmpty>
                    )}
                    {searchQuery.length >= 3 && filteredPlaces.length > 0 && (
                      <CommandGroup>
                        {filteredPlaces.map((place) => (
                          <CommandItem
                            key={place.id}
                            value={place.id}
                            onSelect={() => {
                              setSelectedPlaceId(place.id)
                              setOpen(false)
                              setSearchQuery('')
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedPlaceId === place.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {place.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="company-pwd">Senha</Label>
              <Dialog open={showForgot} onOpenChange={setShowForgot}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Recuperar Senha Empresarial</DialogTitle>
                    <DialogDescription>
                      Informe o e-mail de acesso para receber o link de redefinição.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleForgot} className="mt-2 space-y-3">
                    <Input
                      type="email"
                      placeholder="contato@empresa.com"
                      required
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
              id="company-pwd"
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
            disabled={!selectedPlaceId || !password}
            className="mt-2 h-12 w-full rounded-xl text-base font-bold"
          >
            Acessar Painel
          </Button>
        </form>
      </div>
    </div>
  )
}

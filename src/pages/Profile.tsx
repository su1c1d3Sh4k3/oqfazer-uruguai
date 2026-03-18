import { useAuth } from '@/context/AuthContext'
import { useAccess } from '@/context/AccessContext'
import { usePlaces } from '@/context/PlacesContext'
import { PlaceCard } from '@/components/PlaceCard'
import { Award, Compass, MapPin, Map as MapIcon, ShieldCheck } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { currentUser, logout } = useAuth()
  const { placeCheckIns } = useAccess()
  const { places } = usePlaces()

  if (!currentUser) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center h-full px-4 py-20 text-center">
        <Award className="h-16 w-16 text-slate-300 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4 font-display">Acesse sua conta</h2>
        <p className="text-slate-500 font-medium mb-8 max-w-sm">
          Faça login para salvar seus check-ins e acompanhar seu progresso de explorador pelo
          Uruguai através de todos os seus dispositivos.
        </p>
        <Button asChild size="lg" className="rounded-xl px-8 font-bold shadow-md">
          <Link to="/auth">Fazer Login ou Cadastro</Link>
        </Button>
      </div>
    )
  }

  const visitedIds = Object.keys(placeCheckIns)
  const visitedPlaces = places.filter((p) => visitedIds.includes(p.id))
  const checkInCount = visitedIds.length

  const levels = [
    { threshold: 0, name: 'Recém-chegado', next: 1, color: 'text-slate-500' },
    { threshold: 1, name: 'Explorador Iniciante', next: 3, color: 'text-secondary' },
    { threshold: 3, name: 'Viajante Curioso', next: 5, color: 'text-primary' },
    { threshold: 5, name: 'Aventureiro', next: 10, color: 'text-brand-yellow' },
    { threshold: 10, name: 'Viajante Pro', next: 20, color: 'text-purple-500' },
  ]

  const currentLevel =
    levels
      .slice()
      .reverse()
      .find((l) => checkInCount >= l.threshold) || levels[0]

  const progressPercent = currentLevel.next
    ? Math.min(100, (checkInCount / currentLevel.next) * 100)
    : 100

  return (
    <div className="flex h-full flex-col px-4 pb-8 pt-4 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
            Meu Progresso
          </h1>
          <p className="text-slate-500 font-medium">{currentUser.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Sair da Conta
        </Button>
      </div>

      <div className="mb-10 rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 items-center text-center md:text-left">
        <div className="flex-shrink-0 flex items-center justify-center h-28 w-28 md:h-32 md:w-32 rounded-full bg-slate-50 border-4 border-slate-100 relative shadow-inner">
          <Award className={`h-14 w-14 md:h-16 md:w-16 ${currentLevel.color}`} />
          <div className="absolute -bottom-3 bg-slate-900 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-md">
            Nível {levels.indexOf(currentLevel) + 1}
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> {currentLevel.name}
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-medium mt-1">
              Você já fez check-in em{' '}
              <span className="font-bold text-slate-700">{checkInCount}</span>{' '}
              {checkInCount === 1 ? 'local' : 'locais'}.
            </p>
          </div>

          <div className="space-y-2 max-w-lg mx-auto md:mx-0">
            <div className="flex justify-between text-sm font-bold text-slate-700">
              <span>Progresso</span>
              <span>{currentLevel.next ? `${checkInCount} / ${currentLevel.next}` : 'Máximo'}</span>
            </div>
            <Progress value={progressPercent} className="h-3 bg-slate-100" />
            {currentLevel.next && (
              <p className="text-xs text-slate-500 font-medium text-right">
                Faltam {currentLevel.next - checkInCount} visitas para o próximo nível.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl flex items-center gap-2">
          <MapPin className="h-6 w-6 text-secondary" />
          Histórico de Visitas
        </h2>
        {visitedPlaces.length > 0 && (
          <span className="rounded-full bg-secondary/20 px-3 py-1 text-sm font-bold text-slate-800">
            {visitedPlaces.length} {visitedPlaces.length === 1 ? 'local' : 'locais'}
          </span>
        )}
      </div>

      {visitedPlaces.length === 0 ? (
        <div className="animate-fade-in-up flex flex-1 flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold text-slate-900">
            Sua jornada começa aqui!
          </h3>
          <p className="mb-6 max-w-sm font-medium text-slate-500">
            Faça check-in nos locais que visitar e construa seu histórico de exploração pelo
            Uruguai.
          </p>
          <Button size="lg" className="rounded-full px-8 font-bold shadow-md" asChild>
            <Link to="/">
              <MapIcon className="mr-2 h-5 w-5" />
              Explorar Mapa
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visitedPlaces.map((place, index) => (
            <div
              key={place.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PlaceCard place={place} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

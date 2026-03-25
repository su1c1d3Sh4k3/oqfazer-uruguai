import { useAuth } from '@/context/AuthContext'
import { useAccess } from '@/context/AccessContext'
import { usePlaces } from '@/context/PlacesContext'
import { PlaceCard } from '@/components/PlaceCard'
import { Award, Compass, MapPin, Map as MapIcon, ShieldCheck, Trophy } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
        <Button asChild size="lg" className="rounded-xl px-8 font-bold shadow-md h-12">
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

  // Leaderboard logic
  const MOCK_LEADERBOARD = [
    { name: 'João Silva', checkins: 45, isGold: true },
    { name: 'Maria Souza', checkins: 38 },
    { name: 'Carlos Santos', checkins: 30 },
    { name: 'Ana Costa', checkins: 25 },
    { name: 'Pedro Alves', checkins: 20 },
  ]

  const userEntry = { name: currentUser.email.split('@')[0], checkins: checkInCount, isMe: true }
  const allScores = [...MOCK_LEADERBOARD, userEntry].sort((a, b) => b.checkins - a.checkins)

  // Filter out the duplicate if user is already naturally in Top 5 (this is just mock merge)
  const uniqueScores = allScores.reduce(
    (acc, curr) => {
      if (curr.isMe && acc.some((s) => s.isMe)) return acc
      acc.push(curr)
      return acc
    },
    [] as typeof allScores,
  )

  const top5 = uniqueScores.slice(0, 5)
  const myPosition = uniqueScores.findIndex((s) => s.isMe) + 1

  return (
    <div className="flex h-full flex-col px-4 pb-12 pt-4 md:px-8 md:pt-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
            Meu Progresso
          </h1>
          <p className="text-slate-500 font-medium">{currentUser.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="rounded-xl">
          Sair da Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 items-center text-center md:text-left h-full">
          <div className="flex-shrink-0 flex items-center justify-center h-32 w-32 md:h-36 md:w-36 rounded-full bg-slate-50 border-4 border-slate-100 relative shadow-inner">
            <Award className={`h-16 w-16 md:h-20 md:w-20 ${currentLevel.color}`} />
            <div className="absolute -bottom-3 bg-slate-900 text-white text-sm font-bold px-5 py-1 rounded-full whitespace-nowrap shadow-md">
              Nível {levels.indexOf(currentLevel) + 1}
            </div>
          </div>

          <div className="flex-1 w-full space-y-5">
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-primary" /> {currentLevel.name}
              </h2>
              <p className="text-sm md:text-base text-slate-500 font-medium mt-2 leading-relaxed">
                Você já fez check-in em{' '}
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {checkInCount}
                </span>{' '}
                {checkInCount === 1 ? 'local' : 'locais'} incríveis.
              </p>
            </div>

            <div className="space-y-3 max-w-lg mx-auto md:mx-0">
              <div className="flex justify-between text-sm font-bold text-slate-700 px-1">
                <span>Progresso para o Próximo Nível</span>
                <span className="text-primary">
                  {currentLevel.next ? `${checkInCount} / ${currentLevel.next}` : 'Máximo'}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3 md:h-4 bg-slate-100" />
              {currentLevel.next && (
                <p className="text-xs text-slate-500 font-medium text-right">
                  Faltam {currentLevel.next - checkInCount} visitas.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col h-full">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-brand-yellow drop-shadow-sm" />
            Ranking Exploradores
          </h2>
          <div className="space-y-3 flex-1">
            {top5.map((user, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-colors',
                  user.isMe
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'font-black w-6 text-center text-lg',
                      idx === 0
                        ? 'text-brand-yellow'
                        : idx === 1
                          ? 'text-slate-400'
                          : idx === 2
                            ? 'text-amber-700'
                            : 'text-slate-300',
                    )}
                  >
                    {idx + 1}º
                  </span>
                  <div>
                    <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5 leading-none mb-1">
                      {user.name}
                      {user.isMe && (
                        <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Você
                        </span>
                      )}
                    </p>
                    {idx === 0 && (
                      <p className="text-[10px] font-bold text-brand-yellow uppercase tracking-wider">
                        Explorador Ouro
                      </p>
                    )}
                  </div>
                </div>
                <div className="font-bold text-slate-700 tabular-nums bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100 text-sm">
                  {user.checkins}{' '}
                  <span className="text-[10px] font-medium text-slate-400 uppercase">pts</span>
                </div>
              </div>
            ))}
          </div>
          {myPosition > 5 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                Sua Posição
              </p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <span className="font-black w-6 text-center text-slate-400">{myPosition}º</span>
                  <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    {userEntry.name}{' '}
                    <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Você
                    </span>
                  </p>
                </div>
                <div className="font-bold text-primary tabular-nums bg-white px-2 py-1 rounded-md shadow-sm border border-primary/10 text-sm">
                  {userEntry.checkins}{' '}
                  <span className="text-[10px] font-medium text-slate-400 uppercase">pts</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between mt-4">
        <h2 className="font-display text-xl font-bold text-slate-900 md:text-2xl flex items-center gap-2">
          <MapPin className="h-6 w-6 text-secondary" />
          Histórico de Visitas
        </h2>
        {visitedPlaces.length > 0 && (
          <span className="rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-bold text-secondary border border-secondary/20">
            {visitedPlaces.length} {visitedPlaces.length === 1 ? 'local' : 'locais'}
          </span>
        )}
      </div>

      {visitedPlaces.length === 0 ? (
        <div className="animate-fade-in-up flex flex-1 flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border-4 border-primary/5">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-2 font-display text-2xl font-bold text-slate-900">
            Sua jornada começa aqui!
          </h3>
          <p className="mb-8 max-w-md font-medium text-slate-500 leading-relaxed">
            Faça check-in nos locais que visitar e construa seu histórico de exploração pelo Uruguai
            para subir no ranking global.
          </p>
          <Button size="lg" className="rounded-xl px-8 font-bold shadow-md h-12" asChild>
            <Link to="/">
              <MapIcon className="mr-2 h-5 w-5" />
              Explorar Mapa
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

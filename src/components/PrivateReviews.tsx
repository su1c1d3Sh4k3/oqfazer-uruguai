import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAccess } from '@/context/AccessContext'
import { Star, Lock, Info, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export interface Review {
  id: string
  placeId: string
  userId: string
  userEmail: string
  rating: number
  comment: string
  date: number
}

interface Props {
  placeId: string
  checkInTime: number | null
}

export function PrivateReviews({ placeId, checkInTime }: Props) {
  const { currentUser } = useAuth()
  const { isGranted } = useAccess()
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [canReview, setCanReview] = useState(false)
  const [timeMessage, setTimeMessage] = useState('')

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('place_id', placeId)
        .order('date', { ascending: false })

      if (!error && data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          placeId: r.place_id,
          userId: r.user_id,
          userEmail: r.user_email,
          rating: r.rating,
          comment: r.comment || '',
          date: r.date,
        }))
        setReviews(mapped)

        if (currentUser) {
          const myPrevReview = mapped.find(
            (r: Review) => r.userId === currentUser.id,
          )
          if (myPrevReview) {
            setRating(myPrevReview.rating)
            setComment(myPrevReview.comment)
          }
        }
      }
    }

    fetchReviews()
  }, [placeId, currentUser])

  useEffect(() => {
    if (!checkInTime) {
      setCanReview(false)
      setTimeMessage('Faça check-in neste local para poder avaliá-lo no futuro.')
      return
    }
    const checkAvailability = () => {
      const now = Date.now()
      const diff = checkInTime + 24 * 60 * 60 * 1000 - now
      if (diff <= 0) {
        setCanReview(true)
        setTimeMessage('')
      } else {
        setCanReview(false)
        const hours = Math.ceil(diff / (1000 * 60 * 60))
        setTimeMessage(`Sua avaliação será liberada em aproximadamente ${hours} hora(s).`)
      }
    }
    checkAvailability()
    const interval = setInterval(checkAvailability, 60000)
    return () => clearInterval(interval)
  }, [checkInTime])

  const handleSave = async () => {
    if (!rating) return toast.error('Selecione uma nota com as estrelas.')
    if (!currentUser) return toast.error('Faça login para avaliar.')

    const reviewData = {
      place_id: placeId,
      user_id: currentUser.id,
      user_email: currentUser.email,
      rating,
      comment,
      date: Date.now(),
    }

    const { data, error } = await supabase
      .from('reviews')
      .upsert(reviewData, { onConflict: 'user_id,place_id' })
      .select()
      .single()

    if (error) {
      console.error('Review save error:', error)
      const msg =
        error.code === '42501' || error.message?.includes('policy')
          ? 'Sem permissão. Tente fazer logout e login novamente.'
          : error.message || 'Tente novamente.'
      toast.error('Erro ao salvar avaliação', { description: msg })
      return
    }

    const newReview: Review = {
      id: data.id,
      placeId: data.place_id,
      userId: data.user_id,
      userEmail: data.user_email,
      rating: data.rating,
      comment: data.comment || '',
      date: data.date,
    }

    setReviews((prev) => [
      newReview,
      ...prev.filter((r) => r.userId !== currentUser.id || r.placeId !== placeId),
    ])

    toast.success('Avaliação salva!', {
      description: 'Seu feedback é muito importante para nossa curadoria.',
    })
  }

  const placeReviews = reviews.filter((r) => r.placeId === placeId)
  const myReview = currentUser ? placeReviews.find((r) => r.userId === currentUser.id) : null

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-slate-400" /> Deixe sua Avaliação (Privada)
        </h3>
      </div>

      {!currentUser ? (
        <p className="text-sm font-medium text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
          Faça login na sua conta para deixar uma avaliação sobre este local.
        </p>
      ) : !canReview && !myReview ? (
        <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-xl border border-slate-100 text-center gap-2">
          <Clock className="h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-bold text-slate-700">Avaliação Bloqueada Temporariamente</p>
          <p className="text-xs font-medium text-slate-500">{timeMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-500 flex items-start gap-1.5">
            <Info className="h-4 w-4 shrink-0 text-secondary" />
            Seu feedback é totalmente confidencial e não será exibido publicamente para outros
            usuários.
          </p>
          <div className="flex gap-1 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${rating >= star ? 'fill-brand-yellow text-brand-yellow drop-shadow-sm' : 'text-slate-200'}`}
                />
              </button>
            ))}
          </div>
          <div className="relative">
            <Textarea
              placeholder="O que achou da experiência? Conte para a gente! (Máx 200 caracteres)"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              className="resize-none h-28 bg-slate-50 border-slate-200 text-base"
              maxLength={200}
            />
            <span
              className={`absolute bottom-3 right-3 text-xs font-bold ${comment.length >= 200 ? 'text-red-500' : 'text-slate-400'}`}
            >
              {comment.length}/200
            </span>
          </div>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto h-11 px-8 rounded-xl font-bold shadow-md"
          >
            {myReview ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
          </Button>
        </div>
      )}

      {isGranted && placeReviews.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-wider bg-slate-100 w-fit px-3 py-1 rounded-md">
            Visão do Administrador ({placeReviews.length})
          </h4>
          <div className="space-y-3">
            {placeReviews.map((r) => (
              <div
                key={r.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm"
              >
                <div className="flex justify-between items-start mb-2 border-b border-slate-50 pb-2">
                  <span className="font-bold text-slate-800">{r.userEmail}</span>
                  <span className="flex text-brand-yellow font-bold text-xs items-center bg-brand-yellow/10 px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-current mr-1" /> {r.rating}.0
                  </span>
                </div>
                <p className="text-slate-600 font-medium">
                  {r.comment || (
                    <em className="text-slate-400 font-normal">Sem comentário em texto</em>
                  )}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3">
                  {new Date(r.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
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
}

export function AdminPlaceReviews({ placeId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('place_id', placeId)
        .order('date', { ascending: false })

      if (!error && data) {
        setReviews(
          data.map((r: any) => ({
            id: r.id,
            placeId: r.place_id,
            userId: r.user_id,
            userEmail: r.user_email,
            rating: r.rating,
            comment: r.comment || '',
            date: r.date,
          })),
        )
      }
    }

    fetchReviews()
  }, [placeId])

  if (reviews.length === 0) return null

  return (
    <div className="space-y-4 pt-6 mt-6 border-t border-border">
      <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
        <MessageSquare className="h-5 w-5 text-primary" /> Avaliações Privadas ({reviews.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex flex-col"
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <span className="font-semibold text-sm truncate">{r.userEmail}</span>
              <span className="flex text-brand-yellow font-bold text-xs items-center bg-brand-yellow/10 px-2 py-0.5 rounded-full shrink-0">
                <Star className="h-3 w-3 fill-current mr-1" /> {r.rating}.0
              </span>
            </div>
            <p className="text-sm text-muted-foreground break-words flex-1">
              {r.comment || <em className="text-muted-foreground/50">Sem comentário em texto.</em>}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-3 pt-3 border-t border-border/50">
              {new Date(r.date).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

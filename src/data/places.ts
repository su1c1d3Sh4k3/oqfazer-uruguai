export type PlaceType = 'restaurant' | 'tour'

export interface TimeShift {
  openTime: string
  closeTime: string
}

export interface DailyHours {
  day: number
  isOpen: boolean
  // Espelham o primeiro intervalo (compatibilidade com registros antigos)
  openTime: string
  closeTime: string
  // Intervalos do dia (ex.: 06:00–13:00 | 14:00–20:00). Ausente em registros antigos.
  shifts?: TimeShift[]
}

// Desconto que vale todos os dias dentro do intervalo [startTime, endTime)
export interface DiscountRule {
  id: string
  startTime: string
  endTime: string
  label: string // ex.: "10% OFF" ou "Drink grátis"
  description?: string
}

// Desconto efetivamente aplicado (gravado no check-in)
export interface AppliedDiscount {
  source: 'flash' | 'rule' | 'badge'
  label: string
  description?: string
}

export type PriceLevel = 1 | 2 | 3

export interface FlashOffer {
  percentage: string
  description: string
  expiresAt: number
  durationLabel: string
}

export interface Place {
  id: string
  type: PlaceType
  name: string
  category: string
  city: string
  discountBadge: string
  coverImage: string
  galleryImages: string[]
  logoImage?: string
  description: string
  discountDescription: string
  address: string
  coordinates: { lat: number; lng: number }
  featured?: boolean
  featuredOrder?: number
  order?: number // Added for display ordering
  operatingHours?: DailyHours[]
  discountRules?: DiscountRule[]
  priceLevel?: PriceLevel | null
  isActive?: boolean
  reactivateAt?: string | null // ISO — reativação automática
  createdAt?: number

  // Tour specific fields
  duration?: string
  departureCity?: string
  included?: string[]
  availableDays?: string[]
  bookingUrl?: string
  couponCode?: string

  // Social Links
  instagramUrl?: string
  websiteUrl?: string

  // Metrics
  accessCount?: number
  couponClickCount?: number
  checkInCount?: number
  highlightClickCount?: number

  // Flash Offer
  flashOffer?: FlashOffer

  // Sensitive Fields (Only for Admin Master and Company Owner)
  responsibleName?: string
  ci?: string
  contactEmail?: string
  contactPhone?: string
}


export const createDefaultHours = (): DailyHours[] => [
  { day: 0, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 5, isOpen: true, openTime: '09:00', closeTime: '23:00' },
  { day: 6, isOpen: true, openTime: '09:00', closeTime: '23:00' },
]


export type PlaceType = 'restaurant' | 'tour'

export interface DailyHours {
  day: number
  isOpen: boolean
  openTime: string
  closeTime: string
}

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
  order?: number // Added for display ordering
  operatingHours?: DailyHours[]

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


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true },
})

// Mapping from camelCase Place keys to snake_case DB column names
const PLACE_KEY_MAP: Record<string, string> = {
  id: 'id',
  type: 'type',
  name: 'name',
  category: 'category',
  city: 'city',
  discountBadge: 'discount_badge',
  coverImage: 'cover_image',
  galleryImages: 'gallery_images',
  logoImage: 'logo_image',
  description: 'description',
  discountDescription: 'discount_description',
  address: 'address',
  coordinates: 'coordinates',
  featured: 'featured',
  featuredOrder: 'featured_order',
  order: 'display_order',
  operatingHours: 'operating_hours',
  duration: 'duration',
  departureCity: 'departure_city',
  included: 'included',
  availableDays: 'available_days',
  bookingUrl: 'booking_url',
  couponCode: 'coupon_code',
  instagramUrl: 'instagram_url',
  websiteUrl: 'website_url',
  accessCount: 'access_count',
  couponClickCount: 'coupon_click_count',
  checkInCount: 'check_in_count',
  highlightClickCount: 'highlight_click_count',
  flashOffer: 'flash_offer',
  responsibleName: 'responsible_name',
  ci: 'ci',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
}

// Helper: convert camelCase Place object to snake_case DB row (full — for INSERT)
export function placeToRow(place: Record<string, any>) {
  return {
    id: place.id,
    type: place.type,
    name: place.name,
    category: place.category,
    city: place.city,
    discount_badge: place.discountBadge ?? '',
    cover_image: place.coverImage ?? '',
    gallery_images: place.galleryImages ?? [],
    logo_image: place.logoImage ?? null,
    description: place.description ?? '',
    discount_description: place.discountDescription ?? '',
    address: place.address ?? '',
    coordinates: place.coordinates ?? { lat: 0, lng: 0 },
    featured: place.featured ?? false,
    featured_order: place.featuredOrder ?? null,
    display_order: place.order ?? null,
    operating_hours: place.operatingHours ?? [],
    duration: place.duration ?? null,
    departure_city: place.departureCity ?? null,
    included: place.included ?? [],
    available_days: place.availableDays ?? [],
    booking_url: place.bookingUrl ?? null,
    coupon_code: place.couponCode ?? null,
    instagram_url: place.instagramUrl ?? null,
    website_url: place.websiteUrl ?? null,
    access_count: place.accessCount ?? 0,
    coupon_click_count: place.couponClickCount ?? 0,
    check_in_count: place.checkInCount ?? 0,
    highlight_click_count: place.highlightClickCount ?? 0,
    flash_offer: place.flashOffer ?? null,
    responsible_name: place.responsibleName ?? null,
    ci: place.ci ?? null,
    contact_email: place.contactEmail ?? null,
    contact_phone: place.contactPhone ?? null,
  }
}

// Helper: convert ONLY the provided camelCase keys to snake_case (for partial UPDATE)
// This prevents overwriting existing data with defaults
export function partialPlaceToRow(data: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    const dbKey = PLACE_KEY_MAP[key]
    if (dbKey) {
      row[dbKey] = value ?? null
    }
  }
  return row
}

// Helper: convert snake_case DB row to camelCase Place object
export function rowToPlace(row: Record<string, any>) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    category: row.category,
    city: row.city,
    discountBadge: row.discount_badge ?? '',
    coverImage: row.cover_image ?? '',
    galleryImages: row.gallery_images ?? [],
    logoImage: row.logo_image ?? undefined,
    description: row.description ?? '',
    discountDescription: row.discount_description ?? '',
    address: row.address ?? '',
    coordinates: row.coordinates ?? { lat: 0, lng: 0 },
    featured: row.featured ?? false,
    featuredOrder: row.featured_order ?? undefined,
    order: row.display_order ?? undefined,
    operatingHours: row.operating_hours ?? undefined,
    duration: row.duration ?? undefined,
    departureCity: row.departure_city ?? undefined,
    included: row.included ?? undefined,
    availableDays: row.available_days ?? undefined,
    bookingUrl: row.booking_url ?? undefined,
    couponCode: row.coupon_code ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    accessCount: row.access_count ?? 0,
    couponClickCount: row.coupon_click_count ?? 0,
    checkInCount: row.check_in_count ?? 0,
    highlightClickCount: row.highlight_click_count ?? 0,
    flashOffer: row.flash_offer ?? undefined,
    responsibleName: row.responsible_name ?? undefined,
    ci: row.ci ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
  }
}

// Helper: convert profile row to app User
export function rowToUser(profile: Record<string, any>, email?: string) {
  return {
    id: profile.id,
    email: email || profile.email,
    role: profile.role as 'user' | 'establishment' | 'admin',
    managedPlaceId: profile.managed_place_id ?? undefined,
    name: profile.name ?? undefined,
    cpf: profile.cpf ?? undefined,
    phone: profile.phone ?? undefined,
    travelPeriod: profile.travel_period ?? undefined,
    ci: profile.ci ?? undefined,
    responsibleName: profile.responsible_name ?? undefined,
    deletionRequested: profile.deletion_requested ?? false,
    firstCheckInAt: profile.first_check_in_at ?? undefined,
    firstLoginAt: profile.first_login_at ?? Date.now(),
  }
}

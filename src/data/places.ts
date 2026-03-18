export type PlaceType = 'restaurant' | 'tour'

export interface DailyHours {
  day: number
  isOpen: boolean
  openTime: string
  closeTime: string
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
  description: string
  discountDescription: string
  address: string
  coordinates: { lat: number; lng: number }
  featured?: boolean
  operatingHours?: DailyHours[]

  // Tour specific fields
  included?: string[]
  availableDays?: string[]
  bookingUrl?: string
  couponCode?: string
}

export const DEFAULT_CATEGORIES = [
  'Restaurantes',
  'Passeios',
  'Cafeterias',
  'Bares',
  'Museus',
  'Vinícolas',
]

export const createDefaultHours = (): DailyHours[] => [
  { day: 0, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 5, isOpen: true, openTime: '09:00', closeTime: '23:00' },
  { day: 6, isOpen: true, openTime: '09:00', closeTime: '23:00' },
]

export const DEFAULT_PLACES: Place[] = [
  {
    id: '1',
    type: 'restaurant',
    name: 'Parrilla del Sur',
    category: 'Restaurantes',
    city: 'Montevideo',
    discountBadge: '20% OFF',
    coverImage: 'https://img.usecurling.com/p/600/400?q=steak&color=orange',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=steak&seed=1&color=orange',
      'https://img.usecurling.com/p/800/600?q=steakhouse&seed=2&color=orange',
      'https://img.usecurling.com/p/800/600?q=wine&seed=3&color=orange',
      'https://img.usecurling.com/p/800/600?q=grill&seed=4&color=orange',
      'https://img.usecurling.com/p/800/600?q=dessert&seed=5&color=orange',
    ],
    description:
      'A melhor parrilla de Montevideo com cortes nobres e ambiente aconchegante, ideal para casais e grupos de amigos.',
    discountDescription: '20% de desconto em todas as carnes da parrilla. Bebidas não inclusas.',
    address: 'Rambla República del Perú, 1234 - Montevideo',
    coordinates: { lat: -34.912, lng: -56.155 },
    operatingHours: createDefaultHours(),
    featured: true,
  },
  {
    id: '2',
    type: 'tour',
    name: 'Tour por Punta del Este',
    category: 'Passeios',
    city: 'Punta del Este',
    discountBadge: '5% OFF',
    coverImage: 'https://img.usecurling.com/p/600/400?q=beach&color=red',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=beach&seed=1&color=red',
      'https://img.usecurling.com/p/800/600?q=sunset&seed=2&color=red',
      'https://img.usecurling.com/p/800/600?q=monument&seed=3&color=red',
      'https://img.usecurling.com/p/800/600?q=ocean&seed=4&color=red',
      'https://img.usecurling.com/p/800/600?q=tourist&seed=5&color=red',
    ],
    description:
      'Explore as belezas de Punta del Este em um passeio inesquecível de dia inteiro pelos principais pontos turísticos.',
    discountDescription:
      'Utilize o código de cupom no site do parceiro para ganhar 5% de desconto.',
    address: 'Ponto de encontro: Porto de Punta del Este',
    coordinates: { lat: -34.962, lng: -54.943 },
    operatingHours: createDefaultHours(),
    featured: true,
    included: ['Transfer ida e volta', 'Guia bilíngue', 'Almoço incluso', 'Ingressos para museus'],
    availableDays: ['Segunda-feira', 'Quarta-feira', 'Sexta-feira', 'Sábado'],
    bookingUrl: 'https://example.com/booking',
    couponCode: 'DESCONTOAPP',
  },
  {
    id: '3',
    type: 'restaurant',
    name: 'Café de los Pájaros',
    category: 'Cafeterias',
    city: 'Colonia del Sacramento',
    discountBadge: 'Café + Alfajor 50% OFF',
    coverImage: 'https://img.usecurling.com/p/600/400?q=cafe&color=orange',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=coffee&seed=1&color=orange',
      'https://img.usecurling.com/p/800/600?q=alfajor&seed=2&color=orange',
      'https://img.usecurling.com/p/800/600?q=cafe%20interior&seed=3&color=orange',
      'https://img.usecurling.com/p/800/600?q=historic%20building&seed=4&color=orange',
      'https://img.usecurling.com/p/800/600?q=latte&seed=5&color=orange',
    ],
    description:
      'Café charmoso no centro histórico de Colonia. Especialistas em doces de leite locais e alfajores caseiros.',
    discountDescription:
      'Na compra de um café especial, ganhe 50% de desconto no nosso alfajor artesanal de doce de leite.',
    address: 'Calle de los Suspiros, 45 - Colonia del Sacramento',
    coordinates: { lat: -34.471, lng: -57.852 },
    operatingHours: createDefaultHours(),
    featured: true,
  },
  {
    id: '4',
    type: 'tour',
    name: 'Visita à Vinícola Garzón',
    category: 'Vinícolas',
    city: 'Punta del Este',
    discountBadge: 'Degustação Extra',
    coverImage: 'https://img.usecurling.com/p/600/400?q=vineyard&color=red',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=wine%20glass&seed=6&color=red',
      'https://img.usecurling.com/p/800/600?q=wine%20barrel&seed=7&color=red',
      'https://img.usecurling.com/p/800/600?q=vineyard&seed=8&color=red',
      'https://img.usecurling.com/p/800/600?q=wine%20tasting&seed=9&color=red',
      'https://img.usecurling.com/p/800/600?q=sommelier&seed=10&color=red',
    ],
    description:
      'Descubra a arte da produção de vinhos na mais premiada vinícola do Uruguai, com uma vista deslumbrante.',
    discountDescription:
      'Apresente o cupom ao reservar para ganhar uma degustação premium adicional.',
    address: 'Ruta 9 km 175 - Pueblo Garzón',
    coordinates: { lat: -34.593, lng: -54.551 },
    operatingHours: createDefaultHours(),
    included: ['Passeio guiado pelas vinhas', 'Degustação de 4 vinhos', 'Tábua de queijos'],
    availableDays: ['Terça-feira', 'Quinta-feira', 'Sábado', 'Domingo'],
    bookingUrl: 'https://example.com/booking-garzon',
    couponCode: 'GARZONAPP',
  },
]

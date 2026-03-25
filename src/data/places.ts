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
  description: string
  discountDescription: string
  address: string
  coordinates: { lat: number; lng: number }
  featured?: boolean
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
  checkInCount?: number // New field for Top 20 ranking

  // Flash Offer
  flashOffer?: FlashOffer
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

const tourLinks = [
  {
    slug: 'city-tour-punta-del-este',
    name: 'City Tour Punta del Este',
    city: 'Punta del Este',
    cat: 'Passeios',
  },
  {
    slug: 'city-tour-montevideo',
    name: 'City Tour Montevideo',
    city: 'Montevideo',
    cat: 'Passeios',
  },
  {
    slug: 'city-tour-colonia-del-sacramento',
    name: 'City Tour Colonia del Sacramento',
    city: 'Colonia del Sacramento',
    cat: 'Passeios',
  },
  {
    slug: 'bodega-bouza-visita-e-almoco',
    name: 'Bodega Bouza: Visita e Almoço',
    city: 'Montevideo',
    cat: 'Vinícolas',
  },
  {
    slug: 'bodega-pizzorno-visita-e-almoco',
    name: 'Bodega Pizzorno: Visita e Almoço',
    city: 'Montevideo',
    cat: 'Vinícolas',
  },
  {
    slug: 'primuseum-restaurante-montevideo',
    name: 'Primuseum Restaurante',
    city: 'Montevideo',
    cat: 'Restaurantes',
  },
  {
    slug: 'el-milongon-show-de-tango-em-montevideo',
    name: 'El Milongón: Show de Tango',
    city: 'Montevideo',
    cat: 'Passeios',
  },
  {
    slug: 'bodega-bouza-e-pizzorno-visita',
    name: 'Bodega Bouza e Pizzorno: Visita',
    city: 'Montevideo',
    cat: 'Vinícolas',
  },
  {
    slug: 'bodega-spinoglio-visita',
    name: 'Bodega Spinoglio: Visita',
    city: 'Montevideo',
    cat: 'Vinícolas',
  },
  {
    slug: 'bodega-familia-deicas-juanico-visita-degustacao',
    name: 'Bodega Familia Deicas / Juanicó',
    city: 'Montevideo',
    cat: 'Vinícolas',
  },
  {
    slug: 'day-tour-punta-del-este-saindo-de-punta-del-este',
    name: 'Day Tour Punta del Este (Saindo de PDE)',
    city: 'Punta del Este',
    cat: 'Passeios',
  },
  {
    slug: 'bodega-garzon-visita-e-almoco',
    name: 'Bodega Garzón: Visita e Almoço',
    city: 'Punta del Este',
    cat: 'Vinícolas',
  },
  {
    slug: 'bodega-alto-de-la-ballena',
    name: 'Bodega Alto de la Ballena',
    city: 'Punta del Este',
    cat: 'Vinícolas',
  },
  {
    slug: 'bodega-fripp-colonia-visita-almoco',
    name: 'Bodega Fripp: Visita e Almoço',
    city: 'Colonia del Sacramento',
    cat: 'Vinícolas',
  },
]

const GENERATED_TOURS: Place[] = tourLinks.map((t, i) => {
  const isWine = t.cat === 'Vinícolas'
  const isLunch = t.name.includes('Almoço')
  return {
    id: `bnu-tour-${t.slug}`,
    type: 'tour',
    name: t.name,
    category: t.cat,
    city: t.city,
    departureCity: t.city,
    duration: isLunch ? 'Meio dia (4h a 5h)' : '2 a 3 horas',
    discountBadge: '5% OFF',
    coverImage: `https://img.usecurling.com/p/800/600?q=${isWine ? 'vineyard' : 'city'}&seed=${i + 10}&color=blue`,
    galleryImages: Array(5)
      .fill(0)
      .map(
        (_, j) =>
          `https://img.usecurling.com/p/800/600?q=${isWine ? 'wine' : 'tourist'}&seed=${i * 10 + j}&color=blue`,
      ),
    description: `Descubra o melhor do Uruguai com: ${t.name}. Uma experiência inesquecível selecionada pelo Brasileiros no Uruguai para você.`,
    discountDescription:
      'Utilize nosso código exclusivo na página do parceiro para garantir seu desconto especial.',
    address: 'Ponto de encontro enviado após confirmação',
    coordinates: { lat: -34.9 + i * 0.01, lng: -56.1 + i * 0.01 },
    included: isWine
      ? ['Visita guiada', 'Degustação de vinhos']
      : ['Guia especializado', 'Transporte ida e volta'],
    availableDays: ['Terça-feira', 'Quinta-feira', 'Sábado', 'Domingo'],
    bookingUrl: `https://brasileirosnouruguai.com.br/passeios/${t.slug}/`,
    couponCode: 'BNU5',
    featured: i < 3,
    accessCount: Math.floor(Math.random() * 500) + 50,
    couponClickCount: Math.floor(Math.random() * 200) + 10,
    checkInCount: Math.floor(Math.random() * 300) + 20,
  }
})

const MOCK_RESTAURANTS: Place[] = Array(18)
  .fill(0)
  .map((_, i) => {
    const isCafe = i % 3 === 0
    return {
      id: `mock-rest-${i}`,
      type: 'restaurant',
      name: isCafe ? `Cafeteria del Sur ${i + 1}` : `Restaurante Sabor ${i + 1}`,
      category: isCafe ? 'Cafeterias' : 'Restaurantes',
      city: i % 2 === 0 ? 'Montevideo' : 'Punta del Este',
      discountBadge: isCafe ? '15% OFF' : 'Sobremesa Grátis',
      coverImage: `https://img.usecurling.com/p/600/400?q=${isCafe ? 'cafe' : 'food'}&seed=${i + 100}&color=${isCafe ? 'yellow' : 'orange'}`,
      galleryImages: [],
      description: 'Um ótimo estabelecimento para conhecer na sua viagem, super bem avaliado.',
      discountDescription: 'Apresente seu cupom ao garçom para resgatar este benefício exclusivo.',
      address: `Avenida Principal, ${100 + i}`,
      coordinates: { lat: -34.9 + i * 0.002, lng: -56.15 + i * 0.002 },
      accessCount: 200 + i * 15,
      couponClickCount: 50 + i * 5,
      checkInCount: Math.floor(Math.random() * 800) + 100, // Generates high check-in numbers for the ranking
      operatingHours: createDefaultHours(),
    }
  })

export const DEFAULT_PLACES: Place[] = [
  ...GENERATED_TOURS,
  ...MOCK_RESTAURANTS,
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
    address: 'San José 1065, 11100 Montevideo',
    coordinates: { lat: -34.9063, lng: -56.1905 },
    instagramUrl: 'https://instagram.com/parrilladelsur',
    websiteUrl: 'https://example.com',
    operatingHours: createDefaultHours(),
    featured: true,
    accessCount: 1890,
    couponClickCount: 840,
    checkInCount: 1250, // Top place
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
    instagramUrl: 'https://instagram.com/cafedelospajaros',
    operatingHours: createDefaultHours(),
    accessCount: 1450,
    couponClickCount: 620,
    checkInCount: 980, // Another top place
  },
]

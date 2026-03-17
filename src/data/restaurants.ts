export interface Restaurant {
  id: string
  name: string
  category: string
  city: string
  discountBadge: string
  rating: number
  coverImage: string
  galleryImages: string[]
  description: string
  discountDescription: string
  address: string
  coordinates: { lat: number; lng: number }
  featured?: boolean
}

export const DEFAULT_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Parrilla del Sur',
    category: 'Steakhouse',
    city: 'Montevideo',
    discountBadge: '20% OFF',
    rating: 4.8,
    coverImage: 'https://img.usecurling.com/p/600/400?q=steak',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=steak&seed=1',
      'https://img.usecurling.com/p/800/600?q=steakhouse&seed=2',
      'https://img.usecurling.com/p/800/600?q=wine&seed=3',
      'https://img.usecurling.com/p/800/600?q=grill&seed=4',
      'https://img.usecurling.com/p/800/600?q=dessert&seed=5',
    ],
    description:
      'A melhor parrilla de Montevideo com cortes nobres e ambiente aconchegante, ideal para casais e grupos de amigos.',
    discountDescription: '20% de desconto em todas as carnes da parrilla. Bebidas não inclusas.',
    address: 'Rambla República del Perú, 1234 - Montevideo',
    coordinates: { lat: -34.912, lng: -56.155 },
    featured: true,
  },
  {
    id: '2',
    name: 'Café de los Pájaros',
    category: 'Cafeteria',
    city: 'Colonia del Sacramento',
    discountBadge: 'Café + Alfajor 50% OFF',
    rating: 4.9,
    coverImage: 'https://img.usecurling.com/p/600/400?q=cafe',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=coffee&seed=1',
      'https://img.usecurling.com/p/800/600?q=alfajor&seed=2',
      'https://img.usecurling.com/p/800/600?q=cafe%20interior&seed=3',
      'https://img.usecurling.com/p/800/600?q=historic%20building&seed=4',
      'https://img.usecurling.com/p/800/600?q=latte&seed=5',
    ],
    description:
      'Café charmoso no centro histórico de Colonia. Especialistas em doces de leite locais e alfajores caseiros.',
    discountDescription:
      'Na compra de um café especial, ganhe 50% de desconto no nosso alfajor artesanal de doce de leite.',
    address: 'Calle de los Suspiros, 45 - Colonia del Sacramento',
    coordinates: { lat: -34.471, lng: -57.852 },
    featured: true,
  },
  {
    id: '3',
    name: 'Barra Sunset',
    category: 'Bar',
    city: 'Punta del Este',
    discountBadge: '2x1 Drinks',
    rating: 4.7,
    coverImage: 'https://img.usecurling.com/p/600/400?q=cocktail',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=drinks&seed=1',
      'https://img.usecurling.com/p/800/600?q=beach%20bar&seed=2',
      'https://img.usecurling.com/p/800/600?q=sunset&seed=3',
      'https://img.usecurling.com/p/800/600?q=dj&seed=4',
      'https://img.usecurling.com/p/800/600?q=beer&seed=5',
    ],
    description:
      'O melhor bar de praia para curtir o pôr do sol em Punta del Este com música ao vivo e drinks de autor.',
    discountDescription: 'Compre 1 drink e ganhe outro igual. Válido das 17h às 20h todos os dias.',
    address: 'Ruta 10, km 161 - Punta del Este',
    coordinates: { lat: -34.908, lng: -54.856 },
  },
  {
    id: '4',
    name: 'Bodega Clásica',
    category: 'Restaurante',
    city: 'Montevideo',
    discountBadge: 'Vinho Cortesia',
    rating: 4.6,
    coverImage: 'https://img.usecurling.com/p/600/400?q=winery',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=wine%20glass&seed=6',
      'https://img.usecurling.com/p/800/600?q=pasta&seed=7',
      'https://img.usecurling.com/p/800/600?q=restaurant&seed=8',
      'https://img.usecurling.com/p/800/600?q=cheese&seed=9',
      'https://img.usecurling.com/p/800/600?q=vineyard&seed=10',
    ],
    description: 'Gastronomia sofisticada harmonizada com os melhores vinhos Tannat do Uruguai.',
    discountDescription:
      'Ao pedir dois pratos principais, ganhe uma garrafa de vinho Tannat reserva da casa.',
    address: 'Camino de los Viñedos, 88 - Montevideo',
    coordinates: { lat: -34.821, lng: -56.234 },
  },
]

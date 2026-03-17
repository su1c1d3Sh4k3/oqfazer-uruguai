export interface Restaurant {
  id: string
  name: string
  category: string
  discountBadge: string
  rating: number
  distance: string
  coverImage: string
  galleryImages: string[]
  description: string
  discountDescription: string
  address: string
  coordinates: { lat: number; lng: number }
  featured?: boolean
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Burger Station',
    category: 'Hamburgueria',
    discountBadge: '30% OFF',
    rating: 4.8,
    distance: '1.2 km',
    coverImage: 'https://img.usecurling.com/p/600/400?q=gourmet%20burger',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=burger&seed=1',
      'https://img.usecurling.com/p/800/600?q=fries&seed=2',
      'https://img.usecurling.com/p/800/600?q=restaurant%20interior&seed=3',
      'https://img.usecurling.com/p/800/600?q=milkshake&seed=4',
      'https://img.usecurling.com/p/800/600?q=cheeseburger&seed=5',
    ],
    description:
      'A melhor hamburgueria artesanal da cidade, com blends exclusivos e um ambiente descontraído perfeito para ir com os amigos.',
    discountDescription:
      'Válido para todos os hambúrgueres do cardápio de Segunda a Quinta-feira. Bebidas não inclusas.',
    address: 'Av. Paulista, 1000 - Bela Vista',
    coordinates: { lat: -23.561, lng: -46.656 },
    featured: true,
  },
  {
    id: '2',
    name: 'Piazza della Pizza',
    category: 'Pizzaria',
    discountBadge: 'Compre 1 Leve 2',
    rating: 4.9,
    distance: '2.5 km',
    coverImage: 'https://img.usecurling.com/p/600/400?q=wood%20fired%20pizza',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=pizza&seed=6',
      'https://img.usecurling.com/p/800/600?q=pizza%20oven&seed=7',
      'https://img.usecurling.com/p/800/600?q=wine%20glass&seed=8',
      'https://img.usecurling.com/p/800/600?q=italian%20restaurant&seed=9',
      'https://img.usecurling.com/p/800/600?q=pepperoni%20pizza&seed=10',
    ],
    description:
      'Autêntica pizza napolitana feita em forno a lenha. Ingredientes importados e massa de fermentação natural.',
    discountDescription:
      'Na compra de qualquer pizza grande, ganhe uma pizza média de sabor tradicional. Válido todos os dias.',
    address: 'Rua Augusta, 1500 - Consolação',
    coordinates: { lat: -23.557, lng: -46.659 },
    featured: true,
  },
  {
    id: '3',
    name: 'Café Botânico',
    category: 'Cafeteria',
    discountBadge: 'Café Grátis',
    rating: 4.6,
    distance: '0.8 km',
    coverImage: 'https://img.usecurling.com/p/600/400?q=latte%20art',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=coffee%20shop&seed=11',
      'https://img.usecurling.com/p/800/600?q=pastry&seed=12',
      'https://img.usecurling.com/p/800/600?q=barista&seed=13',
      'https://img.usecurling.com/p/800/600?q=espresso&seed=14',
      'https://img.usecurling.com/p/800/600?q=croissant&seed=15',
    ],
    description:
      'Um refúgio verde no meio da cidade. Cafés especiais extraídos por baristas premiados e doces artesanais.',
    discountDescription:
      'Na compra de qualquer fatia de bolo ou torta, ganhe um espresso duplo ou macchiato.',
    address: 'Rua Oscar Freire, 500 - Jardins',
    coordinates: { lat: -23.563, lng: -46.668 },
    featured: true,
  },
  {
    id: '4',
    name: 'Sushi Zen',
    category: 'Japonês',
    discountBadge: '20% OFF',
    rating: 4.7,
    distance: '3.1 km',
    coverImage: 'https://img.usecurling.com/p/600/400?q=sushi%20platter',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=sushi&seed=16',
      'https://img.usecurling.com/p/800/600?q=sashimi&seed=17',
      'https://img.usecurling.com/p/800/600?q=japanese%20restaurant&seed=18',
      'https://img.usecurling.com/p/800/600?q=sake&seed=19',
      'https://img.usecurling.com/p/800/600?q=maki%20rolls&seed=20',
    ],
    description:
      'Culinária japonesa contemporânea em um ambiente sofisticado. Peixes frescos selecionados diariamente.',
    discountDescription:
      '20% de desconto em combinados a partir de 40 peças. Exclusivo para consumo no local.',
    address: 'Av. Brigadeiro Faria Lima, 2000 - Itaim Bibi',
    coordinates: { lat: -23.585, lng: -46.685 },
  },
  {
    id: '5',
    name: 'El Toro',
    category: 'Steakhouse',
    discountBadge: 'Sobremesa Cortesia',
    rating: 4.5,
    distance: '4.5 km',
    coverImage: 'https://img.usecurling.com/p/600/400?q=steak',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=steakhouse&seed=21',
      'https://img.usecurling.com/p/800/600?q=grill&seed=22',
      'https://img.usecurling.com/p/800/600?q=ribs&seed=23',
      'https://img.usecurling.com/p/800/600?q=dessert&seed=24',
      'https://img.usecurling.com/p/800/600?q=wine&seed=25',
    ],
    description:
      'Cortes premium de carnes grelhadas na parrilla argentina. Acompanhamentos deliciosos e farta carta de vinhos.',
    discountDescription:
      'Peça qualquer corte especial e ganhe nosso famoso Petit Gâteau de Doce de Leite.',
    address: 'Rua Amauri, 300 - Jardim Europa',
    coordinates: { lat: -23.581, lng: -46.683 },
  },
  {
    id: '6',
    name: 'Taco Libre',
    category: 'Mexicano',
    discountBadge: '50% OFF Margaritas',
    rating: 4.4,
    distance: '1.8 km',
    coverImage: 'https://img.usecurling.com/p/600/400?q=tacos',
    galleryImages: [
      'https://img.usecurling.com/p/800/600?q=margarita&seed=26',
      'https://img.usecurling.com/p/800/600?q=nachos&seed=27',
      'https://img.usecurling.com/p/800/600?q=mexican%20restaurant&seed=28',
      'https://img.usecurling.com/p/800/600?q=guacamole&seed=29',
      'https://img.usecurling.com/p/800/600?q=burrito&seed=30',
    ],
    description:
      'Alegria, cores e muito sabor! Comida tex-mex autêntica com as melhores margaritas da região.',
    discountDescription:
      'Margaritas pela metade do preço no happy hour (18h às 20h) ao pedir qualquer porção.',
    address: 'Rua dos Pinheiros, 800 - Pinheiros',
    coordinates: { lat: -23.566, lng: -46.69 },
  },
]

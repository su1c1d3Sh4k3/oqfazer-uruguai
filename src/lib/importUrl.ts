import { Place } from '@/data/places'

export function parseImportUrl(urlStr: string): Partial<Place> {
  const url = new URL(urlStr)
  const slug = url.pathname.split('/').filter(Boolean).pop()
  if (!slug) throw new Error('URL inválida')

  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  let category = 'Passeios'
  if (slug.includes('bodega')) category = 'Vinícolas'
  if (slug.includes('restaurante')) category = 'Restaurantes'

  const isWine = category === 'Vinícolas'

  return {
    type: 'tour',
    name,
    bookingUrl: urlStr,
    category,
    discountBadge: '5% OFF',
    description: `Experiência imperdível: ${name}. Reservando com o nosso link exclusivo você garante descontos especiais.`,
    discountDescription: 'Utilize o nosso cupom BNU5 ao finalizar sua compra no site do parceiro.',
    couponCode: 'BNU5',
    duration: name.includes('Almoço') ? 'Dia inteiro (4 a 6 horas)' : '2 a 3 horas',
    departureCity: 'Montevideo ou Punta del Este',
    included: isWine
      ? ['Visita guiada', 'Degustação de vinhos']
      : ['Guia especializado', 'Transporte ida e volta'],
    availableDays: ['Terça-feira', 'Quinta-feira', 'Sábado', 'Domingo'],
    coverImage: `https://img.usecurling.com/p/800/600?q=${isWine ? 'vineyard' : 'tour'}&color=blue`,
    galleryImages: Array(5)
      .fill(0)
      .map(
        (_, i) =>
          `https://img.usecurling.com/p/800/600?q=${isWine ? 'wine' : 'city'}&seed=${i + 1}&color=blue`,
      ),
  }
}

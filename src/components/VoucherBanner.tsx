import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Gift, Sparkles } from 'lucide-react'
import { useAccess } from '@/context/AccessContext'
import { usePlaces } from '@/context/PlacesContext'
import { getAppSetting } from '@/lib/appSettings'

export function subscribeLink(whatsapp: string) {
  const msg = encodeURIComponent(
    'Olá! Ganhei um cupom no sorteio do O que Fazer no Uruguai? e quero assinar o guia completo.',
  )
  return `https://wa.me/${whatsapp}?text=${msg}`
}

/** Número do WhatsApp de suporte (usado no convite para assinar). */
export function useSupportWhatsapp() {
  const [whatsapp, setWhatsapp] = useState('')
  useEffect(() => {
    getAppSetting('whatsapp_support').then(setWhatsapp)
  }, [])
  return whatsapp
}

/**
 * Faixa no topo para a conta cupom (sorteio): leva ao restaurante enquanto o
 * cupom vale; depois de usado ou vencido, vira o convite para assinar o guia.
 */
export function VoucherBanner() {
  const { voucher } = useAccess()
  const { allPlaces } = usePlaces()
  const location = useLocation()
  const whatsapp = useSupportWhatsapp()

  if (!voucher) return null
  const place = allPlaces.find((p) => p.id === voucher.placeId)

  if (voucher.status === 'available') {
    // Na página do restaurante o cupom já aparece em destaque
    if (location.pathname === `/place/${voucher.placeId}`) return null
    return (
      <Link
        to={`/place/${voucher.placeId}`}
        className="flex items-center justify-center gap-2 bg-brand-yellow px-4 py-2.5 text-center text-sm font-bold text-slate-900 hover:brightness-95"
      >
        <Gift className="h-4 w-4 shrink-0" />
        <span>
          Seu cupom{voucher.discount ? ` de ${voucher.discount}` : ''}
          {place ? ` no ${place.name}` : ''} está disponível — toque para usar
        </span>
      </Link>
    )
  }

  return (
    <a
      href={whatsapp ? subscribeLink(whatsapp) : 'https://brasileirosnouruguai.com.br'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-center text-sm font-bold text-white hover:brightness-110"
    >
      <Sparkles className="h-4 w-4 shrink-0 text-brand-yellow" />
      <span>
        {voucher.status === 'used' ? 'Gostou do desconto?' : 'Seu cupom expirou.'} Assine o guia e
        tenha descontos em todos os restaurantes →
      </span>
    </a>
  )
}

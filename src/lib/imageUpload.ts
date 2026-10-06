import { supabase } from './supabase'

const BUCKET = 'place-images'

/**
 * Envia uma imagem (data URL) ao Storage e retorna a URL pública.
 * As imagens não ficam mais em base64 na tabela `places` — isso deixava a home com 20+ MB.
 * Caminho: <placeId>/<prefixo>-<aleatório>.<ext> (a política de upload da empresa usa a pasta).
 */
export async function uploadPlaceImage(placeId: string, dataUrl: string, prefix: string) {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${placeId}/${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
  if (error) throw error

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

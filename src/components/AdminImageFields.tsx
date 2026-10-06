import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { cropImageTo4by3, cropImageToSquare, makeThumbnail } from '@/lib/imageUtils'
import { uploadPlaceImage } from '@/lib/imageUpload'
import { toast } from 'sonner'

interface Props {
  placeId: string
  coverImage: string
  galleryImages: string[]
  logoImage?: string
  showLogoField?: boolean
  /** thumb = miniatura dos cards; ausente quando a capa é digitada como URL */
  onChangeCover: (val: string, thumb?: string | null) => void
  onChangeGallery: (idx: number, val: string) => void
  onChangeLogo?: (val: string) => void
}

export function AdminImageFields({
  placeId,
  coverImage,
  galleryImages,
  logoImage,
  showLogoField,
  onChangeCover,
  onChangeGallery,
  onChangeLogo,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadIndex, setActiveUploadIndex] = useState<number | 'cover' | 'logo' | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Formato inválido', { description: 'Apenas imagens JPG ou PNG são aceitas.' })
      return
    }

    setUploading(true)
    try {
      if (activeUploadIndex === 'logo') {
        const dataUrl = await cropImageToSquare(file)
        const url = await uploadPlaceImage(placeId, dataUrl, 'logo')
        if (onChangeLogo) onChangeLogo(url)
        toast.success('Logotipo processado e recortado (1:1) com sucesso.')
      } else if (activeUploadIndex === 'cover') {
        const dataUrl = await cropImageTo4by3(file)
        const [url, thumb] = await Promise.all([
          uploadPlaceImage(placeId, dataUrl, 'cover'),
          makeThumbnail(dataUrl).then((t) => uploadPlaceImage(placeId, t, 'cover-thumb')),
        ])
        onChangeCover(url, thumb)
        toast.success('Imagem processada e recortada (4:3) com sucesso.')
      } else if (typeof activeUploadIndex === 'number') {
        const dataUrl = await cropImageTo4by3(file)
        const url = await uploadPlaceImage(placeId, dataUrl, `gallery-${activeUploadIndex}`)
        onChangeGallery(activeUploadIndex, url)
        toast.success('Imagem processada e recortada (4:3) com sucesso.')
      }
    } catch (err) {
      console.error('Erro ao enviar imagem:', err)
      toast.error('Erro ao enviar imagem', { description: 'Tente novamente.' })
    } finally {
      setUploading(false)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    setActiveUploadIndex(null)
  }

  const triggerUpload = (target: number | 'cover' | 'logo') => {
    setActiveUploadIndex(target)
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6 pt-2">
      {uploading && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
          <Loader2 className="h-4 w-4 animate-spin" /> Enviando imagem...
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png"
        className="hidden"
      />

      {showLogoField && (
        <div className="space-y-3">
          <Label className="text-base">Logo do Estabelecimento (1:1 - Circular)</Label>
          <div className="flex gap-2">
            <Input
              value={logoImage || ''}
              onChange={(e) => onChangeLogo && onChangeLogo(e.target.value)}
              placeholder="URL da Imagem do Logo..."
              className="flex-1"
            />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => triggerUpload('logo')}>
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
          {logoImage && (
            <div className="w-24 h-24 mt-2">
              <div className="w-full h-full rounded-full overflow-hidden border border-slate-200 bg-muted">
                <img src={logoImage} alt="Logo" className="object-cover w-full h-full" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-base">Imagem de Capa (4:3)</Label>
        <div className="flex gap-2">
          <Input
            value={coverImage}
            onChange={(e) => onChangeCover(e.target.value)}
            placeholder="URL da Imagem..."
            className="flex-1"
            required
          />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => triggerUpload('cover')}>
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
        </div>
        {coverImage && (
          <div className="w-48 mt-2">
            <AspectRatio ratio={4 / 3} className="bg-muted rounded-xl overflow-hidden border">
              <img src={coverImage} alt="Capa" className="object-cover w-full h-full" />
            </AspectRatio>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-base">Imagens da Galeria</Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 flex flex-col">
              <div className="flex gap-1">
                <Input
                  value={galleryImages[i] || ''}
                  onChange={(e) => onChangeGallery(i, e.target.value)}
                  placeholder={`Img ${i + 1}`}
                  className="text-xs px-2 h-8"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={uploading}
                  onClick={() => triggerUpload(i)}
                >
                  <Upload className="h-3 w-3" />
                </Button>
              </div>
              {galleryImages[i] && (
                <AspectRatio ratio={4 / 3} className="bg-muted rounded-xl overflow-hidden border">
                  <img
                    src={galleryImages[i]}
                    alt={`Galeria ${i + 1}`}
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AspectRatio } from '@/components/ui/aspect-ratio'

interface Props {
  coverImage: string
  galleryImages: string[]
  onChangeCover: (val: string) => void
  onChangeGallery: (idx: number, val: string) => void
}

export function AdminImageFields({
  coverImage,
  galleryImages,
  onChangeCover,
  onChangeGallery,
}: Props) {
  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-3">
        <Label className="text-base">Imagem de Capa</Label>
        <Input
          value={coverImage}
          onChange={(e) => onChangeCover(e.target.value)}
          placeholder="URL da Imagem..."
          required
        />
        {coverImage && (
          <div className="w-48 mt-2">
            <AspectRatio ratio={4 / 3} className="bg-muted rounded-xl overflow-hidden border">
              <img src={coverImage} alt="Capa" className="object-cover w-full h-full" />
            </AspectRatio>
            <p className="text-xs text-muted-foreground mt-1 text-center font-medium">
              Proporção 4:3
            </p>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <Label className="text-base">Imagens da Galeria</Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Input
                value={galleryImages[i] || ''}
                onChange={(e) => onChangeGallery(i, e.target.value)}
                placeholder={`Imagem ${i + 1}`}
                className="text-sm"
                required
              />
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

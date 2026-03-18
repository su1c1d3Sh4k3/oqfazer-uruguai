import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Place } from '@/data/places'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'

interface Props {
  places: Place[]
  onEdit: (place: Place) => void
  onDelete: (id: string) => void
}

export function AdminPlacesList({ places, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[120px]">Imagem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {places.map((place) => (
            <TableRow key={place.id}>
              <TableCell>
                <div className="w-20">
                  <AspectRatio
                    ratio={4 / 3}
                    className="bg-muted rounded-md overflow-hidden border border-border/50"
                  >
                    <img
                      src={place.coverImage}
                      alt={place.name}
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                </div>
              </TableCell>
              <TableCell className="font-medium">{place.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-medium bg-background">
                  {place.category}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{place.city}</TableCell>
              <TableCell>
                {place.type === 'tour' ? (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold">
                    Passeio
                  </Badge>
                ) : (
                  <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20 border-none font-bold">
                    Local
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(place)}
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(place.id)}
                    className="h-8 w-8 text-slate-500 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {places.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                Nenhum local cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

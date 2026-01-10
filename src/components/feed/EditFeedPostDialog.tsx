import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

type SectorType = 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao';

interface Post {
  id: string;
  title: string;
  content: string;
  sector: SectorType;
}

interface EditFeedPostDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: () => void;
}

const sectors = [
  { value: 'estudios', label: 'Estúdios' },
  { value: 'franchising', label: 'Franchising' },
  { value: 'academy', label: 'Academy' },
  { value: 'consultoras', label: 'Consultoras' },
  { value: 'implantacao', label: 'Implantação' },
];

const EditFeedPostDialog = ({ post, open, onOpenChange, onPostUpdated }: EditFeedPostDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [sector, setSector] = useState<SectorType>(post.sector);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Por favor, adicione conteúdo à publicação');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('posts')
      .update({
        title,
        content,
        sector,
      })
      .eq('id', post.id);

    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar publicação');
      return;
    }

    toast.success('Publicação atualizada com sucesso!');
    onOpenChange(false);
    onPostUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Publicação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da publicação"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-sector">Setor</Label>
            <Select value={sector} onValueChange={(v) => setSector(v as SectorType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">Conteúdo</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo da publicação..."
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFeedPostDialog;

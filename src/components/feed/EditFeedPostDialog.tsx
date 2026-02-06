import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';

type SectorType = 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao' | 'marketing' | 'tecnologia' | 'expansao' | 'pure_store';

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
  { value: 'marketing', label: 'Marketing' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'expansao', label: 'Expansão' },
  { value: 'pure_store', label: 'Pure Store' },
];

const EditFeedPostDialog = ({ post, open, onOpenChange, onPostUpdated }: EditFeedPostDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [sector, setSector] = useState<SectorType>(post.sector);

  // Reset form when post changes
  useEffect(() => {
    setTitle(post.title);
    setContent(post.content);
    setSector(post.sector);
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if content has actual text (strip HTML tags)
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <Label>Conteúdo</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Escreva o conteúdo da publicação..."
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

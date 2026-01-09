import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface SocialMediaContent {
  id: string;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  content_type: string | null;
  posting_date: string | null;
  tag: 'reels' | 'desafio_semana' | 'carrossel' | null;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
}

interface EditContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: SocialMediaContent | null;
  onContentUpdated: () => void;
}

const contentTypes = [
  { value: 'reels', label: 'Reels', color: 'bg-purple-500' },
  { value: 'desafio_semana', label: 'Desafio da Semana', color: 'bg-red-500' },
  { value: 'carrossel', label: 'Carrossel', color: 'bg-teal-500' },
];

const EditContentDialog = ({
  open,
  onOpenChange,
  content,
  onContentUpdated,
}: EditContentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [contentType, setContentType] = useState('');
  const [postingDate, setPostingDate] = useState('');

  useEffect(() => {
    if (content && open) {
      setTitle(content.title);
      setDescription(content.description || '');
      setGoogleDriveUrl(content.google_drive_url || '');
      setContentType(content.tag || content.content_type || '');
      setPostingDate(content.posting_date || content.start_date);
    }
  }, [content, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content) return;

    if (!title || !postingDate || !contentType) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('social_media_content')
      .update({
        title,
        description: description || null,
        google_drive_url: googleDriveUrl || null,
        content_type: contentType,
        posting_date: postingDate,
        start_date: postingDate,
        end_date: postingDate,
        tag: contentType as 'reels' | 'desafio_semana' | 'carrossel',
      })
      .eq('id', content.id);

    setLoading(false);

    if (error) {
      console.error('Error updating content:', error);
      toast.error('Erro ao atualizar conteúdo');
      return;
    }

    toast.success('Conteúdo atualizado com sucesso!');
    onOpenChange(false);
    onContentUpdated();
  };

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Conteúdo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contentType">Tipo de Conteúdo *</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${t.color}`} />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-googleDriveUrl">Link do Google Drive</Label>
            <Input
              id="edit-googleDriveUrl"
              value={googleDriveUrl}
              onChange={(e) => setGoogleDriveUrl(e.target.value)}
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-postingDate">Data de Postagem *</Label>
            <Input
              id="edit-postingDate"
              type="date"
              value={postingDate}
              onChange={(e) => setPostingDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContentDialog;

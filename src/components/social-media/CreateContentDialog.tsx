import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { format } from 'date-fns';

interface CreateSocialMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onContentCreated: () => void;
}

const contentTypes = [
  { value: 'video', label: 'Vídeo' },
  { value: 'image', label: 'Imagem' },
  { value: 'document', label: 'Documento' },
];

const contentTags = [
  { value: 'reels', label: 'Reels', color: 'bg-purple-500' },
  { value: 'desafio_semana', label: 'Desafio da Semana', color: 'bg-red-500' },
  { value: 'carrossel', label: 'Carrossel', color: 'bg-teal-500' },
];

const CreateSocialMediaDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onContentCreated,
}: CreateSocialMediaDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [contentType, setContentType] = useState('video');
  const [tag, setTag] = useState<string>('');
  const [postingDate, setPostingDate] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGoogleDriveUrl('');
    setContentType('video');
    setTag('');
    setPostingDate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!title || !postingDate || !tag) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('social_media_content').insert({
      title,
      description: description || null,
      google_drive_url: googleDriveUrl || null,
      content_type: contentType,
      posting_date: postingDate,
      start_date: postingDate,
      end_date: postingDate,
      tag: tag as 'reels' | 'desafio_semana' | 'carrossel',
      user_id: user.id,
    });

    setLoading(false);

    if (error) {
      console.error('Error creating content:', error);
      toast.error('Erro ao criar conteúdo');
      return;
    }

    toast.success('Conteúdo criado com sucesso!');
    resetForm();
    onOpenChange(false);
    onContentCreated();
  };

  // Set default dates when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setPostingDate(dateStr);
    }
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Conteúdo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reels sobre promoção de janeiro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Tag *</Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tag" />
              </SelectTrigger>
              <SelectContent>
                {contentTags.map((t) => (
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
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o conteúdo..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">Tipo de Conteúdo</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleDriveUrl">Link do Google Drive</Label>
            <Input
              id="googleDriveUrl"
              value={googleDriveUrl}
              onChange={(e) => setGoogleDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postingDate">Data de Postagem *</Label>
            <Input
              id="postingDate"
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
              {loading ? 'Criando...' : 'Criar Conteúdo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSocialMediaDialog;

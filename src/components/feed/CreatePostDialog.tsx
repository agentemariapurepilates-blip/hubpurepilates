import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2, Upload, X } from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CreatePostDialogProps {
  onPostCreated: () => void;
  defaultPostType?: 'feed' | 'novidades';
}

const sectors = [
  { value: 'estudios', label: 'Estúdios' },
  { value: 'franchising', label: 'Franchising' },
  { value: 'academy', label: 'Academy' },
  { value: 'consultoras', label: 'Consultoras' },
  { value: 'implantacao', label: 'Implantação' },
];

const CreatePostDialog = ({ onPostCreated, defaultPostType = 'feed' }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sector, setSector] = useState<string>('');
  const [shortDescription, setShortDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM-01'));
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNovidades = defaultPostType === 'novidades';

  // Generate month options (current + next 3 months)
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 4; i++) {
      const date = addMonths(currentDate, i);
      months.push({
        value: format(date, 'yyyy-MM-01'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return months;
  };

  const monthOptions = generateMonthOptions();

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    setUploadingCover(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-cover.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Erro ao fazer upload da imagem');
      setUploadingCover(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    setCoverImageUrl(urlData.publicUrl);
    setUploadingCover(false);
    toast.success('Imagem de capa carregada!');
  };

  const handleRemoveCover = () => {
    setCoverImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sector) return;

    // Check if content is empty (just HTML tags with no text)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText;
    if (!textContent.trim()) {
      toast.error('Por favor, adicione conteúdo à publicação');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title,
      content,
      sector: sector as 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao',
      post_type: defaultPostType,
      cover_image_url: isNovidades ? (coverImageUrl || null) : null,
      short_description: isNovidades ? (shortDescription || null) : null,
      target_month: isNovidades ? targetMonth : null,
    });

    setLoading(false);

    if (error) {
      toast.error('Erro ao criar publicação');
      return;
    }

    toast.success('Publicação criada com sucesso!');
    setTitle('');
    setContent('');
    setSector('');
    setShortDescription('');
    setCoverImageUrl('');
    setTargetMonth(format(new Date(), 'yyyy-MM-01'));
    setOpen(false);
    onPostCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Publicação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Publicação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da publicação"
              required
            />
          </div>
          
          {/* Sector and Month in a row for novidades */}
          <div className={`grid gap-4 ${isNovidades ? 'grid-cols-1 sm:grid-cols-2' : ''}`}>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={sector} onValueChange={setSector} required>
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

            {isNovidades && (
              <div className="space-y-2">
                <Label>Mês da publicação</Label>
                <Select value={targetMonth} onValueChange={setTargetMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="capitalize">{m.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Cover Image - only for novidades */}
          {isNovidades && (
            <div className="space-y-2">
              <Label>Imagem de capa</Label>
              {coverImageUrl ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <img
                    src={coverImageUrl}
                    alt="Capa"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveCover}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingCover ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique para fazer upload da imagem de capa
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>
          )}

          {/* Short Description - only for novidades */}
          {isNovidades && (
            <div className="space-y-2">
              <Label htmlFor="shortDescription">Descrição curta (opcional)</Label>
              <Textarea
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Aparece no card. Se vazio, usa o primeiro parágrafo do conteúdo."
                rows={2}
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Escreva o conteúdo da publicação..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !sector}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                'Publicar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;

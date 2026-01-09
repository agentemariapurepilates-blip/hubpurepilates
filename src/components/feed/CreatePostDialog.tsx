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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Loader2, Image, X, Smile } from 'lucide-react';

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

const emojis = [
  '😀', '😃', '😄', '😁', '😊', '🥰', '😍', '🤩',
  '👍', '👏', '🙌', '💪', '🎉', '🎊', '🏆', '⭐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🔥', '✨', '💡', '📢', '📌', '✅', '🚀', '💼',
];

const CreatePostDialog = ({ onPostCreated, defaultPostType = 'feed' }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sector, setSector] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sector) return;

    setLoading(true);
    let imageUrl: string | null = null;

    // Upload image if exists
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        toast.error('Erro ao fazer upload da imagem');
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title,
      content,
      sector: sector as 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao',
      image_url: imageUrl,
      post_type: defaultPostType,
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
    setImageFile(null);
    setImagePreview(null);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Publicação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div className="space-y-2">
            <Label htmlFor="sector">Setor</Label>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Conteúdo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-1">
                    <Smile className="h-4 w-4" />
                    Emoji
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="p-1.5 text-lg hover:bg-muted rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo da publicação..."
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Imagem (opcional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              >
                <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para adicionar uma imagem
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG até 5MB
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
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

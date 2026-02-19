import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, ImagePlus, X } from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';

interface CreateParceriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateParceriaDialog = ({ open, onOpenChange, onSuccess }: CreateParceriaDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    partner_url: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `parcerias/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      setCoverImage(publicUrl);
      toast({ title: "Sucesso", description: "Imagem adicionada!" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Erro", description: "Erro ao fazer upload da imagem", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('parcerias')
        .insert({
          title: formData.title,
          content: formData.content || null,
          image_url: coverImage,
          partner_url: formData.partner_url || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Parceria criada com sucesso" });

      setFormData({ title: '', content: '', partner_url: '' });
      setCoverImage(null);
      onSuccess();
    } catch (error) {
      console.error('Error creating parceria:', error);
      toast({ title: "Erro", description: "Erro ao criar parceria", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Parceria</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Parceria com Boticário"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner_url">Link do site (opcional)</Label>
            <Input
              id="partner_url"
              type="url"
              value={formData.partner_url}
              onChange={(e) => setFormData(prev => ({ ...prev, partner_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Imagem de Capa</Label>
            {coverImage ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={coverImage} alt="Capa" className="w-full h-auto object-contain" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeCoverImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {uploadingImage ? (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Clique para adicionar uma imagem</p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <RichTextEditor
              content={formData.content}
              onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
              placeholder="Descreva a parceria..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.title}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Parceria
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateParceriaDialog;

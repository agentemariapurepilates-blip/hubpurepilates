import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';

interface CreateAvisoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateAvisoDialog = ({ open, onOpenChange, onSuccess }: CreateAvisoDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    partner_name: '',
    image_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('avisos')
        .insert({
          title: formData.title,
          content: formData.content || null,
          partner_name: formData.partner_name || null,
          image_url: formData.image_url || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Aviso criado com sucesso"
      });
      
      setFormData({ title: '', content: '', partner_name: '', image_url: '' });
      onSuccess();
    } catch (error) {
      console.error('Error creating aviso:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar aviso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Aviso</DialogTitle>
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
            <Label htmlFor="partner_name">Nome do Parceiro</Label>
            <Input
              id="partner_name"
              value={formData.partner_name}
              onChange={(e) => setFormData(prev => ({ ...prev, partner_name: e.target.value }))}
              placeholder="Ex: O Boticário"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <RichTextEditor
              content={formData.content}
              onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
              placeholder="Descreva os detalhes do aviso..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL da Imagem de Capa (opcional)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.title}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Aviso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAvisoDialog;

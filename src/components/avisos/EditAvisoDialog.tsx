import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Aviso } from '@/pages/Avisos';
import RichTextEditor from '@/components/ui/rich-text-editor';

interface EditAvisoDialogProps {
  aviso: Aviso | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditAvisoDialog = ({ aviso, open, onOpenChange, onSuccess }: EditAvisoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (aviso) {
      setFormData({
        title: aviso.title,
        content: aviso.content || ''
      });
    }
  }, [aviso]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aviso) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('avisos')
        .update({
          title: formData.title,
          content: formData.content || null
        })
        .eq('id', aviso.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Aviso atualizado com sucesso"
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating aviso:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar aviso",
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
          <DialogTitle>Editar Aviso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Parceria com Boticário"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <RichTextEditor
              content={formData.content}
              onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
              placeholder="Escreva o conteúdo do aviso..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.title}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAvisoDialog;

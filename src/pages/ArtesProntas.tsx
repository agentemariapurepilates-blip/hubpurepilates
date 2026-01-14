import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Palette, Sparkles, Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Arte {
  id: string;
  title: string;
  image_url: string;
  canva_url: string;
  display_order: number;
}

const ArtesProntas = () => {
  const { isAdmin } = useAuth();
  const [artes, setArtes] = useState<Arte[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArte, setSelectedArte] = useState<Arte | null>(null);
  const [editingArte, setEditingArte] = useState<Arte | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [arteToDelete, setArteToDelete] = useState<Arte | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCanvaUrl, setFormCanvaUrl] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchArtes();
  }, []);

  const fetchArtes = async () => {
    try {
      const { data, error } = await supabase
        .from('artes_prontas')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setArtes(data || []);
    } catch (error) {
      console.error('Error fetching artes:', error);
      toast({
        title: 'Erro ao carregar artes',
        description: 'Não foi possível carregar as artes prontas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('artes-prontas')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('artes-prontas')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const resetForm = () => {
    setFormTitle('');
    setFormCanvaUrl('');
    setFormImageUrl('');
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleCreate = async () => {
    if (!formTitle || !formCanvaUrl || (!selectedFile && !formImageUrl)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formImageUrl;
      
      if (selectedFile) {
        setUploading(true);
        imageUrl = await uploadImage(selectedFile);
        setUploading(false);
      }

      const maxOrder = artes.length > 0 ? Math.max(...artes.map(a => a.display_order)) : 0;

      const { error } = await supabase
        .from('artes_prontas')
        .insert({
          title: formTitle,
          canva_url: formCanvaUrl,
          image_url: imageUrl,
          display_order: maxOrder + 1,
        });

      if (error) throw error;

      toast({ title: 'Modelo adicionado com sucesso!' });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchArtes();
    } catch (error) {
      console.error('Error creating arte:', error);
      toast({
        title: 'Erro ao criar modelo',
        description: 'Não foi possível criar o modelo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const openEditDialog = (arte: Arte) => {
    setEditingArte(arte);
    setFormTitle(arte.title);
    setFormCanvaUrl(arte.canva_url);
    setFormImageUrl(arte.image_url);
    setPreviewUrl(arte.image_url);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingArte || !formTitle || !formCanvaUrl) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formImageUrl;
      
      if (selectedFile) {
        setUploading(true);
        imageUrl = await uploadImage(selectedFile);
        setUploading(false);
      }

      const { error } = await supabase
        .from('artes_prontas')
        .update({
          title: formTitle,
          canva_url: formCanvaUrl,
          image_url: imageUrl,
        })
        .eq('id', editingArte.id);

      if (error) throw error;

      toast({ title: 'Modelo atualizado com sucesso!' });
      setIsEditDialogOpen(false);
      setEditingArte(null);
      resetForm();
      fetchArtes();
    } catch (error) {
      console.error('Error updating arte:', error);
      toast({
        title: 'Erro ao atualizar modelo',
        description: 'Não foi possível atualizar o modelo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!arteToDelete) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('artes_prontas')
        .delete()
        .eq('id', arteToDelete.id);

      if (error) throw error;

      toast({ title: 'Modelo removido com sucesso!' });
      setIsDeleteDialogOpen(false);
      setArteToDelete(null);
      fetchArtes();
    } catch (error) {
      console.error('Error deleting arte:', error);
      toast({
        title: 'Erro ao remover modelo',
        description: 'Não foi possível remover o modelo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const ArteFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="Nome do modelo"
        />
      </div>
      <div>
        <Label htmlFor="canvaUrl">Link do Canva</Label>
        <Input
          id="canvaUrl"
          value={formCanvaUrl}
          onChange={(e) => setFormCanvaUrl(e.target.value)}
          placeholder="https://www.canva.com/design/..."
        />
      </div>
      <div>
        <Label>Imagem de Preview</Label>
        <div className="mt-2 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {selectedFile ? 'Trocar imagem' : 'Fazer upload de imagem'}
            </Button>
          </div>
          {!selectedFile && (
            <>
              <div className="text-center text-sm text-muted-foreground">ou</div>
              <Input
                value={formImageUrl}
                onChange={(e) => {
                  setFormImageUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                placeholder="Cole a URL da imagem"
              />
            </>
          )}
          {previewUrl && (
            <div className="aspect-[4/5] max-h-48 overflow-hidden rounded-lg border bg-muted">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl('')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Palette className="w-8 h-8 text-primary" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Quer deixar seu feed ainda mais completo?
            </h1>
            
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Lembre-se que temos um enxoval de artes editáveis prontas para você usar! 
              Basta logar na sua conta pessoal e criar uma cópia do modelo que deseja editar.
            </p>
          </div>
        </div>

        {/* Admin Add Button */}
        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar modelo
            </Button>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artes.map((arte) => (
            <Card
              key={arte.id}
              className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-2 hover:border-primary/30"
              onClick={() => setSelectedArte(arte)}
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img
                  src={arte.image_url}
                  alt={arte.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Clique para acessar</span>
                  </div>
                </div>
              </div>

              {/* Admin Edit/Delete Buttons */}
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(arte);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setArteToDelete(arte);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="p-4 border-t">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {arte.title}
                </h3>
              </div>
            </Card>
          ))}
        </div>

        {artes.length === 0 && (
          <div className="text-center py-12">
            <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma arte pronta disponível no momento.</p>
          </div>
        )}

        {/* View Arte Dialog */}
        <Dialog open={!!selectedArte} onOpenChange={() => setSelectedArte(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                {selectedArte?.title}
              </DialogTitle>
              <DialogDescription>
                Acesse o modelo no Canva para criar sua própria versão personalizada.
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <div className="aspect-[4/5] rounded-lg overflow-hidden mb-4 bg-muted">
                <img
                  src={selectedArte?.image_url}
                  alt={selectedArte?.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <Button
                className="w-full gap-2"
                onClick={() => window.open(selectedArte?.canva_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Acesse aqui o modelo do Canva
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Arte Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar novo modelo</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo modelo de arte.
              </DialogDescription>
            </DialogHeader>
            
            <ArteFormFields />

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploading ? 'Enviando...' : 'Salvando...'}
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Arte Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingArte(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar modelo</DialogTitle>
              <DialogDescription>
                Atualize as informações do modelo de arte.
              </DialogDescription>
            </DialogHeader>
            
            <ArteFormFields />

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingArte(null); resetForm(); }} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploading ? 'Enviando...' : 'Salvando...'}
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remover modelo</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover o modelo "{arteToDelete?.title}"? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setArteToDelete(null); }} className="flex-1">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  'Remover'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ArtesProntas;

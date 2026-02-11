import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Package, Plus, Pencil, Trash2, Loader2, Upload, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Material {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  display_order: number;
}

const MateriaisImplantacao = () => {
  const { isAdmin, userSector } = useAuth();
  const canManage = isAdmin || userSector === 'implantacao';

  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchMateriais();
  }, []);

  const fetchMateriais = async () => {
    try {
      const { data, error } = await supabase
        .from('materiais_implantacao')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMateriais(data || []);
    } catch (error) {
      console.error('Error fetching materiais:', error);
      toast({
        title: 'Erro ao carregar materiais',
        description: 'Não foi possível carregar os materiais de implantação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMateriais = useMemo(() => {
    if (!searchTerm) return materiais;
    const searchLower = searchTerm.toLowerCase();
    return materiais.filter(m => m.title.toLowerCase().includes(searchLower));
  }, [materiais, searchTerm]);

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
      .from('materiais-implantacao')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('materiais-implantacao')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const resetForm = () => {
    setFormTitle('');
    setFormLinkUrl('');
    setFormImageUrl('');
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleCreate = async () => {
    if (!formTitle || !formLinkUrl || (!selectedFile && !formImageUrl)) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
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

      const maxOrder = materiais.length > 0 ? Math.max(...materiais.map(m => m.display_order)) : 0;

      const { error } = await supabase
        .from('materiais_implantacao')
        .insert({ title: formTitle, link_url: formLinkUrl, image_url: imageUrl, display_order: maxOrder + 1 });

      if (error) throw error;

      toast({ title: 'Material adicionado com sucesso!' });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchMateriais();
    } catch (error) {
      console.error('Error creating material:', error);
      toast({ title: 'Erro ao criar material', description: 'Não foi possível criar o material.', variant: 'destructive' });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material);
    setFormTitle(material.title);
    setFormLinkUrl(material.link_url);
    setFormImageUrl(material.image_url);
    setPreviewUrl(material.image_url);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingMaterial || !formTitle || !formLinkUrl) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
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
        .from('materiais_implantacao')
        .update({ title: formTitle, link_url: formLinkUrl, image_url: imageUrl })
        .eq('id', editingMaterial.id);

      if (error) throw error;

      toast({ title: 'Material atualizado com sucesso!' });
      setIsEditDialogOpen(false);
      setEditingMaterial(null);
      resetForm();
      fetchMateriais();
    } catch (error) {
      console.error('Error updating material:', error);
      toast({ title: 'Erro ao atualizar material', description: 'Não foi possível atualizar o material.', variant: 'destructive' });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('materiais_implantacao')
        .delete()
        .eq('id', materialToDelete.id);

      if (error) throw error;

      toast({ title: 'Material removido com sucesso!' });
      setIsDeleteDialogOpen(false);
      setMaterialToDelete(null);
      fetchMateriais();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({ title: 'Erro ao remover material', description: 'Não foi possível remover o material.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formFieldsJsx = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Nome do material" />
      </div>
      <div>
        <Label htmlFor="linkUrl">Link de acesso</Label>
        <Input id="linkUrl" value={formLinkUrl} onChange={(e) => setFormLinkUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <Label>Imagem de Preview (JPG ou PNG)</Label>
        <div className="mt-2 space-y-3">
          <div className="flex items-center gap-2">
            <Input type="file" accept="image/jpeg,image/png" onChange={handleFileSelect} className="hidden" id="image-upload-materiais" />
            <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload-materiais')?.click()} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {selectedFile ? 'Trocar imagem' : 'Fazer upload de imagem'}
            </Button>
          </div>
          {!selectedFile && (
            <>
              <div className="text-center text-sm text-muted-foreground">ou</div>
              <Input value={formImageUrl} onChange={(e) => { setFormImageUrl(e.target.value); setPreviewUrl(e.target.value); }} placeholder="Cole a URL da imagem" />
            </>
          )}
          {previewUrl && (
            <div className="aspect-[4/5] max-h-48 overflow-hidden rounded-lg border bg-muted">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" onError={() => setPreviewUrl('')} />
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
              <Package className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Materiais de Implantação
            </h1>

            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Acesse os materiais disponíveis para o processo de implantação. Clique em um material para acessar o link correspondente.
            </p>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar materiais..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          {canManage && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar material
            </Button>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMateriais.map((material) => (
            <Card
              key={material.id}
              className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-2 hover:border-primary/30"
              onClick={() => setSelectedMaterial(material)}
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img src={material.image_url} alt={material.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 text-white">
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm font-medium">Clique para acessar</span>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditDialog(material); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setMaterialToDelete(material); setIsDeleteDialogOpen(true); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="p-4 border-t">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {material.title}
                </h3>
              </div>
            </Card>
          ))}
        </div>

        {filteredMateriais.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum material encontrado para sua busca.' : 'Nenhum material de implantação disponível no momento.'}
            </p>
          </div>
        )}

        {/* View Material Dialog */}
        <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {selectedMaterial?.title}
              </DialogTitle>
              <DialogDescription>
                Acesse o material clicando no botão abaixo.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <div className="aspect-[4/5] rounded-lg overflow-hidden mb-4 bg-muted">
                <img src={selectedMaterial?.image_url} alt={selectedMaterial?.title} className="w-full h-full object-cover" />
              </div>

              <Button className="w-full gap-2" onClick={() => window.open(selectedMaterial?.link_url, '_blank')}>
                <ExternalLink className="w-4 h-4" />
                Acesse aqui
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar novo material</DialogTitle>
              <DialogDescription>Preencha as informações do novo material.</DialogDescription>
            </DialogHeader>
            {formFieldsJsx}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving} className="flex-1">
                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploading ? 'Enviando...' : 'Salvando...'}</>) : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingMaterial(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar material</DialogTitle>
              <DialogDescription>Atualize as informações do material.</DialogDescription>
            </DialogHeader>
            {formFieldsJsx}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingMaterial(null); resetForm(); }} className="flex-1">Cancelar</Button>
              <Button onClick={handleUpdate} disabled={saving} className="flex-1">
                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploading ? 'Enviando...' : 'Salvando...'}</>) : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remover material</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover o material "{materialToDelete?.title}"? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setMaterialToDelete(null); }} className="flex-1">Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving} className="flex-1">
                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Removendo...</>) : 'Remover'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default MateriaisImplantacao;

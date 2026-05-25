import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Paintbrush,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  Download,
  Plus,
  X,
  FileText,
  Instagram,
  FileImage,
  FileType,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToStorage } from '@/lib/upload';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Formato = { name: string; url: string };

interface Arte {
  id: string;
  title: string;
  image_url: string;
  formats: Formato[];
  display_order: number;
}

const toDriveDownloadUrl = (url: string): string => {
  const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  return url;
};

const formatIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('instagram') || n.includes('insta') || n.includes('reel') || n.includes('story')) return Instagram;
  if (n.includes('a4') || n.includes('a5') || n.includes('pdf')) return FileText;
  if (n.includes('flyer') || n.includes('cartaz') || n.includes('panfleto')) return FileImage;
  return FileType;
};

const ArtesProntas = () => {
  const { isAdmin } = useAuth();
  const [artes, setArtes] = useState<Arte[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArte, setSelectedArte] = useState<Arte | null>(null);
  const [editingArte, setEditingArte] = useState<Arte | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [arteToDelete, setArteToDelete] = useState<Arte | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formFormats, setFormFormats] = useState<Formato[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchArtes();
  }, []);

  const fetchArtes = async () => {
    try {
      const { data, error } = await supabase
        .from('artes_prontas')
        .select('id, title, image_url, formats, display_order')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setArtes(((data || []) as unknown) as Arte[]);
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

  const filteredArtes = useMemo(() => {
    const lower = searchTerm.toLowerCase().trim();
    return artes.filter((a) => {
      const hasFormats = (a.formats?.length ?? 0) > 0;
      // Não-admin só vê artes com pelo menos um formato disponível
      if (!isAdmin && !hasFormats) return false;
      if (!lower) return true;
      return a.title.toLowerCase().includes(lower);
    });
  }, [artes, searchTerm, isAdmin]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const { publicUrl } = await uploadFileToStorage(file, 'artes-prontas');
    return publicUrl;
  };

  const resetForm = () => {
    setFormTitle('');
    setFormImageUrl('');
    setFormFormats([]);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const openEditDialog = (arte: Arte) => {
    setEditingArte(arte);
    setFormTitle(arte.title);
    setFormImageUrl(arte.image_url);
    setPreviewUrl(arte.image_url);
    setFormFormats(arte.formats ?? []);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingArte || !formTitle) {
      toast({
        title: 'Título é obrigatório',
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
      const normalizedFormats = formFormats
        .filter((f) => f.name.trim() && f.url.trim())
        .map((f) => ({ name: f.name.trim(), url: toDriveDownloadUrl(f.url.trim()) }));

      const { error } = await supabase
        .from('artes_prontas')
        .update({ title: formTitle, image_url: imageUrl, formats: normalizedFormats })
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
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header — alinhado ao estilo do Pure Design */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Paintbrush className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Artes Prontas</h1>
            <p className="text-sm text-muted-foreground">
              Baixe aqui artes prontas para usar no seu estúdio e redes sociais.
            </p>
          </div>
        </div>

        {/* Search — estilo Pure Design (faixa primary à esquerda) */}
        <div className="relative max-w-xl flex items-stretch rounded-lg overflow-hidden shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-primary transition-shadow">
          <div className="w-1.5 bg-primary shrink-0" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar arte pelo título..."
              className="pl-11 h-12 text-base border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-card"
            />
          </div>
        </div>

        {/* Cards grid */}
        {filteredArtes.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            {searchTerm
              ? `Nenhuma arte encontrada para "${searchTerm}".`
              : 'Nenhuma arte disponível no momento.'}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredArtes.map((arte) => {
              const hasFormats = (arte.formats?.length ?? 0) > 0;
              const isClickable = hasFormats || isAdmin;
              return (
                <Card
                  key={arte.id}
                  className={cn(
                    'h-28 overflow-hidden bg-card group relative',
                    isClickable && 'hover:shadow-md cursor-pointer transition-shadow'
                  )}
                  onClick={() => isClickable && setSelectedArte(arte)}
                >
                  <div
                    className="relative h-full"
                    style={{
                      background:
                        'linear-gradient(105deg, hsl(var(--card)) 0%, hsl(var(--card)) 43%, hsl(var(--muted)) 43%, hsl(var(--muted)) 100%)',
                    }}
                  >
                    {/* Thumbnail à direita */}
                    <div className="absolute inset-y-0 right-0 w-[54%] overflow-hidden">
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${arte.image_url})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/35 to-transparent" />
                    </div>
                    {/* Texto + chips à esquerda */}
                    <div className="relative z-10 flex h-full w-[58%] flex-col justify-center p-4 gap-1.5">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                        {arte.title}
                      </h3>
                      {hasFormats ? (
                        <div className="flex flex-wrap gap-1">
                          {arte.formats.slice(0, 3).map((f) => {
                            const Icon = formatIcon(f.name);
                            return (
                              <span
                                key={f.name}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                              >
                                <Icon className="h-2.5 w-2.5" />
                                {f.name}
                              </span>
                            );
                          })}
                          {arte.formats.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              +{arte.formats.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                          sem formatos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(arte);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setArteToDelete(arte);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog · preview + formatos pra baixar */}
        <Dialog open={!!selectedArte} onOpenChange={(open) => !open && setSelectedArte(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-primary" />
                {selectedArte?.title}
              </DialogTitle>
              <DialogDescription>
                Escolha o formato e baixe direto pra usar.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-4">
              {selectedArte && (
                <div className="rounded-lg overflow-hidden bg-muted max-h-72">
                  <img
                    src={selectedArte.image_url}
                    alt={selectedArte.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {(selectedArte?.formats?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {selectedArte?.formats.map((f) => {
                    const Icon = formatIcon(f.name);
                    return (
                      <a
                        key={f.name + f.url}
                        href={f.url}
                        download
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-card hover:border-primary hover:shadow-sm transition-all px-4 py-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-md bg-primary/10 p-2">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{f.name}</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                          <Download className="h-4 w-4" />
                          Baixar aqui
                        </span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum formato disponível ainda.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog · admin */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setEditingArte(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar modelo</DialogTitle>
              <DialogDescription>
                Atualize título, preview e formatos disponíveis para download.
              </DialogDescription>
            </DialogHeader>

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
                <Label>Imagem de preview</Label>
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
                    <Input
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setPreviewUrl(e.target.value);
                      }}
                      placeholder="ou cole a URL da imagem"
                    />
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Formatos para download</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFormFormats([...formFormats, { name: '', url: '' }])
                    }
                    className="h-7 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formFormats.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-3 py-3 rounded-lg bg-muted/40 text-center">
                      Nenhum formato cadastrado. Clique em &quot;Adicionar&quot; para incluir.
                    </p>
                  )}
                  {formFormats.map((f, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="grid grid-cols-[100px_1fr] gap-2 flex-1">
                        <Input
                          placeholder="Ex: A4"
                          value={f.name}
                          onChange={(e) => {
                            const updated = [...formFormats];
                            updated[i] = { ...updated[i], name: e.target.value };
                            setFormFormats(updated);
                          }}
                        />
                        <Input
                          placeholder="URL do Drive ou direta"
                          value={f.url}
                          onChange={(e) => {
                            const updated = [...formFormats];
                            updated[i] = { ...updated[i], url: e.target.value };
                            setFormFormats(updated);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setFormFormats(formFormats.filter((_, idx) => idx !== i))
                        }
                        className="h-9 w-9 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formFormats.length > 0 && (
                    <p className="text-[10px] text-muted-foreground italic px-1 leading-relaxed">
                      Links do Drive em formato <code>/file/d/.../view</code> são convertidos
                      automaticamente para download direto ao salvar.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingArte(null);
                  resetForm();
                }}
                className="flex-1"
              >
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
                Tem certeza que deseja remover o modelo &quot;{arteToDelete?.title}&quot;? Esta
                ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setArteToDelete(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
                className="flex-1"
              >
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

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, ImagePlus, X, Video, FileText } from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { PdfRecusado, subirPdf, type PdfEnviado } from './subirPdf';

interface CreateAvisoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateAvisoDialog = ({ open, onOpenChange, onSuccess }: CreateAvisoDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video' | 'pdf'>('none');
  const [pdf, setPdf] = useState<PdfEnviado | null>(null);
  const [enviandoPdf, setEnviandoPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    setUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avisos/${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      setCoverImage(publicUrl);
      setVideoUrl('');
      setMediaType('image');
      toast({ title: "Sucesso", description: "Imagem de capa adicionada!" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Erro", description: "Erro ao fazer upload da imagem", variant: "destructive" });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setEnviandoPdf(true);
    try {
      setPdf(await subirPdf(file, user.id));
      setCoverImage(null);
      setVideoUrl('');
      setMediaType('pdf');
      toast({ title: "Sucesso", description: "Apresentação adicionada!" });
    } catch (error) {
      console.error('Error uploading pdf:', error);
      toast({
        title: "Erro",
        description: error instanceof PdfRecusado ? error.message : "Erro ao enviar a apresentação",
        variant: "destructive",
      });
    } finally {
      setEnviandoPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const removeMedia = () => {
    setCoverImage(null);
    setVideoUrl('');
    setPdf(null);
    setMediaType('none');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const getGoogleDriveEmbedUrl = (url: string): string | null => {
    let fileId: string | null = null;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) { fileId = match[1]; break; }
    }
    if (!fileId) return null;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (mediaType === 'video' && videoUrl) {
      const embedUrl = getGoogleDriveEmbedUrl(videoUrl);
      if (!embedUrl) {
        toast({ title: "Erro", description: "Link do Google Drive inválido", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      const finalVideoUrl = mediaType === 'video' && videoUrl ? getGoogleDriveEmbedUrl(videoUrl) : null;

      const { error } = await supabase
        .from('avisos')
        .insert({
          title: formData.title,
          content: formData.content || null,
          // Com apresentação, a capa do card é o primeiro slide, gerado no upload.
          image_url: mediaType === 'image' ? coverImage : mediaType === 'pdf' ? pdf?.capa ?? null : null,
          video_url: finalVideoUrl,
          pdf_url: mediaType === 'pdf' ? pdf?.url ?? null : null,
          pdf_nome: mediaType === 'pdf' ? pdf?.nome ?? null : null,
          created_by: user.id
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Aviso criado com sucesso" });
      setFormData({ title: '', content: '' });
      setCoverImage(null);
      setVideoUrl('');
      setPdf(null);
      setMediaType('none');
      onSuccess();
    } catch (error) {
      console.error('Error creating aviso:', error);
      toast({ title: "Erro", description: "Erro ao criar aviso", variant: "destructive" });
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

          {/* Cover Media */}
          <div className="space-y-2">
            <Label>Capa (Imagem, Vídeo ou Apresentação)</Label>

            {mediaType === 'pdf' && pdf ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <FileText className="h-8 w-8 shrink-0 text-primary" />
                <span className="flex-1 truncate text-sm">{pdf.nome}</span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={removeMedia}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : mediaType === 'image' && coverImage ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={coverImage} alt="Capa" className="w-full h-48 object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={removeMedia}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : mediaType === 'video' ? (
              <div className="space-y-2">
                {videoUrl && getGoogleDriveEmbedUrl(videoUrl) && (
                  <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
                    <iframe
                      src={getGoogleDriveEmbedUrl(videoUrl)!}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Cole o link do Google Drive aqui"
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={removeMedia}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  {uploadingMedia ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Imagem</p>
                    </>
                  )}
                </div>
                <div
                  onClick={() => setMediaType('video')}
                  className="flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Video className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Vídeo (Google Drive)</p>
                </div>
                <div
                  onClick={() => !enviandoPdf && pdfInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  {enviandoPdf ? (
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Apresentação (PDF)</p>
                    </>
                  )}
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} className="hidden" />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || enviandoPdf || !formData.title}>
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

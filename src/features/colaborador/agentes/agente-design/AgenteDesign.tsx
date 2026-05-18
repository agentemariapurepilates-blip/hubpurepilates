import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, ImageIcon, Plus, Download, X, Maximize2, Wand2 } from 'lucide-react';
import { AVATARES, TIPO_LABEL, TIPO_ORDER, TIPO_SINGULAR, type Avatar, type AvatarTipo } from './data/avatares';
import { cn } from '@/lib/utils';

const tipoAccent: Record<AvatarTipo, string> = {
  franqueado: 'text-pure-red',
  instrutor: 'text-foreground',
  aluno: 'text-muted-foreground',
};

const AgenteDesign = () => {
  const [openAvatar, setOpenAvatar] = useState<Avatar | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-pure-red/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-pure-red mb-3">
              <User className="h-3 w-3" />
              Agente de Design
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Avatares
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl">
              Biblioteca de avatares pré-cadastrados. Cada um tem fotos de referência
              que mantêm consistência ao gerar novas imagens.
            </p>
          </div>
          <Button asChild className="bg-pure-red hover:bg-pure-red-light text-white">
            <Link to="/agente-design/gerar-foto">
              <Wand2 className="h-4 w-4 mr-2" />
              Ir pra Gerar Foto
            </Link>
          </Button>
        </div>

        {/* 3 colunas por categoria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIPO_ORDER.map((tipo) => {
            const avatares = AVATARES.filter((a) => a.tipo === tipo);
            return (
              <section
                key={tipo}
                className="rounded-xl border border-border bg-card/40 p-4"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className={cn('text-sm font-bold uppercase tracking-wider', tipoAccent[tipo])}>
                    {TIPO_LABEL[tipo]}
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {avatares.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {avatares.map((avatar) => (
                    <AvatarMiniCard
                      key={avatar.id}
                      avatar={avatar}
                      onClick={() => setOpenAvatar(avatar)}
                    />
                  ))}
                  <AddAvatarSlot tipo={tipo} />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <AvatarDetailsDialog
        avatar={openAvatar}
        onClose={() => setOpenAvatar(null)}
        onOpenViewer={(url) => setViewerUrl(url)}
      />

      <ImageViewerDialog
        url={viewerUrl}
        onClose={() => setViewerUrl(null)}
      />
    </MainLayout>
  );
};

// — Mini card —————————————————————————————

type AvatarMiniCardProps = {
  avatar: Avatar;
  onClick: () => void;
};

const AvatarMiniCard = ({ avatar, onClick }: AvatarMiniCardProps) => {
  const thumb = avatar.referencias[0] ?? null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/40 transition-all hover:border-pure-red/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pure-red/50"
    >
      {thumb ? (
        <img
          src={thumb}
          alt={avatar.nome}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border">
            <User className="h-5 w-5" />
          </div>
          <span className="text-[9px] font-medium uppercase tracking-wider">
            Sem foto
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
        <div className="text-[11px] font-semibold text-white leading-tight">
          {avatar.nome}
        </div>
        {avatar.referencias.length > 0 && (
          <div className="mt-0.5 flex items-center gap-1 text-[9px] text-white/70">
            <ImageIcon className="h-2.5 w-2.5" />
            {avatar.referencias.length} {avatar.referencias.length === 1 ? 'foto' : 'fotos'}
          </div>
        )}
      </div>
    </button>
  );
};

const AddAvatarSlot = ({ tipo: _tipo }: { tipo: AvatarTipo }) => {
  return (
    <button
      type="button"
      className="group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-pure-red/50 hover:text-pure-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pure-red/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-current/40">
        <Plus className="h-5 w-5" />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider">
        Adicionar
      </span>
    </button>
  );
};

// — Dialog detalhes ————————————————————————

type AvatarDetailsDialogProps = {
  avatar: Avatar | null;
  onClose: () => void;
  onOpenViewer: (url: string) => void;
};

const AvatarDetailsDialog = ({ avatar, onClose, onOpenViewer }: AvatarDetailsDialogProps) => {
  if (!avatar) return null;

  return (
    <Dialog open={!!avatar} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn('text-[10px] font-semibold tracking-wider uppercase', tipoAccent[avatar.tipo])}>
              {TIPO_SINGULAR[avatar.tipo][avatar.genero]}
            </Badge>
            {avatar.referencias.length > 0 && (
              <span className="text-xs text-muted-foreground">
                · {avatar.referencias.length} {avatar.referencias.length === 1 ? 'foto' : 'fotos'} de referência
              </span>
            )}
          </div>
          <DialogTitle className="text-2xl">{avatar.nome}</DialogTitle>
          <DialogDescription className="text-sm">
            Fotos de referência usadas pra manter a identidade na geração.
          </DialogDescription>
        </DialogHeader>

        {avatar.referencias.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhuma foto cadastrada</p>
            <p className="text-xs text-muted-foreground mt-1">
              Suba 2-3 fotos de referência (rosto, perfil, expressão diferente)
              <br />
              pra manter consistência ao gerar imagens.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {avatar.referencias.map((url, i) => (
              <button
                type="button"
                key={url}
                onClick={() => onOpenViewer(url)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pure-red/50"
                aria-label={`Ver foto ${i + 1} em tamanho real`}
              >
                <img
                  src={url}
                  alt={`${avatar.nome} — referência ${i + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    #{i + 1}
                  </Badge>
                </div>
                {i === 0 && (
                  <div className="absolute bottom-2 right-2">
                    <Badge className="text-[10px] font-semibold bg-pure-red text-white hover:bg-pure-red">
                      Thumb
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                  <div className="opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground">
                      <Maximize2 className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button asChild variant="outline">
            <Link to={`/agente-design/gerar-foto?avatar=${avatar.id}`}>
              <Wand2 className="h-4 w-4 mr-2" />
              Usar este avatar pra gerar foto
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// — Viewer fullscreen ————————————————————————

type ImageViewerDialogProps = {
  url: string | null;
  onClose: () => void;
};

const ImageViewerDialog = ({ url, onClose }: ImageViewerDialogProps) => {
  if (!url) return null;

  const filename = url.split('/').pop() ?? 'imagem.jpeg';

  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 overflow-hidden border-0 bg-black/95">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
          <div className="text-xs text-white/80 font-mono truncate max-w-[60%]">
            {filename}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              asChild
              className="h-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
            >
              <a href={url} download={filename}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Baixar
              </a>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <img
            src={url}
            alt="Foto em tamanho completo"
            className="max-w-full max-h-[95vh] w-auto h-auto object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgenteDesign;

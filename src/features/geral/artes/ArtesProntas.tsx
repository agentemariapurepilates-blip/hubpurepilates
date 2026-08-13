import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, ImageIcon, FolderOpen, ChevronLeft } from 'lucide-react';
import { artesProntas, type ArtePronta } from '@/data/artesProntasData';

/** Nome amigável do arquivo baixado. */
const downloadName = (arte: ArtePronta) => {
  const slug = arte.title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `Pure Pilates - ${arte.format} - ${slug}.${arte.fileType.toLowerCase()}`;
};

const typeIcon = (t: ArtePronta['fileType']) => (t === 'PDF' ? FileText : ImageIcon);

const ArtesProntas = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<ArtePronta | null>(null);

  // Agrupa por campanha/coleção, preservando a ordem de aparição.
  const groups = Array.from(
    artesProntas.reduce((map, arte) => {
      const list = map.get(arte.campaign) ?? [];
      list.push(arte);
      map.set(arte.campaign, list);
      return map;
    }, new Map<string, ArtePronta[]>()),
  );

  const currentArtes = selectedGroup
    ? artesProntas.filter((a) => a.campaign === selectedGroup)
    : [];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground -mt-2">
        Artes finalizadas para baixar e usar direto — o download sai do próprio Hub.
      </p>

      {artesProntas.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Nenhuma arte disponível no momento.
        </Card>
      ) : selectedGroup === null ? (
        /* Nível 1 · coleções */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {groups.map(([campaign, artes]) => {
            const preview = artes[0];
            return (
              <button
                key={campaign}
                type="button"
                onClick={() => setSelectedGroup(campaign)}
                className="text-left"
              >
                <Card className="h-28 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-card">
                  <div
                    className="relative h-full bg-muted"
                    style={{
                      background:
                        'linear-gradient(105deg, hsl(var(--card)) 0%, hsl(var(--card)) 43%, hsl(var(--muted)) 43%, hsl(var(--muted)) 100%)',
                    }}
                  >
                    <div className="absolute inset-y-0 right-0 w-[54%] overflow-hidden">
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${preview.thumbnail})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/35 to-transparent" />
                    </div>
                    <div className="relative z-10 flex h-full w-[58%] items-center gap-3 p-4">
                      <div className="h-9 w-9 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                          {campaign}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {artes.length} {artes.length === 1 ? 'arte' : 'artes'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      ) : (
        /* Nível 2 · artes da coleção */
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedGroup(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para as coleções
          </button>
          <h3 className="text-base font-semibold text-foreground border-b pb-2">
            {selectedGroup}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {currentArtes.map((arte) => {
              const Icon = typeIcon(arte.fileType);
              return (
                <Card
                  key={arte.id}
                  onClick={() => setSelected(arte)}
                  className="h-28 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-card"
                >
                  <div
                    className="relative h-full"
                    style={{
                      background:
                        'linear-gradient(105deg, hsl(var(--card)) 0%, hsl(var(--card)) 43%, hsl(var(--muted)) 43%, hsl(var(--muted)) 100%)',
                    }}
                  >
                    <div className="absolute inset-y-0 right-0 w-[54%] overflow-hidden">
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${arte.thumbnail})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/35 to-transparent" />
                    </div>
                    <div className="relative z-10 flex h-full w-[58%] flex-col justify-center gap-1.5 p-4">
                      <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                        {arte.title}
                      </h4>
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Icon className="h-2.5 w-2.5" />
                        {arte.fileType} · {arte.sizeLabel}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog · preview + download */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              {selected?.title}
            </DialogTitle>
            <DialogDescription>{selected?.campaign}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center max-h-[60vh]">
                <img
                  src={selected.thumbnail}
                  alt={selected.title}
                  className="w-full h-auto object-contain max-h-[60vh]"
                />
              </div>
              <a href={selected.file} download={downloadName(selected)} className="block">
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Baixar {selected.fileType} · {selected.sizeLabel}
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtesProntas;

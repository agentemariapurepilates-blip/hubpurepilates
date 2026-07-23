import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Presentation, Play } from 'lucide-react';
import PresentationSlidesDialog from './PresentationSlidesDialog';
import { NOVIDADES_PURESYSTEM, NOVIDADES_SLIDES } from './novidadesPureSystem';

const NovidadesPureSystemCard = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="group cursor-pointer overflow-hidden ring-1 ring-primary/30 transition-all hover:scale-[1.01] hover:shadow-lg hover:ring-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Capa / thumbnail */}
          <div className="relative shrink-0 bg-neutral-900 sm:w-60">
            <img
              src={NOVIDADES_SLIDES[0].src}
              alt="Capa — Novidades do Pure System"
              className="h-40 w-full object-cover object-center sm:h-full"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium shadow">
                <Play className="h-4 w-4 text-primary" /> Ver apresentação
              </span>
            </div>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
              {NOVIDADES_PURESYSTEM.totalSlides} slides
            </span>
          </div>

          {/* Texto */}
          <div className="flex flex-1 flex-col justify-center gap-2 p-4">
            <Badge className="w-fit gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <Presentation className="h-3 w-3" /> Novo · {NOVIDADES_PURESYSTEM.meeting}
            </Badge>
            <h3 className="text-lg font-bold leading-tight">{NOVIDADES_PURESYSTEM.title}</h3>
            <p className="text-sm text-muted-foreground">{NOVIDADES_PURESYSTEM.subtitle}</p>
            <div className="mt-1">
              <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Play className="h-4 w-4" /> Ver apresentação
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <PresentationSlidesDialog
        open={open}
        onOpenChange={setOpen}
        title={NOVIDADES_PURESYSTEM.title}
        subtitle={NOVIDADES_PURESYSTEM.subtitle}
        slides={NOVIDADES_SLIDES}
      />
    </>
  );
};

export default NovidadesPureSystemCard;

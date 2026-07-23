import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import type { PresentationSlide } from './novidadesPureSystem';

interface PresentationSlidesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  slides: PresentationSlide[];
}

const PresentationSlidesDialog = ({
  open,
  onOpenChange,
  title,
  subtitle,
  slides,
}: PresentationSlidesDialogProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);
  const total = slides.length;

  // Contador "atual / total"
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap() + 1);
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  // Sempre reabrir no primeiro slide
  useEffect(() => {
    if (open && api) api.scrollTo(0, true);
  }, [open, api]);

  // Navegação por teclado (← →), mesmo com o foco no botão de fechar
  useEffect(() => {
    if (!open || !api) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') api.scrollPrev();
      else if (e.key === 'ArrowRight') api.scrollNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, api]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(96vw,1100px)] gap-3 p-3 sm:p-5">
        <DialogTitle className="pr-8 text-base sm:text-lg">
          {title}
          {subtitle && (
            <span className="ml-2 text-xs sm:text-sm font-normal text-muted-foreground">
              {subtitle}
            </span>
          )}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Apresentação com {total} slides. Use as setas, arraste ou use as teclas ← → para navegar.
        </DialogDescription>

        <Carousel setApi={setApi} opts={{ loop: false }} className="w-full">
          <CarouselContent>
            {slides.map((slide, i) => (
              <CarouselItem key={slide.src}>
                <div className="overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                    className="h-auto w-full select-none"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 h-9 w-9 border-0 bg-background/80 shadow backdrop-blur hover:bg-background" />
          <CarouselNext className="right-2 h-9 w-9 border-0 bg-background/80 shadow backdrop-blur hover:bg-background" />
        </Carousel>

        <div className="flex items-center justify-center">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {current} / {total}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PresentationSlidesDialog;

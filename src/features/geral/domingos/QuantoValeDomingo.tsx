import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Landing page pública do estudo "Quanto vale um domingo?" (linkada a partir do
// aviso homônimo). Recuperada do build de produção após um deploy antigo tê-la
// sobrescrito. Slides estáticos em public/domingos-assets/slide-1..7.png.

const TITLE = 'Quanto vale um domingo?';
const DESCRIPTION =
  'O domingo pode estar deixando dinheiro na mesa e cliente novo que só frequenta este dia indo para concorrente. Analisamos o faturamento das unidades que decidiram abrir aos domingos e os números surpreenderam. Preparamos um material completo mostrando o que aconteceu — e o potencial estimado para a sua unidade. Vale a pena separar um tempinho para essa leitura.';
const SLIDES = Array.from({ length: 7 }, (_, i) => `/domingos-assets/slide-${i + 1}.png`);

function EstudoModal({
  title,
  slides,
  open,
  onOpenChange,
}: {
  title: string;
  slides: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if (open) api?.scrollTo(0);
  }, [open, api]);

  const goTo = useCallback((i: number) => api?.scrollTo(i), [api]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-none">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent className="ml-0">
            {slides.map((u, d) => (
              <CarouselItem key={u} className="pl-0">
                <img src={u} alt={`${title} — slide ${d + 1} de ${slides.length}`} className="w-full h-auto" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {slides.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md"
              onClick={() => api?.scrollPrev()}
              disabled={current === 0}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Slide anterior</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md"
              onClick={() => api?.scrollNext()}
              disabled={current === slides.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Próximo slide</span>
            </Button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5">
              {slides.map((u, d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => goTo(d)}
                  aria-label={`Ir para o slide ${d + 1}`}
                  className={`h-1.5 rounded-full transition-all ${d === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
            <div className="absolute top-3 right-3 text-xs font-medium text-white bg-black/40 rounded-full px-2 py-1">
              {current + 1} / {slides.length}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const QuantoValeDomingo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card
        className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] overflow-hidden"
        onClick={() => setOpen(true)}
      >
        <div className="w-full">
          <img src={SLIDES[0]} alt={TITLE} className="w-full h-auto object-contain" />
        </div>
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-base">{TITLE}</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">{DESCRIPTION}</p>
          <span className="text-sm font-medium text-primary hover:underline">
            Clique aqui e veja o estudo especial agora.
          </span>
        </CardContent>
      </Card>
      <EstudoModal title={TITLE} slides={SLIDES} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default QuantoValeDomingo;

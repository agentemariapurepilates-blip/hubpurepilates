// A capa do card de um aviso com apresentação: o primeiro slide.
//
// O caminho normal é a capa já pronta, gerada no upload (subirPdf) e guardada
// em `image_url`. Desenhar aqui é a RESERVA, para os avisos que subiram antes de
// a capa existir — o primeiro foi o "Pure Pass", de 20/10/2026. Por isso o
// desenho só começa quando o card aparece na tela: abrir a lista não pode
// baixar o PDF de cada aviso.

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { abrirPdf, desenharPagina } from './pdfPaginas';

const Selo = () => (
  <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
    <FileText className="h-3 w-3" />
    Apresentação
  </span>
);

const CapaPdf = ({ pdfUrl, capa, titulo }: { pdfUrl: string; capa: string | null; titulo: string }) => {
  const [desenhada, setDesenhada] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (capa || !caixa.current) return;
    let vivo = true;
    const observador = new IntersectionObserver(async ([entrada]) => {
      if (!entrada.isIntersecting) return;
      observador.disconnect();
      try {
        const documento = await abrirPdf(pdfUrl);
        const tela = await desenharPagina(documento, 1, 900);
        if (vivo) setDesenhada(tela.toDataURL('image/jpeg', 0.86));
      } catch {
        // Sem capa, fica o ícone: o aviso abre igual.
      }
    });
    observador.observe(caixa.current);
    return () => {
      vivo = false;
      observador.disconnect();
    };
  }, [pdfUrl, capa]);

  const imagem = capa || desenhada;
  return (
    <div ref={caixa} className="relative w-full">
      {imagem ? (
        <img src={imagem} alt={titulo} className="block h-auto w-full object-contain" />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-muted">
          <FileText className="h-10 w-10 text-primary/70" />
        </div>
      )}
      <Selo />
    </div>
  );
};

export default CapaPdf;

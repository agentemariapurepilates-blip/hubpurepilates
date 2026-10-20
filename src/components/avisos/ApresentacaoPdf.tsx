// A apresentação do aviso, página por página, como slides.
//
// POR QUE NÃO UM <iframe src={pdf}>: seria uma linha, e quebra justo onde mais
// gente abre o Hub. O Safari do iPhone não mostra PDF dentro de iframe — ou
// aparece em branco, ou vira download —, e no Android o visor nativo muda de
// um aparelho para outro. Quem publica não teria como saber que metade da rede
// não está vendo a apresentação.
//
// POR QUE NÃO CONVERTER EM IMAGEM NO UPLOAD: foi o pedido explícito de não
// perder nada. Virar JPG congela a resolução: o slide fica borrado no zoom e
// o texto deixa de ser texto. Aqui a página é desenhada a partir do vetor, na
// resolução da tela de quem está olhando — num celular retina sai com o dobro
// de pixels, e continua nítido ao ampliar.
//
// O ARQUIVO ORIGINAL CONTINUA À MÃO: o botão de baixar entrega o PDF como veio.
// Se algum dia o desenho falhar numa página exótica, a apresentação inteira
// continua a um clique — é a garantia de que nada se perde.

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { abrirPdf, desenharPagina } from './pdfPaginas';

interface ApresentacaoPdfProps {
  url: string;
  /** Nome do arquivo como foi enviado, para o botão de baixar. */
  nome?: string | null;
}

/** Acima disto a espera fica longa e a memória do celular aperta. */
const MAXIMO_DE_PAGINAS = 60;

const ApresentacaoPdf = ({ url, nome }: ApresentacaoPdfProps) => {
  const [paginas, setPaginas] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [problema, setProblema] = useState('');
  // Páginas além do teto: ficam fora dos slides, e a tela diz isso em vez de
  // fingir que a apresentação acabou ali.
  const [cortadas, setCortadas] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [atual, setAtual] = useState(1);
  // Desenhar um PDF inteiro demora; se a pessoa fechar o aviso no meio, o
  // trabalho precisa parar em vez de guardar estado num componente que saiu.
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    setCarregando(true);
    setProblema('');
    setPaginas([]);
    setCortadas(0);

    (async () => {
      try {
        const documento = await abrirPdf(url);
        const total = Math.min(documento.numPages, MAXIMO_DE_PAGINAS);
        // A largura da janela do aviso (até ~670 px) vezes a densidade da
        // tela: num retina sai com o dobro de pixels, e mais que 2x só pesa.
        const largura = Math.round(900 * Math.min(window.devicePixelRatio || 1, 2));

        for (let n = 1; n <= total; n += 1) {
          if (!vivo.current) return;
          const tela = await desenharPagina(documento, n, largura);
          if (!vivo.current) return;
          // Cada página aparece assim que fica pronta: numa apresentação de 30
          // slides, esperar o fim para mostrar a primeira é uma tela parada.
          setPaginas((atuais) => [...atuais, tela.toDataURL('image/png')]);
        }
        if (vivo.current) {
          setCortadas(documento.numPages - total);
          setCarregando(false);
        }
      } catch (erro) {
        console.error('[aviso] não consegui abrir a apresentação:', erro);
        if (vivo.current) {
          setProblema('Não consegui abrir a apresentação aqui.');
          setCarregando(false);
        }
      }
    })();

    return () => {
      vivo.current = false;
    };
  }, [url]);

  useEffect(() => {
    if (!api) return;
    const aoMudar = () => setAtual(api.selectedScrollSnap() + 1);
    aoMudar();
    api.on('select', aoMudar);
    return () => {
      api.off('select', aoMudar);
    };
  }, [api, paginas.length]);

  const baixar = (
    <Button asChild variant="outline" size="sm" className="gap-1.5">
      <a href={url} download={nome || 'apresentacao.pdf'} target="_blank" rel="noreferrer">
        <Download className="h-3.5 w-3.5" />
        Baixar o PDF
      </a>
    </Button>
  );

  if (problema) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{problema}</p>
        <div className="mt-3">{baixar}</div>
      </div>
    );
  }

  if (!paginas.length) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted/40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // `min-w-0` e `overflow-hidden` NÃO SÃO ENFEITE. A janela do aviso é um grid,
  // e filho de grid cresce até a largura natural do conteúdo — que aqui são
  // páginas desenhadas com 1.400 a 2.900 px. Sem a trava, o carrossel alargava
  // a coluna, os slides (100% da coluna) alargavam junto, e cada página nova
  // recomeçava o ciclo: um zoom sem fim, e o arraste travava porque a largura
  // mudava no meio dele (20/10/2026). A largura tem de vir da janela, nunca
  // das páginas.
  return (
    <div className="w-full min-w-0 space-y-2">
      <Carousel setApi={setApi} className="w-full min-w-0 overflow-hidden">
        <CarouselContent>
          {paginas.map((pagina, i) => (
            <CarouselItem key={pagina.slice(-24) + i}>
              <div className="overflow-hidden rounded-lg border bg-white">
                <img src={pagina} alt={`Página ${i + 1}`} className="block h-auto w-full max-w-full" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {paginas.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {atual} de {paginas.length}
          {carregando && ' · carregando as próximas…'}
          {cortadas > 0 && ` · mais ${cortadas} no PDF`}
        </span>
        {baixar}
      </div>
    </div>
  );
};

export default ApresentacaoPdf;

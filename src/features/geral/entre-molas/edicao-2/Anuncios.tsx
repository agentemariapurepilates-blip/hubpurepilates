import { Instagram } from 'lucide-react';
import { Foto, Pagina, VideoAuto, type Lado } from '../diagramacao';
import look1 from './fotos/looks/look-01.jpg';
import look4 from './fotos/looks/look-04.jpg';
import logoStore from './fotos/pure-store-logo.png';

// Anúncios da Pure Store (Coleção Move) entre as seções, para quebrar a leitura: um
// fecha a Black Friday e outro fecha o Pilates Play, para a seção seguinte abrir à esquerda. O @bypurestore tem o maior peso.
// O vídeo da coleção (diferente do clipe da seção Pure Store) ainda vai chegar: quando
// chegar, é só apontar VIDEO_ANUNCIO_MOVE para ele; até lá, entra a foto da coleção.

const VIDEO_ANUNCIO_MOVE: string | null = null;
const INSTAGRAM = 'https://www.instagram.com/bypurestore/';

// clique no link não pode virar a página
const segura = (e: React.SyntheticEvent) => e.stopPropagation();

/** @bypurestore clicável, com o ícone do Instagram: abre em outra aba (no celular, o app). */
const Siga = ({ className, tamanho }: { className?: string; tamanho: number }) => (
  <a
    href={INSTAGRAM}
    target="_blank"
    rel="noreferrer"
    onPointerDown={segura}
    onPointerUp={segura}
    onClick={segura}
    className={`pointer-events-auto inline-flex items-center gap-[0.18em] hover:opacity-85 ${className ?? ''}`}
    style={{ fontSize: tamanho }}
    aria-label="Abrir o Instagram @bypurestore"
  >
    <Instagram style={{ width: '0.78em', height: '0.78em' }} strokeWidth={2.4} />
    @bypurestore
  </a>
);

// cada anúncio com um look diferente da coleção
const Fundo = ({ foto, posicao }: { foto: string; posicao: string }) =>
  VIDEO_ANUNCIO_MOVE ? (
    <VideoAuto src={VIDEO_ANUNCIO_MOVE} poster={foto} className="absolute inset-0" />
  ) : (
    <Foto src={foto} alt="Coleção Move" className="absolute inset-0 h-full w-full" posicao={posicao} />
  );

// Página inteira com a coleção e o @ por cima.
export const AnuncioMove1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={24} tom="escuro" semFolio>
    <Fundo foto={look1} posicao="40% 50%" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-[64px] pb-[70px] pt-[200px] text-[#f7ecdc]">
      <div className="em-sans text-[18px] font-semibold">Coleção Move · Pure Store</div>
      <Siga tamanho={96} className="em-display mt-[10px] font-extrabold leading-[0.9] tracking-[-0.01em] text-[#f7ecdc]" />
      <div className="em-sans mt-[14px] text-[18px] opacity-90">Pré-venda de 02/11 a 02/12 · Lançamento em 04/12 · toque no @ para seguir</div>
    </div>
  </Pagina>
);

// Página creme: a coleção num quadro e o @ em vermelho, grande.
export const AnuncioMove2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={30} semFolio>
    <div className="absolute inset-x-[64px] top-[64px] h-[560px] overflow-hidden">
      <Fundo foto={look4} posicao="50% 35%" />
    </div>
    <div className="absolute inset-x-[64px] top-[660px] text-center">
      <img src={logoStore} alt="Pure Store" draggable={false} className="mx-auto w-[240px] select-none mix-blend-multiply" />
      <Siga tamanho={90} className="em-display mt-[18px] font-extrabold leading-[0.9] tracking-[-0.01em] text-[var(--em-vinho)]" />
      <div className="em-sans mt-[14px] text-[18px]">Coleção Move: com você em todos os seus momentos.</div>
    </div>
  </Pagina>
);

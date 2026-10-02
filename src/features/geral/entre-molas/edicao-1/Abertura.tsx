import { Pagina, VideoAuto, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import fotoMolas from './fotos/abertura-molas.jpg';

// Página 1 — a foto das molas do reformer, sangrada, sem texto (abre a revista
// ao lado do sumário).
export const FotoMolas = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} semFolio tom="escuro">
    <img
      src={fotoMolas}
      alt="Molas do reformer, com o logo Entre Molas na parede do estúdio"
      draggable={false}
      className="absolute inset-0 h-full w-full select-none object-cover"
      style={{ objectPosition: '96% 50%' }}
    />
  </Pagina>
);

// Páginas 3 e 4 — seção "Você sabe o que acontece entre molas?": o título de um
// lado e o vídeo do outro (tocando sozinho, sem som, em loop; o botão liga o som).
export const AberturaTitulo = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.abertura.pagina} tom="vinho">
    <div className="absolute bottom-[110px] left-[64px] right-[64px]">
      <div className="mb-[28px] h-[4px] w-[64px] bg-[#f7ecdc]" />
      <h2 className="em-display text-[132px] font-extrabold uppercase leading-[0.84] tracking-[-0.01em]">
        {MATERIAS.abertura.titulo}
      </h2>
    </div>
  </Pagina>
);

// Vídeo de abertura (versão 1, 30/09/2026): narração provisória, trilha
// provisória. Fonte e renderizador em entre-molas-materiais/edicao-1/video-entre-molas.
const VIDEO_ABERTURA = '/videos/entre-molas/abertura-entre-molas.mp4';

export const AberturaVideo = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.abertura.pagina + 1} tom="escuro">
    <VideoAuto src={VIDEO_ABERTURA} inteiro somAoAbrir className="absolute inset-0 bg-[#1d1413]" />
  </Pagina>
);

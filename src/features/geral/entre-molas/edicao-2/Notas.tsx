import { Corpo, Foto, Miolo, Pagina, VideoAuto, type Lado } from '../diagramacao';
import posterMove from './fotos/colecao-move-poster.jpg';
import lookMove from './fotos/looks/look-12.jpg';
import { MATERIAS } from './materias';
import { Chave, TituloComFio } from './pecas';
import capaManual from './fotos/manual-eletromidia-capa.jpg';
import eletromidia from './fotos/eletromidia.png';
import sophia from './fotos/sophia.jpg';
import tamires from './fotos/tamires.jpg';

// Notas curtas: Equipe Suporte, Eletromídia e Pure Store (Coleção Move: o texto, o
// vídeo novo da coleção e, em Looks.tsx, o mosaico dos looks). Textos como no Canva.

const VIDEO_MOVE = '/videos/entre-molas/edicao-2/colecao-move.mp4';

// Suporte em duas páginas: a chamada em vinho e, ao lado, as duas consultoras grandes.
export const Suporte = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.suporte.pagina} tom="vinho">
    <Miolo className="justify-center">
      <div className="em-sans text-[18px] font-semibold">Equipe Suporte</div>
      <p className="em-display mt-[22px] text-[96px] font-extrabold uppercase leading-[0.88]">{MATERIAS.suporte.titulo}</p>
    </Miolo>
  </Pagina>
);

export const SuporteFotos = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.suporte.pagina + 1}>
    <div className="absolute inset-x-[64px] top-[110px] grid grid-cols-2 gap-[20px]">
      {[
        { src: tamires, nome: 'Tamires' },
        { src: sophia, nome: 'Sophia' },
      ].map((c) => (
        <figure key={c.nome}>
          <img src={c.src} alt={c.nome} draggable={false} className="aspect-[3/4] w-full select-none object-cover shadow-[0_18px_40px_-14px_rgba(0,0,0,0.45)]" />
          <figcaption className="em-sans mt-[16px] text-[24px] font-bold">{c.nome}</figcaption>
          <div className="em-sans text-[16px] opacity-75">Consultora · Equipe Suporte</div>
        </figure>
      ))}
    </div>
    <p className="em-serif absolute inset-x-[64px] top-[740px] text-[26px] italic leading-[1.4]">
      Apresentamos as duas consultoras novas: Tamires e Sophia!
    </p>
  </Pagina>
);

export const Eletromidia = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.eletromidia.pagina}>
    <Miolo className="justify-center">
      <div className="flex items-end gap-[24px]">
        <div className="min-w-0 flex-1">
          <TituloComFio tamanho={80}>{MATERIAS.eletromidia.titulo}</TituloComFio>
        </div>
        <img src={eletromidia} alt="Eletromídia" draggable={false} className="h-[150px] w-[150px] shrink-0 select-none" />
      </div>
      <p className="em-serif mt-[18px] text-[23px] leading-[1.36]">
        A Eletromídia faz parte da comunicação da Pure Pilates e ajuda a levar informações e conteúdos aos alunos durante a
        permanência na unidade.
      </p>
      <Corpo className="mt-[14px] !text-[16.5px]">
        <p className="em-sem-recuo">
          Para que ela cumpra seu papel, é importante verificar diariamente se a TV e o equipamento estão ligados e funcionando
          corretamente.
        </p>
        <p>
          Inclua essa conferência na rotina de abertura da unidade e oriente sua equipe a observar se os conteúdos estão sendo
          exibidos.
        </p>
        <p>
          Esta solução também é uma oportunidade de receita para o studio e existem monitoramentos para verificar a
          disponibilidade da plataforma e dos anúncios digitais.
        </p>
      </Corpo>
    </Miolo>
  </Pagina>
);

// Ao lado do texto, a chamada para baixar o manual atualizado da Pure TV (eletromídia).
const MANUAL = '/arquivos/eletromidia/manual-eletromidia.pdf';

export const EletromidiaManual = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.eletromidia.pagina + 1}>
    <div className="absolute inset-x-[64px] top-[84px]">
      <div className="em-sans text-[15px] font-semibold text-[var(--em-vinho)]">Pure TV · Eletromídia</div>
      <h2 className="em-display mt-[8px] text-[72px] font-extrabold uppercase leading-[0.9]">
        Baixe o <span className="text-[var(--em-vinho)]">manual</span>
      </h2>
      <p className="em-serif mt-[14px] text-[22px] italic leading-[1.4]">O manual atualizado da Pure TV, a eletromídia das unidades.</p>
    </div>
    <div className="absolute left-[64px] top-[330px] w-[300px]">
      <img src={capaManual} alt="Capa do manual da Pure TV" draggable={false} className="w-full select-none shadow-[0_24px_50px_-20px_rgba(0,0,0,0.5)]" />
    </div>
    <div className="absolute left-[400px] right-[64px] top-[340px]">
      <Chave>Inclua essa conferência na rotina de abertura da unidade.</Chave>
      <p className="em-sans mt-[22px] text-[17px] leading-[1.5]">
        Verifique diariamente se a TV e o equipamento estão ligados e funcionando, e oriente sua equipe a observar se os
        conteúdos estão sendo exibidos.
      </p>
      <a
        href={MANUAL}
        download="Manual Eletromídia - Pure TV.pdf"
        target="_blank"
        rel="noreferrer"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="em-sans mt-[30px] inline-flex items-center gap-[10px] bg-[var(--em-vinho)] px-[26px] py-[16px] text-[17px] font-bold text-[#f7ecdc] hover:brightness-110"
      >
        Baixar o manual (PDF) ↓
      </a>
    </div>
  </Pagina>
);

export const StoreVideo = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.move.pagina + 1} tom="escuro" semFolio>
    <VideoAuto src={VIDEO_MOVE} poster={posterMove} somAoAbrir somNoCentro className="absolute inset-0" posicao="50% 20%" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-[64px] pb-[84px] pt-[120px]">
      <div className="em-sans text-[14px] font-bold uppercase tracking-[0.26em] text-[#ffd9a8]">Coleção</div>
      <div className="em-display text-[150px] font-extrabold uppercase leading-[0.82] text-[#f7ecdc]">Move</div>
    </div>
  </Pagina>
);

export const StoreMove = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.move.pagina} folioCurto>
    <Foto src={lookMove} alt="Coleção Move" className="absolute inset-x-0 top-0 h-[430px] w-full" posicao="50% 55%" />
    <div className="absolute inset-x-[64px] top-[466px]">
      <h2 className="em-display text-[92px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">{MATERIAS.move.titulo}</h2>
      <p className="em-serif mt-[14px] text-[25px] leading-[1.3]">
        Com você em todos os seus momentos.
        <br />
        Uma nova proposta de vestir o movimento.
      </p>
      <Corpo colunas={1} className="mt-[14px] !text-[17px]">
        <p className="em-sem-recuo">
          A Coleção Move chega à Pure Store com peças versáteis, cores sofisticadas e uma proposta que acompanha diferentes
          momentos da rotina. Uma seleção pensada para unir o universo do movimento a um estilo que vai além do estúdio.
        </p>
      </Corpo>
      <div className="em-tom--vinho mt-[20px] px-[28px] py-[16px]">
        <p className="em-display text-[44px] font-extrabold uppercase leading-[1]">
          Pré-venda: 02/11 a 02/12.
          <br />
          Lançamento: 04/12.
        </p>
      </div>
    </div>
  </Pagina>
);

import { Corpo, Foto, Miolo, Pagina, VideoAuto, type Lado } from '../diagramacao';
import recepcao from '../edicao-1/fotos/layout/projeto-3.png';
import colecaoMove from '../edicao-1/fotos/pure-store/colecao-move.jpg';
import { MATERIAS } from './materias';
import { TituloComFio } from './pecas';
import eletromidia from './fotos/eletromidia.png';
import logoStore from './fotos/pure-store-logo.png';
import sophia from './fotos/sophia.jpg';
import tamires from './fotos/tamires.jpg';

// Notas curtas: Equipe Suporte, Eletromídia e Pure Store (Coleção Move: o mesmo
// clipe da Edição 1). Textos exatamente como no Canva.

const VIDEO_MOVE = '/videos/entre-molas/colecao-move.mp4';

export const Suporte = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.suporte.pagina} tom="vinho">
    <Miolo className="justify-center">
      <div className="em-sans inline-block self-start bg-[#f7ecdc] px-[12px] py-[6px] text-[14px] font-bold uppercase tracking-[0.3em] text-[#a9293b]">
        Equipe Suporte
      </div>
      <p className="em-display mt-[20px] text-[76px] font-extrabold uppercase leading-[0.9]">{MATERIAS.suporte.titulo}</p>
      <div className="mt-[34px] grid grid-cols-2 gap-[18px]">
        <figure>
          <img src={tamires} alt="Tamires" draggable={false} className="aspect-square w-full select-none border-[6px] border-[#f7ecdc] object-cover shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]" />
          <figcaption className="em-display mt-[12px] text-[38px] font-bold uppercase leading-none">Tamires</figcaption>
        </figure>
        <figure>
          <img src={sophia} alt="Sophia" draggable={false} className="aspect-square w-full select-none border-[6px] border-[#f7ecdc] object-cover shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]" />
          <figcaption className="em-display mt-[12px] text-[38px] font-bold uppercase leading-none">Sophia</figcaption>
        </figure>
      </div>
      <p className="em-sans mt-[22px] text-[20px]">apresentamos as duas consultoras novas - Tamires e Sophia!</p>
    </Miolo>
  </Pagina>
);

export const Eletromidia = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.eletromidia.pagina} folioCurto>
    <Miolo className="!bottom-0">
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
      {/* a recepção do projeto de layout, com a TV na parede */}
      <Foto src={recepcao} alt="Recepção do studio, com a TV na parede" className="relative -mx-[64px] mt-[20px] min-h-0 w-[820px] max-w-none flex-1" posicao="50% 30%" />
    </Miolo>
  </Pagina>
);

export const StoreAbertura = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.move.pagina}>
    <div className="absolute inset-0 flex flex-col items-center justify-center px-[64px] text-center">
      <img src={logoStore} alt="Pure Store" draggable={false} className="w-[520px] select-none mix-blend-multiply" />
      <p className="em-serif mt-[60px] text-[34px]">Siga também</p>
      <p className="em-display mt-[6px] text-[92px] font-extrabold leading-none text-[var(--em-vinho)]">@bypurestore</p>
    </div>
  </Pagina>
);

export const StoreVideo = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.move.pagina + 1} tom="escuro">
    <VideoAuto src={VIDEO_MOVE} poster={colecaoMove} somAoAbrir somNoCentro className="absolute inset-0" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-[64px] pb-[84px] pt-[120px]">
      <div className="em-sans text-[14px] font-bold uppercase tracking-[0.26em] text-[#ffd9a8]">Coleção</div>
      <div className="em-display text-[150px] font-extrabold uppercase leading-[0.82] text-[#f7ecdc]">Move</div>
    </div>
  </Pagina>
);

export const StoreMove = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={MATERIAS.move.pagina + 2} folioCurto>
    <Foto src={colecaoMove} alt="Coleção Move" className="absolute inset-x-0 top-0 h-[430px] w-full" posicao="50% 45%" />
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

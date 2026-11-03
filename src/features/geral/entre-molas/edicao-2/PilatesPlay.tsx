import { Corpo, Miolo, Pagina, VideoAuto, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import { Chave, Intertitulo, TituloComFio } from './pecas';

// Pilates Play no app (páginas 26 a 30): capa | vídeo em página inteira | texto em duas páginas | guia
// para gestores. Texto exatamente como no Canva.

const VIDEO_PLAY = '/videos/entre-molas/edicao-2/pilates-play-no-app.mp4';
const P = MATERIAS.play.pagina;

// Capa da matéria: o chamado antes do vídeo. As letras sobem uma a uma ao abrir a página.
export const PlayCapa = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} tom="vinho" semFolio>
    <div className="absolute inset-x-[64px] top-[84px]">
      <div className="h-[4px] w-[64px] bg-[#f7ecdc]" />
      <div className="em-sans mt-[22px] text-[18px] font-semibold">Pilates Play no app</div>
    </div>
    <h2 className="em-display absolute inset-x-[64px] top-[250px] text-[178px] font-extrabold uppercase leading-[0.82] tracking-[-0.02em]">
      {['Tem', 'novidade', 'aqui'].map((p, i) => (
        <span key={p} className="em-sobe block" style={{ animationDelay: `${1 + i * 0.25}s` }}>
          {i === 2 ? <span className="text-[#ffd9a8]">{p}</span> : p}
        </span>
      ))}
    </h2>
    <p className="em-serif em-sobe absolute inset-x-[64px] top-[740px] text-[26px] italic leading-[1.35]" style={{ animationDelay: '2s' }}>
      Mais de 100 conteúdos exclusivos para os instrutores da rede, agora na palma da mão. Vire a página e veja.
    </p>
  </Pagina>
);

export const Play1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 2}>
    <Miolo>
      <TituloComFio tamanho={76}>
        Excelência na <span className="text-[var(--em-vinho)]">palma da mão</span>
      </TituloComFio>
      <p className="em-serif mt-[20px] text-[24px] italic leading-[1.38]">
        Uma aula inesquecível começa muito antes de o aluno subir no aparelho. Começa na preparação de quem está ali para
        conduzir cada movimento: o instrutor.
      </p>
      <Corpo capitular className="mt-[26px]">
        <p className="em-sem-recuo">
          E agora os professores da rede ganharam um novo aliado. <b>O Pilates Play chegou ao app da Pure Pilates.</b>
        </p>
        <p>
          Desenvolvida pela própria Pure, a Pilates Play é uma plataforma de streaming e ensino a distância pensada para quem
          vive o Pilates de verdade. São mais de 100 conteúdos exclusivos, entre vídeos tutoriais, aulas demonstrativas,
          técnicas de execução e workshops, todos com o método Pure Pilates como base.
        </p>
      </Corpo>
      <div className="mt-[40px] grid grid-cols-[auto_1fr] items-end gap-[28px] border-t border-[var(--em-tinta)]/20 pt-[30px]">
        <div className="em-display text-[150px] font-extrabold leading-[0.8] text-[var(--em-vinho)]">+100</div>
        <p className="em-serif pb-[6px] text-[22px] italic leading-[1.38]">
          conteúdos exclusivos: vídeos tutoriais, aulas demonstrativas, técnicas de execução e workshops.
        </p>
      </div>
      <Chave className="mt-[40px]">O Pilates Play chegou ao app da Pure Pilates.</Chave>
    </Miolo>
  </Pagina>
);

export const Play2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 3}>
    <Miolo className="!top-[130px]">
      <Intertitulo>O que isso muda na sua unidade?</Intertitulo>
      <Corpo colunas={1} className="mt-[12px]">
        <p className="em-sem-recuo">
          Com o Pilates Play no app, seus instrutores podem se atualizar quando e onde quiserem: no intervalo entre aulas, no
          caminho para o estúdio ou naquele momento livre do dia. Sem precisar parar a rotina e sem perder o padrão de qualidade.
        </p>
        <p>
          Para o franqueado, isso significa uma equipe mais preparada, aulas mais alinhadas ao método e uma experiência cada
          vez mais consistente para o aluno, em qualquer unidade da rede.
        </p>
      </Corpo>
      <Chave className="my-[40px]">Uma equipe mais preparada, aulas mais alinhadas ao método e uma experiência mais consistente para o aluno.</Chave>
      <Intertitulo>Uma dica para aproveitar ao máximo!</Intertitulo>
      <Corpo colunas={1} className="mt-[12px]">
        <p className="em-sem-recuo">
          Que tal transformar o Pilates Play em parte da rotina da equipe? Escolher um conteúdo por semana para todos assistirem
          e trocar ideias depois é um jeito simples de manter o time conectado e evoluindo junto.
        </p>
      </Corpo>
      <div className="em-tom--vinho -mx-[64px] mt-[48px] px-[64px] py-[30px]">
        <p className="em-serif text-[24px] italic leading-[1.38]">
          Porque excelência não é algo que se conquista uma vez. É algo que se pratica todos os dias.
        </p>
      </div>
    </Miolo>
  </Pagina>
);

// Página inteira com o vídeo; o som liga junto e o botão fica bem no centro.
export const PlayVideo = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1} tom="escuro" semFolio>
    <VideoAuto src={VIDEO_PLAY} somAoAbrir somNoCentro className="absolute inset-0" posicao="50% 22%" />
  </Pagina>
);

const ACOES = [
  { n: '01', t: 'Apresente na reunião', d: 'Mostre o vídeo explicativo e o caminho para acessar o Play dentro do app.' },
  { n: '02', t: 'Reserve 10 minutos', d: 'Convide o time a explorar o conteúdo junto, ali mesmo, durante a reunião.' },
  { n: '03', t: 'Seja exemplo', d: 'Use o Play no planejamento de uma aula e compartilhe sua experiência com a equipe.' },
  { n: '04', t: 'Acompanhe e reforce', d: 'Na semana seguinte, converse com o time: o que já utilizaram? Quais dúvidas apareceram?' },
];
const SEMANAS = [
  { t: 'Semana 1', d: 'Apresentar e explorar' },
  { t: 'Semana 2', d: 'Enviar lembrete' },
  { t: 'Semana 3', d: 'Resolver dúvidas' },
  { t: 'Semana 4', d: 'Compartilhar experiências' },
];

// Guia para gestores, na hierarquia da revista: caixa-alta só no título; ações em duas
// colunas; o ritmo das quatro semanas como uma linha do tempo, sem tarja.
export const PlayGestor = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 4}>
    <Miolo>
      <div className="em-sans mb-[10px] text-[15px] font-semibold text-[var(--em-vinho)]">Para gestores</div>
      <TituloComFio tamanho={60}>O que o gestor pode fazer para o Play entrar na rotina?</TituloComFio>
      <p className="em-serif mt-[18px] text-[22px] italic leading-[1.4]">
        A adesão começa com uma ação simples: apresentar, experimentar e reforçar o uso.
      </p>

      <div className="mt-[28px] grid grid-cols-2 gap-x-[40px] gap-y-[24px]">
        {ACOES.map((a) => (
          <div key={a.n}>
            <div className="em-display text-[44px] font-extrabold leading-[0.9] text-[var(--em-vinho)]">{a.n}</div>
            <div className="em-sans mt-[10px] text-[20px] font-bold leading-[1.25]">{a.t}</div>
            <p className="em-sans mt-[6px] text-[17px] leading-[1.45] opacity-85">{a.d}</p>
          </div>
        ))}
      </div>

      <Intertitulo className="mt-[34px]">Ritmo de adesão</Intertitulo>
      <div className="relative mt-[18px]">
        <div className="absolute left-[9px] right-[9px] top-[8px] h-[2px] bg-[#a9293b]/35" />
        <div className="relative grid grid-cols-4 gap-[16px]">
          {SEMANAS.map((s) => (
            <div key={s.t}>
              <span className="inline-block h-[18px] w-[18px] rounded-full border-[3px] border-[var(--em-vinho)] bg-[var(--em-papel)]" />
              <div className="em-sans mt-[10px] text-[17px] font-bold">{s.t}</div>
              <div className="em-sans mt-[2px] text-[15px] leading-[1.4] opacity-80">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </Miolo>
  </Pagina>
);

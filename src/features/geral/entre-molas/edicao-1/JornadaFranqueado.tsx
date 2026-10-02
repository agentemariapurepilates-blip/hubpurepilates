import { Corpo, Pagina, VideoAuto, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import timeEscape from './fotos/suporte/time-escape-room.jpg';

// Editoria Suporte ao Franqueado — matéria "A Jornada do Franqueado" (4 páginas):
// 1–2 o texto do Canva ("Crescemos em unidades. E em gente também"), sem mudança;
// 3 a jornada (texto redigido a partir do briefing da equipe, aguardando aprovação) + o caminho;
// 4 o vídeo do último encontro (escape room) em página inteira.

const P = MATERIAS.jornada.pagina;

// O caminho da jornada: uma estrada que sobe da esquerda para a direita, com as
// paradas escritas pela equipe, e termina no céu com o avião de papel.
const PARADAS: { x: number; y: number; texto: string; lado: 'cima' | 'baixo' }[] = [
  { x: 24, y: 300, texto: 'Começamos nos reunindo', lado: 'cima' },
  { x: 232, y: 232, texto: 'Entendemos uns aos outros', lado: 'baixo' },
  { x: 410, y: 176, texto: 'O que cada área faz e como faz', lado: 'baixo' },
  { x: 540, y: 104, texto: 'E agora, onde vamos chegar?', lado: 'baixo' },
];

const Caminho = () => (
  <div className="absolute bottom-[74px] left-[64px] h-[340px] w-[692px]">
    <svg viewBox="0 0 692 340" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {/* a estrada */}
      <path
        d="M24 300 C120 300 150 232 232 232 S340 214 410 176 S500 150 540 104"
        fill="none" stroke="#a9293b" strokeWidth={5} strokeLinecap="round" strokeDasharray="2 13"
      />
      {/* o voo: da última parada para o céu */}
      <path d="M540 104 C560 76 588 56 622 40" fill="none" stroke="#a9293b" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 9" opacity={0.6} />
      <g transform="translate(618 4) rotate(-14)">
        <path d="M0 18 L52 0 L33 46 L22 28 Z" fill="#fff" stroke="#231f20" strokeWidth={2} strokeLinejoin="round" />
        <path d="M22 28 L52 0" stroke="#231f20" strokeWidth={2} />
      </g>
      {PARADAS.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={15} fill="#a9293b" />
          <circle cx={p.x} cy={p.y} r={6} fill="#f7ecdc" />
        </g>
      ))}
    </svg>
    {PARADAS.map((p, i) => (
      <div
        key={i}
        className="em-display absolute w-[160px] text-[20px] font-bold uppercase leading-[1.02] text-[var(--em-tinta)]"
        style={{
          left: Math.min(Math.max(p.x - 20, 0), 692 - 160),
          ...(p.lado === 'cima' ? { bottom: 340 - p.y + 26 } : { top: p.y + 26 }),
        }}
      >
        {p.texto}
      </div>
    ))}
    {/* o destino, no espaço livre acima da estrada */}
    <div className="em-display absolute left-[250px] top-[6px] w-[250px] text-right text-[46px] font-extrabold uppercase leading-[0.9] text-[var(--em-vinho)]">
      O céu é
      <br />o limite!
    </div>
  </div>
);

// Abertura: o título da matéria e o texto do Canva ("Suporte"), exatamente como lá.
export const Suporte1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    <div className="absolute left-[64px] right-[64px] top-[70px]">
      <h2 className="em-display text-[92px] font-extrabold uppercase leading-[0.86] tracking-[-0.01em]">
        A Jornada do <span className="text-[var(--em-vinho)]">Franqueado</span>
      </h2>
      <p className="em-display mt-[22px] border-t-2 border-[var(--em-tinta)] pt-[18px] text-[40px] font-bold uppercase leading-[0.98]">
        Crescemos em unidades. E em gente também
      </p>
    </div>
    <Corpo capitular className="absolute left-[64px] right-[64px] top-[362px]">
      <p>
        Toda boa aula de Pilates tem alguém atento a cada movimento, corrigindo, incentivando e ajudando o aluno a
        ir mais longe com segurança. Na gestão de uma franquia, não é diferente.
      </p>
      <p>
        É esse o papel da nossa equipe de suporte aos franqueados: hoje temos 9 consultoras. Ampliamos o nosso
        capital humano para que nenhum franqueado se sinta sozinho, não importa onde esteja ou em que fase o
        negócio se encontre.
      </p>
      <p>
        Quanto maior a rede, mais importante é manter a proximidade que sempre foi a nossa marca. É ela que nos
        permite ouvir, entender a realidade de cada unidade e evoluir juntos. E é essa proximidade que sustenta um
        dos nossos maiores objetivos: fortalecer a padronização da experiência Pure Pilates e do nosso jeito de
        conduzir os negócios. Para que o aluno encontre o mesmo acolhimento, a mesma qualidade e o mesmo
        encantamento em qualquer unidade da rede. E para que cada franqueado tenha clareza, ferramentas e apoio
        para crescer com consistência.
      </p>
    </Corpo>
  </Pagina>
);

// A frase-síntese em página vinho e o fecho do texto do Canva.
export const Suporte2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1} tom="vinho">
    <div className="absolute left-[64px] right-[64px] top-[84px]">
      <div className="mb-[22px] h-[4px] w-[64px] bg-[#f7ecdc]" />
      <p className="em-display text-[74px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
        Porque padronizar, para nós, não é engessar.
      </p>
      <p className="em-display mt-[18px] text-[32px] font-semibold uppercase leading-[1] text-[#ffd9a8]">
        É garantir que tudo o que faz a Pure dar certo chegue, do mesmo jeito, a cada estúdio.
      </p>
      <p className="em-sans mt-[22px] border-t border-[#f7ecdc]/50 pt-[14px] text-[18px] leading-[1.5]">
        Nas próximas páginas, você vai conhecer melhor quem faz parte desse time. As pessoas que, por trás de cada
        mola, trabalham para que a sua unidade seja cada vez mais Pure.
      </p>
    </div>
    {/* o time no dia do escape room, foto inteira sangrada na base da página */}
    <img
      src={timeEscape}
      alt="O time da Pure no dia do escape room"
      draggable={false}
      className="absolute inset-x-0 bottom-0 h-[462px] w-full select-none object-cover"
    />
    <div className="absolute inset-x-0 bottom-0 h-[110px] bg-gradient-to-t from-black/70 to-transparent" />
  </Pagina>
);

// A jornada: texto redigido a partir do briefing da equipe (01/10/2026) + o caminho.
export const Jornada1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 2}>
    <h2 className="em-display absolute left-[64px] right-[64px] top-[70px] text-[70px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
      O que começou com uma reunião <span className="text-[var(--em-vinho)]">se tornou uma jornada</span>
    </h2>
    <Corpo capitular className="absolute left-[64px] right-[64px] top-[296px]">
      <p>
        Tudo começou com uma reunião do time interno. A pauta: discutir ações em prol da melhoria do atendimento
        ao franqueado e da integração entre as áreas.
      </p>
      <p>
        O que era uma reunião se tornou uma jornada. Hoje ela já é fixa na agenda de todos e tem um objetivo
        claro: melhorar, cada vez mais, o nosso jeito de trabalhar.
      </p>
      <p>
        É também uma forma de nos conectarmos como time: consultoras, marketing e todo mundo que faz a Pure
        acontecer.
      </p>
      <p className="em-destaque">
        O nosso último encontro envolveu um escape room. E ali pudemos ver de perto o quanto estamos conectados.
      </p>
    </Corpo>
    <Caminho />
  </Pagina>
);

// Vídeo do último encontro (escape room) em página inteira: toca sozinho, sem som; o botão liga o som.
// Arquivo leve em public/videos; o original (4K) fica em entre-molas-materiais/edicao-1/videos-brutos.
const VIDEO_ESCAPE = '/videos/entre-molas/jornada-escape-room.mp4';

export const Jornada2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 3} tom="escuro">
    <VideoAuto src={VIDEO_ESCAPE} className="absolute inset-0" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-[64px] pb-[84px] pt-[110px]">
      <div className="em-sans text-[14px] font-bold uppercase tracking-[0.26em] text-[#ff8a9a]">Nosso último encontro</div>
      <div className="em-display mt-[6px] text-[56px] font-extrabold uppercase leading-[0.9] text-[#f7ecdc]">Escape room</div>
    </div>
  </Pagina>
);

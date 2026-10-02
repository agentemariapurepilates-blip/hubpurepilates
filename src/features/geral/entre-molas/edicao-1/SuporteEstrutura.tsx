import { Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import marina from './fotos/suporte/marina-lombardi.jpg';

// Editoria Suporte ao Franqueado — lâmina de abertura (2 páginas), antes de "A Jornada do Franqueado":
// a estrutura do departamento, em cinco níveis. Texto exatamente como enviado pela equipe (02/10/2026).

const P = MATERIAS.suporte.pagina;

const NIVEIS: { titulo: string; frente?: string; texto: string }[] = [
  {
    titulo: 'Supervisão Técnica de Suporte',
    texto:
      'Atua como referência técnica da equipe, apoiando a resolução de dúvidas complexas e garantindo a padronização dos atendimentos, treinamentos e fluxos operacionais.',
  },
  {
    titulo: 'Consultoria Sênior',
    frente: 'Consultoria e Relacionamento',
    texto:
      'Realiza o acompanhamento consultivo das franquias, com reuniões, análise de indicadores e elaboração de planos de ação junto aos franqueados para melhorar o desempenho das unidades.',
  },
  {
    titulo: 'Consultoria Júnior',
    frente: 'Treinamento e Integração',
    texto:
      'Conduz os treinamentos de novos franqueados e as reciclagens operacionais, orientando sobre os sistemas e processos da rede e apoiando a implantação das novas unidades.',
  },
  {
    titulo: 'Assistência de Suporte',
    frente: 'Atendimento Inicial',
    texto:
      'É responsável pelo primeiro nível de atendimento, solucionando dúvidas básicas, acompanhando chamados e encaminhando demandas mais complexas às profissionais responsáveis.',
  },
];

// Abertura: título, apresentação e o primeiro nível (a gerência), com a foto da Marina.
export const Estrutura1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    <Miolo className="!top-[76px]">
      <h2 className="em-display text-[66px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
        Conheça a estrutura do Departamento de <span className="text-[var(--em-vinho)]">Suporte ao Franqueado</span>
      </h2>
      <p className="em-serif mt-[22px] border-t-2 border-[var(--em-tinta)] pt-[18px] text-[21px] leading-[1.42]">
        A Pure Pilates apresenta a estrutura do Departamento de Suporte ao Franqueado, organizada em cinco níveis
        para oferecer atendimento, capacitação e acompanhamento às unidades, com responsabilidades bem definidas.
      </p>
      <div className="mt-[28px] flex min-h-0 flex-1 gap-[30px]">
        <figure className="relative w-[330px] shrink-0 self-stretch overflow-hidden">
          <img src={marina} alt="Marina Lombardi" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: '50% 20%' }} />
          <figcaption className="em-sans absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-[20px] pb-[14px] pt-[44px] text-[15px] font-semibold uppercase tracking-[0.16em] text-[#f7ecdc]">
            Marina Lombardi
          </figcaption>
        </figure>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="em-display text-[96px] font-extrabold leading-[0.8] text-[var(--em-vinho)]">01</div>
          <h3 className="em-display mt-[14px] text-[38px] font-extrabold uppercase leading-[0.94]">
            Gerência de Suporte ao Franqueado
          </h3>
          <p className="em-sans mt-[16px] text-[18px] leading-[1.55]">
            Sob a liderança de Marina Lombardi, é responsável pela gestão do departamento, pelo desenvolvimento da
            equipe e pela integração com as demais áreas da franqueadora, acompanhando indicadores e promovendo
            melhorias nos processos.
          </p>
        </div>
      </div>
    </Miolo>
  </Pagina>
);

// Os outros quatro níveis, em escada, e o fecho.
export const Estrutura2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo className="!top-[76px]">
      <ol className="flex min-h-0 flex-1 flex-col justify-between">
        {NIVEIS.map((n, i) => (
          <li key={n.titulo} className="flex gap-[22px] border-b border-black/15 pb-[16px]">
            <span className="em-display w-[76px] shrink-0 text-[64px] font-extrabold leading-[0.85] text-[var(--em-vinho)]">
              {String(i + 2).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="em-display text-[32px] font-extrabold uppercase leading-[0.96]">{n.titulo}</h3>
              {n.frente && (
                <div className="em-sans mt-[6px] text-[14px] font-bold uppercase tracking-[0.2em] text-[var(--em-vinho)]">
                  {n.frente}
                </div>
              )}
              <p className="em-sans mt-[8px] text-[17.5px] leading-[1.5]">{n.texto}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="em-display mt-[22px] bg-[#a9293b] px-[26px] py-[20px] text-[27px] font-bold uppercase leading-[1.04] text-[#f7ecdc]">
        Essa organização busca fortalecer o relacionamento com os franqueados e oferecer um suporte mais integrado,
        com clareza sobre o papel de cada função.
      </p>
    </Miolo>
  </Pagina>
);

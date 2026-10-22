import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ArrowUp,
  Bot,
  CalendarCheck,
  Check,
  ChevronLeft,
  CircleHelp,
  Megaphone,
  QrCode,
  Ticket,
  Zap,
} from 'lucide-react';
import { CapaFluxoMidia, FluxoMidiaModelo } from './FluxoMidia';

// Manual do franqueado "Comece: Pure Pass e Aula Experimental" — reconstruído
// em HTML nativo, como o Onboarding do Instrutor: o texto do manual de outubro
// de 2026 sem alterações, os quadros e tabelas refeitos aqui e as telas reais
// (public/guias/comece/) extraídas do PDF original em resolução cheia.
//
// O sumário é do Hub: as partes do manual reunidas nos seis assuntos que o
// franqueado procura. As referências "veja a página X" do PDF viraram links
// para a seção correspondente.

const IMG = '/guias/comece';
const TINTA = 'text-[#231F20]';

// ── Peças de layout ────────────────────────────────────────────────────────

const Section = ({ id, children }: { id: string; children: ReactNode }) => (
  <section id={id} className="scroll-mt-6 border-t border-[#231F20]/10 px-6 py-9 sm:px-10 sm:py-11 lg:px-14">
    {children}
  </section>
);

const SectionHeader = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) => (
  <header className="mb-8">
    <div className="flex items-start justify-between gap-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
      <a
        href="#sumario"
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#231F20]/50 transition-colors hover:text-primary"
      >
        <ArrowUp className="h-3.5 w-3.5" />
        Sumário
      </a>
    </div>
    <h2 className={cn('text-2xl font-extrabold leading-[1.1] tracking-tight sm:text-[2rem]', TINTA)}>{title}</h2>
    <div className="mt-4 h-1 w-16 rounded-full bg-primary" />
    {children && <p className="mt-5 text-base leading-relaxed text-[#2b2b2b]">{children}</p>}
  </header>
);

const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className={cn('mb-3 mt-9 text-lg font-bold', TINTA)}>{children}</h3>
);

const P = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn('mb-3 text-[15px] leading-relaxed text-[#2b2b2b]', className)}>{children}</p>
);

/** Rótulo do papel em cada etapa, nas cores do manual. */
const PAPEIS = {
  CLIENTE: 'bg-primary/10 text-primary',
  SISTEMA: 'bg-teal-500/15 text-teal-700',
  UNIDADE: 'bg-amber-500/15 text-amber-700',
} as const;
type Papel = keyof typeof PAPEIS;

const Tag = ({ papel }: { papel: Papel }) => (
  <span className={cn('mr-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]', PAPEIS[papel])}>
    {papel}
  </span>
);

interface Passo {
  titulo: string;
  papel?: Papel;
  texto?: ReactNode;
}

/** Etapas numeradas ligadas por uma linha, como no manual. A última fica escura. */
const Passos = ({ passos }: { passos: Passo[] }) => (
  <ol className="relative space-y-5">
    {passos.map((p, i) => (
      <li key={p.titulo} className="relative flex gap-4">
        {i < passos.length - 1 && (
          <span className="absolute left-[17px] top-10 h-[calc(100%-1rem)] w-0.5 bg-[#231F20]/10" />
        )}
        <span
          className={cn(
            'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white',
            i === passos.length - 1 ? 'bg-[#231F20]' : 'bg-primary',
          )}
        >
          {i + 1}
        </span>
        <div className="pt-1.5">
          <p className={cn('font-bold', TINTA)}>{p.titulo}</p>
          {p.texto && (
            <p className="mt-1 text-[14px] leading-relaxed text-[#2b2b2b]">
              {p.papel && <Tag papel={p.papel} />}
              {p.texto}
            </p>
          )}
        </div>
      </li>
    ))}
  </ol>
);

const Checks = ({ itens }: { itens: ReactNode[] }) => (
  <ul className="space-y-2">
    {itens.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#2b2b2b]">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" strokeWidth={3} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const Bullets = ({ itens, className, marcador = 'text-primary' }: { itens: ReactNode[]; className?: string; marcador?: string }) => (
  <ul className={cn('space-y-1.5', className)}>
    {itens.map((item, i) => (
      <li key={i} className="flex gap-2 text-[14px] leading-relaxed">
        <span className={marcador}>•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const TONS = {
  teal: 'border-teal-500 bg-teal-500/10',
  amber: 'border-amber-500 bg-amber-500/10',
  red: 'border-primary bg-[#F5F4F2]',
  dark: 'border-amber-500 bg-[#231F20]',
};

const TITULO_TONS = {
  teal: 'text-teal-700',
  amber: 'text-amber-700',
  red: 'text-primary',
  dark: 'text-amber-400',
};

const Callout = ({
  tom,
  titulo,
  children,
  className,
}: {
  tom: keyof typeof TONS;
  titulo?: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn('rounded-xl border-l-4 px-5 py-4', TONS[tom], className)}>
    {titulo && (
      <p className={cn('mb-1 text-[11px] font-bold uppercase tracking-[0.2em]', TITULO_TONS[tom])}>{titulo}</p>
    )}
    <div className={cn('text-[14px] leading-relaxed', tom === 'dark' ? 'text-white/90' : 'text-[#2b2b2b]')}>
      {children}
    </div>
  </div>
);

/** Um número ou sigla grande ao lado de um título, como os quadros "3h" e "10%" do manual. */
const Destaque = ({
  valor,
  titulo,
  children,
  tom = 'neutro',
}: {
  valor: ReactNode;
  titulo: string;
  children: ReactNode;
  tom?: 'neutro' | 'red' | 'teal' | 'amber';
}) => (
  <div className="flex gap-4 rounded-xl border border-[#231F20]/10 bg-white p-4">
    <span
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-center text-base font-extrabold leading-none',
        tom === 'neutro' && 'bg-[#F5F4F2] text-primary',
        tom === 'red' && 'bg-primary/10 text-primary',
        tom === 'teal' && 'bg-teal-500/15 text-teal-700',
        tom === 'amber' && 'bg-amber-500/15 text-amber-700',
      )}
    >
      {valor}
    </span>
    <div>
      <p className={cn('font-bold', TINTA)}>{titulo}</p>
      <p className="mt-0.5 text-[14px] leading-relaxed text-[#2b2b2b]">{children}</p>
    </div>
  </div>
);

/** Valor grande em duas linhas ("12 / MESES"), como nos quadros do manual. */
const Sigla = ({ topo, base }: { topo: string; base: string }) => (
  <span className="text-sm">
    {topo}
    <br />
    <span className="text-[9px] tracking-wider">{base}</span>
  </span>
);

/** Tela real do site do cliente, dentro de uma moldura de celular desenhada em CSS. */
const Celular = ({ src, alt, legenda }: { src: string; alt: string; legenda: string }) => (
  <figure className="mx-auto w-full max-w-[230px]">
    <div className="relative overflow-hidden rounded-[2rem] border-[7px] border-[#231F20] bg-white shadow-lg">
      <span className="absolute left-1/2 top-1.5 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-[#231F20]/70" />
      <img src={`${IMG}/${src}.webp`} alt={alt} loading="lazy" className="block w-full" />
    </div>
    <figcaption className="mt-2 text-center text-xs text-[#231F20]/60">{legenda}</figcaption>
  </figure>
);

/** Tela do PureSystem. As largas rolam de lado no celular, em vez de encolher até ficar ilegível. */
const Tela = ({ src, alt, legenda, larga }: { src: string; alt: string; legenda: string; larga?: boolean }) => (
  <figure className="my-5">
    <div className="overflow-x-auto rounded-xl border border-[#231F20]/15 bg-white shadow-sm">
      <img
        src={`${IMG}/${src}.webp`}
        alt={alt}
        loading="lazy"
        className={cn('block h-auto w-full', larga && 'min-w-[720px]')}
      />
    </div>
    <figcaption className="mt-2 text-center text-xs text-[#231F20]/60">{legenda}</figcaption>
  </figure>
);

const Caminho = ({ partes }: { partes: string[] }) => (
  <div className="my-4 flex flex-wrap items-center gap-2">
    {partes.map((p, i) => (
      <span key={p} className="flex items-center gap-2">
        {i > 0 && <span className="font-bold text-primary">›</span>}
        <span className={cn('rounded-full border border-[#231F20]/10 bg-[#F5F4F2] px-3.5 py-1.5 text-sm font-semibold', TINTA)}>
          {p}
        </span>
      </span>
    ))}
  </div>
);

const Botao = ({ children, cor = 'escuro' }: { children: ReactNode; cor?: 'escuro' | 'verde' }) => (
  <span
    className={cn(
      'mx-0.5 inline-block rounded px-2 py-0.5 text-[13px] font-semibold text-white',
      cor === 'escuro' ? 'bg-[#231F20]' : 'bg-green-600',
    )}
  >
    {children}
  </span>
);

const Ir = ({ para, children }: { para: string; children: ReactNode }) => (
  <a href={`#${para}`} className="font-semibold text-primary underline-offset-2 hover:underline">
    {children}
  </a>
);

const Codigo = ({ children }: { children: ReactNode }) => (
  <code className="whitespace-nowrap rounded bg-[#F5F4F2] px-1.5 py-0.5 text-[13px] font-semibold text-[#8a1c24]">
    {children}
  </code>
);

/** Tabela no estilo do manual: cabeçalho escuro, linhas separadas por fio. */
const Tabela = ({
  colunas,
  linhas,
  primeiraForte = true,
}: {
  colunas: string[];
  linhas: ReactNode[][];
  primeiraForte?: boolean;
}) => (
  <div className="my-5 overflow-x-auto">
    <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
      <thead>
        <tr className="bg-[#231F20] text-white">
          {colunas.map((c) => (
            <th key={c} className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em]">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha, i) => (
          <tr key={i} className="border-b border-[#231F20]/10 align-top">
            {linha.map((celula, j) => (
              <td
                key={j}
                className={cn('px-4 py-3 leading-relaxed text-[#2b2b2b]', j === 0 && primeiraForte && cn('font-bold', TINTA))}
              >
                {celula}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Quadro = ({ titulo, cor, itens }: { titulo: string; cor: string; itens: ReactNode[] }) => (
  <div className="overflow-hidden rounded-xl border border-[#231F20]/10 bg-white">
    <div className={cn('h-1.5', cor)} />
    <div className="p-5">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#231F20]/70">{titulo}</p>
      <Bullets itens={itens} className="text-[#2b2b2b]" />
    </div>
  </div>
);

const CartaoTopo = ({ cor, rotulo, rotuloCor, titulo, children }: { cor: string; rotulo: string; rotuloCor: string; titulo: string; children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-[#231F20]/10 bg-white">
    <div className={cn('h-1.5', cor)} />
    <div className="p-5">
      <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', rotuloCor)}>{rotulo}</p>
      <p className={cn('mb-3 font-bold', TINTA)}>{titulo}</p>
      {children}
    </div>
  </div>
);

const Conta = ({ linhas, total }: { linhas: [string, string][]; total: [string, string] }) => (
  <div className="rounded-xl bg-[#F5F4F2] p-5 text-[14px]">
    {linhas.map(([a, b]) => (
      <div key={a} className="flex justify-between gap-4 py-1 text-[#2b2b2b]">
        <span>{a}</span>
        <span className="whitespace-nowrap">{b}</span>
      </div>
    ))}
    <div className="mt-2 flex justify-between border-t border-[#231F20]/15 pt-3 font-extrabold text-primary">
      <span>{total[0]}</span>
      <span>{total[1]}</span>
    </div>
  </div>
);

const Item = ({ id, eyebrow, titulo, children }: { id: string; eyebrow: string; titulo: string; children: ReactNode }) => (
  <div id={id} className="scroll-mt-6 pt-12 first:pt-0">
    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#231F20]/50">{eyebrow}</p>
    <h3 className={cn('mb-4 text-xl font-extrabold tracking-tight sm:text-2xl', TINTA)}>{titulo}</h3>
    {children}
  </div>
);

// ── Sumário ────────────────────────────────────────────────────────────────

interface Grupo {
  id: string;
  nome: string;
  icone: LucideIcon;
  selo: string;
  faixa: string;
  itens: { id: string; titulo: string }[];
}

const GRUPOS: Grupo[] = [
  {
    id: 'guia-rapido',
    nome: 'Guia rápido',
    icone: Zap,
    selo: 'bg-primary/10 text-primary',
    faixa: 'bg-primary',
    itens: [
      { id: 'caminho-do-cliente', titulo: 'O caminho do cliente no Comece' },
      { id: 'tres-jeitos', titulo: 'Os três jeitos de começar, lado a lado' },
      { id: 'porta-de-entrada', titulo: 'O Comece: a porta de entrada' },
    ],
  },
  {
    id: 'fluxo-midia',
    nome: 'Fluxo de mídia',
    icone: Megaphone,
    selo: 'bg-[#E0A458]/20 text-[#9A5A12]',
    faixa: 'bg-[#E0A458]',
    itens: [
      { id: 'midia-com-aporte', titulo: 'Unidades com mídia aporte: fluxo de mídia e configurações' },
      { id: 'midia-sem-aporte', titulo: 'Unidades com verba de contribuição mensal: modelo de tráfego e mensuração' },
    ],
  },
  {
    id: 'pure-pass',
    nome: 'Sobre o Pure Pass',
    icone: Ticket,
    selo: 'bg-primary text-white',
    faixa: 'bg-primary',
    itens: [
      { id: 'planos', titulo: 'Planos e regras' },
      { id: 'compra', titulo: 'A compra, passo a passo' },
      { id: 'cancelamento', titulo: 'Cancelamento e multa' },
      { id: 'primeiro-mes', titulo: 'O primeiro mês' },
      { id: 'unidade-favorita', titulo: 'A unidade favorita' },
    ],
  },
  {
    id: 'experimental-gratuita',
    nome: 'Aula experimental gratuita',
    icone: CalendarCheck,
    selo: 'bg-[#231F20] text-white',
    faixa: 'bg-[#231F20]',
    itens: [
      { id: 'gratuita-agendamento', titulo: 'Como o cliente agenda' },
      { id: 'gratuita-matricula', titulo: 'Do agendamento à matrícula' },
    ],
  },
  {
    id: 'experimental-paga',
    nome: 'Aula experimental paga',
    icone: QrCode,
    selo: 'bg-zinc-500 text-white',
    faixa: 'bg-zinc-500',
    itens: [
      { id: 'paga-ligar', titulo: 'Como ligar na unidade' },
      { id: 'paga-caminho', titulo: 'O caminho do cliente: WhatsApp, termo e PIX' },
      { id: 'paga-regras', titulo: 'Remarcar, cancelar e faltar' },
      { id: 'paga-devolucao', titulo: 'Devolver o PIX e registrar no sistema' },
    ],
  },
  {
    id: 'puresystem',
    nome: 'O que o PureSystem faz sozinho',
    icone: Bot,
    selo: 'bg-teal-500/15 text-teal-700',
    faixa: 'bg-teal-500',
    itens: [
      { id: 'quem-faz-pure-pass', titulo: 'Pure Pass e aula gratuita: quem faz o quê' },
      { id: 'quem-faz-paga', titulo: 'Aula paga e a rotina da sua equipe' },
    ],
  },
  {
    id: 'faq',
    nome: 'Perguntas frequentes',
    icone: CircleHelp,
    selo: 'bg-amber-500/15 text-amber-700',
    faixa: 'bg-amber-500',
    itens: [
      { id: 'faq-pure-pass', titulo: 'Pure Pass e aula experimental' },
      { id: 'faq-paga', titulo: 'Aula paga: dúvidas do dia a dia' },
    ],
  },
];

const parte = (id: string) => {
  const i = GRUPOS.findIndex((g) => g.id === id);
  return `Parte ${i + 1} · ${GRUPOS[i].nome}`;
};

const Sumario = () => (
  <section id="sumario" className="scroll-mt-6 px-6 py-9 sm:px-10 sm:py-11 lg:px-14">
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Neste manual</p>
    <h2 className={cn('text-2xl font-extrabold tracking-tight sm:text-[2rem]', TINTA)}>O que você encontra aqui</h2>
    <div className="mt-4 h-1 w-16 rounded-full bg-primary" />
    <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {GRUPOS.map((g, i) => (
        <div key={g.id} className="relative overflow-hidden rounded-2xl border border-[#231F20]/10 bg-white p-5">
          <span className={cn('absolute inset-x-0 top-0 h-1', g.faixa)} />
          <a href={`#${g.id}`} className="group mb-3 flex items-center gap-3">
            <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', g.selo)}>
              <g.icone className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#231F20]/50">
                Parte {i + 1}
              </span>
              <span className={cn('block font-bold leading-tight group-hover:text-primary', TINTA)}>{g.nome}</span>
            </span>
          </a>
          <ul className="space-y-0.5">
            {g.itens.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-[#2b2b2b] transition-colors hover:bg-[#F5F4F2] hover:text-primary"
                >
                  {item.titulo}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <Callout tom="red" className="mt-7">
      <strong>Precisa de ajuda?</strong> Abra um chamado pelo PureSystem. Para dúvidas rápidas, a <strong>MarIA</strong>{' '}
      responde dentro do sistema, em qualquer tela, pelo botão de ajuda.
    </Callout>
    <p className="mt-4 text-xs text-[#231F20]/60">
      Os valores, nomes de clientes e unidades nas telas internas deste manual são exemplos. As telas do site do cliente
      são as reais.
    </p>
  </section>
);

// ── Parte 1 · Guia rápido ──────────────────────────────────────────────────

const COMPARATIVO: ReactNode[][] = [
  ['Para quem', 'Quem já quer treinar e escolhe quantas aulas por mês.', 'Quem quer conhecer o método antes de decidir.', 'Igual à gratuita, para a unidade filtrar quem quer treinar de verdade.'],
  ['O cliente paga', 'A mensalidade do plano, no cartão, com ou sem fidelidade.', 'Nada.', 'Um PIX (valor padrão da rede: R$ 39,90) que cai na conta Efí da unidade.'],
  ['Como é feito', 'Escolhe plano, preenche os dados, aceita o termo e paga no cartão.', 'Escolhe dia e horário e confirma pelo WhatsApp.', 'Escolhe dia e horário, confirma pelo WhatsApp, aceita o termo e paga o PIX.'],
  ['Quando vira aula', 'Assim que a compra é confirmada, o cliente já agenda as aulas.', 'Na hora, depois da confirmação do WhatsApp.', 'Só depois que o PIX é pago.'],
  ['Cancelar', 'Pelo app. Com fidelidade há multa de 10% das mensalidades que faltam.', 'Cancela ou remarca com 3 horas de antecedência.', 'Remarca sem pagar de novo. Se cancelar, o valor vira crédito de 30 dias.'],
  ['O que sobra de valor', 'Plano ativo e renovação automática todo mês.', 'Uma chance de converter em matrícula.', <>O valor pago vira <strong>crédito na matrícula</strong> por 30 dias, mesmo se faltar.</>],
  ['Papel da unidade', <>Acompanhar o <strong>primeiro mês</strong> (3 contatos) para o cliente criar hábito.</>, 'Receber bem, marcar presença e falta, e fechar a matrícula.', 'Igual à gratuita, mais devolver o PIX quando for o caso.'],
];

const GuiaRapido = () => (
  <Section id="guia-rapido">
    <SectionHeader eyebrow={parte('guia-rapido')} title="Guia rápido" />

    <Item id="caminho-do-cliente" eyebrow="Guia rápido · 1 de 2" titulo="O caminho do cliente no Comece">
      <div className="grid items-start gap-8 md:grid-cols-[230px_1fr]">
        <Celular src="comece-abertura" alt="Abertura do Comece no celular" legenda="Passo 1: a abertura do Comece, no celular" />
        <div>
          <P>
            O <strong>Comece</strong> é a página que recebe quem quer começar no Pilates: vem de anúncio, de busca no
            Google, do site ou de uma campanha da sua unidade. Em poucos toques o cliente escolhe <strong>como</strong>{' '}
            quer começar.
          </P>
          <div className="mt-5">
            <Passos
              passos={[
                {
                  titulo: 'Escolhe a unidade',
                  papel: 'CLIENTE',
                  texto: 'Digita o CEP ou o bairro e vê as unidades mais próximas. Se veio pelo link da sua unidade, já cai direto nela.',
                },
                {
                  titulo: 'Escolhe como começar',
                  papel: 'CLIENTE',
                  texto: (
                    <>
                      A tela mostra <strong>duas portas</strong>: o <strong>Pure Pass</strong> (recomendado) ou uma{' '}
                      <strong>aula experimental</strong> para conhecer antes.
                    </>
                  ),
                },
                {
                  titulo: 'Conclui sozinho',
                  papel: 'SISTEMA',
                  texto: 'Pure Pass: plano, cadastro, termo e cartão no próprio site. Experimental: horário, confirmação no WhatsApp e, se a unidade cobrar, termo e PIX.',
                },
                {
                  titulo: 'Sua unidade entra em campo',
                  papel: 'UNIDADE',
                  texto: (
                    <>
                      Acompanha pelo <strong>Meu Dia</strong> e pela tela <strong>Aulas Experimentais</strong>: recebe a
                      aula, conversa com o cliente e fecha a matrícula.
                    </>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-primary p-6 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Porta 1 · Recomendada</p>
          <p className="mt-1 text-xl font-extrabold">Pure Pass</p>
          <p className="mt-2 text-[14px] text-white/90">
            Assinatura mensal de aulas. O cliente já treina, em qualquer unidade da rede.
          </p>
          <Bullets
            className="mt-3 text-white"
            marcador="text-white"
            itens={['Planos Light, Soft e Power', 'Com ou sem fidelidade', 'Paga no cartão']}
          />
        </div>
        <div className="rounded-2xl border-2 border-[#231F20] bg-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Porta 2 · Para conhecer antes</p>
          <p className={cn('mt-1 text-xl font-extrabold', TINTA)}>Aula experimental</p>
          <p className="mt-2 text-[14px] text-[#2b2b2b]">Uma aula completa de 55 minutos, em turma de até 4 alunos.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#F5F4F2] p-3">
              <p className="font-bold text-primary">Gratuita</p>
              <p className="text-[13px] text-[#2b2b2b]">Padrão da unidade.</p>
            </div>
            <div className="rounded-lg bg-[#F5F4F2] p-3">
              <p className="font-bold text-primary">Paga</p>
              <p className="text-[13px] text-[#2b2b2b]">R$ 39,90 por PIX, vira crédito na matrícula.</p>
            </div>
          </div>
        </div>
      </div>

      <Callout tom="red" className="mt-6">
        <strong>Em uma frase:</strong> o cliente faz a compra ou o agendamento sozinho, o sistema confirma, lembra e
        cobra, e a unidade cuida do que só gente faz bem: receber, conversar e acompanhar.
      </Callout>
    </Item>

    <Item id="tres-jeitos" eyebrow="Guia rápido · 2 de 2" titulo="Os três jeitos de começar, lado a lado">
      <div className="my-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
          <thead>
            <tr>
              <th className="w-[130px]" />
              <th className="bg-primary px-4 py-3 text-white">
                <span className="block font-bold">Pure Pass</span>
                <span className="block text-xs font-normal text-white/80">assinatura mensal</span>
              </th>
              <th className="bg-[#231F20] px-4 py-3 text-white">
                <span className="block font-bold">Experimental gratuita</span>
                <span className="block text-xs font-normal text-white/80">padrão da unidade</span>
              </th>
              <th className="bg-zinc-500 px-4 py-3 text-white">
                <span className="block font-bold">Experimental paga</span>
                <span className="block text-xs font-normal text-white/80">a unidade escolhe ligar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARATIVO.map((linha, i) => (
              <tr key={i} className="border-b border-[#231F20]/10 align-top">
                {linha.map((c, j) => (
                  <td
                    key={j}
                    className={cn(
                      'px-4 py-3 leading-relaxed',
                      j === 0
                        ? cn('text-[11px] font-bold uppercase tracking-[0.12em]', TINTA)
                        : 'bg-[#FAF9F7] text-[#2b2b2b]',
                    )}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Quadro
          titulo="O cliente"
          cor="bg-primary"
          itens={['Escolhe unidade e plano ou horário', 'Preenche os dados e aceita o termo', 'Paga no cartão ou no PIX', 'Cancela e remarca sozinho']}
        />
        <Quadro
          titulo="O sistema, sozinho"
          cor="bg-teal-500"
          itens={['Confirma pelo WhatsApp e por e-mail', 'Lembra a aula na véspera e no dia', 'Cobra a mensalidade todo mês', 'Calcula multa, crédito e devolução']}
        />
        <Quadro
          titulo="A sua unidade"
          cor="bg-amber-500"
          itens={['Recebe o cliente na aula', 'Marca presença ou falta', 'Conversa nos momentos certos', 'Devolve PIX quando necessário']}
        />
      </div>

      <Callout tom="teal" titulo="Como ler este manual" className="mt-6">
        Cada parte tem a mesma ordem: como o cliente vê, o que o sistema faz sozinho e o que é com a sua unidade. As
        regras de cancelamento e de dinheiro estão em seções próprias, fáceis de achar.
      </Callout>
    </Item>

    <Item id="porta-de-entrada" eyebrow="Guia rápido · O Comece" titulo="O Comece: a porta de entrada">
      <P>
        O cliente que clica em "Comece" cai numa página pensada para uma única decisão: <strong>como começar</strong>.
        Esta é a tela da sua unidade, como o cliente vê no celular.
      </P>
      <div className="mt-5 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-[230px_230px_1fr]">
        <Celular src="unidade-topo" alt="Topo da página da unidade no Comece" legenda="Topo: a unidade, a nota no Google e os planos do Pure Pass" />
        <Celular src="unidade-planos" alt="Botão do plano e opção de aula experimental" legenda="Embaixo: o botão do plano e a opção da aula experimental" />
        <div className="sm:col-span-2 lg:col-span-1">
          <p className={cn('mb-3 text-lg font-bold', TINTA)}>O que a tela mostra</p>
          <Checks
            itens={[
              <><strong>Pure Pass em destaque</strong>, com o plano de melhor preço por aula selecionado.</>,
              <><strong>Com ou sem fidelidade</strong>: o cliente compara os preços ali mesmo.</>,
              <><strong>Aula experimental</strong> logo abaixo, para quem prefere conhecer antes.</>,
              <><strong>A unidade</strong>: endereço, horário e a nota do Google.</>,
            ]}
          />
          <Callout tom="teal" titulo="Onde o cliente treina" className="mt-5">
            O Pure Pass vale em qualquer unidade da rede. A unidade que o cliente escolhe na compra é a sua{' '}
            <strong>unidade favorita</strong>: recebe o pagamento e cuida do relacionamento (
            <Ir para="unidade-favorita">veja a unidade favorita</Ir>).
          </Callout>
        </div>
      </div>

      <H3>Os endereços que você pode divulgar</H3>
      <Tabela
        colunas={['Link', 'Para que serve']}
        primeiraForte={false}
        linhas={[
          [<Codigo>purepilates.com.br/comece</Codigo>, 'Abertura geral: o cliente digita CEP ou bairro e escolhe a unidade mais próxima.'],
          [<Codigo>/comece/uf/cidade/unidade</Codigo>, <>Página da <strong>sua unidade</strong>, já com a decisão aberta. É o link que a sua equipe deve usar em bio, WhatsApp e indicações.</>],
          [<Codigo>/comece-aqui/uf/cidade/unidade</Codigo>, <>Versão <strong>só da sua unidade</strong> para campanhas pagas: o cliente não vê troca de unidade nem outras opções de saída.</>],
          [<Codigo>...?cupom=CODIGO</Codigo>, 'Aplica um cupom de Pure Pass já na compra. Vale só para cupom do tipo promocional do Pure Pass.'],
        ]}
      />
      <Callout tom="amber" titulo="Unidade que não aparece para novos alunos">
        Se a sua unidade está pausada para novos clientes, o Comece mostra "Esta unidade não está recebendo novos alunos
        pelo site agora" e oferece outra unidade. Isso é controlado pela franqueadora.
      </Callout>
    </Item>
  </Section>
);

// ── Parte 2 · Fluxo de mídia ───────────────────────────────────────────────

const FluxoDeMidia = () => (
  <Section id="fluxo-midia">
    <SectionHeader eyebrow={parte('fluxo-midia')} title="Fluxo de mídia">
      Como cada modelo de verba leva o lead ao Comece: o evento de otimização da campanha e a página de destino, para
      unidades com e sem aporte.
    </SectionHeader>
    <CapaFluxoMidia />

    <div className="mt-12">
      <Item id="midia-com-aporte" eyebrow="Fluxo de mídia · Com aporte" titulo="Unidades com mídia aporte: fluxo de mídia e configurações">
        <FluxoMidiaModelo slug="com-aporte" />
      </Item>
      <Item
        id="midia-sem-aporte"
        eyebrow="Fluxo de mídia · Verba de contribuição"
        titulo="Unidades com verba de contribuição mensal: modelo de tráfego e mensuração"
      >
        <FluxoMidiaModelo slug="sem-aporte" />
      </Item>
    </div>
  </Section>
);

// ── Parte 3 · Pure Pass ────────────────────────────────────────────────────

const PLANOS = [
  { nome: 'Light', aulas: 2, com: 'R$ 109', sem: 'R$ 129', cor: 'bg-amber-500', inclui: [false, false, false] },
  { nome: 'Soft', aulas: 4, com: 'R$ 209', sem: 'R$ 239', cor: 'bg-teal-500', inclui: [true, true, false] },
  { nome: 'Power', aulas: 8, com: 'R$ 399', sem: 'R$ 439', cor: 'bg-primary', inclui: [true, true, true] },
];
const BENEFICIOS = ['Agendar até 3h antes', 'Crédito vai para o mês seguinte', 'Brinde de boas-vindas'];

const MOMENTOS = [
  {
    eyebrow: '1 · Dias 1 a 5',
    titulo: 'Boas-vindas',
    quando: <>assinou e ainda <strong>nenhuma aula</strong> foi marcada.</>,
    texto: <>O objetivo é um só: <strong>marcar a primeira aula</strong>. Quem marca a primeira aula cedo tem muito mais chance de seguir.</>,
    fala: '"Oi, Marina, bem-vinda à Pure! Já vi que o seu plano está ativo. Posso te ajudar a escolher o melhor horário para a sua primeira aula?"',
  },
  {
    eyebrow: '2 · Dias 10 a 18',
    titulo: 'Meio do mês',
    quando: <>usou <strong>menos da metade</strong> das aulas do plano.</>,
    texto: <>Pergunte como está sendo e <strong>ofereça horários</strong> para usar as aulas do mês. Aqui se descobre se o problema é horário, rotina ou desânimo.</>,
    fala: '"Oi, Lucas! Você já fez 2 das 8 aulas deste mês. Que tal reservarmos juntos os próximos horários da semana?"',
  },
  {
    eyebrow: '3 · 1 a 3 dias antes',
    titulo: 'Pré-cobrança',
    quando: <>faltam <strong>1 a 3 dias</strong> para a primeira renovação.</>,
    texto: <>Lembre da renovação e das aulas que ainda dá para usar, <strong>sem pressionar</strong>. Quem sabe da cobrança antes não cancela por susto.</>,
    fala: '"Oi, Beatriz! Sua renovação do Pure Pass é daqui a 2 dias e você ainda tem 2 aulas para aproveitar. Quer que eu reserve?"',
  },
];

const PurePass = () => (
  <Section id="pure-pass">
    <SectionHeader eyebrow={parte('pure-pass')} title="Sobre o Pure Pass" />

    <Item id="planos" eyebrow="Pure Pass" titulo="Planos e regras">
      <P>
        O Pure Pass é uma <strong>assinatura mensal de aulas</strong>. O cliente escolhe quantas aulas quer por mês e faz
        as aulas em qualquer unidade da rede. A renovação é automática, todo mês, no cartão.
      </P>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {PLANOS.map((p) => (
          <div key={p.nome} className="overflow-hidden rounded-xl border border-[#231F20]/10 bg-white">
            <div className={cn('px-5 py-4 text-white', p.cor)}>
              <p className="text-xl font-extrabold">{p.nome}</p>
              <p className="text-sm text-white/85">{p.aulas} aulas por mês</p>
            </div>
            <div className="space-y-2 px-5 py-4 text-sm">
              <div className="flex items-center justify-between border-b border-dashed border-[#231F20]/15 pb-2">
                <span className="text-[#231F20]/70">Com fidelidade</span>
                <span className={cn('text-lg font-extrabold', TINTA)}>{p.com}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-[#231F20]/15 pb-2">
                <span className="text-[#231F20]/70">Sem fidelidade</span>
                <span className={cn('text-lg font-extrabold', TINTA)}>{p.sem}</span>
              </div>
              <ul className="space-y-1 pt-1">
                {BENEFICIOS.map((b, i) => (
                  <li key={b} className={cn('flex gap-2', p.inclui[i] ? 'text-[#2b2b2b]' : 'text-[#231F20]/40')}>
                    <span className={p.inclui[i] ? 'font-bold text-teal-600' : ''}>{p.inclui[i] ? '✓' : '–'}</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#231F20]/60">
        Valores de referência de outubro de 2026. O site sempre mostra o valor vigente.
      </p>

      <H3>Quanto custa cada aula</H3>
      <Tabela
        colunas={['Plano', 'Aulas por mês', 'Por aula, com fidelidade', 'Por aula, sem fidelidade']}
        linhas={[
          ['Light', '2', 'R$ 54,50', 'R$ 64,50'],
          ['Soft', '4', 'R$ 52,25', 'R$ 59,75'],
          [
            <>
              Power
              <span className="ml-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Melhor preço por aula
              </span>
            </>,
            '8',
            <strong>R$ 49,88</strong>,
            'R$ 54,88',
          ],
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <H3>Com ou sem fidelidade?</H3>
          <div className="space-y-3">
            <Destaque valor={<Sigla topo="12" base="MESES" />} titulo="Com fidelidade" tom="teal">
              O cliente se compromete por 12 meses e paga <strong>menos por mês</strong>. Se cancelar antes do fim, paga a
              multa do termo (<Ir para="cancelamento">veja cancelamento e multa</Ir>).
            </Destaque>
            <Destaque valor={<Sigla topo="0" base="MULTA" />} titulo="Sem fidelidade" tom="amber">
              Mais flexível, por um valor um pouco maior. Cancela quando quiser, sem multa, e o plano segue valendo até o
              fim do período já pago.
            </Destaque>
          </div>
        </div>
        <div>
          <H3>Regras que valem para todos</H3>
          <div className="space-y-3">
            <Destaque valor={<Sigla topo="1x" base="MÊS" />} titulo="Renovação automática">
              A cobrança do cartão se repete todo mês no mesmo dia, até o cliente cancelar.
            </Destaque>
            <Destaque valor={<Sigla topo="+490" base="UNID." />} titulo="Qualquer unidade">
              As aulas do plano valem em toda a rede. A unidade favorita, escolhida na compra, recebe e cuida do cliente.
            </Destaque>
          </div>
        </div>
      </div>

      <Callout tom="teal" titulo="Preço promocional no 1º mês" className="mt-6">
        Com um cupom promocional do Pure Pass, o desconto vale na <strong>primeira mensalidade</strong>. O site mostra "no
        1º mês R$ X, depois R$ Y por mês". O mesmo CPF, e-mail ou telefone não usa cupom de Pure Pass duas vezes em 12
        meses.
      </Callout>
    </Item>

    <Item id="compra" eyebrow="Pure Pass" titulo="A compra, passo a passo">
      <div className="grid items-start gap-8 md:grid-cols-[230px_1fr]">
        <Celular src="compra-plano" alt="Escolha do plano Power e cadastro" legenda="O cliente escolheu o Power: as duas opções e o cadastro" />
        <Passos
          passos={[
            { titulo: 'Escolhe o plano', papel: 'CLIENTE', texto: 'Toca no plano e em "Com fidelidade" ou "Sem fidelidade". O preço por aula aparece no cartão.' },
            { titulo: 'Preenche os dados', papel: 'CLIENTE', texto: 'Nome, e-mail, CPF e WhatsApp. O sistema aproveita o cadastro de quem já é cliente.' },
            { titulo: 'Aceita o termo de adesão', papel: 'CLIENTE', texto: 'O termo é assinado online com "Estou de acordo". Ele traz a fidelidade, as regras de cancelamento e a multa.' },
            { titulo: 'Paga no cartão', papel: 'CLIENTE', texto: 'O pagamento do primeiro mês é no cartão de crédito. Antes de confirmar, o cliente revisa tudo.' },
            { titulo: 'Plano ativo', papel: 'SISTEMA', texto: 'Cria ou atualiza o cadastro, ativa o plano e os créditos de aulas, registra o pagamento e confirma por e-mail. O cliente já agenda as aulas pelo app.' },
          ]}
        />
      </div>
      <div className="mt-8 grid items-start gap-8 md:grid-cols-[230px_1fr]">
        <Celular src="compra-condicoes" alt="Cupom e condições do plano" legenda="Mais embaixo: cupom e as condições do plano" />
        <div>
          <p className={cn('mb-3 text-lg font-bold', TINTA)}>O que o cliente lê antes de continuar</p>
          <P>
            Abaixo do cadastro, o quadro <strong>Informações e Condições</strong> mostra o que vale para o plano (no
            exemplo, o Power):
          </P>
          <Checks
            itens={[
              <><strong>Sem taxa de adesão</strong>: o preço da mensalidade não inclui taxas.</>,
              <><strong>Pagamento mensal automático</strong> por cartão de crédito.</>,
              <><strong>Qualquer unidade</strong>: vale nas mais de 490 unidades da rede.</>,
              <><strong>Fidelização de 12 meses</strong>, quando o plano é com fidelidade.</>,
              <><strong>3 horas de antecedência</strong> para cancelar uma aula.</>,
              <><strong>Aulas não agendadas migram para o mês seguinte</strong> e <strong>brinde de boas-vindas</strong>, nos planos que incluem.</>,
              <><strong>Cupom</strong>: campo opcional; o cliente toca em <Botao>Aplicar</Botao> e segue em <strong>Continuar Adesão</strong>.</>,
            ]}
          />
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tom="amber" titulo="Sem cartão, sem Pure Pass">
          O Pure Pass é vendido no cartão de crédito. Se for recusado, o plano não ativa e o cliente tenta outro cartão.
        </Callout>
        <Callout tom="teal" titulo="Na compra, a unidade não faz nada">
          Cadastro, plano e financeiro já aparecem no sistema. Acompanhe pelo <Ir para="primeiro-mes">primeiro mês</Ir>.
        </Callout>
      </div>
    </Item>

    <Item id="cancelamento" eyebrow="Pure Pass · Regras de cancelamento" titulo="Cancelar o Pure Pass: com e sem multa">
      <P>
        O cliente cancela <strong>pelo app</strong>, sozinho. O que muda é a fidelidade. O sistema calcula a multa do
        termo e o cliente não consegue alterar o valor.
      </P>
      <div className="mt-4 rounded-xl bg-[#231F20] px-5 py-3 text-center font-bold text-white">
        O plano tem fidelidade e ainda faltam mensalidades?
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CartaoTopo cor="bg-teal-500" rotulo="Não" rotuloCor="text-teal-700" titulo="Cancelamento direto">
          <Checks
            itens={[
              <>Plano <strong>sem fidelidade</strong>, ou na <strong>última mensalidade</strong>.</>,
              'Sem multa e sem pagamento.',
              <>O plano deixa de renovar e <strong>vale até o fim do período já pago</strong>.</>,
            ]}
          />
        </CartaoTopo>
        <CartaoTopo cor="bg-primary" rotulo="Sim" rotuloCor="text-primary" titulo="Cancelamento com multa">
          <Checks
            itens={[
              <>O app mostra quantas mensalidades faltam e o <strong>valor da multa</strong>.</>,
              <>Paga na hora por <strong>PIX</strong> (conta Efí da unidade) ou <strong>cartão</strong>.</>,
              <>O cancelamento só vale <strong>depois que o pagamento é confirmado</strong>.</>,
            ]}
          />
        </CartaoTopo>
      </div>

      <H3>Como a multa é calculada</H3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Conta
            linhas={[
              ['Plano Power com fidelidade', 'R$ 399,00'],
              ['Mensalidades que faltam', '8'],
              ['Total das mensalidades que faltam', 'R$ 3.192,00'],
            ]}
            total={['Multa: 10% do total', 'R$ 319,20']}
          />
          <p className="mt-2 text-xs text-[#231F20]/60">
            Exemplo. A multa é de 10% sobre o total das mensalidades que faltam, como diz o termo.
          </p>
        </div>
        <div className="space-y-3">
          <Destaque valor="10%" titulo="Quem recebe">
            A multa é <strong>da sua unidade</strong>. Entra no financeiro do cliente como "Multa de cancelamento" e conta
            no cálculo de royalties e propaganda.
          </Destaque>
          <Destaque valor={<Sigla topo="sem" base="VOLTA" />} titulo="Não reativa" tom="red">
            Quem cancela pagando a multa <strong>não reativa</strong> o plano: o contrato foi encerrado. Para voltar, faz
            uma nova adesão.
          </Destaque>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tom="teal" titulo="Se o cliente pedir para cancelar na recepção">
          Oriente a cancelar pelo app. Assim o valor da multa é calculado pelo sistema e a unidade não precisa cobrar
          depois. Para alterar ou trocar de plano depois de cancelar, o cliente também precisa de uma nova adesão.
        </Callout>
        <Callout tom="amber" titulo="Para o PIX da multa">
          A unidade precisa ter o certificado Pix da Efí cadastrado. Para cartão, a Vindi. Se só um estiver ativo, o app
          mostra apenas essa opção ao cliente.
        </Callout>
      </div>
    </Item>

    <Item id="primeiro-mes" eyebrow="Pure Pass · Acompanhamento" titulo="O primeiro mês decide o Pure Pass">
      <P>
        Quem assina e <strong>não cria o hábito</strong> nas primeiras semanas costuma cancelar na primeira cobrança. Por
        isso o sistema avisa a sua equipe, no <strong>Meu Dia</strong>, nos três momentos em que uma conversa faz
        diferença.
      </P>
      <div className="mt-5">
        <div className="flex h-9 overflow-hidden rounded-lg text-[11px] font-bold text-white sm:text-xs">
          <span className="flex w-[20%] items-center justify-center bg-primary">Dias 1 a 5</span>
          <span className="w-[25%] bg-[#8d8687]" />
          <span className="flex w-[20%] items-center justify-center bg-teal-500">Dias 10 a 18</span>
          <span className="w-[20%] bg-[#8d8687]" />
          <span className="flex w-[15%] items-center justify-center bg-[#231F20]">Cobrança</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-[#231F20]/60">
          <span>Assinatura</span>
          <span>Meio do mês</span>
          <span>Primeira renovação</span>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {MOMENTOS.map((m) => (
          <CartaoTopo key={m.titulo} cor="bg-primary" rotulo={m.eyebrow} rotuloCor="text-primary" titulo={m.titulo}>
            <p className="rounded-lg bg-[#F5F4F2] p-3 text-[13px] text-[#2b2b2b]">
              <strong>Entra na lista quando:</strong> {m.quando}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[#2b2b2b]">{m.texto}</p>
            <p className="mt-3 border-l-4 border-teal-500 bg-teal-500/10 p-3 text-[13px] italic text-[#2b2b2b]">{m.fala}</p>
          </CartaoTopo>
        ))}
      </div>

      <H3>Onde isso aparece</H3>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div>
          <P>
            No <strong>Meu Dia</strong>, o card <strong>Pure Pass: primeiro mês</strong>. Cada linha mostra o nome, o dia
            do ciclo, as aulas usadas e o <strong>roteiro curto</strong> do que conversar.
          </P>
          <div className="mt-4">
            <Passos
              passos={[
                { titulo: 'Abra o Meu Dia e procure o card.' },
                {
                  titulo: 'Chame o cliente',
                  texto: <>Clique na linha com o botão direito (ou no ⋮) para <strong>chamar no WhatsApp</strong> ou gerar um <strong>rascunho de mensagem</strong> por IA, que já nasce com o contexto.</>,
                },
                {
                  titulo: 'Oculte quem já foi atendido',
                  texto: <>Depois de falar com o cliente, use <Botao>Ocultar</Botao> &gt; <strong>Até mudar</strong>. A linha só volta no próximo momento.</>,
                },
              ]}
            />
          </div>
        </div>
        <Tela src="meu-dia-primeiro-mes" alt="Card Pure Pass: primeiro mês no Meu Dia" legenda="Meu Dia: o card com os três momentos (clientes de exemplo)" />
      </div>

      <H3>Primeiro mês: o que o sistema faz e o que é seu</H3>
      <div className="grid gap-4 md:grid-cols-2">
        <Quadro
          titulo="O sistema faz sozinho"
          cor="bg-teal-500"
          itens={[
            <><strong>Monta a lista</strong> do Meu Dia com quem precisa de contato, todo dia.</>,
            <><strong>Calcula o momento certo</strong> de cada cliente pelo dia do ciclo e pelas aulas usadas.</>,
            <><strong>Envia e-mail ao cliente 3 dias antes da primeira renovação</strong>: valor, data, aulas que ainda dá para usar e como cancelar.</>,
            <><strong>Renova no cartão</strong> todo mês e registra o pagamento.</>,
            <><strong>Esconde quem você já atendeu</strong> até o próximo momento.</>,
          ]}
        />
        <Quadro
          titulo="A sua unidade faz"
          cor="bg-amber-500"
          itens={[
            <><strong>Conversa nos três momentos</strong>, de preferência por WhatsApp, com o roteiro do card.</>,
            <><strong>Ajuda a marcar as aulas</strong>: horários fixos na semana ajudam o cliente a criar rotina.</>,
            <><strong>Registra o contato</strong> no histórico do cliente e usa <strong>Ocultar &gt; Até mudar</strong>.</>,
            <><strong>Escuta o motivo</strong> de quem quer cancelar e avisa a coordenação.</>,
          ]}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <H3>Quem entra na lista</H3>
          <div className="rounded-xl bg-[#F5F4F2] p-5">
            <Bullets
              className="text-[#2b2b2b]"
              itens={[
                <>Quem assina o <strong>primeiro Pure Pass</strong> da vida (quem já teve Pure Pass não entra).</>,
                <>Plano <strong>ativo</strong> e criado nos últimos <strong>35 dias</strong>.</>,
                'Planos de convênio (Gympass, Totalpass) e de influenciador não entram.',
                'A lista mostra só a sua unidade, ou as unidades que você gerencia.',
              ]}
            />
          </div>
        </div>
        <div>
          <H3>E-mail antes da cobrança</H3>
          <div className="rounded-xl bg-[#F5F4F2] p-4">
            <div className="rounded-lg bg-white p-4 text-[14px] leading-relaxed text-[#2b2b2b] shadow-sm">
              <p className={cn('mb-2 font-bold', TINTA)}>Resumo do e-mail:</p>
              <p>
                Olá! Sua primeira renovação do Pure Pass será em <strong>[data]</strong>, no valor de{' '}
                <strong>R$ [valor]</strong>.
              </p>
              <p className="mt-2">
                Você ainda tem <strong>[n] aulas</strong> para usar até lá. Se precisar cancelar, é pelo aplicativo.
              </p>
              <p className="mt-1 text-right text-[11px] text-[#231F20]/50">modelo do e-mail enviado ao cliente</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#231F20]/60">
            O e-mail sai em português, inglês ou espanhol, conforme o cadastro. Cada plano recebe uma vez.
          </p>
        </div>
      </div>

      <H3>Rotina sugerida para a recepção</H3>
      <Tabela
        colunas={['Quando', 'O que fazer', 'Onde']}
        linhas={[
          ['Todo dia, ao abrir', <>Abrir o <strong>Meu Dia</strong>, olhar o card <strong>Pure Pass: primeiro mês</strong> e atender quem estiver lá.</>, 'Meu Dia'],
          ['Boas-vindas', <>Mensagem de boas-vindas e ajuda para <strong>marcar a 1ª aula</strong>. Se o cliente tem horário fixo, marque as próximas semanas junto.</>, 'WhatsApp'],
          ['Meio do mês', 'Perguntar como está sendo e oferecer horários. Anotar o motivo se houver queixa.', 'WhatsApp'],
          ['Antes da cobrança', <>Lembrar da renovação e das aulas que sobram. <strong>Sem pressionar</strong>: o objetivo é o cliente decidir informado.</>, 'WhatsApp'],
          ['Depois do contato', <><strong>Ocultar &gt; Até mudar</strong>, para a linha só voltar no próximo momento.</>, 'Meu Dia'],
        ]}
      />
      <Callout tom="teal" titulo="Cliente que quer cancelar">
        Ouça primeiro. Se o plano tem fidelidade, explique com calma que o cancelamento é pelo app e que há multa de 10%
        das mensalidades que faltam (<Ir para="cancelamento">veja cancelamento e multa</Ir>). Muitas vezes o problema é
        horário, e um horário fixo novo resolve.
      </Callout>
    </Item>

    <Item id="unidade-favorita" eyebrow="Pure Pass · Unidade favorita" titulo="A unidade favorita do Pure Pass">
      <P>
        O Pure Pass vale em <strong>qualquer unidade da rede</strong>, mas todo plano tem uma{' '}
        <strong>unidade favorita</strong>: a que o cliente escolhe como preferencial <strong>na contratação</strong>. Ela
        recebe o pagamento e tem a obrigação de <strong>gerenciar o relacionamento</strong> com o cliente.
      </P>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border-2 border-primary bg-white p-5">
          <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            Unidade favorita
          </span>
          <p className={cn('mb-1 mt-4 text-lg font-bold', TINTA)}>Escolhida na contratação</p>
          <P>É a unidade que o cliente escolhe no Comece ao assinar o plano.</P>
          <Checks
            itens={[
              <>Recebe o <strong>pagamento</strong>: a mensalidade e a multa de cancelamento, na conta da própria unidade.</>,
              <>Gerencia o <strong>relacionamento</strong>: acompanha o primeiro mês e é o contato do cliente para plano, cobrança e cancelamento.</>,
              <>Fica com o valor das <strong>aulas compradas e não usadas</strong>, sem repassar a ninguém.</>,
            ]}
          />
        </div>
        <div className="rounded-xl border border-[#231F20]/10 bg-[#F5F4F2] p-5">
          <span className="rounded-full bg-[#231F20] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            Favorita no aplicativo
          </span>
          <p className={cn('mb-1 mt-4 text-lg font-bold', TINTA)}>Só muda a agenda</p>
          <P>O cliente pode trocar a favorita no app quando quiser. O que muda:</P>
          <Checks itens={[<>Apenas a unidade que <strong>aparece primeiro na agenda</strong> dele.</>]} />
          <P className="mt-3">
            O restante continua <strong>igual ao da contratação</strong>: quem recebe, quem gerencia e como é o repasse.
          </P>
        </div>
      </div>

      <H3>Quando o cliente treina em outra unidade</H3>
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl bg-primary p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Unidade A</p>
          <p className="text-lg font-bold">A unidade favorita</p>
          <p className="text-sm text-white/85">Recebeu o pagamento e cuida do cliente.</p>
        </div>
        <div className="text-center text-xs text-[#231F20]/60">
          <span className="block text-2xl text-primary">→</span>
          repasse por aula realizada,
          <br />
          no fechamento do mês
        </div>
        <div className="rounded-xl bg-[#231F20] p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Unidade B</p>
          <p className="text-lg font-bold">Onde o cliente treinou</p>
          <p className="text-sm text-white/80">Deu a aula e recebe o valor dela.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <p className={cn('mb-3 font-bold', TINTA)}>Como o repasse é calculado</p>
          <Checks
            itens={[
              <>O valor da aula é o <strong>preço por aula do plano</strong>.</>,
              <>Do valor, ficam retidos <strong>1,67% do cartão</strong>, <strong>10% de imposto</strong> e <strong>10% de royalties e propaganda</strong>.</>,
              'O restante vai para a unidade que deu a aula.',
              <>No fechamento, o valor é <strong>cobrado da unidade favorita e creditado à unidade que deu a aula</strong>.</>,
            ]}
          />
        </div>
        <div>
          <Conta
            linhas={[
              ['Power com fidelidade (R$ 399 ÷ 8)', 'R$ 49,88'],
              ['Retido (1,67% + 10% + 10%)', '− R$ 10,81'],
            ]}
            total={['Repasse por aula', 'R$ 39,07']}
          />
          <p className="mt-2 text-xs text-[#231F20]/60">Exemplo com o valor de referência de outubro de 2026.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Destaque valor={<Sigla topo="sem" base="AULA" />} titulo="Aulas compradas e não usadas" tom="amber">
          Só há repasse quando uma aula é <strong>realmente dada</strong> em outra unidade. A aula que o cliente deixa de
          fazer não gera repasse: o valor fica com a <strong>unidade favorita</strong>.
        </Destaque>
        <Callout tom="teal" titulo="Cliente de outra unidade na sua agenda">
          Receba normalmente: o Pure Pass vale na rede toda e não precisa de cadastro novo. Dúvidas de plano, cobrança ou
          cancelamento voltam para a <strong>unidade favorita</strong>. Se um valor do repasse parecer diferente no
          fechamento, abra um chamado.
        </Callout>
      </div>
    </Item>
  </Section>
);

// ── Parte 4 · Aula experimental gratuita ───────────────────────────────────

const ExperimentalGratuita = () => (
  <Section id="experimental-gratuita">
    <SectionHeader eyebrow={parte('experimental-gratuita')} title="Aula experimental gratuita" />

    <Item id="gratuita-agendamento" eyebrow="Aula experimental gratuita" titulo="Como o cliente agenda">
      <P>
        É o padrão de toda unidade. O cliente agenda sozinho, sem pagar nada, e confirma pelo WhatsApp. Esta é a tela que
        ele usa, no celular.
      </P>
      <div className="mt-5 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-[230px_230px_1fr]">
        <Celular src="experimental-dia" alt="Agendamento da aula experimental: escolha do dia" legenda="1 e 2: escolhe o dia" />
        <Celular src="experimental-horario" alt="Escolha do horário livre" legenda="3: escolhe o horário livre" />
        <div className="sm:col-span-2 lg:col-span-1">
          <Passos
            passos={[
              { titulo: 'Escolhe dia e horário', texto: 'Só aparecem horários realmente livres na sua agenda.' },
              { titulo: 'Preenche os dados', texto: 'Nome e e-mail. O telefone vem da própria mensagem do WhatsApp.' },
              { titulo: 'Confirma pelo WhatsApp', texto: <>Envia uma mensagem pronta. O número usado fica como <strong>contato do agendamento</strong>.</> },
              { titulo: 'Aula agendada', texto: <>Aparece na sua agenda e na tela <strong>Aulas Experimentais</strong>.</> },
            ]}
          />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <H3>Regras que a equipe precisa conhecer</H3>
          <div className="space-y-3">
            <Destaque valor="3h" titulo="Remarcar e cancelar">
              O cliente remarca ou cancela com pelo menos <strong>3 horas</strong> de antecedência.
            </Destaque>
            <Destaque valor="1 n.º" titulo="Um número, uma pessoa" tom="amber">
              Quem agenda primeiro "fica" com o WhatsApp. Se um parente tentar usar o mesmo número, o sistema recusa e a
              equipe pode ajudar.
            </Destaque>
            <Destaque valor="0" titulo="Sem cobrança" tom="teal">
              Não há pagamento. Se a unidade ligar a cobrança, o fluxo muda (
              <Ir para="experimental-paga">veja a aula experimental paga</Ir>).
            </Destaque>
          </div>
        </div>
        <div>
          <H3>Opção da sua unidade</H3>
          <div className="space-y-3">
            <Callout tom="teal" titulo="Confirmar aula experimental por e-mail">
              Na edição da unidade (Unidades &gt; Alterar), a caixa <strong>Confirmar Aula Experimental por Email</strong>{' '}
              faz o cliente receber também um e-mail de confirmação, além do WhatsApp.
            </Callout>
            <Callout tom="amber" titulo="Sem horários livres">
              Se a agenda da unidade está cheia para os próximos dias, o site avisa "os horários de aula experimental dos
              próximos dias já foram preenchidos". A agenda abre horários novos todos os dias.
            </Callout>
          </div>
        </div>
      </div>
    </Item>

    <Item id="gratuita-matricula" eyebrow="Aula experimental gratuita" titulo="Do agendamento à matrícula: o que acontece sozinho">
      <P>
        O maior risco de uma aula experimental é o cliente <strong>não aparecer</strong>. Por isso o sistema lembra,
        conversa e reagenda por WhatsApp, sem a sua equipe precisar ligar para todo mundo.
      </P>
      <Tabela
        colunas={['Quando', 'O que acontece', 'Quem']}
        linhas={[
          ['Ao agendar', 'O cliente confirma pelo WhatsApp e recebe a confirmação por WhatsApp (e por e-mail, se a sua unidade ligou essa opção).', <Tag papel="SISTEMA" />],
          ['Véspera, de manhã', <>Lembrete por WhatsApp com o endereço e um mapa, e botões <strong>Confirmar presença</strong>, <strong>Remarcar</strong> e <strong>Cancelar</strong>. Quem responde "Confirmar" já tem a ligação de confirmação baixada.</>, <Tag papel="SISTEMA" />],
          ['Dia da aula', 'Um segundo lembrete chega entre 3h30 e 4h30 antes da aula, para quem ainda consegue remarcar (a remarcação exige 3 horas).', <Tag papel="SISTEMA" />],
          ['Hora da aula', <>A equipe recebe o cliente e, depois, marca <strong>presença ou falta</strong> na agenda. Essa marcação é o que dispara os passos seguintes.</>, <Tag papel="UNIDADE" />],
          ['Se faltou', <>No fim do mesmo dia, o cliente recebe um convite para <strong>remarcar</strong>. Quem já remarcou ou já usou a segunda chance não recebe.</>, <Tag papel="SISTEMA" />],
          ['Se compareceu', <>À noite, uma mensagem curta pergunta <strong>como foi a aula</strong>, sem nenhuma oferta. Elogio vira conversa de planos, crítica avisa a unidade.</>, <Tag papel="SISTEMA" />],
          ['Depois da aula', <>Conversar sobre planos e <strong>fechar a matrícula</strong>. O sistema acompanha a conversão: a coluna <strong>Matriculado</strong> mostra quem fechou.</>, <Tag papel="UNIDADE" />],
        ]}
      />
      <H3>A tela Aulas Experimentais</H3>
      <Caminho partes={['CRM', 'Aulas Experimentais']} />
      <Tela
        src="tela-aulas-experimentais"
        alt="Tela Aulas Experimentais do PureSystem"
        legenda="Aulas Experimentais: uma linha por aula, com quem agendou, se o robô já lembrou e se virou matrícula (clientes de exemplo)"
        larga
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Destaque valor={<Bot className="h-6 w-6" />} titulo='Coluna "Robô lembrou"' tom="teal">
          Mostra que o robô <strong>já tocou</strong> naquele cliente. <strong>Regra de ouro:</strong> quem o robô já
          lembrou, a recepção não precisa lembrar de novo.
        </Destaque>
        <Destaque valor={<Check className="h-6 w-6" strokeWidth={3} />} titulo='Coluna "Matriculado"'>
          É o indicador principal: virou matrícula ou não. Use os filtros por data de aula, de agendamento ou de lead.
        </Destaque>
      </div>
    </Item>
  </Section>
);

// ── Parte 5 · Aula experimental paga ───────────────────────────────────────

const ExperimentalPaga = () => (
  <Section id="experimental-paga">
    <SectionHeader eyebrow={parte('experimental-paga')} title="Aula experimental paga" />

    <Item id="paga-ligar" eyebrow="Aula experimental paga" titulo="Como ligar na unidade">
      <P>
        A cobrança é <strong>opcional e decidida pela unidade</strong>. Ela ajuda a filtrar quem quer treinar de verdade e
        o dinheiro cai <strong>direto na conta Efí da sua unidade</strong>. O valor pago não se perde: vira crédito na
        matrícula.
      </P>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {(
          [
            ['Valor', 'R$ 39,90', <>Valor padrão da rede, igual para todas as unidades. A unidade <strong>não altera</strong> o valor.</>],
            ['Para onde vai', 'Conta Efí da unidade', <>Por PIX. Só liga com as <strong>credenciais da Efí</strong> e um <strong>certificado Pix válido</strong>.</>],
            ['O que o cliente leva', 'Crédito de 30 dias', <>O valor vira <strong>crédito na matrícula</strong> por 30 dias, mesmo que o cliente falte.</>],
          ] as [string, string, ReactNode][]
        ).map(([a, b, c]) => (
          <div key={a} className="rounded-xl border border-[#231F20]/10 bg-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{a}</p>
            <p className={cn('mt-1 text-lg font-bold', TINTA)}>{b}</p>
            <p className="mt-1 text-[14px] text-[#2b2b2b]">{c}</p>
          </div>
        ))}
      </div>

      <H3>Passo a passo para ligar</H3>
      <Caminho partes={['Administração', 'Unidades', 'Alterar a unidade', 'Cobrar a aula experimental (PIX)']} />
      <div className="grid items-start gap-6 md:grid-cols-[1fr_1.4fr]">
        <Passos
          passos={[
            { titulo: 'Abra a unidade', texto: <>Abra <strong>Unidades</strong>, selecione a sua unidade e clique em <Botao>Alterar</Botao> (o lápis na barra).</> },
            { titulo: 'Marque a cobrança', texto: <>Role até <strong>Cobrar a aula experimental (PIX)</strong> e marque a caixa.</> },
            { titulo: 'Confirme', texto: <>Clique em <Botao cor="verde">Confirmar</Botao>. A partir daí o site da unidade mostra o valor e passa a cobrar.</> },
          ]}
        />
        <Tela src="unidade-cobranca-ligada" alt="Opção Cobrar a aula experimental (PIX) marcada" legenda="Opção marcada: o texto explica que o valor vira crédito na matrícula" />
      </div>
      <Callout tom="teal" titulo="Desligar">
        Para voltar a ser gratuita, desmarque a caixa e confirme. O site da unidade volta a não ter cobrança.
      </Callout>

      <H3>Se a opção estiver bloqueada</H3>
      <div className="grid items-start gap-6 md:grid-cols-[1.4fr_1fr]">
        <Tela src="unidade-cobranca-bloqueada" alt="Opção de cobrança bloqueada por falta de PIX configurado" legenda="Sem o PIX pronto, a caixa fica bloqueada e o aviso em amarelo diz o que falta" />
        <Callout tom="amber" titulo="Falta configurar o PIX" className="md:mt-5">
          A unidade ainda não tem credenciais da Efí e certificado Pix válido. Resolva primeiro pelo manual da{' '}
          <strong>Central de Pagamentos</strong>. Enquanto isso a aula experimental segue gratuita.
        </Callout>
      </div>
    </Item>

    <Item id="paga-caminho" eyebrow="Aula experimental paga" titulo="O caminho do cliente: WhatsApp, termo e PIX">
      <div className="grid items-start gap-8 md:grid-cols-[230px_1fr]">
        <Celular src="experimental-paga" alt="Agendamento da aula experimental paga" legenda="A tela mostra o valor e a regra do crédito" />
        <Passos
          passos={[
            { titulo: 'Escolhe dia e horário', papel: 'CLIENTE', texto: <>Vê o valor e o aviso de que ele vira <strong>desconto na matrícula</strong> em até 30 dias. Antes de confirmar, o site mostra as 3 etapas.</> },
            { titulo: 'Confirma pelo WhatsApp', papel: 'CLIENTE', texto: 'Envia a mensagem pronta. O número usado fica como contato.' },
            { titulo: 'Aceita o termo de adesão', papel: 'CLIENTE', texto: <>Aparece <strong>depois</strong> do WhatsApp confirmado e traz as regras de remarcação, cancelamento e crédito. Aceite explícito, com "Estou de acordo".</> },
            { titulo: 'Paga o PIX', papel: 'SISTEMA', texto: <>Gera o PIX na conta Efí da unidade, mostra na tela e <strong>envia o PIX copia e cola no WhatsApp</strong> do cliente.</> },
            { titulo: 'Aula agendada', papel: 'SISTEMA', texto: <><strong>Só quando o PIX cai</strong>, a aula é agendada. A confirmação vai por WhatsApp e e-mail, mesmo se o cliente fechar a tela.</> },
          ]}
        />
      </div>
      <H3>Na sua tela: Aulas Experimentais</H3>
      <Tela
        src="tela-aulas-experimentais"
        alt="Coluna Pagamento (PIX) na tela Aulas Experimentais"
        legenda="A coluna Pagamento (PIX) mostra o valor e se está Pago ou Devolvido"
        larga
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-[#F5F4F2] p-5">
          <Bullets
            className="text-[#2b2b2b]"
            itens={[
              <>A aula paga só existe <strong>depois do pagamento</strong>.</>,
              <>O PIX entra no financeiro do cliente como <strong>Aula Experimental</strong>, sem você lançar nada.</>,
              <>Se o PIX cair e o horário já tiver sido ocupado, o sistema <strong>não perde o pagamento</strong>.</>,
            ]}
          />
        </div>
        <Callout tom="amber" titulo="Pagou e não agendou?">
          Raro. O sistema registra o pagamento e avisa a unidade, que fala com o cliente para reagendar ou, se ele
          preferir, devolver o PIX (<Ir para="paga-devolucao">veja a devolução do PIX</Ir>).
        </Callout>
      </div>
    </Item>

    <Item id="paga-regras" eyebrow="Aula experimental paga · Regras do termo" titulo="Remarcar, cancelar e faltar">
      <P>
        As regras abaixo estão no <strong>termo de adesão</strong> que o cliente aceita antes de pagar. O cliente resolve a
        maior parte sozinho pelo site; a unidade entra quando a aula é cancelada por ela ou quando há pedido de devolução.
      </P>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <CartaoTopo cor="bg-teal-500" rotulo="Remarcar" rotuloCor="text-primary" titulo="Sem pagar de novo">
          <P>Com <strong>3 horas</strong> de antecedência, quantas vezes quiser.</P>
          <Checks
            itens={[
              <>Nova aula em até <strong>30 dias</strong> do pedido.</>,
              <>Na <strong>mesma unidade</strong> (o PIX caiu nela).</>,
              <>O PIX e o lançamento <strong>passam para a aula nova</strong>.</>,
            ]}
          />
        </CartaoTopo>
        <CartaoTopo cor="bg-amber-500" rotulo="Cancelar" rotuloCor="text-primary" titulo="Vira crédito">
          <P>Cancelando com <strong>3 horas</strong> de antecedência, sem remarcar:</P>
          <Checks
            itens={[
              <>O valor vira <strong>crédito na matrícula</strong> por 30 dias, contados do cancelamento.</>,
              <>Nesse prazo ele ainda pode <strong>marcar nova aula</strong> sem pagar de novo.</>,
            ]}
          />
        </CartaoTopo>
        <CartaoTopo cor="bg-primary" rotulo="Faltar" rotuloCor="text-primary" titulo="A aula se perde">
          <P>Falta, atraso (tolerância de 15 minutos) ou cancelar com <strong>menos de 3 horas</strong>:</P>
          <Checks
            itens={[
              <>O cliente <strong>perde a aula</strong>.</>,
              <>O <strong>crédito segue valendo</strong>, por 30 dias da data da aula.</>,
            ]}
          />
        </CartaoTopo>
      </div>

      <H3>Quando é a unidade que cancela, ou o cliente desiste</H3>
      <div className="grid gap-4 md:grid-cols-2">
        <Destaque valor="!" titulo="A unidade cancela a aula" tom="amber">
          O cliente recebe um e-mail com as opções: <strong>remarcar</strong> ou <strong>pedir a devolução</strong> do PIX.
        </Destaque>
        <Destaque valor={<Sigla topo="7" base="DIAS" />} titulo="Arrependimento (CDC)" tom="red">
          Em até <strong>7 dias da compra</strong> e antes da aula, o cliente pede a devolução e recebe{' '}
          <strong>o valor integral</strong>, por PIX.
        </Destaque>
      </div>

      <H3>O crédito na matrícula</H3>
      <div className="grid gap-6 md:grid-cols-2">
        <Checks
          itens={[
            <>O crédito é <strong>fixo</strong>: o valor pago pela aula.</>,
            <>Aplica <strong>sozinho no checkout</strong> do Pure Pass ou da matrícula. O código também vai no e-mail e na página de obrigado.</>,
            <>Vale por <strong>30 dias</strong> da aula, mesmo se o cliente faltar.</>,
            <>Vale nas unidades do <strong>mesmo franqueado</strong>.</>,
          ]}
        />
        <div className="space-y-3">
          <Callout tom="amber" titulo="Cupom promocional prevalece">
            Se o cliente usar um cupom promocional, ele vale no lugar do crédito: o crédito entra{' '}
            <strong>só quando não há cupom promocional</strong>.
          </Callout>
          <Callout tom="teal" titulo="Cancelar pela agenda da unidade">
            Quando a unidade cancela a aula pela agenda, o sistema grava o dia do cancelamento. É a partir dele que contam
            os <strong>30 dias</strong> para o cliente remarcar ou usar o crédito.
          </Callout>
        </div>
      </div>

      <H3>Os 30 dias do crédito, em uma linha</H3>
      <ol className="relative grid gap-6 sm:grid-cols-4">
        <span className="absolute left-[12%] right-[12%] top-[18px] hidden h-0.5 bg-[#231F20]/10 sm:block" />
        {[
          ['Paga o PIX', 'O valor fica reservado para a matrícula.'],
          ['Dia da aula', 'Faltou ou cancelou: a contagem dos 30 dias começa.'],
          ['Até 30 dias', 'Matrícula ou Pure Pass com o crédito aplicado.'],
          ['Depois de 30 dias', 'O crédito vence.'],
        ].map(([t, d], i) => (
          <li key={t} className="relative text-center">
            <span
              className={cn(
                'relative mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary text-sm font-extrabold',
                i === 3 ? 'bg-primary text-white' : 'bg-white text-primary',
              )}
            >
              {i + 1}
            </span>
            <p className={cn('mt-2 font-bold', TINTA)}>{t}</p>
            <p className="text-[13px] text-[#2b2b2b]">{d}</p>
          </li>
        ))}
      </ol>
    </Item>

    <Item id="paga-devolucao" eyebrow="Aula experimental paga · Passo a passo" titulo="Devolver o PIX e registrar no sistema">
      <P>
        Quando a unidade cancela a aula ou o cliente desiste em até 7 dias, a devolução é feita em{' '}
        <strong>duas etapas</strong>: o PIX pela Central de Pagamentos e o registro na tela Aulas Experimentais.
      </P>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#231F20] pb-2">
        <p className={cn('font-bold', TINTA)}>Etapa 1: devolver o valor por PIX</p>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Central de Pagamentos
        </span>
      </div>
      <div className="mt-5 grid items-start gap-6 md:grid-cols-2">
        <Passos
          passos={[
            { titulo: 'Novo pagamento', texto: <>Abra <strong>Financeiro &gt; Central de Pagamentos</strong> e clique em <Botao>Novo pagamento</Botao>.</> },
            { titulo: 'Chave e valor', texto: <>Informe a <strong>chave PIX do cliente</strong> e o valor da aula (ex.: R$ 39,90).</> },
            { titulo: 'Aprovação', texto: <>Confirme. O pagamento aguarda a <strong>aprovação</strong> (Telegram ou autenticador) e só sai depois de aprovado.</> },
          ]}
        />
        <Tela src="central-pagamentos" alt="Novo pagamento PIX na Central de Pagamentos" legenda="Central de Pagamentos: PIX para a chave (dados de exemplo)" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#231F20] pb-2">
        <p className={cn('font-bold', TINTA)}>Etapa 2: registrar a devolução no sistema</p>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Aulas Experimentais
        </span>
      </div>
      <Tela
        src="registrar-devolucao-menu"
        alt="Menu do botão direito com Registrar devolução do PIX"
        legenda="Botão direito na linha da aula paga: Registrar devolução do PIX"
        larga
      />
      <div className="grid items-start gap-6 md:grid-cols-[1fr_260px]">
        <div>
          <Passos
            passos={[
              { titulo: 'Localize a aula', texto: <>Abra <strong>CRM &gt; Aulas Experimentais</strong> e localize a aula do cliente (coluna <strong>Pagamento (PIX)</strong>: "Pago").</> },
              { titulo: 'Botão direito', texto: <>Clique com o <strong>botão direito</strong> na linha e escolha <strong>Registrar devolução do PIX</strong>.</> },
              { titulo: 'Motivo', texto: <>Escolha o <strong>motivo</strong> (a unidade cancelou a aula, arrependimento ou outro), escreva uma observação se quiser e confirme.</> },
            ]}
          />
          <Callout tom="teal" titulo="O que o registro faz" className="mt-5">
            Cancela o <strong>crédito</strong> para matrícula, <strong>estorna o lançamento financeiro</strong> da aula e,
            se a aula ainda não aconteceu, <strong>cancela a aula</strong>. A coluna passa a mostrar "Devolvido".
          </Callout>
        </div>
        <Tela src="registrar-devolucao-janela" alt="Janela Registrar devolução do PIX" legenda="A janela de registro (cliente de exemplo)" />
      </div>
      <Callout tom="dark" titulo="Faça as duas etapas, nessa ordem" className="mt-4">
        Registrar sem devolver deixa o cliente sem o dinheiro e sem o crédito. Devolver sem registrar deixa o crédito e o
        lançamento do cliente ativos no sistema.
      </Callout>
    </Item>
  </Section>
);

// ── Parte 6 · O que o PureSystem faz sozinho ───────────────────────────────

const PureSystem = () => (
  <Section id="puresystem">
    <SectionHeader eyebrow={parte('puresystem')} title="O que o PureSystem faz sozinho">
      Para cada momento do cliente, o que acontece <strong>sozinho</strong> e o que é <strong>da sua equipe</strong>.
      Quando a coluna da unidade diz "Nada.", não há nada a fazer.
    </SectionHeader>

    <Item id="quem-faz-pure-pass" eyebrow="Quem faz o quê" titulo="Pure Pass e aula gratuita">
      <p className={cn('font-bold text-primary')}>Pure Pass</p>
      <Tabela
        colunas={['Momento', 'O sistema faz sozinho', 'A unidade faz']}
        linhas={[
          ['Compra', 'Cadastro, termo de adesão, cobrança do 1º mês no cartão, ativação do plano e e-mail.', 'Nada.'],
          ['Dias 1 a 5', <>Coloca no <strong>Meu Dia</strong> quem ainda não marcou aula.</>, 'Boas-vindas e ajuda para marcar a 1ª aula.'],
          ['Dias 10 a 18', 'Coloca no Meu Dia quem usou menos da metade das aulas.', 'Conversa e oferta de horários.'],
          ['3 dias antes da 1ª renovação', <>Envia <strong>e-mail ao cliente</strong> e coloca no Meu Dia.</>, 'Contato leve: renovação e aulas que sobram.'],
          ['Todo mês', 'Renova no cartão e registra o pagamento.', 'Acompanhar o uso das aulas.'],
          ['Cancelamento', 'Calcula a multa, cobra por PIX ou cartão, só cancela depois do pagamento e bloqueia reativação.', <>Orientar o cliente a cancelar <strong>pelo app</strong>. Não cobrar a multa na recepção.</>],
        ]}
      />
      <p className="mt-8 font-bold text-primary">Aula experimental gratuita</p>
      <Tabela
        colunas={['Momento', 'O sistema faz sozinho', 'A unidade faz']}
        linhas={[
          ['Agendamento', 'Mostra só horários livres, valida o WhatsApp e confirma.', 'Nada.'],
          ['Véspera e dia da aula', 'Lembretes por WhatsApp com botões de confirmar, remarcar e cancelar.', <>Só ligar para quem <strong>não respondeu</strong> nada.</>],
          ['Hora da aula', 'Nada.', <>Receber o cliente e marcar <strong>presença ou falta</strong> no mesmo dia.</>],
          ['Se faltou', 'Convida para remarcar no fim do dia.', 'Marcar a falta no mesmo dia (é o que dispara o convite).'],
          ['Se compareceu', 'Pergunta como foi a aula à noite.', <>Conversar sobre planos e <strong>fechar a matrícula</strong>.</>],
        ]}
      />
    </Item>

    <Item id="quem-faz-paga" eyebrow="Quem faz o quê" titulo="Aula paga e a rotina da sua equipe">
      <p className="font-bold text-primary">Aula experimental paga</p>
      <Tabela
        colunas={['Momento', 'O sistema faz sozinho', 'A unidade faz']}
        linhas={[
          ['Agendamento', 'Valida o WhatsApp, pede o aceite do termo e gera o PIX na conta Efí da unidade.', 'Nada.'],
          ['PIX pago', 'Agenda a aula, lança o pagamento no financeiro do cliente e confirma por WhatsApp e e-mail.', 'Receber o cliente e marcar presença.'],
          ['Remarcar ou cancelar', <>Verifica as 3 horas, move o PIX para a aula nova ou transforma o valor em <strong>crédito</strong>.</>, 'Nada.'],
          ['Unidade cancela a aula', 'Envia ao cliente e-mail com as opções de remarcar ou pedir devolução.', 'Decidir, junto ao cliente, remarcar ou devolver.'],
          ['Devolução do PIX', 'Ao registrar, cancela o crédito e estorna o lançamento.', <>Fazer o PIX pela Central e <strong>registrar</strong> na tela Aulas Experimentais.</>],
          ['Matrícula', <>Aplica o <strong>crédito</strong> sozinho no checkout, se não houver cupom promocional.</>, 'Conversar sobre o plano antes de o crédito vencer (30 dias).'],
        ]}
      />
      <H3>Rotina sugerida</H3>
      <div className="grid gap-4 md:grid-cols-3">
        <Quadro
          titulo="Todo dia"
          cor="bg-amber-500"
          itens={[
            <>Abrir o <strong>Meu Dia</strong>.</>,
            <>Atender o card <strong>Pure Pass: primeiro mês</strong>.</>,
            <>Ver as <strong>experimentais de hoje</strong> e receber bem.</>,
            <>Marcar <strong>presença ou falta</strong> no mesmo dia.</>,
          ]}
        />
        <Quadro
          titulo="Toda semana"
          cor="bg-teal-500"
          itens={[
            <>Abrir <strong>Aulas Experimentais</strong> e olhar a coluna <strong>Matriculado</strong>.</>,
            'Chamar quem fez a aula e ainda não fechou.',
            <>Conferir pedidos de <strong>devolução de PIX</strong> pendentes.</>,
          ]}
        />
        <Quadro
          titulo="Todo mês"
          cor="bg-primary"
          itens={[
            'Olhar quantos Pure Pass novos cancelaram na 1ª cobrança e por quê.',
            'Rever os horários mais cheios e vazios da agenda.',
            <>Garantir que o <strong>PIX da unidade</strong> segue ativo (certificado válido).</>,
          ]}
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Callout tom="amber" titulo="O que evitar">
          <Bullets
            itens={[
              'Ligar para quem o robô já lembrou ("Robô lembrou").',
              'Cobrar a multa de cancelamento na recepção.',
              'Esquecer de marcar a falta: o convite de remarcar não sai.',
              'Devolver o PIX e não registrar a devolução no sistema.',
            ]}
          />
        </Callout>
        <Callout tom="teal" titulo="Resumo em uma linha">
          O sistema cuida do que se repete (lembrar, cobrar, calcular). A unidade cuida do que só pessoas fazem bem:
          receber, conversar e acompanhar.
        </Callout>
      </div>
    </Item>
  </Section>
);

// ── Parte 7 · Perguntas frequentes ─────────────────────────────────────────

const FAQ_PURE_PASS: [string, ReactNode][] = [
  ['O Pure Pass vale só na minha unidade?', 'Não. O cliente faz as aulas do plano em qualquer unidade da rede. A unidade favorita, escolhida na compra, recebe o pagamento, é o contato do cliente e acompanha o primeiro mês.'],
  ['Qual a diferença entre com e sem fidelidade?', 'Com fidelidade o cliente se compromete por 12 meses e paga menos por mês; se cancelar antes, paga multa de 10% do total das mensalidades que faltam. Sem fidelidade ele cancela quando quiser, sem multa.'],
  ['Como o cliente cancela o Pure Pass?', 'Pelo app, sozinho. Com fidelidade, o app mostra o valor da multa e o cliente paga por PIX ou cartão. O cancelamento só vale depois que o pagamento é confirmado.'],
  ['Quem fica com a multa?', 'A sua unidade. Ela entra no financeiro do cliente como "Multa de cancelamento" e conta no cálculo de royalties e propaganda.'],
  ['O cliente cancelou pagando a multa e quer voltar. Reativa?', 'Não. O contrato foi encerrado. Ele faz uma nova adesão ao Pure Pass.'],
  ['Por que um cliente novo do Pure Pass não aparece no card "primeiro mês"?', 'O card lista o primeiro Pure Pass de quem nunca teve um, com plano ativo nos últimos 35 dias e que esteja num dos três momentos. Convênio e influenciador não entram. Se você ocultou a linha, ela só volta no próximo momento.'],
  ['O sistema já mandou lembrete para o cliente da experimental. Preciso ligar?', 'Não. A coluna "Robô lembrou" mostra que ele já foi lembrado. Ligue só se o cliente não respondeu nada.'],
  ['O cliente diz que o WhatsApp já foi usado por outra pessoa.', 'Quem agenda primeiro "fica" com o número, e o sistema recusa uma segunda pessoa no mesmo WhatsApp. Se o cliente for de fato outra pessoa, a equipe pode agendar a aula pela agenda da unidade.'],
];

const FAQ_PAGA: [string, ReactNode][] = [
  ['Quem define o valor da aula experimental paga?', <>O valor é da rede (R$ 39,90). A unidade só decide se cobra ou não, na edição da unidade, em <strong>Cobrar a aula experimental (PIX)</strong>.</>],
  ['Onde o dinheiro cai?', 'Direto na conta Efí da sua unidade. Por isso a opção só liga com as credenciais da Efí e o certificado Pix válidos.'],
  ['O cliente quer remarcar a aula paga. Como faz?', 'Pelo site, com pelo menos 3 horas de antecedência, quantas vezes quiser e sem pagar de novo. A nova aula precisa ser na mesma unidade e em até 30 dias do pedido.'],
  ['O cliente faltou na aula paga. Perdeu o dinheiro?', 'Perdeu a aula, mas não o valor: o crédito para a matrícula segue valendo por 30 dias, contados da data da aula.'],
  ['Como o crédito é usado na matrícula?', 'Sozinho, no checkout do Pure Pass ou da matrícula. O código também vai no e-mail e na página de obrigado. Se o cliente usar cupom promocional, o cupom vale no lugar do crédito.'],
  ['Quando devolvo o PIX?', 'Quando a unidade cancela a aula e o cliente não quer remarcar, ou quando ele se arrepende em até 7 dias da compra e antes da aula. A devolução é integral e feita por PIX.'],
  ['Como devolvo e registro?', <>Duas etapas: o PIX pela <strong>Central de Pagamentos</strong> e, depois, em <strong>Aulas Experimentais</strong>, botão direito na linha &gt; <strong>Registrar devolução do PIX</strong>. O registro cancela o crédito e estorna o lançamento.</>],
  ['A aula não aparece como paga na tela. O que olhar?', <>Na tela <strong>Aulas Experimentais</strong>, a coluna <strong>Pagamento (PIX)</strong> mostra o valor e se está <strong>Pago</strong> ou <strong>Devolvido</strong>. A aula paga só existe depois que o PIX cai.</>],
  ['Quero voltar a oferecer a aula experimental gratuita.', <>Em <strong>Unidades</strong>, abra a unidade com o botão <strong>Alterar</strong>, desmarque <strong>Cobrar a aula experimental (PIX)</strong> e confirme.</>],
  ['A minha unidade não aparece no Comece, ou aparece como indisponível.', 'Isso é controlado pela franqueadora (a unidade pode estar pausada para novos alunos). Abra um chamado pelo PureSystem.'],
];

const Perguntas = ({ prefixo, itens }: { prefixo: string; itens: [string, ReactNode][] }) => (
  <Accordion type="multiple" className="rounded-xl border border-[#231F20]/10 bg-white px-5">
    {itens.map(([pergunta, resposta], i) => (
      <AccordionItem key={pergunta} value={`${prefixo}-${i}`} className="border-[#231F20]/10 last:border-b-0">
        <AccordionTrigger className="text-left text-[15px] font-bold text-primary hover:no-underline">
          {pergunta}
        </AccordionTrigger>
        <AccordionContent className="text-[14px] leading-relaxed text-[#2b2b2b]">{resposta}</AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

const Faq = () => (
  <Section id="faq">
    <SectionHeader eyebrow={parte('faq')} title="Perguntas frequentes" />
    <Item id="faq-pure-pass" eyebrow="Perguntas frequentes" titulo="Pure Pass e aula experimental">
      <Perguntas prefixo="pp" itens={FAQ_PURE_PASS} />
    </Item>
    <Item id="faq-paga" eyebrow="Perguntas frequentes" titulo="Aula paga: dúvidas do dia a dia">
      <Perguntas prefixo="paga" itens={FAQ_PAGA} />
      <Callout tom="red" className="mt-6">
        <strong>Mais ajuda:</strong> a <strong>MarIA</strong> responde dúvidas sobre qualquer tela do PureSystem pelo
        botão de ajuda, e o manual da <strong>Central de Pagamentos</strong> detalha o PIX e a aprovação.
      </Callout>
    </Item>
  </Section>
);

// ── Página ─────────────────────────────────────────────────────────────────

const ManualComece = () => {
  const { hash } = useLocation();

  // Link de fora com âncora (ex.: o banner da Campanha Aporte aponta para
  // #midia-com-aporte): a página só existe depois do login e do carregamento
  // da rota, tarde demais para o navegador rolar sozinho.
  useEffect(() => {
    if (!hash) return;
    const quadro = requestAnimationFrame(() =>
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' }),
    );
    return () => cancelAnimationFrame(quadro);
  }, [hash]);

  return (
  <MainLayout>
    {/* Largura de leitura centralizada: o manual não estica até a borda da
        tela, e o conteúdo preenche o quadro inteiro, sem sobra à direita. */}
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5">
        <Link
          to="/tutoriais"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Guias e Tutoriais
        </Link>
      </div>

      <article
        className="overflow-hidden rounded-2xl border border-[#231F20]/10 bg-white shadow-sm"
        style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
      >
        {/* Capa: os círculos concêntricos do manual, desenhados em CSS */}
        <header className="relative overflow-hidden bg-[#231F20] px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14">
          <div className="pointer-events-none absolute -right-28 top-1/2 hidden -translate-y-1/2 md:block" aria-hidden>
            <div className="flex h-[420px] w-[420px] items-center justify-center rounded-full border-[3px] border-primary/40">
              <div className="flex h-[300px] w-[300px] items-center justify-center rounded-full border-[3px] border-primary/80">
                <div className="h-[150px] w-[150px] rounded-full bg-primary" />
              </div>
            </div>
          </div>
          <div className="relative max-w-xl">
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-white/85">
              <span className="h-4 w-1 bg-primary" />
              Manual do franqueado · PureSystem
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Comece:
              <br />
              Pure Pass e
              <br />
              Aula Experimental
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/80 sm:text-lg">
              Como o cliente chega, o que o sistema faz sozinho e o que a sua unidade faz em cada etapa: Pure Pass, aula
              experimental gratuita e aula experimental paga.
            </p>
            <div className="mt-6 h-1 w-20 rounded-full bg-primary" />
            <p className="mt-8 text-xs tracking-[0.15em] text-white/60">Versão 1.0 · Outubro de 2026</p>
          </div>
        </header>

        <Sumario />
        <GuiaRapido />
        <FluxoDeMidia />
        <PurePass />
        <ExperimentalGratuita />
        <ExperimentalPaga />
        <PureSystem />
        <Faq />

        {/* Contracapa */}
        <footer className="bg-[#231F20] px-6 py-12 text-center text-white sm:px-10">
          <p className="text-sm text-white/75">Comece: Pure Pass e Aula Experimental · PureSystem</p>
          <p className="mx-auto mt-2 max-w-xl font-bold">
            Receba bem, conversem no momento certo e acompanhem cada cliente até a matrícula e o primeiro mês.
          </p>
          <a href="#sumario" className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white">
            <ArrowUp className="h-3.5 w-3.5" />
            Voltar ao sumário
          </a>
        </footer>
        <div className="h-3 bg-primary" />
      </article>
    </div>
  </MainLayout>
  );
};

export default ManualComece;

import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Copy, Check, type LucideIcon } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

/**
 * Kit visual dos artigos da PurePedia.
 *
 * A identidade é a das landing pages do Pure Station (purestation.purepilates.com.br):
 * Montserrat, vermelho #C12030, cantos assimétricos (o canto de baixo-direita
 * "corta") e o ícone em formato de pétala. Os tokens estão fixos de propósito —
 * o artigo é uma peça de marca, não segue o tema claro/escuro do Hub, igual ao
 * guia de Onboarding do Instrutor.
 */

export const PS = {
  red: '#C12030',
  redDeep: '#A31A28',
  ink: '#1F2328',
  inkSoft: '#565C63',
  inkMute: '#8A9099',
  bg2: '#F3F4F6',
  line: 'rgba(31,35,40,.12)',
  shadowSm: '0 12px 30px -18px rgba(31,35,40,.3)',
  card: '28px 28px 4px 28px',
  cardSm: '18px 18px 4px 18px',
  tile: '11px 11px 3px 11px',
  petala: '50% 50% 0 50%',
  btn: '14px 14px 0 14px',
} as const;

const FONT = "'Montserrat', Arial, Helvetica, sans-serif";

/** Eyebrow com o triangulinho de "play" — assinatura das LPs do Pure Station. */
export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span
    className="inline-flex items-center text-[0.76rem] font-bold uppercase"
    style={{ letterSpacing: '.16em', color: PS.red }}
  >
    <span
      aria-hidden
      className="mr-2 inline-block h-0 w-0 translate-y-px"
      style={{
        borderLeft: '8px solid currentColor',
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
      }}
    />
    {children}
  </span>
);

/** Capa vermelha do artigo. */
export const Capa = ({
  eyebrow,
  titulo,
  resumo,
}: {
  eyebrow: string;
  titulo: ReactNode;
  resumo?: string;
}) => (
  <header
    className="relative overflow-hidden px-6 py-12 text-white sm:px-12 sm:py-16"
    style={{ background: 'linear-gradient(150deg,#C1202F 0%,#921724 68%,#7c1420 100%)' }}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        width: 320,
        height: 320,
        borderRadius: PS.petala,
        background: 'rgba(255,255,255,.07)',
        left: -110,
        top: -120,
      }}
    />
    <div className="relative max-w-3xl">
      <span
        className="inline-flex items-center text-[0.76rem] font-bold uppercase text-white/85"
        style={{ letterSpacing: '.16em' }}
      >
        <span
          aria-hidden
          className="mr-2 inline-block h-0 w-0 translate-y-px"
          style={{
            borderLeft: '8px solid currentColor',
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
          }}
        />
        {eyebrow}
      </span>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.7rem)] font-extrabold leading-[1.1] tracking-[-.02em]">
        {titulo}
      </h1>
      {resumo && (
        <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-white/90">{resumo}</p>
      )}
    </div>
  </header>
);

/** Bloco de seção. `tom` alterna o fundo, como as faixas da LP. */
export const Secao = ({
  children,
  tom = 'branco',
}: {
  children: ReactNode;
  tom?: 'branco' | 'cinza' | 'rosa';
}) => {
  const bg = tom === 'cinza' ? PS.bg2 : tom === 'rosa' ? '#FBF2F3' : '#FFFFFF';
  return (
    <section
      className="px-6 py-12 sm:px-12 sm:py-16"
      style={{ background: bg, borderTop: `1px solid ${PS.line}` }}
    >
      <div className="mx-auto max-w-3xl">{children}</div>
    </section>
  );
};

/** Cabeçalho de seção — eyebrow + título + linha de apoio. */
export const SecHead = ({
  eyebrow,
  titulo,
  apoio,
  centro = false,
}: {
  eyebrow?: string;
  titulo: string;
  apoio?: string;
  centro?: boolean;
}) => (
  <header className={`mb-8 ${centro ? 'text-center' : ''}`}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2
      className="mt-2 text-[clamp(1.6rem,3.2vw,2.2rem)] font-extrabold leading-[1.12] tracking-[-.02em]"
      style={{ color: PS.ink }}
    >
      {titulo}
    </h2>
    {apoio && (
      <p className="mt-2 text-[1.02rem] leading-relaxed" style={{ color: PS.inkSoft }}>
        {apoio}
      </p>
    )}
  </header>
);

export const P = ({ children }: { children: ReactNode }) => (
  <p className="mb-4 text-[1rem] leading-[1.62]" style={{ color: PS.inkSoft }}>
    {children}
  </p>
);

/** Linha de destaque com ícone em ladrilho vermelho (padrão `.feat-row` da LP). */
export const FeatRow = ({
  icon: Icon,
  titulo,
  children,
}: {
  icon: LucideIcon;
  titulo: string;
  children?: ReactNode;
}) => (
  <div className="flex items-start gap-3.5">
    <span
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-white"
      style={{
        borderRadius: PS.tile,
        background: `linear-gradient(150deg,${PS.red},${PS.redDeep})`,
        boxShadow: '0 10px 20px -10px rgba(0,0,0,.5)',
      }}
    >
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0">
      <h4 className="mb-0.5 text-[1.05rem] font-extrabold" style={{ color: PS.ink }}>
        {titulo}
      </h4>
      {children && (
        <div className="text-[0.94rem] leading-[1.55]" style={{ color: PS.inkSoft }}>
          {children}
        </div>
      )}
    </div>
  </div>
);

/** Cartão branco com canto cortado. */
export const Cartao = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div
    className={`bg-white p-6 ${className}`}
    style={{ border: `1px solid ${PS.line}`, borderRadius: PS.card, boxShadow: PS.shadowSm }}
  >
    {children}
  </div>
);

/** Selo: ícone em pétala + rótulo curto. */
export const Selo = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <div
    className="bg-white px-5 py-6 text-center"
    style={{ border: `1px solid ${PS.line}`, borderRadius: PS.card, boxShadow: PS.shadowSm }}
  >
    <span
      className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center text-white"
      style={{
        borderRadius: PS.petala,
        background: `linear-gradient(150deg,${PS.red},${PS.redDeep})`,
        boxShadow: '0 12px 24px -12px rgba(193,32,48,.6)',
      }}
    >
      <Icon className="h-6 w-6" />
    </span>
    <h3 className="text-[1.02rem] font-extrabold leading-snug" style={{ color: PS.ink }}>
      {children}
    </h3>
  </div>
);

/** Linha com check vermelho (padrão `.dor` da LP). */
export const ItemCheck = ({ children }: { children: ReactNode }) => (
  <div
    className="flex items-center gap-3.5 bg-white px-5 py-4"
    style={{ border: `1px solid ${PS.line}`, borderRadius: PS.cardSm, boxShadow: PS.shadowSm }}
  >
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
      style={{ background: PS.red }}
    >
      <Check className="h-4 w-4" strokeWidth={2.6} />
    </span>
    <p className="m-0 text-[0.98rem] font-semibold" style={{ color: PS.ink }}>
      {children}
    </p>
  </div>
);

/** Painel vermelho com vidro — para regras e avisos que não podem passar batido. */
export const Destaque = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <div
    className="relative overflow-hidden px-7 py-7 text-white"
    style={{ background: 'linear-gradient(135deg,#c1202f,#8f1622)', borderRadius: PS.card }}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        width: 220,
        height: 220,
        borderRadius: PS.petala,
        background: 'rgba(255,255,255,.07)',
        right: -80,
        top: -90,
      }}
    />
    <div className="relative">
      <h3 className="mb-2 text-[1.2rem] font-extrabold leading-snug">{titulo}</h3>
      <div className="text-[0.98rem] leading-[1.6] text-white/90">{children}</div>
    </div>
  </div>
);

/** Passo numerado do fluxo de tratativa. */
export const Passo = ({
  numero,
  titulo,
  children,
}: {
  numero: number;
  /** ReactNode (e não string) porque o texto do passo pode ter grifo do original. */
  titulo: ReactNode;
  children?: ReactNode;
}) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center text-[0.95rem] font-extrabold text-white"
        style={{ borderRadius: PS.tile, background: `linear-gradient(150deg,${PS.red},${PS.redDeep})` }}
      >
        {numero}
      </span>
      <span aria-hidden className="mt-1 w-px flex-1" style={{ background: PS.line }} />
    </div>
    <div className="min-w-0 pb-7">
      <h4 className="mb-1.5 text-[1.05rem] font-extrabold" style={{ color: PS.ink }}>
        {titulo}
      </h4>
      <div className="text-[0.96rem] leading-[1.6]" style={{ color: PS.inkSoft }}>
        {children}
      </div>
    </div>
  </div>
);

/** Lista simples com marcador vermelho. */
export const Lista = ({ itens }: { itens: ReactNode[] }) => (
  <ul className="m-0 list-none space-y-2 p-0">
    {itens.map((item, i) => (
      <li key={i} className="flex gap-2.5 text-[0.96rem] leading-[1.6]" style={{ color: PS.inkSoft }}>
        <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PS.red }} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/** Mensagem pronta com botão de copiar. */
export const MensagemCopiavel = ({ rotulo, texto }: { rotulo: string; texto: string }) => {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast.success('Mensagem copiada!');
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div
      className="bg-white"
      style={{ border: `1px solid ${PS.line}`, borderRadius: PS.cardSm, boxShadow: PS.shadowSm }}
    >
      <div
        className="flex items-center justify-between gap-3 px-5 py-3"
        style={{ borderBottom: `1px solid ${PS.line}` }}
      >
        <span className="text-[0.78rem] font-bold uppercase" style={{ letterSpacing: '.12em', color: PS.red }}>
          {rotulo}
        </span>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[0.8rem] font-bold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: PS.red, borderRadius: PS.btn }}
        >
          {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copiado ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <p
        className="m-0 whitespace-pre-line px-5 py-4 text-[0.94rem] leading-[1.6]"
        style={{ color: PS.inkSoft }}
      >
        {texto}
      </p>
    </div>
  );
};

/**
 * Captura de tela de um tutorial. As imagens vêm dos PDFs originais (extraídas
 * página a página), e nelas a marcação vermelha É a instrução — por isso a
 * figura nunca deve ser cortada nem reduzida a ponto de perder legibilidade.
 */
export const Figura = ({ src, alt }: { src: string; alt: string }) => (
  <figure
    className="my-4 overflow-hidden bg-white"
    style={{ border: `1px solid ${PS.line}`, borderRadius: PS.cardSm, boxShadow: PS.shadowSm }}
  >
    <img src={src} alt={alt} loading="lazy" className="block h-auto w-full" />
  </figure>
);

/** Pergunta e resposta em acordeão (padrão `.faq` da LP). */
export const Faq = ({ pergunta, children }: { pergunta: string; children: ReactNode }) => (
  <details
    className="group bg-white"
    style={{ border: `1px solid ${PS.line}`, borderRadius: 16, overflow: 'hidden' }}
  >
    <summary
      className="flex cursor-pointer list-none items-center justify-between gap-3.5 px-5 py-4 text-[1rem] font-bold [&::-webkit-details-marker]:hidden"
      style={{ color: PS.ink }}
    >
      {pergunta}
      <span
        aria-hidden
        className="shrink-0 text-[1.4rem] font-bold leading-none group-open:hidden"
        style={{ color: PS.red }}
      >
        +
      </span>
      <span
        aria-hidden
        className="hidden shrink-0 text-[1.4rem] font-bold leading-none group-open:inline"
        style={{ color: PS.red }}
      >
        –
      </span>
    </summary>
    <div className="px-5 pb-5 text-[0.95rem] leading-[1.65]" style={{ color: PS.inkSoft }}>
      {children}
    </div>
  </details>
);

/** Casca do artigo: volta pra PurePedia + moldura no visual do Pure Station. */
export const ArtigoShell = ({ children }: { children: ReactNode }) => (
  <MainLayout>
    <div className="w-full">
      <div className="mb-5">
        <Link
          to="/purepedia"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          PurePedia
        </Link>
      </div>
      <article
        className="overflow-hidden bg-white shadow-sm"
        style={{ border: `1px solid ${PS.line}`, borderRadius: 24, fontFamily: FONT }}
      >
        {children}
      </article>
    </div>
  </MainLayout>
);

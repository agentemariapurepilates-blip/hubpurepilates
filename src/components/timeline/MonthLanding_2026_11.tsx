import { useState, useEffect, useRef, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AnimatedSection from './AnimatedSection';
import { cn } from '@/lib/utils';
import {
  ArrowRight, ChevronLeft, ChevronRight, Clapperboard, Users, TrendingUp, Target, Megaphone,
  GraduationCap, ShoppingBag, Instagram, Music2, Tag, Mail, MessageCircle, Database, Zap,
  ShieldCheck, Rocket, Search, Star, MapPin, CalendarDays, Monitor, BookOpen, Percent, Volume2, VolumeX,
} from 'lucide-react';
import logoPure from '@/assets/logo-pure-pilates.png';
import posterMove from '@/features/geral/entre-molas/edicao-1/fotos/pure-store/colecao-move.jpg';

/* ══════════════════════════════════════════════════════════════════════════
   TIMELINE Nº 11 · NOVEMBRO 2026
   Edição Black Friday — fundo preto de verdade, texto branco com contraste
   alto e o vermelho da marca como único acento. Conteúdo do Canva
   "Timeline - NOV 2026" (pauta + 28 páginas).

   ESQUELETO (23/10/2026): o que ainda não chegou fica marcado com <Pendente />
   — números de performance, aporte e Pure Match, prints e posts do mês.
   ══════════════════════════════════════════════════════════════════════════ */

type TabKey =
  | 'capa'
  | 'novela'
  | 'brandformance'
  | 'resultados'
  | 'social'
  | 'station'
  | 'store'
  | 'academy';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'capa', label: 'Capa' },
  { key: 'novela', label: '★ Segredos de Pilar: reta final' },
  { key: 'brandformance', label: 'Brandformance' },
  { key: 'resultados', label: 'Resultados' },
  { key: 'social', label: 'Redes Sociais' },
  { key: 'station', label: 'Pure Station' },
  { key: 'store', label: 'Pure Store' },
  { key: 'academy', label: 'Pure Academy' },
];

/* ── paleta da edição ────────────────────────────────────────────────── */
const PRETO = '#0a0a0a';        // fundo
const GRAFITE = '#151515';      // cartão
const GRAFITE_CLARO = '#1f1f1f';
const VERMELHO = '#C12030';     // vermelho da marca
const VERMELHO_VIVO = '#E0293B'; // só para brilho/luz, nunca para texto pequeno

/** Black Friday 2026: sexta, 27/11. A contagem da capa mira o começo do dia. */
const BLACK_FRIDAY = new Date('2026-11-27T00:00:00-03:00');

/** Trailer de Os Segredos de Pilar (o mesmo da edição de outubro). */
const TRAILER_NOVELA = 'agMCwjc2etM';

/* ── posts do mês (embeds) ───────────────────────────────────────────── */
const TIKTOKS = ['7698860691117083924', '7696524750641843476'];
const igEmbed = (codigo: string) => `https://www.instagram.com/p/${codigo}/embed`;
const tiktokEmbed = (id: string) => `https://www.tiktok.com/embed/v2/${id}`;

/**
 * UGCs de novembro: comprimidos para a web (720p) a partir dos originais
 * e servidos do próprio Hub, em public/videos/timeline-2026-11/.
 */
const UGCS = [1, 2, 3].map((n) => ({
  video: `/videos/timeline-2026-11/ugc-${n}.mp4`,
  capa: `/videos/timeline-2026-11/ugc-${n}.jpg`,
}));

/** O clipe da Coleção Move feito para a revista Entre Molas (8 s, em loop). */
const VIDEO_MOVE = '/videos/entre-molas/colecao-move.mp4';

const SUMARIO: { key: TabKey; titulo: string; desc: string }[] = [
  { key: 'novela', titulo: 'Segredos de Pilar', desc: 'A reta final da novela de vendas da rede.' },
  { key: 'brandformance', titulo: 'Brandformance', desc: 'Marca e resultado juntos — e por que a sua unidade é parte disso.' },
  { key: 'resultados', titulo: 'Resultados', desc: 'Performance de setembro e parcial de outubro, aporte e Pure Match.' },
  { key: 'social', titulo: 'Redes Sociais', desc: '3.390 novos seguidores, o TikTok acelerando e os destaques do mês.' },
  { key: 'station', titulo: 'Pure Station', desc: '412 mil pessoas na base: onde está a próxima matrícula.' },
  { key: 'store', titulo: 'Pure Store', desc: 'Black Friday na loja, pré-venda da Move e a nova Pure Socks.' },
  { key: 'academy', titulo: 'Pure Academy', desc: 'Formação 100% online com 50% OFF de lançamento.' },
];

/* ══════════════════════════════════════════════════════════════════════
   ESTILOS E ANIMAÇÕES DA EDIÇÃO
   Tudo em CSS: leve, sem biblioteca, e respeita quem pede menos movimento.
   ══════════════════════════════════════════════════════════════════════ */
const estilosBlack = `
@keyframes bf-faixa { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes bf-acende {
  0%, 100% { opacity: 1; text-shadow: 0 0 18px ${VERMELHO_VIVO}aa, 0 0 42px ${VERMELHO}66; }
  4% { opacity: .35; text-shadow: none; }
  6% { opacity: 1; }
  8% { opacity: .55; text-shadow: none; }
  10% { opacity: 1; text-shadow: 0 0 18px ${VERMELHO_VIVO}aa, 0 0 42px ${VERMELHO}66; }
}
@keyframes bf-letra { from { opacity: 0; transform: translateY(.45em) scale(.9); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes bf-varredura { 0% { transform: translateX(-120%) skewX(-18deg); } 60%, 100% { transform: translateX(260%) skewX(-18deg); } }
@keyframes bf-holofote { 0%, 100% { transform: translate(-10%, -6%); } 50% { transform: translate(12%, 8%); } }
@keyframes bf-pulso { 0%, 100% { box-shadow: 0 0 0 0 ${VERMELHO}88; } 70% { box-shadow: 0 0 0 16px ${VERMELHO}00; } }
@keyframes bf-grao { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-2%, 1%); } 50% { transform: translate(1%, -2%); } 75% { transform: translate(2%, 2%); } }

.bf-faixa-trilho { animation: bf-faixa 26s linear infinite; }
.bf-acende { animation: bf-acende 6s ease-in-out infinite; }
.bf-letra { display: inline-block; opacity: 0; animation: bf-letra .7s cubic-bezier(.2,.8,.2,1) forwards; }
.bf-varredura::after {
  content: ''; position: absolute; inset: 0; width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent);
  animation: bf-varredura 5s ease-in-out infinite;
}
.bf-holofote { animation: bf-holofote 14s ease-in-out infinite; }
.bf-pulso { animation: bf-pulso 2.4s ease-out infinite; }
.bf-grao {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
  animation: bf-grao 1.2s steps(4) infinite;
}
.bf-contorno { -webkit-text-stroke: 1.5px rgba(255,255,255,.85); color: transparent; }

@media (prefers-reduced-motion: reduce) {
  .bf-faixa-trilho, .bf-acende, .bf-holofote, .bf-pulso, .bf-grao, .bf-varredura::after { animation: none !important; }
  .bf-letra { animation: none !important; opacity: 1; }
}
`;

/* ── hook de entrada em tela ─────────────────────────────────────────── */
function useNaTela<T extends HTMLElement>(limite = 0.25) {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          obs.unobserve(el);
        }
      },
      { threshold: limite },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [limite]);
  return { ref, visivel };
}

/* ── contador com separador de milhar pt-BR ──────────────────────────── */
const Contador = ({
  ate, decimais = 0, sufixo = '', prefixo = '', duracao = 1800, className,
}: { ate: number; decimais?: number; sufixo?: string; prefixo?: string; duracao?: number; className?: string }) => {
  const { ref, visivel } = useNaTela<HTMLSpanElement>(0.3);
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (!visivel) return;
    const inicio = performance.now();
    let raf = 0;
    const passo = (agora: number) => {
      const p = Math.min((agora - inicio) / duracao, 1);
      setValor((1 - Math.pow(1 - p, 3)) * ate);
      if (p < 1) raf = requestAnimationFrame(passo);
      else setValor(ate);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [visivel, ate, duracao]);

  return (
    <span ref={ref} className={className}>
      {prefixo}
      {valor.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais })}
      {sufixo}
    </span>
  );
};

/* ── faixa correndo (a "fita" da Black Friday) ───────────────────────── */
const Faixa = ({ itens, invertida = false }: { itens: string[]; invertida?: boolean }) => {
  const linha = [...itens, ...itens];
  return (
    <div
      className={cn('relative overflow-hidden py-2.5 select-none', invertida ? 'bg-white text-black' : 'text-white')}
      style={invertida ? undefined : { background: VERMELHO }}
      aria-hidden
    >
      <div className="bf-faixa-trilho flex w-max whitespace-nowrap">
        {[0, 1].map((metade) => (
          <div key={metade} className="flex shrink-0">
            {linha.map((t, i) => (
              <span key={i} className="mx-5 font-heading font-black uppercase tracking-[0.25em] text-xs sm:text-sm">
                {t} <span className="mx-3 opacity-60">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── título com letras entrando uma a uma ────────────────────────────── */
const LetraALetra = ({ texto, atraso = 0, passo = 70, className }: { texto: string; atraso?: number; passo?: number; className?: string }) => (
  <span className={className} aria-label={texto}>
    {texto.split('').map((c, i) => (
      <span key={i} className="bf-letra" style={{ animationDelay: `${atraso + i * passo}ms` }} aria-hidden>
        {c === ' ' ? ' ' : c}
      </span>
    ))}
  </span>
);

/* ── contagem regressiva até a Black Friday ──────────────────────────── */
const ContagemBlack = () => {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const falta = Math.max(0, BLACK_FRIDAY.getTime() - agora);
  const partes = [
    { v: Math.floor(falta / 86_400_000), r: 'dias' },
    { v: Math.floor(falta / 3_600_000) % 24, r: 'horas' },
    { v: Math.floor(falta / 60_000) % 60, r: 'min' },
    { v: Math.floor(falta / 1000) % 60, r: 'seg' },
  ];
  if (falta === 0) {
    return <p className="font-heading font-black text-2xl text-white">A Black Friday chegou.</p>;
  }
  return (
    <div className="flex gap-2 sm:gap-3">
      {partes.map((p) => (
        <div key={p.r} className="min-w-[3.6rem] sm:min-w-[4.4rem] rounded-xl border border-white/15 bg-white/[0.05] px-2 py-2.5 text-center">
          <p className="font-heading font-black text-2xl sm:text-3xl text-white tabular-nums leading-none">
            {String(p.v).padStart(2, '0')}
          </p>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-white/55 font-semibold mt-1.5">{p.r}</p>
        </div>
      ))}
    </div>
  );
};

/* ── cabeçalho de seção ──────────────────────────────────────────────── */
const Cabecalho = ({
  kicker, titulo, destaque, lead, icone: Icone,
}: { kicker: string; titulo: string; destaque?: string; lead?: string; icone?: React.ElementType }) => (
  <AnimatedSection variant="fade-up">
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        {Icone && <Icone className="h-4 w-4 shrink-0" style={{ color: VERMELHO_VIVO }} />}
        <span className="text-[11px] uppercase tracking-[0.3em] font-bold" style={{ color: VERMELHO_VIVO }}>{kicker}</span>
        <span className="h-px flex-1 max-w-[140px]" style={{ background: `${VERMELHO}88` }} />
      </div>
      <h2 className="font-heading font-black text-4xl sm:text-6xl text-white leading-[0.95] tracking-tight uppercase">
        {titulo}
        {destaque && <> <span style={{ color: VERMELHO_VIVO }}>{destaque}</span></>}
      </h2>
      {lead && <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/75 leading-relaxed">{lead}</p>}
    </div>
  </AnimatedSection>
);

/* ── cartão da edição ────────────────────────────────────────────────── */
const Papel = ({
  children, className, tom = 'grafite', brilho = false,
}: { children: ReactNode; className?: string; tom?: 'grafite' | 'claro' | 'vermelho'; brilho?: boolean }) => {
  const fundos = { grafite: GRAFITE, claro: GRAFITE_CLARO, vermelho: VERMELHO };
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border text-white p-6 sm:p-8',
        tom === 'vermelho' ? 'border-white/20' : 'border-white/10',
        'shadow-[0_18px_40px_-28px_rgba(0,0,0,0.95)]',
        brilho && 'bf-varredura',
        className,
      )}
      style={{ background: fundos[tom] }}
    >
      <div className="relative">{children}</div>
    </div>
  );
};

/** Marca o que ainda falta no esqueleto. Some quando o conteúdo entra. */
const Pendente = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-white/25 bg-white/[0.03] px-4 py-5 text-center text-sm text-white/55">
    <span className="mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white" style={{ background: VERMELHO }}>
      a preencher
    </span>
    {children}
  </div>
);

const Numero = ({ valor, rotulo, className }: { valor: ReactNode; rotulo: string; className?: string }) => (
  <div className={cn('rounded-xl border border-white/10 bg-white/[0.04] p-4', className)}>
    <p className="font-heading font-black text-2xl sm:text-3xl text-white leading-none tabular-nums">{valor}</p>
    <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 font-semibold mt-2 leading-snug">{rotulo}</p>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════
   CAPA — masthead, capa Black Friday, carta e sumário
   ══════════════════════════════════════════════════════════════════════ */
const Capa = ({ irPara }: { irPara: (t: TabKey) => void }) => (
  <>
    <AnimatedSection variant="fade-in">
      <div>
        <div className="flex items-end justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <img src={logoPure} alt="Pure Pilates" className="h-7 sm:h-9 object-contain brightness-0 invert" />
            <div className="leading-none">
              <p className="font-heading font-black text-xl sm:text-3xl tracking-tighter text-white">
                TIMELINE<span style={{ color: VERMELHO_VIVO }}>.</span>
              </p>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-white/55 font-semibold mt-1">
                Pure Pilates
              </p>
            </div>
          </div>
          <div className="text-right leading-tight shrink-0">
            <p className="font-heading font-black text-lg sm:text-2xl leading-none" style={{ color: VERMELHO_VIVO }}>Nº 11</p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-white/55 font-semibold mt-1">
              Novembro 2026
            </p>
          </div>
        </div>
        <div className="border-t-2 border-white/85 pt-[3px]">
          <div className="border-t border-white/25" />
        </div>
        <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.28em] font-semibold text-white/60">
          Edição Black Friday · Departamento de Marketing
        </p>
      </div>
    </AnimatedSection>

    {/* ═══ CAPA ═══ */}
    <AnimatedSection variant="fade-in" delay={80}>
      <div className="relative overflow-hidden rounded-sm ring-1 ring-white/10" style={{ background: PRETO }}>
        {/* holofote vermelho passeando + grão de filme */}
        <div
          className="bf-holofote pointer-events-none absolute -inset-1/4"
          style={{ background: `radial-gradient(40% 45% at 60% 35%, ${VERMELHO}55 0%, transparent 70%)` }}
        />
        <div className="bf-grao pointer-events-none absolute -inset-[10%] opacity-[0.07] mix-blend-overlay" />

        <Faixa itens={['Black Friday', 'Novembro 2026', 'Black sem dor', 'Acelerar com intenção']} />

        <div className="relative px-6 sm:px-10 lg:px-12 py-12 sm:py-16">
          <p className="text-[11px] uppercase tracking-[0.35em] font-bold text-white/65">O mês mais estratégico do ano</p>

          <h1 className="font-heading font-black uppercase leading-[0.8] tracking-tighter mt-4">
            <span className="bf-acende block text-white text-[4.4rem] sm:text-[8rem] lg:text-[10rem]">
              <LetraALetra texto="BLACK" />
            </span>
            <span className="block bf-contorno text-[3.2rem] sm:text-[5.8rem] lg:text-[7.2rem]">
              <LetraALetra texto="FRIDAY" atraso={420} />
            </span>
          </h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
            <div>
              <p className="font-heading font-black text-xl sm:text-2xl text-white leading-tight max-w-lg">
                Novembro é o mês de <span style={{ color: VERMELHO_VIVO }}>acelerar com intenção</span>.
              </p>
              <p className="text-sm sm:text-base text-white/75 leading-relaxed mt-3 max-w-lg">
                Aula experimental e vantagens especiais na adesão do Pure Pass: o modelo de atração da campanha
                <strong className="text-white"> Black sem dor</strong>.
              </p>
              <button
                type="button"
                onClick={() => irPara('store')}
                className="bf-pulso inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white mt-6 transition-transform hover:scale-[1.03]"
                style={{ background: VERMELHO }}
              >
                <Tag className="h-4 w-4" />
                Ver as ofertas do mês
              </button>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-white/60 mb-3">Faltam para a Black Friday · 27/11</p>
              <ContagemBlack />
            </div>
          </div>
        </div>

        <Faixa invertida itens={['Sem dor no corpo', 'Sem dor no bolso', '50% OFF no primeiro mês com Pure Pass']} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-white/15 mt-3 pt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/55 font-semibold">
        <span>Capa · <span style={{ color: VERMELHO_VIVO }}>Black Friday</span></span>
        <span>Dezembro bate à porta</span>
        <span className="hidden sm:inline">Reputação é a nova vitrine</span>
      </div>
    </AnimatedSection>

    {/* ═══ CAMPANHA BLACK SEM DOR ═══ */}
    <AnimatedSection variant="scale-up" delay={100}>
      <Papel tom="vermelho" brilho>
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-white/80">Vem aí · Pack PDV para a TV</p>
            <p className="font-heading font-black uppercase text-4xl sm:text-6xl leading-[0.9] tracking-tight mt-2">
              Black sem dor
            </p>
            <p className="text-sm sm:text-base text-white/90 mt-3 max-w-xl">
              Sem dor no corpo, sem dor no bolso: <strong>50% OFF no primeiro mês com Pure Pass</strong>.
              O pack da campanha chega para a TV da recepção.
            </p>
          </div>
          <div className="rounded-2xl bg-black/30 px-6 py-5 text-center">
            <p className="font-heading font-black text-6xl sm:text-7xl leading-none">50%</p>
            <p className="text-xs uppercase tracking-[0.3em] font-bold mt-1">OFF</p>
          </div>
        </div>      </Papel>
    </AnimatedSection>

    {/* ═══ CARTA AO FRANQUEADO ═══ */}
    <AnimatedSection variant="fade-up" delay={120}>
      <Papel tom="claro">
        <p className="text-[11px] uppercase tracking-[0.3em] font-bold" style={{ color: VERMELHO_VIVO }}>Carta ao franqueado</p>
        <div className="mt-4 space-y-4 text-sm sm:text-base leading-relaxed text-white/80 max-w-3xl">
          <p>
            Novembro chegou, e com ele um dos meses mais estratégicos do ano para a rede Pure Pilates.
          </p>
          <p>
            Temos pela frente a <strong className="text-white">Black Friday</strong>, um momento de alta procura em
            que cada estúdio tem a chance de atrair novos clientes, converter quem já está de olho na marca e fechar
            planos que garantem um início de ano forte. Preparação, comunicação alinhada e agilidade no atendimento
            fazem toda a diferença nessas semanas. Ainda mais pelo{' '}
            <strong className="text-white">modelo de atração que unirá aula experimental e vantagens especiais na adesão do Pure Pass</strong>.
          </p>
          <p>
            Ao mesmo tempo, <strong className="text-white">dezembro já está batendo à porta</strong>, com o recesso
            logo após a primeira quinzena. Isso significa que o nosso calendário efetivo é mais curto do que parece.
            O que planejarmos e executarmos agora vai definir como fechamos 2026 e como entramos em 2027.
          </p>
          <p>
            E <strong className="text-white">há um contexto que torna este momento ainda mais especial: o Pilates nunca foi tão relevante no Brasil.</strong>{' '}
            As buscas pela modalidade seguem crescendo, a nossa rede se expande e a marca Pure Pilates ganha cada vez
            mais espaço e oportunidades. Com esse crescimento, entramos em uma nova fase, em que a marca passará a
            acompanhar de perto os indicadores de reputação.
          </p>
          <p>
            E reputação não se constrói apenas com a padronização dos espaços, dos processos ou com uma gestão de
            pessoas mais conectada. Ela nasce, principalmente, das ações diárias de atendimento, em cada interação
            com o cliente, dentro e fora dos estúdios. Um “bom dia” bem dado, uma dúvida respondida com cuidado, uma
            avaliação agradecida no tempo certo.
          </p>
          <p>
            Por isso, o Google Places e as medidas de qualidade e velocidade de resposta passam a ser
            imprescindíveis. Eles são a vitrine da nossa marca para quem ainda não nos conhece e a base do nosso
            próximo nível de marketing.
          </p>
          <p className="font-heading font-black text-xl sm:text-2xl text-white">Novembro é o mês de acelerar com intenção.</p>
          <p>
            <strong className="text-white">Vamos juntos?</strong>
            <br />
            Marketing Pure Pilates.
          </p>
        </div>
      </Papel>
    </AnimatedSection>

    {/* ═══ SUMÁRIO ═══ */}
    <AnimatedSection variant="fade-up" delay={160}>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] uppercase tracking-[0.3em] font-bold" style={{ color: VERMELHO_VIVO }}>Nesta edição</span>
          <span className="h-px flex-1" style={{ background: `${VERMELHO}77` }} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SUMARIO.map((item, i) => (
            <button
              key={item.key}
              type="button"
              onClick={() => irPara(item.key)}
              className="group text-left rounded-xl border border-white/10 bg-white/[0.05] p-4 transition-colors hover:border-white/40 hover:bg-white/[0.1]"
            >
              <p className="font-heading font-black text-2xl leading-none" style={{ color: VERMELHO_VIVO }}>
                {String(i + 1).padStart(2, '0')}
              </p>
              <p className="font-heading font-bold text-base text-white mt-2 flex items-center gap-1.5">
                {item.titulo}
                <ArrowRight className="h-3.5 w-3.5 text-white opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </p>
              <p className="text-xs text-white/65 leading-snug mt-1">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   OS SEGREDOS DE PILAR — reta final
   ══════════════════════════════════════════════════════════════════════ */
const Novela = () => (
  <>
    <Cabecalho
      kicker="Novela de vendas"
      titulo="Segredos de Pilar:"
      destaque="reta final"
      icone={Clapperboard}
    />
    <AnimatedSection variant="fade-up">
      <Papel>
        <div className="relative w-full aspect-video overflow-hidden rounded-xl ring-1 ring-white/15 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] mb-6">
          <iframe
            src={`https://www.youtube.com/embed/${TRAILER_NOVELA}?rel=0&modestbranding=1&playsinline=1`}
            title="Trailer — Os Segredos de Pilar"
            className="absolute inset-0 w-full h-full block"
            style={{ border: 0 }}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="font-heading font-black text-2xl sm:text-3xl text-white">Em breve, o último episódio!</p>
        <Link
          to="/segredos-de-pilar"
          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white mt-6 transition-colors hover:bg-white/10"
        >
          Abrir a série no Hub
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Papel>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   BRANDFORMANCE
   ══════════════════════════════════════════════════════════════════════ */
const Brandformance = () => (
  <>
    <Cabecalho
      kicker="Brand + Performance"
      titulo="Brand"
      destaque="formance"
      lead="A marca e o resultado caminhando juntos."
      icone={Target}
    />

    <AnimatedSection variant="fade-up">
      <Papel>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-white/80 max-w-3xl">
          <p>
            O Marketing da Pure Pilates trabalha com Meta (Instagram e Facebook) e Google a partir de um conceito
            chamado <strong className="text-white">Brandformance</strong>, a união de <em>brand</em> (marca) com{' '}
            <em>performance</em> (resultado).
          </p>
          <p>
            Na prática, isso significa que não fazemos campanhas apenas para “aparecer” nem apenas para “converter”.
            Cada ação tem dois objetivos ao mesmo tempo: fortalecer a marca Pure Pilates na mente das pessoas e gerar
            resultados concretos, como contatos, aulas experimentais e novos alunos nos estúdios.
          </p>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <Megaphone className="h-5 w-5" style={{ color: VERMELHO_VIVO }} />
            <p className="font-heading font-black text-lg text-white mt-3">Uma marca forte torna a venda mais fácil</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <TrendingUp className="h-5 w-5" style={{ color: VERMELHO_VIVO }} />
            <p className="font-heading font-black text-lg text-white mt-3">e cada venda bem feita fortalece a marca</p>
          </div>
        </div>
        <p className="font-heading font-black text-lg text-white mt-5">Um movimento alimenta o outro.</p>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <Papel tom="claro">
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>Por que o franqueado é parte essencial disso?</p>
        <div className="mt-3 space-y-4 text-sm sm:text-base leading-relaxed text-white/80 max-w-3xl">
          <p>
            A franqueadora constrói a força da marca em escala nacional. Mas, quando um cliente é impactado por um
            anúncio, o próximo passo dele quase sempre é local: ele procura o estúdio mais próximo no Google, olha as
            avaliações, visita o Instagram da unidade e manda uma mensagem.
          </p>
          <p>
            É nesse momento que a jornada pode ganhar força ou se perder. Um perfil desatualizado, uma avaliação sem
            resposta ou uma mensagem que demora a ser respondida quebram todo o investimento feito até ali. Por isso,
            a gestão local das redes sociais e do Google Places não é um complemento, é a continuação da campanha.
          </p>
        </div>
        {/* a jornada, passo a passo */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { i: Megaphone, t: 'Vê o anúncio' },
            { i: Search, t: 'Procura no Google' },
            { i: Star, t: 'Olha as avaliações' },
            { i: MessageCircle, t: 'Manda mensagem' },
          ].map(({ i: Icone, t }, n) => (
            <AnimatedSection key={t} variant="fade-up" delay={n * 90}>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 h-full">
                <p className="text-[10px] font-bold text-white/45">{String(n + 1).padStart(2, '0')}</p>
                <Icone className="h-5 w-5 mt-2" style={{ color: VERMELHO_VIVO }} />
                <p className="text-sm font-semibold text-white mt-2">{t}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
        <p className="font-heading font-black text-lg sm:text-xl text-white mt-5">
          A franqueadora abre a porta, e o franqueado recebe o cliente.
        </p>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={80}>
      <div className="grid lg:grid-cols-2 gap-4">
        <Papel>
          <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>Por que ter um olhar constante?</p>
          <p className="text-sm sm:text-base leading-relaxed text-white/80 mt-3">
            Reputação digital não se constrói em uma ação pontual. Ela é resultado de consistência: postagens
            frequentes, informações sempre corretas, avaliações respondidas com cuidado e atendimento ágil todos os
            dias. Os algoritmos do Google e da Meta também valorizam perfis ativos e bem cuidados, entregando mais
            visibilidade a quem mantém essa regularidade. Ou seja, o cuidado diário de cada unidade impacta
            diretamente o alcance e o resultado de toda a rede. E a gente sabe que basta uma avaliação ruim ou algo
            não resolvido para todo o esforço vir abaixo.
          </p>
        </Papel>
        <Papel>
          <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>Por que seguir ferramentas, prazos, processos e padrões?</p>
          <p className="text-sm sm:text-base leading-relaxed text-white/80 mt-3">
            <strong className="text-white">
              Com 500 unidades, a força da Pure Pilates está em falar com uma só voz. Por isso, a franqueadora
              desenvolve ferramentas de gestão automatizada e padronizada, que facilitam a rotina do franqueado,
              economizam tempo e garantem que a marca seja percebida com a mesma qualidade em qualquer lugar do país.
            </strong>{' '}
            Seguir os prazos, processos e padrões definidos não é burocracia. É o que permite que as campanhas
            nacionais funcionem, que os dados sejam comparáveis, que as boas práticas sejam replicadas e que cada
            unidade se beneficie do tamanho da rede. Quando todos fazem a sua parte, no tempo certo e do jeito certo,
            a marca cresce e cada estúdio cresce junto.
          </p>
        </Papel>
      </div>
    </AnimatedSection>

    <AnimatedSection variant="scale-up" delay={100}>
      <Papel tom="vermelho" brilho>
        <p className="font-heading font-black text-2xl sm:text-3xl leading-tight">
          Brandformance é um trabalho a muitas mãos. E as suas fazem toda a diferença.
        </p>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={120}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/midias-sociais"
          className="group rounded-2xl border border-white/10 p-6 transition-colors hover:border-white/40"
          style={{ background: GRAFITE }}
        >
          <CalendarDays className="h-6 w-6" style={{ color: VERMELHO_VIVO }} />
          <p className="font-heading font-black text-lg text-white mt-3 leading-snug">
            A sua comunidade local com conteúdos que endossam o jeito da Pure de conduzir a jornada do cliente
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/75 mt-3 group-hover:text-white">
            Calendário de social no Hub <ArrowRight className="h-4 w-4" />
          </p>
        </Link>
        <div className="rounded-2xl border border-white/10 p-6" style={{ background: GRAFITE }}>
          <MapPin className="h-6 w-6" style={{ color: VERMELHO_VIVO }} />
          <p className="font-heading font-black text-lg text-white mt-3 leading-snug">
            A reputação da sua unidade também sendo gerenciada no Google
          </p>
          <p className="text-sm font-semibold text-white/75 mt-3">Gestão de Google Places no Pure System</p>
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   RESULTADOS — performance, aporte e Pure Match
   ══════════════════════════════════════════════════════════════════════ */
const Resultados = () => (
  <>
    <Cabecalho
      kicker="Resultados"
      titulo="Performance"
      destaque="da rede"
      lead="Evolução de setembro e resultado parcial de outubro (até 22/10)."
      icone={TrendingUp}
    />

    <AnimatedSection variant="fade-up">
      <Papel>
        <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2 text-sm">
          <div />
          {['Setembro', 'Outubro*'].map((m) => (
            <div key={m} className="rounded-full py-2 text-center font-heading font-bold text-white" style={{ background: VERMELHO }}>
              {m}
            </div>
          ))}
          {[
            ['Aula Experimental', '8.471', '5.625'],
            ['Presença Aula Experimental', '6.174', '4.179'],
            ['Matrículas', '1.437', '1.228'],
            ['PurePass', '70', '47'],
          ].map(([linha, set, out]) => (
            <div key={linha} className="contents">
              <div className="rounded-lg bg-white/[0.06] px-3 py-3 font-semibold text-white">{linha}</div>
              <div className="rounded-lg bg-white/[0.04] py-3 text-center font-heading font-bold text-white tabular-nums">{set}</div>
              <div className="rounded-lg bg-white/[0.04] py-3 text-center font-heading font-bold text-white tabular-nums">{out}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/50 mt-3">* Resultado parcial, até 22/10.</p>
        <p className="text-sm sm:text-base leading-relaxed text-white/80 mt-5 max-w-3xl">
          Setembro fechou com 8.471 aulas experimentais e 73% de presença, gerando 1.437 matrículas e 70 PurePass.
          Em outubro, até o dia 22, a presença subiu para 74% e já são 1.228 matrículas: no ritmo atual, o mês tende
          a fechar com mais matrículas que setembro.
        </p>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <Papel tom="claro">
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>Campanhas de aporte</p>
        <p className="text-sm sm:text-base leading-relaxed text-white/80 mt-3 max-w-3xl">
          Franquias com campanhas dedicadas para crescimento de aula experimental. Investimento dedicado para
          formatos em Meta, com todo o tráfego exclusivo para a unidade. Dentro do Hub, o franqueado tem (1) conteúdo
          explicativo, (2) formulário para adesão da mídia adicional e (3) report único sobre o valor real das
          campanhas incrementais na sua região de atuação.
        </p>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={80}>
      <Papel>
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>Pure Match</p>
        <p className="font-heading font-black text-xl text-white mt-2">Campanhas e resultados de aporte de recrutamento</p>
        <p className="text-sm sm:text-base leading-relaxed text-white/80 mt-3 max-w-3xl">
          Dentro da verba de mídia de contribuição da rede dedicamos +10% do recurso para ações de recrutamento de
          profissionais. Contudo, existem necessidades especiais e a equipe também atua com campanhas de aporte para
          atender estes casos. A solicitação desta campanha é realizada para a equipe de RH e direcionada
          internamente para marketing. Todos os leads conquistados são repassados também entre os departamentos para
          o franqueado.
        </p>
        <div className="mt-5 grid grid-cols-[1fr_1fr_1fr] gap-2 text-sm">
          <div />
          {['Setembro', 'Outubro (até 22/10)'].map((m) => (
            <div key={m} className="rounded-lg py-2 text-center font-bold text-white" style={{ background: `${VERMELHO}cc` }}>{m}</div>
          ))}
          {[
            ['Leads', '407', '189'],
            ['Unidades ativas', '14', '13'],
          ].map(([linha, set, out]) => (
            <div key={linha} className="contents">
              <div className="rounded-lg bg-white/[0.06] px-3 py-3 font-semibold text-white">{linha}</div>
              <div className="rounded-lg bg-white/[0.04] py-3 text-center font-heading font-bold text-white tabular-nums">{set}</div>
              <div className="rounded-lg bg-white/[0.04] py-3 text-center font-heading font-bold text-white tabular-nums">{out}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-white/70 mt-4">
          Além das campanhas pagas, as equipes tratam comunicações nas redes sociais do Pure Academy, disparos de
          e-mails para a base de leads já conquistados e inclusão de grupos de Telegram.
        </p>
      </Papel>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   REDES SOCIAIS
   ══════════════════════════════════════════════════════════════════════ */
type Destaque = {
  titulo: string;
  post: string;
  texto: string;
  numeros: { v: string; r: string }[];
};

const DESTAQUES: Destaque[] = [
  {
    titulo: 'O post do mês',
    post: 'DdrTdcYHB5x',
    texto:
      'O post se destacou pelo alto volume de interações, superando o desempenho das publicações recentes. A abordagem leve e divertida gerou identificação com o público, estimulando curtidas, comentários, compartilhamentos e salvamentos. O resultado reforça o potencial de conteúdos que exploram situações do dia a dia dos alunos para gerar engajamento e conexão com a marca.',
    numeros: [
      { v: '63,1 mil', r: 'visualizações' }, { v: '33.899', r: 'alcance' }, { v: '2.278', r: 'interações' },
      { v: '1.560', r: 'curtidas' }, { v: '461', r: 'compartilhamentos' }, { v: '147', r: 'salvamentos' },
    ],
  },
  {
    titulo: 'Post 500 unidades',
    post: 'DdoXaqcksqt',
    texto:
      'O marco de 500 unidades representa um momento histórico para a Pure Pilates, consolidando sua trajetória de expansão e a força da maior rede de estúdios de Pilates da América Latina. Nas redes sociais, o conteúdo ganhou destaque pelo alcance e pelas interações, com curtidas, comentários e compartilhamentos que reforçam o reconhecimento da marca. Mais do que celebrar um número, a publicação valorizou a grandiosidade da rede e sua presença cada vez mais forte no mercado.',
    numeros: [
      { v: '10,9 mil', r: 'visualizações' }, { v: '7.152', r: 'alcance' }, { v: '489', r: 'interações' },
      { v: '368', r: 'curtidas' }, { v: '69', r: 'compartilhamentos' }, { v: '21h40', r: 'tempo assistido' },
    ],
  },
  {
    titulo: 'Aniversário da Pure',
    post: 'Ddtd4kYAtOe',
    texto:
      'O aniversário da Pure Pilates foi celebrado com um conteúdo que valorizou a história, a evolução e a grandiosidade da marca ao longo dos anos. A publicação apresentou resultados expressivos de alcance e engajamento, com curtidas, comentários e compartilhamentos, reforçando a conexão do público com a trajetória da rede. Mais do que uma comemoração, o conteúdo fortaleceu o posicionamento institucional da Pure e destacou sua consolidação como referência no mercado de Pilates.',
    numeros: [
      { v: '10,2 mil', r: 'visualizações' }, { v: '7.004', r: 'alcance' }, { v: '339', r: 'interações' },
      { v: '253', r: 'curtidas' }, { v: '47', r: 'compartilhamentos' }, { v: '16h31', r: 'tempo assistido' },
    ],
  },
  {
    titulo: 'Primeira vez na Pure',
    post: 'DeH_35micX6',
    texto:
      'O conteúdo “Primeira vez na Pure” se destacou pelo bom volume de visualizações e pelo interesse do público em conhecer a experiência de uma primeira aula de Pilates. Com uma abordagem informativa e acolhedora, a publicação ajudou a esclarecer dúvidas, aproximar novos alunos da modalidade e reduzir possíveis inseguranças. Os compartilhamentos e salvamentos reforçam o valor desse tipo de conteúdo, que combina informação prática, descoberta e incentivo à experimentação.',
    numeros: [
      { v: '12,8 mil', r: 'visualizações' }, { v: '6.018', r: 'alcance' }, { v: '243', r: 'interações' },
      { v: '166', r: 'curtidas' }, { v: '47', r: 'compartilhamentos' }, { v: '25', r: 'salvamentos' },
    ],
  },
];

const Social = () => (
  <>
    <Cabecalho
      kicker="Redes Sociais"
      titulo="Outubro acelerou"
      destaque="o alcance"
      icone={Instagram}
    />

    {/* seguidores */}
    <AnimatedSection variant="scale-up">
      <Papel tom="vermelho" brilho>
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-white/80">Novos seguidores @purepilatesbr</p>
            <p className="font-heading font-black text-7xl sm:text-8xl leading-none mt-2 tabular-nums">
              +<Contador ate={3390} />
            </p>
          </div>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            O Desafio da Semana continua se consolidando como um dos formatos de maior engajamento da Pure Pilates.
            Além dele, as publicações sobre as 500 unidades, o aniversário da Pure e a primeira experiência no Pilates
            estiveram entre os melhores desempenhos do período. Uma estratégia que combina conteúdos de interação com
            publicações institucionais e educativas.
          </p>
        </div>
      </Papel>
    </AnimatedSection>

    {/* TikTok */}
    <AnimatedSection variant="fade-up" delay={60}>
      <Papel>
        <div className="flex items-center gap-2">
          <Music2 className="h-5 w-5" style={{ color: VERMELHO_VIVO }} />
          <p className="font-heading font-black text-xl text-white">TikTok em ritmo de crescimento</p>
        </div>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Numero valor={<Contador ate={11.3} decimais={1} sufixo=" mil" />} rotulo="visualizações no mês" />
          <Numero valor={<Contador ate={6.1} decimais={1} sufixo=" mil" />} rotulo="novos espectadores" />
          <Numero valor={<Contador ate={178} prefixo="+" sufixo="%" />} rotulo="vs. mês anterior" />
          <Numero valor={<Contador ate={48.8} decimais={1} sufixo="%" />} rotulo="das views vêm da busca" />
        </div>
        <p className="text-sm sm:text-base text-white/75 leading-relaxed mt-5 max-w-3xl">
          Em outubro, o perfil da Pure Pilates no TikTok somou 11,3 mil visualizações e alcançou 6,1 mil pessoas que
          nunca tinham visto nosso conteúdo, alta de 178% em relação ao mês anterior. Quase metade das views veio da
          busca: quem pesquisa sobre pilates no TikTok está encontrando a Pure. Na última semana, as visualizações
          cresceram 73%, sinal de que a estratégia de conteúdo está ganhando força.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {TIKTOKS.map((id) => (
            <div key={id} className="relative w-full max-w-[340px] mx-auto overflow-hidden rounded-xl bg-black ring-1 ring-white/10" style={{ height: 580 }}>
              <iframe
                src={tiktokEmbed(id)}
                title="TikTok — Pure Pilates"
                className="absolute inset-0 h-full w-full"
                style={{ border: 0 }}
                loading="lazy"
                allow="encrypted-media"
              />
            </div>
          ))}
        </div>
      </Papel>
    </AnimatedSection>

    {/* destaques */}
    {DESTAQUES.map((d, i) => (
      <AnimatedSection key={d.titulo} variant={i % 2 ? 'fade-left' : 'fade-right'} delay={40}>
        <Papel tom={i % 2 ? 'claro' : 'grafite'}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
            <div className="relative w-full max-w-[340px] mx-auto overflow-hidden rounded-xl bg-white ring-1 ring-white/10" style={{ height: 520 }}>
              <iframe
                src={igEmbed(d.post)}
                title={d.titulo}
                className="absolute inset-0 h-full w-full"
                style={{ border: 0 }}
                loading="lazy"
                scrolling="no"
                allowFullScreen
              />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>Destaque</p>
              <p className="font-heading font-black text-2xl text-white mt-1">{d.titulo}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {d.numeros.map((n) => (
                  <Numero key={n.r} valor={n.v} rotulo={n.r} className="p-3" />
                ))}
              </div>
              <p className="text-sm text-white/75 leading-relaxed mt-4">{d.texto}</p>
            </div>
          </div>
        </Papel>
      </AnimatedSection>
    ))}

    <AnimatedSection variant="fade-up">
      <Papel>
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>UGCs</p>
        <p className="font-heading font-black text-xl text-white mt-1">Criativos UGC aprovados</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {UGCS.map((u) => (
            <div key={u.video} className="relative mx-auto w-full max-w-[300px] aspect-[9/16] overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
              <video
                src={u.video}
                poster={u.capa}
                controls
                playsInline
                preload="none"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </Papel>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   PURE STATION
   ══════════════════════════════════════════════════════════════════════ */
const ONDE_ESTA_A_VENDA = [
  { r: 'Já fez aula e hoje está fora', v: 158_820 },
  { r: 'Agendou e não compareceu', v: 44_685 },
  { r: 'Deixou contato e nunca agendou', v: 23_145 },
];

/** Barra que cresce quando entra na tela. */
const Barra = ({ fracao, cor = VERMELHO }: { fracao: number; cor?: string }) => {
  const { ref, visivel } = useNaTela<HTMLDivElement>(0.4);
  return (
    <div ref={ref} className="h-2.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-[1400ms] ease-out"
        style={{ width: visivel ? `${fracao * 100}%` : '0%', background: cor }}
      />
    </div>
  );
};

const Station = () => (
  <>
    <Cabecalho
      kicker="Pure Station"
      titulo="A plataforma de captação e"
      destaque="relacionamento da rede"
      lead="Sistema próprio da Pure, onde está registrado todo mundo que já passou pela rede e de onde saem as campanhas de inbound marketing, sem custo."
      icone={Database}
    />

    {/* a base */}
    <AnimatedSection variant="fade-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Numero valor={<Contador ate={412480} />} rotulo="pessoas na base" />
        <Numero valor={<Contador ate={20009} />} rotulo="alunos ativos" />
        <Numero valor={<Contador ate={20000} prefixo="~" />} rotulo="entrando por mês" />
        <Numero valor="16 · 44 · 46" rotulo="landing pages · segmentações · automações" />
      </div>
    </AnimatedSection>

    {/* onde está a venda */}
    <AnimatedSection variant="fade-up" delay={60}>
      <Papel tom="claro">
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>Onde está a venda?</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
              De cada 10 pessoas na base, <span style={{ color: VERMELHO_VIVO }}>6</span> já fizeram aula, agendaram ou
              deixaram o contato — e hoje não são alunas.
            </p>
            <p className="text-sm sm:text-base text-white/75 mt-3">É aqui que está a próxima matrícula.</p>
            {/* 10 pessoas, 6 acesas */}
            <div className="flex gap-1.5 mt-5" aria-hidden>
              {Array.from({ length: 10 }).map((_, i) => (
                <AnimatedSection key={i} variant="scale-up" delay={i * 70}>
                  <Users className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: i < 6 ? VERMELHO_VIVO : 'rgba(255,255,255,.22)' }} />
                </AnimatedSection>
              ))}
            </div>
          </div>
          <div>
            <p className="font-heading font-black text-5xl sm:text-6xl text-white leading-none tabular-nums">
              <Contador ate={229523} />
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-white/55 font-semibold mt-2">pessoas já tiveram contato real com a marca</p>
            <div className="mt-5 space-y-4">
              {ONDE_ESTA_A_VENDA.map((l) => (
                <div key={l.r}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-white/85">{l.r}</span>
                    <span className="font-heading font-black text-white tabular-nums">{l.v.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="mt-1.5"><Barra fracao={l.v / ONDE_ESTA_A_VENDA[0].v} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Papel>
    </AnimatedSection>

    {/* academy, a maior dor */}
    <AnimatedSection variant="fade-up" delay={80}>
      <Papel>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" style={{ color: VERMELHO_VIVO }} />
          <p className="font-heading font-black text-xl text-white">Academy — a maior dor da rede</p>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Numero valor={<Contador ate={14648} />} rotulo="pessoas ligadas à formação de professores" />
          <Numero valor={<Contador ate={11145} />} rotulo="com permissão para receber" />
          <Numero valor="19" rotulo="e-mails na régua" />
          <Numero valor="6" rotulo="templates de WhatsApp prontos" />
        </div>
      </Papel>
    </AnimatedSection>

    {/* o que já roda */}
    <AnimatedSection variant="fade-up" delay={60}>
      <Papel tom="claro">
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>O que já roda, sem verba de mídia</p>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Numero valor={<Contador ate={171} />} rotulo="campanhas" />
          <Numero valor={<Contador ate={1.9} decimais={1} sufixo=" mi" />} rotulo="disparos" />
          <Numero valor={<Contador ate={18} sufixo="%" />} rotulo="de abertura" />
          <Numero valor={<Contador ate={95386} />} rotulo="pessoas em automação" />
        </div>
        <p className="font-heading font-black text-lg text-white mt-5">
          Todo esse alcance saiu sem comprar anúncio: falamos com quem já é da casa.
        </p>
      </Papel>
    </AnimatedSection>

    {/* whatsapp x email */}
    <AnimatedSection variant="fade-up" delay={80}>
      <Papel>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" style={{ color: VERMELHO_VIVO }} />
          <p className="font-heading font-black text-xl text-white">WhatsApp, desde maio</p>
        </div>
        <p className="text-sm sm:text-base text-white/75 mt-2 max-w-3xl">
          Canal novo e o mais eficiente que temos: a mensagem é lida por quase metade das pessoas e clicada{' '}
          <strong className="text-white">14 vezes mais</strong> que o e-mail.
        </p>
        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          {[
            { r: 'Leitura', email: 18, wpp: 45, max: 50, fmt: (n: number) => `${n}%` },
            { r: 'Clique', email: 0.5, wpp: 7.2, max: 8, fmt: (n: number) => `${n.toLocaleString('pt-BR')}%` },
          ].map((m) => (
            <div key={m.r} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/55">{m.r}</p>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex justify-between text-sm"><span className="inline-flex items-center gap-1.5 text-white/75"><Mail className="h-3.5 w-3.5" />E-mail</span><span className="font-bold text-white">{m.fmt(m.email)}</span></div>
                  <div className="mt-1.5"><Barra fracao={m.email / m.max} cor="rgba(255,255,255,.45)" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm"><span className="inline-flex items-center gap-1.5 text-white"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</span><span className="font-heading font-black text-white">{m.fmt(m.wpp)}</span></div>
                  <div className="mt-1.5"><Barra fracao={m.wpp / m.max} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Numero valor={<Contador ate={10309} />} rotulo="mensagens enviadas" className="p-3" />
          <Numero valor="25" rotulo="templates aprovados pela Meta" className="p-3" />
          <Numero valor={<Contador ate={393} sufixo=" mil" />} rotulo="telefones na base" className="p-3" />
        </div>
      </Papel>
    </AnimatedSection>

    {/* feita dentro de casa */}
    <AnimatedSection variant="scale-up" delay={80}>
      <Papel tom="vermelho" brilho>
        <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-white/80">Feita dentro de casa</p>
        <p className="font-heading font-black text-2xl sm:text-4xl leading-tight mt-2">
          Desenvolvida pelo time interno, conectada ao Pure System.
        </p>
        <p className="text-sm sm:text-base text-white/90 mt-3 max-w-3xl">
          Não é software alugado: foi construída pela Pure, conversa direto com o Pure System e custa
          infraestrutura, não licença por contato.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          {[
            { i: Zap, t: 'E-mail, WhatsApp, automação, segmentação e CRM num lugar só' },
            { i: ShieldCheck, t: 'Nenhum dado da rede sai de casa' },
            { i: Percent, t: 'Ferramenta de mercado cobra por contato: com 412 mil leads, esse custo não existe aqui' },
            { i: Rocket, t: 'Landing page de campanha no ar no mesmo dia, sem depender de terceiros' },
          ].map(({ i: Icone, t }) => (
            <div key={t} className="flex gap-3 rounded-xl bg-black/25 p-4">
              <Icone className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-snug">{t}</p>
            </div>
          ))}
        </div>
      </Papel>
    </AnimatedSection>

  </>
);

/* ══════════════════════════════════════════════════════════════════════
   PURE STORE — Black Friday, Move e Socks
   ══════════════════════════════════════════════════════════════════════ */

/** O clipe da revista: toca sozinho e mudo, em loop; o botão liga o som. */
const VideoMove = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const [mudo, setMudo] = useState(true);
  return (
    <div className="relative aspect-[4/5] sm:aspect-video overflow-hidden rounded-2xl ring-1 ring-white/15 bg-black">
      <video
        ref={ref}
        src={VIDEO_MOVE}
        poster={posterMove}
        autoPlay
        muted={mudo}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
      <div className="absolute left-5 bottom-4 sm:left-8 sm:bottom-6">
        <p className="text-[11px] uppercase tracking-[0.35em] font-bold text-white/80">Coleção Verão 27</p>
        <p className="font-heading font-black text-5xl sm:text-7xl tracking-[0.08em] text-white leading-none">MOVE</p>
      </div>
      <button
        type="button"
        onClick={() => {
          setMudo((m) => !m);
          ref.current?.play().catch(() => undefined);
        }}
        aria-label={mudo ? 'Ligar o som' : 'Desligar o som'}
        className="absolute right-4 bottom-4 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/85 transition-colors"
      >
        {mudo ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
};

const Store = () => (
  <>
    <Cabecalho
      kicker="Pure Store"
      titulo="Black Friday"
      destaque="Pure Store"
      lead="Uma oportunidade à altura dos seus próximos passos."
      icone={ShoppingBag}
    />

    {/* black friday */}
    <AnimatedSection variant="scale-up">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ background: PRETO }}>
        <div
          className="bf-holofote pointer-events-none absolute -inset-1/4"
          style={{ background: `radial-gradient(35% 45% at 30% 40%, ${VERMELHO}66 0%, transparent 70%)` }}
        />
        <Faixa itens={['35% OFF em todo o site', 'Até 50% OFF em selecionados', 'Black Friday Pure Store']} />
        <div className="relative grid gap-6 p-6 sm:p-10 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="font-heading font-black leading-[0.85] text-white">
              <span className="bf-acende block text-[5.5rem] sm:text-[8rem]">35%</span>
              <span className="block text-2xl sm:text-3xl tracking-[0.3em] mt-1">OFF</span>
            </p>
            <p className="text-sm text-white/75 mt-2">em todo o site</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/15 bg-white/[0.05] p-5">
              <p className="font-heading font-black text-3xl sm:text-4xl text-white">até 50% OFF</p>
              <p className="text-sm text-white/70 mt-1">no total, em produtos selecionados</p>
            </div>
            <a
              href="https://loja.purepilates.com.br/"
              target="_blank"
              rel="noreferrer"
              className="bf-pulso inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.03]"
              style={{ background: VERMELHO }}
            >
              Ir para a loja
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <Papel>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-white/80 max-w-3xl">
          <p>
            Nossa maior campanha promocional do ano chegou, com condições especiais para você planejar suas compras e
            preparar sua unidade para o fim de ano.
          </p>
          <p>
            Um bom momento para ampliar as opções da loja, apostar nos produtos que fazem parte da rotina dos alunos
            e se preparar para a temporada de presentes.
          </p>
          <p>
            E para acompanhar esse movimento, leve a campanha para os canais da sua unidade. Uma boa seleção de
            produtos, apresentada no momento certo, também fortalece o relacionamento com os alunos.
          </p>
          <p className="font-heading font-black text-lg text-white">Black Friday Pure Store. Boas escolhas começam aqui.</p>
        </div>
      </Papel>
    </AnimatedSection>

    {/* move */}
    <AnimatedSection variant="fade-up" delay={60}>
      <div className="space-y-4">
        <VideoMove />
        <Papel tom="claro">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3 text-sm sm:text-base leading-relaxed text-white/80">
              <p className="font-heading font-black text-xl text-white">MOVE: o verão está chegando à Pure Store!</p>
              <p>
                Uma nova coleção, mais de 9 peças e muitas possibilidades para renovar a arara e apresentar novidades
                aos alunos. A coleção MOVE chega para acompanhar diferentes momentos, com peças pensadas para levar o
                universo Pure além das aulas.
              </p>
              <p>
                Para as unidades, é a oportunidade de se planejar, conhecer as novidades e preparar a divulgação com
                antecedência. Nossa sugestão: comece a despertar a curiosidade dos alunos com teasers nos stories e
                compartilhe a chegada da coleção. Assim, quando as peças estiverem disponíveis, eles já terão começado
                a conhecer a novidade.
              </p>
              <p className="font-heading font-black text-white">MOVE. O verão ganha um novo ritmo.</p>
            </div>
            <div className="rounded-2xl p-6 text-center self-start" style={{ background: VERMELHO }}>
              <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-white/85">Anote a data</p>
              <p className="font-heading font-black text-6xl text-white leading-none mt-2">05/11</p>
              <p className="font-heading font-bold text-white mt-2">começa a pré-venda</p>
              <p className="text-xs text-white/85 mt-3">Entrega dos itens em até 30 dias.</p>
            </div>
          </div>
        </Papel>
      </div>
    </AnimatedSection>

    {/* socks */}
    <AnimatedSection variant="fade-up" delay={60}>
      <Papel>
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: VERMELHO_VIVO }}>Pré-venda · Pure Socks</p>
        <p className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">As favoritas da rede estão de cara nova!</p>
        <p className="text-sm sm:text-base text-white/80 leading-relaxed mt-3 max-w-3xl">
          A coleção Pure Socks está chegando com mais de 8 modelos para ampliar as opções de uma das categorias de
          maior destaque nas vendas das unidades Pure Pilates. Entre os sucessos que os alunos já conhecem e as
          novidades natalinas, a coleção reúne:
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['Meias com e sem antiderrapante', 'Sapatilhas', 'Cano médio e cano longo', 'Opções para presentear no fim de ano'].map((t, i) => (
            <AnimatedSection key={t} variant="fade-up" delay={i * 80}>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 h-full text-sm font-semibold text-white">{t}</div>
            </AnimatedSection>
          ))}
        </div>
        <p className="text-sm sm:text-base text-white/80 leading-relaxed mt-4 max-w-3xl">
          Para sua unidade, a oportunidade está em dar visibilidade ao que já tem potencial de venda. Apresente os
          modelos nos stories, mostre os detalhes, crie sugestões de presentes e mantenha as meias em evidência na
          recepção e na arara. Pequenas ações de marketing orgânico ajudam a aproximar os produtos dos alunos e
          estimular novas compras.
        </p>
        <p className="font-heading font-black text-white mt-4">Mais opções, mais possibilidades e novidades para fechar o ano com a cara da Pure!</p>
      </Papel>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   PURE ACADEMY
   ══════════════════════════════════════════════════════════════════════ */
const Academy = () => (
  <>
    <Cabecalho
      kicker="Pure Academy"
      titulo="Mais instrutores qualificados."
      destaque="Mais valor para o seu studio."
      lead="A Pure Pilates Academy lançou uma formação online para profissionais de Educação Física e Fisioterapia que desejam se preparar para atuar com Pilates."
      icone={GraduationCap}
    />

    <AnimatedSection variant="fade-up">
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { i: Monitor, t: '100% online', d: 'Flexibilidade para estudar' },
          { i: BookOpen, t: 'Teoria e prática', d: 'Solo e principais aparelhos' },
          { i: Users, t: 'Capacitação', d: 'Desenvolvimento da equipe' },
        ].map(({ i: Icone, t, d }) => (
          <Papel key={t} className="p-5 sm:p-6">
            <Icone className="h-6 w-6" style={{ color: VERMELHO_VIVO }} />
            <p className="font-heading font-black text-lg text-white uppercase mt-3">{t}</p>
            <p className="text-sm text-white/70 mt-1">{d}</p>
          </Papel>
        ))}
      </div>
    </AnimatedSection>

    <AnimatedSection variant="scale-up" delay={60}>
      <Papel tom="vermelho" brilho>
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <p className="font-heading font-black text-6xl sm:text-7xl leading-none">50% OFF</p>
          <div>
            <p className="font-heading font-black text-xl">Condição especial de lançamento</p>
            <p className="text-sm text-white/90 mt-1">Desconto aplicado diretamente no checkout.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <a
            href="https://purestation.purepilates.com.br/curso-de-formacao-pilates"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
          >
            Página do curso <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://hotmart.com/pt-br/marketplace/produtos/curso-de-formacao-em-pilates/M107200821L"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/60 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Inscrição <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </Papel>
    </AnimatedSection>

  </>
);

/* ══════════════════════════════════════════════════════════════════════
   PÁGINA
   ══════════════════════════════════════════════════════════════════════ */
const MonthLanding_2026_11 = () => {
  const [abaAtiva, setAbaAtiva] = useState<TabKey>('capa');
  const abasRef = useRef<HTMLDivElement>(null);
  const [podeEsquerda, setPodeEsquerda] = useState(false);
  const [podeDireita, setPodeDireita] = useState(false);

  const medirAbas = () => {
    const el = abasRef.current;
    if (!el) return;
    setPodeEsquerda(el.scrollLeft > 8);
    setPodeDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    medirAbas();
    const el = abasRef.current;
    el?.addEventListener('scroll', medirAbas, { passive: true });
    window.addEventListener('resize', medirAbas);
    return () => {
      el?.removeEventListener('scroll', medirAbas);
      window.removeEventListener('resize', medirAbas);
    };
  }, []);

  const rolar = (dir: 'left' | 'right') => {
    abasRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const irPara = (t: TabKey) => {
    setAbaAtiva(t);
    abasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderSecao = () => {
    switch (abaAtiva) {
      case 'capa': return <Capa irPara={irPara} />;
      case 'novela': return <Novela />;
      case 'brandformance': return <Brandformance />;
      case 'resultados': return <Resultados />;
      case 'social': return <Social />;
      case 'station': return <Station />;
      case 'store': return <Store />;
      case 'academy': return <Academy />;
    }
  };

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 overflow-hidden" style={{ background: PRETO }}>
      <style>{estilosBlack}</style>

      <div className="relative z-10 mx-auto max-w-5xl space-y-10">
        {/* abas */}
        <div className="relative">
          <div
            ref={abasRef}
            className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAbaAtiva(tab.key)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all border shrink-0',
                  abaAtiva === tab.key
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white/[0.06] text-white/75 border-white/15 hover:bg-white/[0.14] hover:text-white',
                )}
                style={abaAtiva === tab.key ? { background: VERMELHO } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            className={cn(
              'pointer-events-none absolute left-0 top-0 bottom-2 w-16 flex items-center transition-opacity duration-200',
              podeEsquerda ? 'opacity-100' : 'opacity-0',
            )}
            style={{ background: `linear-gradient(90deg, ${PRETO}, ${PRETO}d9, transparent)` }}
          >
            <button
              type="button"
              onClick={() => rolar('left')}
              aria-label="Ver abas anteriores"
              className="pointer-events-auto rounded-full bg-white/10 text-white shadow-md border border-white/15 p-1.5 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div
            className={cn(
              'pointer-events-none absolute right-0 top-0 bottom-2 w-16 flex items-center justify-end transition-opacity duration-200',
              podeDireita ? 'opacity-100' : 'opacity-0',
            )}
            style={{ background: `linear-gradient(270deg, ${PRETO}, ${PRETO}d9, transparent)` }}
          >
            <button
              type="button"
              onClick={() => rolar('right')}
              aria-label="Ver mais abas"
              className="pointer-events-auto rounded-full text-white shadow-md p-1.5 transition-colors animate-pulse"
              style={{ background: VERMELHO, animationDuration: '2.5s' }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div key={abaAtiva} className="space-y-16">{renderSecao()}</div>
      </div>
    </div>
  );
};

export default MonthLanding_2026_11;

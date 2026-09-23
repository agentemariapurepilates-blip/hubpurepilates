import { useState, useEffect, useRef, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AnimatedSection from './AnimatedSection';
import { cn } from '@/lib/utils';
import {
  ArrowRight, ChevronLeft, ChevronRight, Clapperboard, Play, Sparkles, Users, TrendingUp,
  Target, Megaphone, GraduationCap, ShoppingBag, Calendar, MapPin, Instagram, Music2,
  Wand2, Film, Heart, Tag, Truck, Lightbulb,
} from 'lucide-react';
import logoPure from '@/assets/logo-pure-pilates.png';
import reportAporte from '@/assets/out26-report-aporte.png';

/* ══════════════════════════════════════════════════════════════════════════
   TIMELINE Nº 10 · OUTUBRO 2026
   Edição de Halloween — noite, teia de aranha e o laranja que puxa para a
   Black Friday, sobre a mesma diagramação de revista da edição de setembro.
   Conteúdo do Canva "Timeline - OUT 2026".
   ══════════════════════════════════════════════════════════════════════════ */

type TabKey =
  | 'capa'
  | 'novela'
  | 'resultados'
  | 'social'
  | 'criativos'
  | 'academy'
  | 'store';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'capa', label: 'Capa' },
  { key: 'novela', label: '★ Os Segredos de Pilar' },
  { key: 'resultados', label: 'Resultados' },
  { key: 'social', label: 'Redes Sociais' },
  { key: 'criativos', label: 'Criativos & Conteúdo' },
  { key: 'academy', label: 'Pure Academy' },
  { key: 'store', label: 'Pure Store' },
];

/* ── paleta da edição ────────────────────────────────────────────────── */
const NOITE = '#160f1d';        // fundo noturno
const NOITE_CLARA = '#241733';  // cartão escuro
const DOURADO = '#DB9828';      // dourado da marca (brand book)
const TEIA = 'rgba(255,255,255,0.16)';

const TEASER_NOVELA = 'agMCwjc2etM';

/* ── posts do mês (embeds) ───────────────────────────────────────────── */
const IG_LEO_YOUNG = 'DczPOkJJBzu';
const IG_DESAFIO = 'DdOsxDxB-BL';
const TIKTOK_DESTAQUE = '7621613857274285332';
const igEmbed = (codigo: string) => `https://www.instagram.com/p/${codigo}/embed`;
const igPost = (codigo: string) => `https://www.instagram.com/p/${codigo}/`;
const tiktokEmbed = (id: string) => `https://www.tiktok.com/embed/v2/${id}`;
const tiktokPost = (id: string) => `https://www.tiktok.com/@purepilatesbr/video/${id}`;

/**
 * Prévia da Coleção Verão 27 (MOVE). Fotos na pasta do Drive, compartilhada por link.
 * O cinza claro FICA DE FORA: a cor ainda não foi aprovada (pedido de 23/09/2026).
 */
const FOTOS_MOVE = [
  { id: '1w33w9MHeUTjnS4zkOtak2F3ZqVH0KpEO', cor: 'vinho' },
  { id: '1Psdji-RpExmJ0EFjgQAOIpVtU75jpGIm', cor: 'bege' },
  { id: '1wrzvGS5BzO5cU1sdVcVSDBCppmSjNyT2', cor: 'lilás' },
  { id: '11Fb6uM1y9NlX2GV4yxpQki3-DkAdRanr', cor: 'marrom' },
  { id: '1rW3AAZRsFCg_EvVMFCc_sxf27jPWUYiu', cor: 'vinho' },
  { id: '112TpnLFOUrfBKW39-F3nhjjtTziM3qSI', cor: 'bege' },
  { id: '1dspFWWWFdMhHbHe-8swuVIl9827YYDzU', cor: 'lilás' },
  { id: '1col2Gp09f3DTqNLpjhoDdWnKvgHAVyd9', cor: 'marrom' },
];
const fotoDoDrive = (id: string) => `https://drive.google.com/thumbnail?id=${id}&sz=w800`;

/**
 * Vídeos UGC de outubro: três criadoras, cada uma nos três formatos.
 * Ficam no Drive (pasta 1d7v9gtSc0M0JwyB1bvrEzx6b7zlTwTyJ) e tocam embedados:
 * ninguém sai da timeline para assistir (pedido do usuário em 23/09/2026).
 */
const UGC = [
  {
    nome: 'Ana Monteiro',
    feed: '1h7y_LnhnVdqEyl89-PCfGQdfbJcNCxjo',
    quadrado: '1smVq-mjluOBs4dvWacGsnRtYV9QQgKUo',
    vertical: '1CUxgpZN7JigjGjyAf7aM_B9d0eBiNaXQ',
  },
  {
    nome: 'Carol Lellis',
    feed: '1WPUeBKhCC2PEsN5UYRcPaK3bSrH7Mn0R',
    quadrado: '1jDTMgVgp4wxKtY0yXQA6CZeRRBWbvF_8',
    vertical: '1WPFhFubvw4VLNPu89-iPNeIoR-P51lB6',
  },
  {
    nome: 'Krizia Terto',
    feed: '1d8MIBsGEFvQbBxgAyfueKgcropZkQffL',
    quadrado: '1rKQZ_tOY4QkBCzBDQ48m-YPgntLokrQa',
    vertical: '1L85BVFzEKt-kREJ2epOjQ_ol4sp_aOl3',
  },
];
const driveEmbed = (id: string) => `https://drive.google.com/file/d/${id}/preview`;


const SUMARIO: { key: TabKey; titulo: string; desc: string }[] = [
  { key: 'novela', titulo: 'Os Segredos de Pilar', desc: 'A novela de vendas da rede estreou — e é para todos.' },
  { key: 'resultados', titulo: 'Resultados', desc: 'Performance parcial até 20/09, campanhas de aporte e Pure Match.' },
  { key: 'social', titulo: 'Redes Sociais', desc: '3.060 novos seguidores, os destaques do mês e o TikTok.' },
  { key: 'criativos', titulo: 'Criativos & Conteúdo', desc: 'Os vídeos UGC, a IA da Meta e o conteúdo da sua unidade.' },
  { key: 'academy', titulo: 'Pure Academy', desc: 'Formação 100% online e o Workshop de Gestante em novembro.' },
  { key: 'store', titulo: 'Pure Store', desc: 'Ainda dá tempo no Mês do Franqueado, e vem aí a Coleção Verão 27.' },
];

/* ── teia de aranha (canto) ──────────────────────────────────────────── */
const Teia = ({
  className,
  tamanho = 220,
  cor = TEIA,
  espelhada = false,
}: { className?: string; tamanho?: number; cor?: string; espelhada?: boolean }) => (
  <svg
    width={tamanho}
    height={tamanho}
    viewBox="0 0 200 200"
    fill="none"
    aria-hidden="true"
    className={cn('pointer-events-none select-none', className)}
    style={espelhada ? { transform: 'scaleX(-1)' } : undefined}
  >
    {/* fios que saem do canto */}
    {[0, 15, 30, 45, 60, 75, 90].map((g) => (
      <line
        key={g}
        x1="0"
        y1="0"
        x2={200 * Math.cos((g * Math.PI) / 180)}
        y2={200 * Math.sin((g * Math.PI) / 180)}
        stroke={cor}
        strokeWidth="1.1"
      />
    ))}
    {/* arcos entre os fios */}
    {[38, 76, 114, 152, 190].map((r) => (
      <path
        key={r}
        d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`}
        stroke={cor}
        strokeWidth="1.1"
        fill="none"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
    ))}
  </svg>
);

/* ── aranha pendurada no fio ─────────────────────────────────────────── */
const Aranha = ({ className, fio = 54 }: { className?: string; fio?: number }) => (
  <svg width="34" data-aranha="pendurada" height={fio + 30} viewBox={`0 0 34 ${fio + 30}`} fill="none" aria-hidden="true" className={cn('pointer-events-none out26-balanca', className)}>
    <line x1="17" y1="0" x2="17" y2={fio} stroke={TEIA} strokeWidth="1.2" />
    <g transform={`translate(17 ${fio + 12})`} stroke={DOURADO} strokeWidth="1.4" strokeLinecap="round">
      <path d="M-4-3 -12-9M-5 0-14-2M-4 3-12 8M4-3 12-9M5 0 14-2M4 3 12 8" />
    </g>
    <ellipse cx="17" cy={fio + 12} rx="6.5" ry="8" fill={NOITE_CLARA} stroke={DOURADO} strokeWidth="1.2" />
    <circle cx="14.6" cy={fio + 8} r="1.1" fill={DOURADO} />
    <circle cx="19.4" cy={fio + 8} r="1.1" fill={DOURADO} />
  </svg>
);

/* ── morceguinhos ────────────────────────────────────────────────────── */
const Morcego = ({ className, tamanho = 26, cor = TEIA }: { className?: string; tamanho?: number; cor?: string }) => (
  <svg width={tamanho} height={tamanho * 0.5} viewBox="0 0 40 20" fill={cor} aria-hidden="true" className={cn('pointer-events-none', className)}>
    <path d="M20 4c1.6 0 2.6 1.2 3 2.6 1.4-2 3.4-3.4 6-4-1 1.6-1.2 3-.8 4.4 2-1.4 4.4-2 7-1.8-2.6 1.4-4.4 3.4-5.2 6-1.8-.6-3.6-.4-5.2.6-1.4.8-2.4 2-2.8 3.4-.4-1.4-1.4-2.6-2.8-3.4-1.6-1-3.4-1.2-5.2-.6-.8-2.6-2.6-4.6-5.2-6 2.6-.2 5 .4 7 1.8.4-1.4.2-2.8-.8-4.4 2.6.6 4.6 2 6 4 .4-1.4 1.4-2.6 3-2.6Z" />
  </svg>
);

/* ── abóbora (no dourado da marca, não no laranja) ───────────────────── */
const Abobora = ({
  className, tamanho = 46, cor = DOURADO, cara = true,
}: { className?: string; tamanho?: number; cor?: string; cara?: boolean }) => (
  <svg
    width={tamanho}
    height={tamanho}
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    className={cn('pointer-events-none select-none', className)}
  >
    {/* cabinho e folha */}
    <path d="M32 16c0-4 1-7 3-9" stroke={cor} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M35 9c4-2 7-1 8 1-3 2-6 2-8-1Z" fill={cor} opacity="0.85" />
    {/* gomos */}
    <ellipse cx="32" cy="38" rx="21" ry="17" fill={cor} opacity="0.22" />
    <ellipse cx="32" cy="38" rx="21" ry="17" stroke={cor} strokeWidth="2" />
    <path d="M32 21v34M20 23c-3 5-3 25 0 30M44 23c3 5 3 25 0 30" stroke={cor} strokeWidth="1.6" opacity="0.75" />
    {cara && (
      <g fill={cor}>
        <path d="M24 33l5 5-8 1 3-6Z" />
        <path d="M40 33l-5 5 8 1-3-6Z" />
        <path d="M22 45c4 4 16 4 20 0-2 3-5 5-10 5s-8-2-10-5Z" />
      </g>
    )}
  </svg>
);

/** Camada de enfeites atrás de tudo: teias nos cantos, abóboras e morcegos. */
const FundoHalloween = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    {/* luar */}
    <div
      className="absolute -top-24 right-[8%] h-72 w-72 rounded-full blur-3xl"
      style={{ background: `${DOURADO}22` }}
    />

    {/* teias grandes nos quatro cantos */}
    <Teia className="absolute -left-10 -top-10 opacity-60" tamanho={420} cor="rgba(255,255,255,0.22)" />
    <Teia className="absolute -right-10 -top-10 opacity-45" tamanho={360} cor="rgba(255,255,255,0.18)" espelhada />
    <Teia className="absolute -left-12 bottom-[12%] opacity-35" tamanho={300} cor="rgba(255,255,255,0.16)" />
    <Teia className="absolute -right-12 bottom-0 opacity-40" tamanho={340} cor="rgba(255,255,255,0.18)" espelhada />
    <Teia className="absolute left-1/2 top-[38%] -translate-x-1/2 opacity-20" tamanho={260} cor="rgba(255,255,255,0.12)" />

    {/* abóboras espalhadas */}
    <Abobora className="absolute left-[4%] top-[28%] opacity-25" tamanho={70} />
    <Abobora className="absolute right-[5%] top-[46%] opacity-20" tamanho={54} cara={false} />
    <Abobora className="absolute left-[8%] bottom-[6%] opacity-25" tamanho={62} />
    <Abobora className="absolute right-[10%] bottom-[22%] opacity-15" tamanho={46} cara={false} />

    {/* morcegos */}
    <Morcego className="absolute left-[24%] top-[12%] opacity-40" tamanho={34} />
    <Morcego className="absolute right-[28%] top-[24%] opacity-30" tamanho={24} />
    <Morcego className="absolute left-[40%] bottom-[16%] opacity-25" tamanho={28} />

    {/* aranhas penduradas na borda de cima */}
    <Aranha className="absolute left-[12%] top-0" fio={90} />
    <Aranha className="absolute right-[18%] top-0" fio={140} />
  </div>
);

/* ── animações da edição (aranha andando, fio balançando) ────────────── */
const estilosHalloween = `
@keyframes out26-caminhada { from { transform: translateX(-14vw); } to { transform: translateX(114vw); } }
@keyframes out26-pernas { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes out26-balanca { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(16px); } }
.out26-anda { animation-name: out26-caminhada; animation-timing-function: linear; animation-iteration-count: infinite; }
.out26-pernas { animation: out26-pernas 0.5s ease-in-out infinite; transform-origin: 20px 21px; }
.out26-balanca { animation: out26-balanca 5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .out26-anda, .out26-pernas, .out26-balanca { animation: none !important; }
}
`;

/** Aranha que atravessa a página andando, mexendo as perninhas. */
const AranhaAndando = ({
  topo, duracao, atraso = 0, tamanho = 26, opacidade = 0.55,
}: { topo: string; duracao: number; atraso?: number; tamanho?: number; opacidade?: number }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute left-0 z-0 out26-anda"
    style={{ top: topo, animationDuration: `${duracao}s`, animationDelay: `${atraso}s`, opacity: opacidade }}
  >
    <svg width={tamanho} height={tamanho} viewBox="0 0 40 40" fill="none">
      <g className="out26-pernas" stroke={DOURADO} strokeWidth="1.6" strokeLinecap="round">
        <path d="M14 18 4 10M13 21 2 20M14 24 5 31M26 18 36 10M27 21 38 20M26 24 35 31" />
      </g>
      <ellipse cx="20" cy="21" rx="7" ry="8.5" fill={NOITE_CLARA} stroke={DOURADO} strokeWidth="1.3" />
      <circle cx="17.6" cy="17.4" r="1.2" fill={DOURADO} />
      <circle cx="22.4" cy="17.4" r="1.2" fill={DOURADO} />
    </svg>
  </div>
);

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

/* ── cabeçalho de seção ──────────────────────────────────────────────── */
const Cabecalho = ({
  kicker, titulo, destaque, lead, icone: Icone,
}: { kicker: string; titulo: string; destaque?: string; lead?: string; icone?: React.ElementType }) => (
  <AnimatedSection variant="fade-up">
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        {Icone && <Icone className="h-4 w-4 text-primary shrink-0" />}
        <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">{kicker}</span>
        <span className="h-px flex-1 max-w-[140px]" style={{ background: `${DOURADO}66` }} />
      </div>
      <h2 className="font-heading font-black text-4xl sm:text-6xl text-white leading-[0.95] tracking-tight">
        {titulo}
        {destaque && <> <span className="text-primary">{destaque}</span></>}
      </h2>
      {lead && <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed">{lead}</p>}
    </div>
  </AnimatedSection>
);

/* ── cartão da edição (tudo escuro; é uma edição noturna) ────────────── */
const Papel = ({
  children, className, tom = 'branco', teia = true,
}: { children: ReactNode; className?: string; tom?: 'branco' | 'areia' | 'noite'; teia?: boolean }) => {
  // Os nomes vêm da edição de setembro; aqui todos são tons de noite.
  const fundos = { branco: '#1d1526', areia: '#2a1b33', noite: '#120c18' };
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 text-white p-6 sm:p-8',
        'shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]',
        className,
      )}
      style={{ background: fundos[tom] }}
    >
      {teia && <Teia className="absolute -right-6 -top-6 opacity-45" tamanho={190} cor="rgba(255,255,255,0.22)" espelhada />}
      <div className="relative">{children}</div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   CAPA — masthead, capa tipográfica, carta e sumário
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
                TIMELINE<span className="text-primary">.</span>
              </p>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-white/50 font-semibold mt-1">
                Pure Pilates
              </p>
            </div>
          </div>
          <div className="text-right leading-tight shrink-0">
            <p className="font-heading font-black text-primary text-lg sm:text-2xl leading-none">Nº 10</p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-white/50 font-semibold mt-1">
              Outubro 2026
            </p>
          </div>
        </div>
        <div className="border-t-2 border-white/80 pt-[3px]">
          <div className="border-t border-white/25" />
        </div>
        <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.28em] font-semibold" style={{ color: DOURADO }}>
          Edição de Halloween · Departamento de Marketing
        </p>
      </div>
    </AnimatedSection>

    {/* ═══ CAPA: a novela é a manchete ═══ */}
    <AnimatedSection variant="fade-in" delay={80}>
      <div
        className="relative overflow-hidden rounded-sm ring-1 ring-white/10"
        style={{ background: `radial-gradient(120% 90% at 75% 0%, ${NOITE_CLARA} 0%, ${NOITE} 62%)` }}
      >
        <Teia className="absolute -left-4 -top-4 opacity-90" tamanho={260} />
        <Teia className="absolute -right-4 -bottom-6 opacity-60" tamanho={210} espelhada />
        <Aranha className="absolute left-[16%] top-0" fio={64} />
        <Morcego className="absolute right-[12%] top-[10%] opacity-55" tamanho={30} />
        <Morcego className="absolute right-[24%] top-[20%] opacity-35" tamanho={20} />

        <div className="relative grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-10 px-6 sm:px-10 lg:px-12 py-12 sm:py-16 items-center">
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white"
              style={{ background: DOURADO }}
            >
              <Clapperboard className="h-3 w-3" />
              Estreia da rede
            </span>

            <h2 className="font-heading font-black text-white leading-[0.85] tracking-tighter mt-5 text-[2.9rem] sm:text-[4.6rem] lg:text-[5.4rem]">
              Os Segredos
              <br />
              de <span style={{ color: DOURADO }}>Pilar</span>
            </h2>

            <p className="font-heading font-black text-lg sm:text-2xl text-white/90 leading-tight mt-4">
              A novela de vendas da rede.
            </p>

            <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-4 max-w-xl">
              Foi o que preparamos em segredo ao longo de vários meses: um treinamento de vendas em formato de
              novela, feito a partir das práticas dos estúdios que mais encantam e convertem. Episódios curtos,
              com história, sobre os erros que fazem o aluno fechar com o concorrente — e como virar o jogo.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-7">
              <button
                type="button"
                onClick={() => irPara('novela')}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: DOURADO }}
              >
                <Play className="h-4 w-4 fill-current" />
                Ver o trailer
              </button>
              <Link
                to="/segredos-de-pilar"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Abrir a série no Hub
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/45 mt-5">
              O trailer já está no ar · episódios liberados aos poucos
            </p>
          </div>

          <div className="relative w-full aspect-video overflow-hidden rounded-xl ring-1 ring-white/15 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.8)]">
            <iframe
              src={`https://www.youtube.com/embed/${TEASER_NOVELA}?rel=0&modestbranding=1&playsinline=1`}
              title="Trailer — Os Segredos de Pilar"
              className="absolute inset-0 w-full h-full block"
              style={{ border: 0 }}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-white/15 mt-3 pt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/50 font-semibold">
        <span>Capa · <span className="text-primary">Os Segredos de Pilar</span></span>
        <span>Outubro sem sustos</span>
        <span className="hidden sm:inline">Balanço de setembro</span>
      </div>
    </AnimatedSection>

    {/* ═══ CARTA AO FRANQUEADO ═══ */}
    <AnimatedSection variant="fade-up" delay={120}>
      <Papel tom="areia" className="relative">
        <Teia className="absolute -right-6 -top-6 opacity-30" tamanho={170} cor="rgba(0,0,0,0.12)" espelhada />
        <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">Carta ao franqueado</p>
        <div className="mt-4 space-y-4 text-sm sm:text-base leading-relaxed text-white/80 max-w-3xl">
          <p>
            Setembro passou num piscar de olhos, cheio de novidades e com muitos projetos em andamento.
            Celebramos nossas <strong className="text-white">17 primaveras</strong>, conquistamos novos
            territórios, recebemos prêmios e alcançamos resultados que nos enchem de orgulho.
          </p>
          <p>
            Esse também foi um período de muitas reflexões. Falamos sobre a sustentabilidade do negócio,
            criação de comunicações diferentes com os franqueados, sobre como reforçar o que temos de melhor e
            fortalecer a nossa base para este crescimento acelerado em um mercado tão pulsante!
          </p>
          <p>
            Essas conversas deram origem a um movimento importante de estruturação de treinamentos, processos e
            até de estruturas. Por isso, peço que cada um de vocês reserve um tempo para conhecer o que
            preparamos <strong className="text-white">em segredo ao longo de vários meses</strong>.
          </p>
          <p>
            É um conteúdo feito para orientar todos os gestores com as melhores práticas dos estúdios que mais
            performam no encantamento e conversão de clientes. Um formato totalmente diferente, porque sabemos
            que o tempo é curto para tudo o que está por vir.
          </p>
          <p>
            A série <strong className="text-white">Segredos de Pilar</strong> é para todos. Ela reforça o
            nosso compromisso de entregar sempre inovação, reconhecendo que ainda temos muito a crescer e a
            aprender uns com os outros.
          </p>
          <p className="font-heading font-black text-xl sm:text-2xl text-primary">Enjoy it!</p>
        </div>
      </Papel>
    </AnimatedSection>

    {/* ═══ SUMÁRIO ═══ */}
    <AnimatedSection variant="fade-up" delay={160}>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">Nesta edição</span>
          <span className="h-px flex-1" style={{ background: `${DOURADO}55` }} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SUMARIO.map((item, i) => (
            <button
              key={item.key}
              type="button"
              onClick={() => irPara(item.key)}
              className="group text-left rounded-xl border border-white/10 bg-white/[0.06] p-4 transition-colors hover:border-primary/40 hover:bg-white/[0.12]"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
                {String(i + 1).padStart(2, '0')}
              </p>
              <p className="font-heading font-bold text-base text-white mt-1.5 flex items-center gap-1.5">
                {item.titulo}
                <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </p>
              <p className="text-xs text-white/60 leading-snug mt-1">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   OS SEGREDOS DE PILAR
   ══════════════════════════════════════════════════════════════════════ */
const Novela = () => (
  <>
    <Cabecalho
      kicker="Estreia"
      titulo="Os Segredos de"
      destaque="Pilar"
      lead="Treinamento de vendas em formato de novela. Episódios curtos, com história, que mostram os maiores erros na hora de vender — e por que tanto aluno acaba fechando com o estúdio concorrente em vez do nosso."
      icone={Clapperboard}
    />

    <AnimatedSection variant="fade-up">
      <div className="relative overflow-hidden rounded-2xl" style={{ background: NOITE }}>
        <Teia className="absolute -left-3 -top-3 opacity-80" tamanho={190} />
        <Teia className="absolute -right-3 -bottom-3 opacity-50" tamanho={150} espelhada />

        <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-8 p-6 sm:p-9 items-center">
          <div className="relative w-full aspect-video overflow-hidden rounded-xl ring-1 ring-white/15 shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${TEASER_NOVELA}?rel=0&modestbranding=1&playsinline=1`}
              title="Trailer — Os Segredos de Pilar"
              className="absolute inset-0 w-full h-full block"
              style={{ border: 0 }}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="text-white">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: DOURADO }}>
              Trailer
            </p>
            <p className="font-heading font-black text-2xl sm:text-3xl leading-tight mt-2">
              O trailer já está no ar.
            </p>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3">
              A série nasceu de uma pergunta simples: por que o aluno entra no estúdio, faz a aula
              experimental, elogia tudo — e some? Cada episódio mostra um erro que a gente comete sem
              perceber no atendimento, e o que fazer no lugar.
            </p>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3">
              Os episódios são liberados aos poucos, um a um, direto na aba da série aqui no Hub.
            </p>

            <Link
              to="/segredos-de-pilar"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold mt-6 text-white transition-opacity hover:opacity-90"
              style={{ background: DOURADO }}
            >
              <Play className="h-4 w-4 fill-current" />
              Abrir a série no Hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={80}>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icone: Target,
            titulo: 'O que você vai ver',
            texto: 'Os erros mais comuns da venda: a resposta automática, o preço solto, a conversa que não vira agendamento.',
          },
          {
            icone: Users,
            titulo: 'Para quem é',
            texto: 'Para todos. Foi feita a partir das práticas dos estúdios que mais convertem e encantam na rede.',
          },
          {
            icone: Sparkles,
            titulo: 'Como assistir',
            texto: 'No menu lateral do Hub, em "Os segredos de Pilar". Cada episódio novo aparece lá, sem procurar em pasta nenhuma.',
          },
        ].map((c) => (
          <Papel key={c.titulo}>
            <c.icone className="h-5 w-5 text-primary" />
            <p className="font-heading font-bold text-base text-white mt-3">{c.titulo}</p>
            <p className="text-sm text-white/70 leading-snug mt-1.5">{c.texto}</p>
          </Papel>
        ))}
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   RESULTADOS
   ══════════════════════════════════════════════════════════════════════ */
const LinhaPerformance = ({
  rotulo, agosto, setembro, variacao, alerta,
}: { rotulo: string; agosto: number; setembro: number; variacao?: string; alerta?: boolean }) => (
  <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-3 border-b border-white/10 py-3.5 last:border-b-0">
    <p className="text-sm sm:text-base font-medium text-white">{rotulo}</p>
    <p className="text-sm sm:text-base tabular-nums text-white/55 text-right">
      <Contador ate={agosto} />
    </p>
    <p className="text-right">
      <Contador ate={setembro} className="font-heading font-black text-lg sm:text-xl text-white tabular-nums" />
      {variacao && (
        <span className={cn('block text-[11px] font-semibold', alerta ? 'text-primary' : 'text-emerald-600')}>
          {variacao}
        </span>
      )}
    </p>
  </div>
);

const Resultados = () => (
  <>
    <Cabecalho
      kicker="Performance"
      titulo="Resultado parcial"
      destaque="até 20/09"
      icone={TrendingUp}
    />

    <AnimatedSection variant="fade-up">
      <Papel>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 pb-2 border-b-2 border-white/70 text-[10px] uppercase tracking-[0.18em] font-bold text-white/50">
          <span>Indicador</span>
          <span className="text-right">Agosto</span>
          <span className="text-right">Setembro</span>
        </div>
        <LinhaPerformance rotulo="Aula experimental" agosto={9965} setembro={6681} variacao="-6,4% vs meta" alerta />
        <LinhaPerformance rotulo="Presença na aula experimental" agosto={7309} setembro={5157} variacao="+4,4% vs meta" />
        <LinhaPerformance rotulo="Matrículas" agosto={1720} setembro={1244} variacao="-10,3% vs meta" alerta />
        <LinhaPerformance rotulo="PurePass" agosto={89} setembro={44} />

        <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-6 max-w-3xl">
          O mês de agosto esta com grande destaque para crescimento de presença. O fator que a rede precisa ter
          atenção é sobre a conversão destes leads visto que temos deficit de mais de 6%. Já o topo de funil (o
          volume de aula experimental) esta em linha com a meta e em termos de custos de aquisição já com
          valores menores versus mês anterior.
        </p>
        <p className="text-[11px] leading-relaxed text-white/50 mt-5">
          *os valores percentuais em parenteses correspondem a meta do painel de controle de performance. Estes
          valores são estabelecidos para crescimento e otimizações das campanhas da rede entre marketing e
          prestadores de serviço. São parâmetros acompanhados internamente prezando pelo bom desempenho das
          campanhas.
        </p>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <Papel tom="areia">
        <div className="flex items-center gap-3 mb-3">
          <Megaphone className="h-4 w-4 text-primary" />
          <p className="text-[11px] uppercase tracking-[0.28em] font-bold text-primary">Campanhas de aporte</p>
        </div>
        <p className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
          <Contador ate={32} /> unidades com campanha dedicada
        </p>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-3xl">
          Considerando as franquias que estão com campanhas dedicadas para crescimento de aula experimental em
          32 unidades da rede. Este investimento dedicado para formatos em META e todo o tráfego é exclusivo
          para a unidade. Dentro do hubpurepilates.com.br o franqueado consegue ter (1) Conteúdo explicativo
          (2) Formulário para adesão da mídia adicional e (3) Report único sobre o valor real das campanhas
          incrementais na sua região de atuação. Abaixo um print das informações apresentadas:
        </p>

        <img
          src={reportAporte}
          alt="Report de aporte no Hub: visão geral dos últimos 30 dias com aulas experimentais agendadas, custo por aula, gasto, alcance, impressões, cliques, CPM, CPC e o gráfico de desempenho diário."
          loading="lazy"
          className="w-full rounded-xl border border-white/10 mt-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]"
        />

        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {[
            { rotulo: 'Leads', agosto: 240, setembro: 274 },
            { rotulo: 'Unidades ativas', agosto: 8, setembro: 12 },
          ].map((c) => (
            <div key={c.rotulo} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/45">{c.rotulo}</p>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-sm text-white/50 tabular-nums">
                  ago <Contador ate={c.agosto} />
                </span>
                <ArrowRight className="h-4 w-4 text-primary mb-1" />
                <span className="font-heading font-black text-2xl text-white tabular-nums">
                  <Contador ate={c.setembro} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={100}>
      <Papel tom="noite" className="relative">
        <Teia className="absolute -right-4 -top-4 opacity-60" tamanho={160} espelhada />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: DOURADO }}>
            Pure Match
          </p>
          <p className="font-heading font-black text-2xl sm:text-3xl leading-tight mt-2">
            +10% da verba de mídia para recrutamento
          </p>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-3xl">
            Dentro da verba de mídia de contribuição da rede dedicamos +10% do recurso para ações de
            recrutamento de profissionais. Contudo, existem necessidades especiais e a equipe também atua com
            campanhas de aporte para atender estes casos. A solicitação desta campanha é realizada para a
            equipe de RH e direcionada internamente para marketing. Todos os leads conquistados são repassados
            também entre os departamentos para o franqueado.
          </p>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-3xl">
            Além das campanhas pagas as equipes tratam comunicações nas redes sociais do Pure Academy, disparos
            de e-mails para a base de leads já conquistados e inclusão de grupos de telegram.
          </p>
        </div>
      </Papel>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   REDES SOCIAIS
   ══════════════════════════════════════════════════════════════════════ */
const Numero = ({ valor, rotulo }: { valor: string; rotulo: string }) => (
  <div>
    <p className="font-heading font-black text-xl sm:text-2xl leading-none text-white">{valor}</p>
    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/45 mt-1.5">{rotulo}</p>
  </div>
);

/** Post do Instagram embutido, com a ficha de resultados ao lado. */
const PostInstagram = ({
  codigo, titulo, chamada, numeros, nota,
}: {
  codigo: string;
  titulo: string;
  chamada: string;
  numeros: { valor: string; rotulo: string }[];
  nota?: string;
}) => (
  <Papel tom="noite" teia={false}>
    <div className="grid lg:grid-cols-[minmax(0,320px)_1fr] gap-6 items-start">
      <div className="relative w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10" style={{ height: 520 }}>
        <iframe
          src={igEmbed(codigo)}
          title={titulo}
          className="absolute inset-0 h-full w-full"
          style={{ border: 0 }}
          loading="lazy"
          scrolling="no"
          allowFullScreen
        />
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: DOURADO }}>
          {titulo}
        </p>
        <p className="font-heading font-black text-2xl sm:text-3xl leading-tight mt-2 text-white">{chamada}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-6">
          {numeros.map((n) => (
            <Numero key={n.rotulo} valor={n.valor} rotulo={n.rotulo} />
          ))}
        </div>

        {nota && <p className="text-sm text-white/65 leading-relaxed mt-5 max-w-xl">{nota}</p>}

        <a
          href={igPost(codigo)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold mt-6 transition-opacity hover:opacity-80"
          style={{ color: DOURADO }}
        >
          <Instagram className="h-4 w-4" />
          Ver no Instagram
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  </Papel>
);

const Social = () => (
  <>
    <Cabecalho
      kicker="Redes sociais"
      titulo="3.060 novos"
      destaque="seguidores"
      lead="Em setembro de 2026, conquistamos 3.060 novos seguidores, contra 1.624 no mesmo período de 2025. Um crescimento de 88,4%, com 1.436 novos seguidores a mais na comparação ano a ano."
      icone={Instagram}
    />

    <AnimatedSection variant="fade-up">
      <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-3xl">
        Entre os conteúdos de melhor desempenho do mês, destacamos os três com maiores resultados de
        engajamento.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 mt-5">
        {[
          { titulo: 'Trend', desc: 'Acho chique', views: '25,8 mil', interacoes: '833', seguidores: '13', icone: Sparkles },
          { titulo: 'Meme', desc: 'Treta fitness', views: '12,6 mil', interacoes: '452', seguidores: '4', icone: Heart },
          { titulo: 'Vídeo', desc: 'Leo Young', views: '18,6 mil', interacoes: '516', seguidores: '8', icone: Film },
        ].map((c) => (
          <Papel key={c.desc} tom="areia">
            <c.icone className="h-5 w-5" style={{ color: DOURADO }} />
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/45 mt-3">{c.titulo}</p>
            <p className="font-heading font-black text-xl text-white leading-tight mt-1">{c.desc}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
              <Numero valor={c.views} rotulo="Visualizações" />
              <Numero valor={c.interacoes} rotulo="Interações" />
              <Numero valor={`+${c.seguidores}`} rotulo="Seguidores" />
            </div>
          </Papel>
        ))}
      </div>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <PostInstagram
        codigo={IG_LEO_YOUNG}
        titulo="Vídeo · Leo Young"
        chamada="O post com mais visualizações do mês."
        numeros={[
          { valor: '18,6 mil', rotulo: 'Visualizações' },
          { valor: '8.142', rotulo: 'Alcance' },
          { valor: '516', rotulo: 'Interações líquidas' },
          { valor: '+8', rotulo: 'Seguidores' },
        ]}
        nota="Este post obteve mais visualizações em comparação com os posts recentes do Instagram."
      />
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={80}>
      <PostInstagram
        codigo={IG_DESAFIO}
        titulo="Desafio da Semana"
        chamada="O formato que mais mobiliza a comunidade."
        numeros={[
          { valor: 'Recorrência', rotulo: 'O que sustenta' },
          { valor: 'Prática', rotulo: 'Demonstração' },
          { valor: 'Comunidade', rotulo: 'Participação' },
        ]}
        nota="O Desafio da Semana segue entre os conteúdos que mais mobilizam a comunidade, concentrando altos volumes de curtidas, comentários e compartilhamentos. O resultado reforça a força de um formato já reconhecido pela audiência e que consegue unir recorrência, demonstração prática e participação da comunidade."
      />
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={100}>
      <Papel>
        <div className="grid sm:grid-cols-3 gap-6 items-center">
          <div className="text-center">
            <p className="font-heading font-black text-4xl sm:text-5xl text-primary leading-none">
              <Contador ate={3060} />
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/45 mt-2">
              Novos seguidores · set/26
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading font-black text-4xl sm:text-5xl text-white/35 leading-none">
              <Contador ate={1624} />
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/45 mt-2">
              No mesmo mês de 2025
            </p>
          </div>
          <div className="text-center">
            <p className="font-heading font-black text-4xl sm:text-5xl leading-none" style={{ color: DOURADO }}>
              +<Contador ate={88.4} decimais={1} sufixo="%" />
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/45 mt-2">
              Crescimento ano a ano
            </p>
          </div>
        </div>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={120}>
      <Papel tom="noite">
        <div className="grid lg:grid-cols-[minmax(0,300px)_1fr] gap-6 items-start">
          <div className="relative w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10" style={{ height: 560 }}>
            <iframe
              src={tiktokEmbed(TIKTOK_DESTAQUE)}
              title="TikTok — Pure Pilates"
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
              loading="lazy"
              allow="encrypted-media"
            />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <Music2 className="h-4 w-4" style={{ color: DOURADO }} />
              <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: DOURADO }}>
                Crescimento no TikTok
              </p>
            </div>
            <p className="font-heading font-black text-2xl sm:text-3xl leading-tight mt-3 text-white">
              “4 coisas que o Pilates faz no SEU corpo” — <Contador ate={40.9} decimais={1} sufixo=" mil" /> visualizações
            </p>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-2xl">
              O destaque do mês foi o vídeo “4 coisas que o Pilates faz no SEU corpo”, com 40,9 mil
              visualizações de longe o post de maior alcance, mostrando que conteúdos leves e diretos seguem
              performando melhor. Os vídeos “Eu acho chique falar casualmente…” e “Vem cá, deixa…” completam o
              top 3, reforçando o bom desempenho do formato selfie/lifestyle. A conta segue em crescimento,
              somando 2.666 seguidores e 16,6 mil curtidas acumuladas.
            </p>

            <div className="flex flex-wrap gap-8 mt-6">
              <div>
                <p className="font-heading font-black text-3xl leading-none text-white">
                  <Contador ate={2666} />
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/45 mt-1.5">Seguidores</p>
              </div>
              <div>
                <p className="font-heading font-black text-3xl leading-none text-white">
                  <Contador ate={16.6} decimais={1} sufixo=" mil" />
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/45 mt-1.5">
                  Curtidas acumuladas
                </p>
              </div>
            </div>

            <a
              href={tiktokPost(TIKTOK_DESTAQUE)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold mt-6 transition-opacity hover:opacity-80"
              style={{ color: DOURADO }}
            >
              <Music2 className="h-4 w-4" />
              Ver no TikTok
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Papel>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   CRIATIVOS & CONTEÚDO
   ══════════════════════════════════════════════════════════════════════ */
/** Vídeo UGC tocando dentro da própria timeline. */
const VideoUGC = ({ criadora }: { criadora: (typeof UGC)[number] }) => (
  <div>
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-black/60 ring-1 ring-white/10">
      <iframe
        src={driveEmbed(criadora.feed)}
        title={`Vídeo UGC com ${criadora.nome}`}
        allow="autoplay; fullscreen"
        allowFullScreen
        className="h-full w-full border-0"
      />
      {/* tampa o "abrir em nova janela" do player do Drive: assiste-se aqui */}
      <span className="absolute right-0 top-0 h-12 w-12" aria-hidden />
    </div>
    <p className="text-sm font-semibold text-white/85 mt-2">{criadora.nome}</p>
  </div>
);

const Criativos = () => (
  <>
    <Cabecalho
      kicker="Outubro"
      titulo="O criativo é a nova"
      destaque="segmentação"
      lead="Novos anúncios para as campanhas pagas, redes sociais e muito mais!"
      icone={Wand2}
    />

    <AnimatedSection variant="fade-up">
      <Papel>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-3xl">
          Esses são alguns dos vídeos UGC que já temos prontos para uso em nossas campanhas.
        </p>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-3xl">
          Conteúdos com linguagem natural, diferentes abordagens e formatos pensados para aproximar ainda mais
          a marca do público.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 mt-6">
          {UGC.map((criadora) => (
            <VideoUGC key={criadora.nome} criadora={criadora} />
          ))}
        </div>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <Papel tom="areia">
        <p className="font-heading font-black text-xl sm:text-2xl text-white leading-tight">
          Um novo jeito de apresentar a aula experimental
        </p>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-3xl">
          Com as recentes atualizações de Inteligência Artificial da Meta (como as campanhas Advantage+), o
          algoritmo lê o comportamento do usuário e os elementos do vídeo (metadados, legendas, áudio e ganchos)
          para decidir para quem entregar o anúncio. O formato UGC aborda dores reais e traz diferentes ângulos
          da experiência da aula experimental, alimentando a IA com os sinais necessários para encontrar o
          público comprador ideal de forma orgânica, sem depender tanto de segmentações de público manuais.
          Após 3 vídeos publicitários com personagens relevantes continuamos a apresentação da marca com
          formatos que apresentam ótimos resultados.
        </p>
        <div
          className="mt-6 rounded-xl px-5 py-4 text-white"
          style={{ background: `linear-gradient(100deg, ${NOITE} 0%, ${NOITE_CLARA} 100%)` }}
        >
          <p className="font-heading font-black text-lg sm:text-xl leading-tight">
            Até o final do ano teremos pelo menos{' '}
            <span style={{ color: DOURADO }}>3 criativos novos por mês!!!</span>
          </p>
          <p className="text-sm text-white/65 mt-1.5">
            Seguimos com o compromisso de manter a nossa rede com as melhores práticas de performance e
            construção de marca.
          </p>
        </div>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <Papel>
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <p className="text-[11px] uppercase tracking-[0.28em] font-bold text-primary">Calendário editorial</p>
        </div>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-3xl">
          O calendário editorial já nasce com estratégia. Utilize o material que produzimos para o perfil
          oficial nas redes locais. Todo mês, a rede desenvolve o calendário considerando comportamento do
          público, leitura de SEO, formatos com melhor desempenho, identidade da marca e dinâmica do algoritmo.
        </p>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-3xl">
          A inteligência artificial também pode apoiar esse processo. Mas sempre com direção, curadoria e
          intenção. A diferença está aqui: não é usar IA para preencher espaço. É usar estratégia para criar
          conteúdo que aproxima, posiciona e vende melhor a experiência Pure Pilates.
        </p>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={100}>
      <Papel tom="noite" className="relative">
        <Teia className="absolute -right-4 -top-4 opacity-55" tamanho={170} espelhada />
        <Aranha className="absolute right-[18%] top-0" fio={40} />
        <div className="relative">
          <Lightbulb className="h-5 w-5" style={{ color: DOURADO }} />
          <p className="font-heading font-black text-2xl sm:text-3xl leading-tight mt-3 max-w-2xl">
            O conteúdo mais forte está dentro da sua unidade.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 mt-5 text-sm sm:text-base text-white/75">
            {[
              'Alunos em movimento.',
              'Professores orientando.',
              'Desafios acontecendo.',
              'Bastidores reais.',
              'Depoimentos espontâneos.',
              'A rotina viva do estúdio.',
            ].map((linha) => (
              <p key={linha} className="flex items-center gap-2">
                <Abobora tamanho={18} cara={false} className="shrink-0 opacity-80" />
                {linha}
              </p>
            ))}
          </div>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-5 max-w-3xl">
            Esse tipo de conteúdo cria presença, aproxima a comunidade e mostra a experiência Pure Pilates como
            ela realmente acontece. Incentivem seus professores a criarem. Repostem bons conteúdos. Valorizem os
            alunos. Mostrem a energia da unidade. Com o tempo, conteúdos locais bem produzidos também podem
            ganhar espaço na rede nacional. A comunicação fica mais humana quando a unidade aparece de verdade.
          </p>
        </div>
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
      titulo="Formação e"
      destaque="capacitação"
      lead="Duas novidades para fortalecer a equipe da sua unidade."
      icone={GraduationCap}
    />

    <AnimatedSection variant="fade-up">
      <Papel tom="areia">
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold text-primary">Vem aí</p>
        <p className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight mt-2">
          Curso de Formação em Pilates 100% online
        </p>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-3xl">
          Franqueados Pure, vem novidade da Pure Academy para fortalecer ainda mais a nossa rede! Esta semana
          lançaremos o Curso de Formação em Pilates 100% online, com a qualidade e a metodologia da Pure Pilates.
          Uma nova oportunidade para facilitar o acesso à formação em Pilates, preparar mais profissionais e
          apoiar o crescimento dos nossos estúdios. Mais acessibilidade, mais profissionais capacitados e uma
          rede ainda mais forte.
        </p>
        <p className="font-heading font-black text-xl text-primary mt-5">Aguardem!</p>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <Papel>
        <p className="text-[11px] uppercase tracking-[0.28em] font-bold text-primary">Workshop</p>
        <p className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight mt-2">
          Pilates para Gestante
        </p>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed mt-3 max-w-3xl">
          Mais uma capacitação chegando para fortalecer a sua equipe! O Workshop de Pilates para Gestante vai
          preparar seus instrutores para atender esse público com mais segurança, confiança e qualidade,
          agregando valor às aulas e ampliando as oportunidades da sua unidade. Em breve, mais informações.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">
            <Calendar className="h-4 w-4 text-primary" />
            07 e 08 de novembro
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">
            <MapPin className="h-4 w-4 text-primary" />
            Sede Belenzinho · SP
          </span>
        </div>
      </Papel>
    </AnimatedSection>
  </>
);

/**
 * Prévia da coleção: as fotos passam sozinhas e cada uma sai com a faixa preta
 * de SPOILER por cima — nada de revelar com clique.
 */
const SlideshowMove = () => {
  const [atual, setAtual] = useState(0);
  const [parado, setParado] = useState(false);

  useEffect(() => {
    if (parado) return;
    const t = setInterval(() => setAtual((i) => (i + 1) % FOTOS_MOVE.length), 3800);
    return () => clearInterval(t);
  }, [parado]);

  const ir = (passo: number) => setAtual((i) => (i + passo + FOTOS_MOVE.length) % FOTOS_MOVE.length);

  return (
    <div
      className="relative mx-auto mt-7 w-full max-w-[19rem] sm:max-w-sm"
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/10">
        {FOTOS_MOVE.map((foto, i) => (
          <img
            key={foto.id}
            src={fotoDoDrive(foto.id)}
            alt={`Prévia da Coleção Verão 27 na cor ${foto.cor}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
              i === atual ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}

        {/* a faixa atravessa a foto inteira */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="w-[170%] -rotate-[8deg] bg-black py-2.5 sm:py-3 shadow-[0_14px_36px_rgba(0,0,0,0.65)]">
            <p
              className="text-center font-heading font-black text-lg sm:text-2xl uppercase tracking-[0.42em]"
              style={{ color: DOURADO }}
            >
              spoiler
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => ir(-1)}
          aria-label="Foto anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white/85 hover:bg-black/80 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => ir(1)}
          aria-label="Próxima foto"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white/85 hover:bg-black/80 hover:text-white transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {FOTOS_MOVE.map((foto, i) => (
          <button
            key={foto.id}
            type="button"
            onClick={() => setAtual(i)}
            aria-label={`Ver a foto ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === atual ? 'w-5' : 'w-1.5 bg-white/25 hover:bg-white/50',
            )}
            style={i === atual ? { background: DOURADO } : undefined}
          />
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   PURE STORE
   ══════════════════════════════════════════════════════════════════════ */
const Store = () => (
  <>
    <Cabecalho
      kicker="Pure Store"
      titulo="Ainda dá tempo:"
      destaque="Mês do Franqueado"
      lead="Economize mais, compre melhor e renove sua unidade! Durante todo o mês de setembro, você tem acesso a condições exclusivas na Pure Store."
      icone={ShoppingBag}
    />

    <AnimatedSection variant="fade-up">
      <Papel tom="noite" className="relative">
        <Teia className="absolute -left-4 -top-4 opacity-70" tamanho={180} />
        <Morcego className="absolute right-[10%] top-[12%] opacity-50" tamanho={26} />
        <div className="relative grid sm:grid-cols-2 gap-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <Tag className="h-5 w-5" style={{ color: DOURADO }} />
            <p className="font-heading font-black text-3xl sm:text-4xl mt-3">até 35% OFF</p>
            <p className="text-sm text-white/70 mt-1.5">
              No site, com o cupom{' '}
              <span className="font-mono font-bold tracking-wide" style={{ color: DOURADO }}>
                MESDOFRANQUEADO
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <Truck className="h-5 w-5" style={{ color: DOURADO }} />
            <p className="font-heading font-black text-3xl sm:text-4xl mt-3">Frete grátis</p>
            <p className="text-sm text-white/70 mt-1.5">Em pedidos acima de R$ 900.</p>
          </div>
        </div>
        <p className="relative text-sm sm:text-base text-white/70 leading-relaxed mt-5 max-w-3xl">
          Aproveite para reforçar seu estoque, renovar a arara e garantir os produtos que fazem a diferença na
          experiência dos seus alunos. Corra! As ofertas são válidas por tempo limitado e enquanto durarem os
          estoques.
        </p>
        <a
          href="https://loja.purepilates.com.br/"
          target="_blank"
          rel="noreferrer"
          className="relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white mt-6 transition-opacity hover:opacity-90"
          style={{ background: DOURADO }}
        >
          Ir para a loja
          <ArrowRight className="h-4 w-4" />
        </a>
      </Papel>
    </AnimatedSection>

    <AnimatedSection variant="fade-up" delay={60}>
      <Papel tom="areia">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">Vem aí</p>
          <p className="font-heading font-black text-3xl sm:text-5xl text-white leading-none tracking-tight mt-3">
            COLEÇÃO VERÃO 27
          </p>
          <p className="font-heading font-black text-5xl sm:text-7xl tracking-[0.12em] mt-2" style={{ color: DOURADO }}>
            MOVE
          </p>

        </div>

        <SlideshowMove />
      </Papel>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   PÁGINA
   ══════════════════════════════════════════════════════════════════════ */
const MonthLanding_2026_10 = () => {
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

  const renderSecao = () => {
    switch (abaAtiva) {
      case 'capa': return <Capa irPara={setAbaAtiva} />;
      case 'novela': return <Novela />;
      case 'resultados': return <Resultados />;
      case 'social': return <Social />;
      case 'criativos': return <Criativos />;
      case 'academy': return <Academy />;
      case 'store': return <Store />;
    }
  };

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 overflow-hidden" style={{ background: NOITE }}>
      <style>{estilosHalloween}</style>
      <FundoHalloween />

      {/* aranhas atravessando a edição */}
      <AranhaAndando topo="18%" duracao={64} tamanho={24} opacidade={0.5} />
      <AranhaAndando topo="52%" duracao={92} atraso={12} tamanho={18} opacidade={0.35} />
      <AranhaAndando topo="82%" duracao={78} atraso={30} tamanho={30} opacidade={0.4} />

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
                  'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all border shrink-0',
                  abaAtiva === tab.key
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-white/[0.06] text-white/70 border-white/15 hover:bg-white/[0.14] hover:text-white',
                )}
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
            style={{ background: `linear-gradient(90deg, ${NOITE}, ${NOITE}d9, transparent)` }}
          >
            <button
              type="button"
              onClick={() => rolar('left')}
              aria-label="Ver abas anteriores"
              className="pointer-events-auto rounded-full bg-white/10 text-white shadow-md border border-white/15 p-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div
            className={cn(
              'pointer-events-none absolute right-0 top-0 bottom-2 w-16 flex items-center justify-end transition-opacity duration-200',
              podeDireita ? 'opacity-100' : 'opacity-0',
            )}
            style={{ background: `linear-gradient(270deg, ${NOITE}, ${NOITE}d9, transparent)` }}
          >
            <button
              type="button"
              onClick={() => rolar('right')}
              aria-label="Ver mais abas"
              className="pointer-events-auto rounded-full bg-primary text-primary-foreground shadow-md p-1.5 hover:bg-primary/90 transition-colors animate-pulse"
              style={{ animationDuration: '2.5s' }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-16">{renderSecao()}</div>
      </div>
    </div>
  );
};

export default MonthLanding_2026_10;

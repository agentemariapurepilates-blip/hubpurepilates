import { useState, useEffect, useRef, ReactNode } from 'react';
import AnimatedSection from './AnimatedSection';
import { cn } from '@/lib/utils';
import {
  ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Instagram, Play,
  Mail, MessageCircle, Smartphone, Workflow, Filter, BarChart3, Server,
  Sparkles, Users, TrendingUp, Target, Megaphone, GraduationCap, ShoppingBag,
  Calendar, MapPin, Quote, Heart, Camera, Search, Compass, Timer, Tag,
  Truck, CheckCircle2, Music2, Eye, Radio, Handshake, Lightbulb, Info,
} from 'lucide-react';
import logoPure from '@/assets/logo-pure-pilates.png';
import fechamentoSetembro from '@/assets/set26-fechamento.jpg';
import estherVideo from '@/assets/set26-esther-video.jpg';
import estherPerfil from '@/assets/set26-esther-perfil.png';
import tiktokGrid from '@/assets/set26-tiktok-grid.jpg';

/* ══════════════════════════════════════════════════════════════════════════
   TIMELINE Nº 09 · SETEMBRO 2026
   Edição de primavera — diagramação de revista sobre a paleta da Pure.
   Conteúdo verbatim do Canva "Timeline - SET 2026"; a seção Pure Station
   foi redigida aqui (o Canva trazia só o título).
   ══════════════════════════════════════════════════════════════════════════ */

type TabKey =
  | 'capa'
  | 'resultados'
  | 'social'
  | 'station'
  | 'setembro'
  | 'academy'
  | 'store';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'capa', label: 'Capa' },
  { key: 'resultados', label: 'Resultados de Agosto' },
  { key: 'social', label: 'Redes Sociais' },
  { key: 'station', label: '★ Pure Station' },
  { key: 'setembro', label: 'Setembro & Pure Metrics' },
  { key: 'academy', label: 'Pure Academy' },
  { key: 'store', label: 'Pure Store' },
];

/* ── paleta da edição ────────────────────────────────────────────────── */
const CREME = '#fdf7ef';   // papel
const AREIA = '#f2e2ca';   // cartão quente
const BLUSH = '#f7dcd8';   // rosa pétala
const ROSA = '#e0919c';    // rosa forte
const FOLHA = '#7d9a68';   // verde folha
const FOLHA_CLARA = '#dfe9d3';

/* ── links ──────────────────────────────────────────────────────────── */
const IG_TREND_CHIQUE = 'Db9SnLDCTNV';       // Trend "Acho chique"
const IG_CARROSSEL_MUSCULACAO = 'Db6PoeKiY5y';
const IG_CARROSSEL_AGENDAMENTO = 'Dbv8ndjjpJw';
const ESTHER_TIKTOK = 'https://www.tiktok.com/@estheremcena';
/* Vídeos do @purepilatesbr em destaque no mês */
const TIKTOKS = ['7675023536360000789', '7676486615757344020'];
const tiktokEmbed = (id: string) => `https://www.tiktok.com/embed/v2/${id}`;
const tiktokPost = (id: string) => `https://www.tiktok.com/@purepilatesbr/video/${id}`;
const LUCIELLEN_DRIVE_ID = '1-sYU2lkyZU7JzIXkEvKAAKQZUwUxtnZJ';
/* Vídeo do Curso de Formação 100% online — Drive, compartilhado como
   "qualquer pessoa com o link". */
const CURSO_DRIVE_ID = '1ECgbx80OdOdgnmT9BfFTOb--XAm2HAbw';
const LOJA_URL = 'https://loja.purepilates.com.br/';

const igEmbed = (code: string) => `https://www.instagram.com/p/${code}/embed`;
const igPost = (code: string) => `https://www.instagram.com/p/${code}/`;

/* ══════════════════════════════════════════════════════════════════════
   ANIMAÇÕES DA EDIÇÃO
   Ficam num <style> local em vez do tailwind.config: são gestos de
   primavera desta edição só, e não vocabulário do design system.
   ══════════════════════════════════════════════════════════════════════ */
const estilosPrimavera = `
@keyframes ppQueda {
  0%   { transform: translate3d(0, -12%, 0); opacity: 0; }
  8%   { opacity: 1; }
  92%  { opacity: 1; }
  100% { transform: translate3d(var(--deriva, 40px), 112%, 0); opacity: 0; }
}
@keyframes ppGiro {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(180deg) scaleX(0.7); }
  100% { transform: rotate(360deg); }
}
@keyframes ppBalanco {
  0%, 100% { transform: rotate(-3.5deg); }
  50%      { transform: rotate(3.5deg); }
}
@keyframes ppDesenha {
  to { stroke-dashoffset: 0; }
}
@keyframes ppBrilho {
  0%   { transform: translateX(-120%) skewX(-18deg); }
  100% { transform: translateX(320%) skewX(-18deg); }
}
@media (prefers-reduced-motion: reduce) {
  .pp-petala, .pp-balanco { animation: none !important; }
}
`;

/* ── pétala solta ───────────────────────────────────────────────────── */
const Petala = ({
  left, atraso, duracao, tamanho, cor, deriva,
}: { left: string; atraso: number; duracao: number; tamanho: number; cor: string; deriva: number }) => (
  <span
    className="pp-petala pointer-events-none absolute top-0"
    style={{
      left,
      ['--deriva' as string]: `${deriva}px`,
      animation: `ppQueda ${duracao}s linear ${atraso}s infinite`,
    }}
  >
    <span
      className="block"
      style={{ animation: `ppGiro ${duracao / 2.4}s ease-in-out ${atraso}s infinite` }}
    >
      <svg width={tamanho} height={tamanho} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 1c5 3.4 7.5 6.6 7.5 10.2C17.5 15.6 14.1 19 10 19s-7.5-3.4-7.5-7.8C2.5 7.6 5 4.4 10 1Z"
          fill={cor}
          opacity="0.85"
        />
      </svg>
    </span>
  </span>
);

const PETALAS = [
  { left: '4%', atraso: 0, duracao: 13, tamanho: 15, cor: BLUSH, deriva: 60 },
  { left: '12%', atraso: 3.4, duracao: 16, tamanho: 11, cor: ROSA, deriva: -40 },
  { left: '21%', atraso: 6.1, duracao: 11, tamanho: 18, cor: '#fbeae2', deriva: 34 },
  { left: '29%', atraso: 1.2, duracao: 18, tamanho: 12, cor: BLUSH, deriva: -55 },
  { left: '38%', atraso: 8.5, duracao: 14, tamanho: 16, cor: FOLHA_CLARA, deriva: 48 },
  { left: '47%', atraso: 4.7, duracao: 12, tamanho: 10, cor: ROSA, deriva: -30 },
  { left: '56%', atraso: 10.2, duracao: 17, tamanho: 17, cor: BLUSH, deriva: 52 },
  { left: '64%', atraso: 2.3, duracao: 15, tamanho: 13, cor: '#fbeae2', deriva: -46 },
  { left: '73%', atraso: 7.6, duracao: 12, tamanho: 15, cor: FOLHA_CLARA, deriva: 38 },
  { left: '81%', atraso: 5.1, duracao: 19, tamanho: 11, cor: ROSA, deriva: -36 },
  { left: '89%', atraso: 9.4, duracao: 13, tamanho: 16, cor: BLUSH, deriva: 44 },
  { left: '95%', atraso: 12.1, duracao: 16, tamanho: 12, cor: '#fbeae2', deriva: -28 },
];

const ChuvaDePetalas = ({ className }: { className?: string }) => (
  <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
    {PETALAS.map((p, i) => (
      <Petala key={i} {...p} />
    ))}
  </div>
);

/* ── ramo decorativo ────────────────────────────────────────────────── */
const Ramo = ({
  className, cor = FOLHA, largura = 120, espelhado = false,
}: { className?: string; cor?: string; largura?: number; espelhado?: boolean }) => (
  <svg
    className={cn('pp-balanco', className)}
    width={largura}
    height={largura * 0.62}
    viewBox="0 0 120 74"
    fill="none"
    aria-hidden="true"
    style={{
      transformOrigin: espelhado ? 'right center' : 'left center',
      transform: espelhado ? 'scaleX(-1)' : undefined,
      animation: 'ppBalanco 7s ease-in-out infinite',
    }}
  >
    <path d="M2 70C26 62 48 46 62 30 76 14 96 6 118 4" stroke={cor} strokeWidth="1.6" strokeLinecap="round" />
    {[
      { x: 22, y: 62, r: -28 }, { x: 42, y: 50, r: -14 }, { x: 60, y: 33, r: -6 },
      { x: 78, y: 19, r: 8 }, { x: 98, y: 9, r: 20 },
    ].map((f, i) => (
      <ellipse
        key={i}
        cx={f.x}
        cy={f.y}
        rx="11"
        ry="5"
        fill={cor}
        opacity={0.28 + i * 0.1}
        transform={`rotate(${f.r} ${f.x} ${f.y})`}
      />
    ))}
  </svg>
);

/* ── régua de seção com folha ao centro ─────────────────────────────── */
const Regua = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center gap-3 my-2', className)} aria-hidden="true">
    <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${FOLHA}55)` }} />
    <svg width="26" height="14" viewBox="0 0 26 14" fill="none">
      <ellipse cx="13" cy="7" rx="10" ry="4.4" fill={FOLHA} opacity="0.35" transform="rotate(-16 13 7)" />
      <path d="M3 11 23 3" stroke={FOLHA} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
    <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${FOLHA}55, transparent)` }} />
  </div>
);

/* ── hook de entrada em tela (para barras que crescem) ──────────────── */
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
      { threshold: limite }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [limite]);
  return { ref, visivel };
}

/* ── contador com separador de milhar pt-BR ─────────────────────────── */
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

/* ── cabeçalho de seção (kicker + título display) ───────────────────── */
const Cabecalho = ({
  kicker, titulo, destaque, lead, icone: Icone,
}: { kicker: string; titulo: string; destaque?: string; lead?: string; icone?: React.ElementType }) => (
  <AnimatedSection variant="fade-up">
    <div className="relative">
      <Ramo className="absolute -top-6 right-0 hidden sm:block opacity-70" largura={140} espelhado />
      <div className="flex items-center gap-3 mb-3">
        {Icone && <Icone className="h-4 w-4 text-primary shrink-0" />}
        <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">{kicker}</span>
        <span className="h-px flex-1 max-w-[140px]" style={{ background: `${FOLHA}66` }} />
      </div>
      <h2 className="font-heading font-black text-4xl sm:text-6xl text-foreground leading-[0.95] tracking-tight">
        {titulo}
        {destaque && <> <span className="text-primary">{destaque}</span></>}
      </h2>
      {lead && (
        <p className="mt-4 max-w-2xl text-base sm:text-lg text-foreground/70 leading-relaxed">{lead}</p>
      )}
    </div>
  </AnimatedSection>
);

/* ── cartão de papel (o "papel" da revista) ─────────────────────────── */
const Papel = ({ children, className, tom = 'branco' }: { children: ReactNode; className?: string; tom?: 'branco' | 'areia' | 'blush' | 'folha' }) => {
  const fundos = {
    branco: '#fffdfa',
    areia: AREIA,
    blush: BLUSH,
    folha: FOLHA_CLARA,
  };
  return (
    <div
      className={cn('rounded-2xl border border-foreground/[0.07] shadow-[0_2px_18px_-10px_rgba(0,0,0,0.25)]', className)}
      style={{ background: fundos[tom] }}
    >
      {children}
    </div>
  );
};

/* ── mockup de celular (moldura para vídeo vertical) ────────────────── */
const MockupCelular = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('relative mx-auto w-full max-w-[270px]', className)}>
    <div className="relative rounded-[2.4rem] bg-neutral-900 p-2.5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
      {/* botões laterais */}
      <span className="absolute -left-[3px] top-[88px] h-11 w-[3px] rounded-l bg-neutral-700" aria-hidden="true" />
      <span className="absolute -left-[3px] top-[148px] h-11 w-[3px] rounded-l bg-neutral-700" aria-hidden="true" />
      <span className="absolute -right-[3px] top-[120px] h-16 w-[3px] rounded-r bg-neutral-700" aria-hidden="true" />
      {/* tela */}
      <div className="relative overflow-hidden rounded-[1.9rem] bg-black aspect-[9/19.5]">
        {children}
        <span
          className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 h-4 w-20 rounded-full bg-neutral-900/90 z-10"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════
   CAPA — masthead, foto de capa, carta e sumário
   ══════════════════════════════════════════════════════════════════════ */
const SUMARIO: { key: TabKey; titulo: string; desc: string }[] = [
  { key: 'resultados', titulo: 'Resultados de Agosto', desc: 'Performance parcial até 24/08, campanhas de aporte e Pure Match.' },
  { key: 'social', titulo: 'Redes Sociais', desc: 'Os três posts do mês, novos seguidores, Esther em Cena e o TikTok.' },
  { key: 'station', titulo: 'Pure Station', desc: 'A nova plataforma de e-mail, WhatsApp e automações — no ar.' },
  { key: 'setembro', titulo: 'Setembro & Pure Metrics', desc: 'O calendário editorial, o conteúdo local e a pesquisa de marca.' },
  { key: 'academy', titulo: 'Pure Academy', desc: 'Workshop de Pilates para Gestante e o Curso de Formação online.' },
  { key: 'store', titulo: 'Pure Store', desc: 'Setembro é o Mês do Franqueado — até 35% OFF e frete grátis.' },
];

const Capa = ({ irPara }: { irPara: (t: TabKey) => void }) => (
  <>
    {/* ═══ MASTHEAD ═══ */}
    <AnimatedSection variant="fade-in">
      <div>
        <div className="flex items-end justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <img src={logoPure} alt="Pure Pilates" className="h-7 sm:h-9 object-contain" />
            <div className="leading-none">
              <p className="font-heading font-black text-xl sm:text-3xl tracking-tighter text-foreground">
                TIMELINE<span className="text-primary">.</span>
              </p>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-foreground/50 font-semibold mt-1">
                Pure Pilates
              </p>
            </div>
          </div>
          <div className="text-right leading-tight shrink-0">
            <p className="font-heading font-black text-primary text-lg sm:text-2xl leading-none">Nº 09</p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-foreground/50 font-semibold mt-1">
              Setembro 2026
            </p>
          </div>
        </div>
        {/* filete duplo com a folha */}
        <div className="border-t-2 border-foreground pt-[3px]">
          <div className="border-t border-foreground/25" />
        </div>
        <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.28em] font-semibold" style={{ color: FOLHA }}>
          Edição de primavera · Departamento de Marketing
        </p>
      </div>
    </AnimatedSection>

    {/* ═══ CAPA TIPOGRÁFICA ═══ */}
    <AnimatedSection variant="fade-in" delay={80}>
      <div
        className="relative overflow-hidden rounded-sm ring-1 ring-foreground/10"
        style={{ background: `linear-gradient(155deg, ${AREIA} 0%, ${BLUSH} 52%, ${CREME} 100%)` }}
      >
        <ChuvaDePetalas />
        <Ramo className="absolute -left-6 bottom-4 opacity-40" largura={210} />
        <Ramo className="absolute -right-6 top-4 opacity-35" largura={190} espelhado />

        <div className="relative px-6 sm:px-12 py-14 sm:py-24 text-center">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.38em] font-bold text-primary">
            Edição de primavera
          </p>
          <h2 className="font-heading font-black text-[3.6rem] sm:text-[7.5rem] lg:text-[9.5rem] leading-[0.8] tracking-tighter text-foreground mt-5">
            Setembro
          </h2>
          <p className="font-heading font-black text-2xl sm:text-5xl leading-none tracking-tight text-primary mt-2 sm:mt-3">
            floresce.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8 sm:mt-10">
            <span className="h-px w-10 sm:w-20" style={{ background: `${FOLHA}77` }} />
            <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] font-bold text-foreground/60">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              A primavera começa em 22/09
            </span>
            <span className="h-px w-10 sm:w-20" style={{ background: `${FOLHA}77` }} />
          </div>

          {/* chamadas de capa */}
          <div className="grid sm:grid-cols-3 gap-2.5 mt-10 sm:mt-12 max-w-3xl mx-auto text-left">
            {[
              { k: 'Resultados', t: 'Presença cresce 11,9% — e a conversão pede atenção.' },
              { k: 'Pure Station', t: 'A plataforma de e-mail e WhatsApp da rede está no ar.' },
              { k: 'Pure Store', t: 'Setembro é o Mês do Franqueado: até 35% OFF.' },
            ].map((c) => (
              <div key={c.k} className="rounded-xl border border-foreground/10 bg-background/45 backdrop-blur-[2px] px-4 py-3.5">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">{c.k}</p>
                <p className="text-xs sm:text-sm text-foreground/75 leading-snug mt-1.5">{c.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-foreground/15 mt-3 pt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-foreground/50 font-semibold">
        <span>Capa · <span className="text-primary">Setembro floresce</span></span>
        <span>Balanço de agosto</span>
        <span className="hidden sm:inline">Departamento de Marketing</span>
      </div>
    </AnimatedSection>

    {/* ═══ EPÍGRAFE ═══ */}
    <AnimatedSection variant="scale-up">
      <div className="relative overflow-hidden rounded-2xl px-6 sm:px-12 py-10 sm:py-14 text-center" style={{ background: AREIA }}>
        <Ramo className="absolute -left-4 -bottom-4 opacity-50" largura={170} />
        <Ramo className="absolute -right-4 -top-4 opacity-50" largura={150} espelhado />
        <Quote className="h-6 w-6 mx-auto mb-4 text-primary/70" />
        <p className="font-heading font-black text-2xl sm:text-4xl lg:text-[2.9rem] leading-[1.1] text-foreground max-w-3xl mx-auto tracking-tight">
          O que pode ser medido,<br className="hidden sm:block" /> pode ser <span className="text-primary">melhorado</span>.
        </p>
        <p className="mt-5 text-[11px] uppercase tracking-[0.3em] font-bold text-foreground/50">Peter Drucker</p>
      </div>
    </AnimatedSection>

    {/* ═══ CARTA AO FRANQUEADO ═══ */}
    <AnimatedSection variant="fade-up">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Carta do Marketing</span>
          <span className="h-px flex-1 max-w-[160px]" style={{ background: `${FOLHA}66` }} />
        </div>

        <h2 className="font-heading font-black text-4xl sm:text-6xl text-foreground leading-[0.95] mb-6 tracking-tight">
          Caro<br /><span className="text-primary">franqueado,</span>
        </h2>

        <p className="text-base sm:text-lg text-foreground/85 leading-relaxed mb-6 first-letter:float-left first-letter:font-heading first-letter:font-black first-letter:text-primary first-letter:text-6xl sm:first-letter:text-7xl first-letter:leading-[0.7] first-letter:pr-3 first-letter:pt-1">
          É com esse princípio que a Pure Pilates conduz sua operação de marketing — e os números de julho e agosto mostram que medir com rigor está gerando resultado concreto.
        </p>

        <div className="lg:columns-2 lg:gap-10 [&>p]:mb-4 [&>p]:break-inside-avoid text-sm sm:text-base text-foreground/85 leading-relaxed">
          <p>Os primeiros 24 dias de agosto já entregam um volume de leads superior ao período anterior, com otimização consistente nos custos das campanhas de atração. Eficiência e escala, ao mesmo tempo. Isso não acontece por acaso — é fruto de ajustes contínuos, leitura de dados e decisões mais rápidas.</p>
          <p>O ponto de atenção está na conversão — e é exatamente aí que precisamos concentrar energia agora. Agosto é um mês estratégico: o segundo semestre tem menos dias úteis do que parece, e cada lead que não avança representa uma oportunidade que não volta.</p>
          <p>Para apoiar esse esforço, a área de marketing entrega neste período um calendário de redes sociais construído com base nas estratégias que comprovadamente conquistam seguidores e geram engajamento. Não é achismo — é leitura de dados aplicada à comunicação.</p>
          <p>No front operacional, novos recursos já estão disponíveis para ativação de leads da base via WhatsApp, ampliando o alcance das unidades justamente onde a conversão acontece. E a <strong>Pure Station</strong> está no ar: uma plataforma que representa economia real de recursos e um novo padrão de relacionamento com clientes, leads e profissionais de Pilates — que evoluirá com o tempo e com os aprendizados de cada unidade.</p>
          <p>Nos próximos dias, iniciaremos o planejamento das nossas ações de <strong>Black Friday</strong> e encerramento de ano. Fiquem atentos às comunicações nos grupos, no Hub e no aplicativo da Pure Pilates.</p>
        </div>

        {/* citação de destaque */}
        <blockquote className="my-9 border-l-4 border-primary pl-5 sm:pl-7">
          <p className="font-heading font-bold text-2xl sm:text-4xl text-foreground leading-tight">
            “Não é momento de aguardar — é momento de agir.”
          </p>
        </blockquote>

        {/* fecho em quatro tempos */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { t: 'O calendário aperta.', i: Timer },
            { t: 'A estrutura está pronta.', i: CheckCircle2 },
            { t: 'Os dados mostram o caminho.', i: Compass },
            { t: 'Agora é execução.', i: Target, forte: true },
          ].map((f, i) => (
            <AnimatedSection key={f.t} variant="fade-up" delay={i * 90}>
              <div
                className={cn(
                  'h-full rounded-xl px-4 py-5 border transition-transform duration-300 hover:-translate-y-1',
                  f.forte ? 'bg-foreground text-background border-foreground' : 'border-foreground/10'
                )}
                style={f.forte ? undefined : { background: '#fffdfa' }}
              >
                <f.i className={cn('h-4 w-4 mb-2.5', f.forte ? 'text-primary' : 'text-primary')} />
                <p className={cn('font-heading font-bold text-base leading-snug', f.forte ? '' : 'text-foreground')}>
                  {f.t}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-8 pt-5 border-t border-foreground/15">
          <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0" style={{ background: `${FOLHA}22` }}>
            <Sparkles className="h-5 w-5" style={{ color: FOLHA }} />
          </div>
          <div>
            <p className="font-heading font-bold text-xl text-foreground leading-none">Marketing Pure Pilates</p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-foreground/50 font-semibold mt-1">Setembro de 2026</p>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* ═══ SUMÁRIO ═══ */}
    <AnimatedSection variant="fade-up">
      <div className="flex items-end justify-between border-b-2 border-foreground pb-3 mb-2">
        <h2 className="font-heading font-black text-4xl sm:text-6xl text-foreground leading-none tracking-tight">
          Sumário
        </h2>
        <span className="text-[11px] uppercase tracking-[0.3em] text-foreground/50 font-semibold pb-1">Nesta edição</span>
      </div>
    </AnimatedSection>

    <div className="lg:grid lg:grid-cols-[minmax(0,210px)_1fr] lg:gap-10 items-end">
      {/* marginália — o mês em três números */}
      <div className="hidden lg:block relative self-end pb-4">
        <Ramo className="opacity-55 mb-5" largura={140} />
        {[
          { v: '9.044', l: 'aulas experimentais' },
          { v: '134.073', l: 'fãs na rede' },
          { v: '32', l: 'unidades com aporte' },
        ].map((n) => (
          <div key={n.l} className="border-t border-foreground/15 py-3">
            <p className="font-heading font-black text-2xl text-foreground tabular-nums leading-none">{n.v}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-foreground/45 mt-1.5">{n.l}</p>
          </div>
        ))}
      </div>
      <div>
        {SUMARIO.map((item, i) => (
          <AnimatedSection key={item.key} variant="fade-up" delay={i * 60}>
            <button
              type="button"
              onClick={() => irPara(item.key)}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6 w-full text-left border-b border-foreground/15 py-4 sm:py-5 hover:bg-primary/5 transition-colors px-1"
            >
              <span className="font-heading font-black text-2xl sm:text-4xl text-foreground/25 group-hover:text-primary tabular-nums transition-colors w-10 sm:w-14">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="block font-heading font-bold text-base sm:text-xl text-foreground group-hover:text-primary transition-colors leading-tight">
                  {item.titulo}
                </span>
                <span className="block text-xs sm:text-sm text-muted-foreground leading-snug mt-0.5">
                  {item.desc}
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   RESULTADOS — performance parcial até 24/08
   Os percentuais entre parênteses no Canva são a variação contra a meta
   do painel de controle, não contra julho. Aqui os dois aparecem
   separados para não confundir a leitura.
   ══════════════════════════════════════════════════════════════════════ */
const FUNIL = [
  { label: 'Aula Experimental', julho: 8606, agosto: 9044, meta: '+1,2%', metaOk: true, mm: '+5,1%' },
  { label: 'Presença Aula Experimental', julho: 6304, agosto: 7055, meta: '+8,5%', metaOk: true, mm: '+11,9%' },
  { label: 'Matrículas', julho: 1316, agosto: 1636, meta: '-6,5%', metaOk: false, mm: '+24,3%' },
  { label: 'PurePass', julho: 54, agosto: 74, meta: '—', metaOk: null, mm: '+37,0%' },
];

const BarraFunil = ({ item, indice }: { item: typeof FUNIL[number]; indice: number }) => {
  const { ref, visivel } = useNaTela<HTMLDivElement>(0.3);
  const teto = Math.max(item.julho, item.agosto);
  const pJulho = (item.julho / teto) * 100;
  const pAgosto = (item.agosto / teto) * 100;

  return (
    <div ref={ref} className="py-5 border-b border-foreground/10 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <p className="font-heading font-bold text-base sm:text-lg text-foreground">{item.label}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-foreground/45">mês a mês</span>
          <span className="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums" style={{ background: `${FOLHA}26`, color: '#4e6640' }}>
            {item.mm}
          </span>
          {item.metaOk !== null && (
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
                item.metaOk ? 'bg-foreground/[0.06] text-foreground/70' : 'bg-primary/10 text-primary'
              )}
              title="Variação contra a meta do painel de controle"
            >
              meta {item.meta}
            </span>
          )}
        </div>
      </div>

      {/* julho — fantasma */}
      <div className="flex items-center gap-3 mb-2">
        <span className="w-16 sm:w-20 shrink-0 text-[10px] uppercase tracking-[0.16em] font-bold text-foreground/40">Julho</span>
        <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ background: '#0000000a' }}>
          <div
            className="h-full rounded-full transition-[width] [transition-duration:1400ms] ease-out"
            style={{ width: visivel ? `${pJulho}%` : '0%', background: '#c9b9a3', transitionDelay: `${indice * 90}ms` }}
          />
        </div>
        <span className="w-14 sm:w-16 shrink-0 text-right text-sm font-semibold text-foreground/50 tabular-nums">
          {item.julho.toLocaleString('pt-BR')}
        </span>
      </div>

      {/* agosto — cheio */}
      <div className="flex items-center gap-3">
        <span className="w-16 sm:w-20 shrink-0 text-[10px] uppercase tracking-[0.16em] font-bold text-primary">Agosto</span>
        <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ background: '#0000000a' }}>
          <div
            className="h-full rounded-full transition-[width] [transition-duration:1400ms] ease-out"
            style={{
              width: visivel ? `${pAgosto}%` : '0%',
              background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, #d9566b 100%)',
              transitionDelay: `${indice * 90 + 160}ms`,
            }}
          />
        </div>
        <span className="w-14 sm:w-16 shrink-0 text-right text-base font-heading font-black text-foreground tabular-nums">
          <Contador ate={item.agosto} />
        </span>
      </div>
    </div>
  );
};

/* Report de aporte — reconstrução em HTML da tela do Hub (o print do Canva
   estava em resolução baixa). Fiel à tela, sem o gráfico de desempenho diário. */
const CARTOES_APORTE_1 = [
  { rotulo: 'Aulas experimentais', valor: '8', sub: 'agendadas no período', destaque: true },
  { rotulo: 'Custo por aula', valor: 'R$ 52,51', sub: 'média do período' },
  { rotulo: 'Gasto', valor: 'R$ 420,07', sub: 'total no período' },
  { rotulo: 'Alcance', valor: '1.895', sub: 'máximo diário' },
];
const CARTOES_APORTE_2 = [
  { rotulo: 'Impressões', valor: '33.451' },
  { rotulo: 'Cliques', valor: '522' },
  { rotulo: 'CPM', valor: 'R$ 12,56' },
  { rotulo: 'CPC', valor: 'R$ 0,80' },
];

const RotuloReport = ({ children }: { children: ReactNode }) => (
  <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-neutral-400">
    {children}
    <Info className="h-2.5 w-2.5 opacity-60" />
  </span>
);

const ReportAporte = () => (
  <div className="rounded-2xl border border-foreground/10 bg-[#faf9f7] p-5 sm:p-7 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.4)] overflow-x-auto">
    <div className="min-w-[560px]">
      <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-neutral-400">Visão geral · 30D</p>
      <p className="font-bold text-lg sm:text-xl text-neutral-800 tabular-nums mt-1">
        2026-07-26 <span className="text-neutral-400">→</span> 2026-08-24
      </p>

      <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] sm:text-xs text-neutral-600">
        Sync de hoje ainda não rodou. Dados mostrados são do último sync em 20/08/2026, 03:00:12.
      </p>

      <div className="grid grid-cols-4 gap-2.5 mt-4">
        {CARTOES_APORTE_1.map((c) => (
          <div
            key={c.rotulo}
            className={cn(
              'rounded-lg bg-white border border-neutral-200/80 px-3.5 py-3',
              c.destaque && 'border-t-2 border-t-primary'
            )}
          >
            <RotuloReport>{c.rotulo}</RotuloReport>
            <p className={cn('font-bold text-xl sm:text-2xl mt-1.5 tabular-nums', c.destaque ? 'text-primary' : 'text-neutral-800')}>
              {c.valor}
            </p>
            <p className="text-[10px] text-neutral-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2.5 mt-2.5">
        {CARTOES_APORTE_2.map((c) => (
          <div key={c.rotulo} className="rounded-lg bg-white border border-neutral-200/80 px-3.5 py-3">
            <RotuloReport>{c.rotulo}</RotuloReport>
            <p className="font-bold text-lg sm:text-xl text-neutral-800 mt-1.5 tabular-nums">{c.valor}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Resultados = () => (
  <>
    <Cabecalho
      kicker="Performance · parcial até 24/08"
      titulo="Resultados de"
      destaque="agosto."
      lead="Topo de funil em linha com a meta, presença em alta e um alerta claro na conversão. Julho e agosto lado a lado."
      icone={BarChart3}
    />

    {/* números-âncora */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[
        { valor: 9044, label: 'Aula Experimental', nota: '+5,1% vs. julho', icone: Users },
        { valor: 7055, label: 'Presenças', nota: '+11,9% vs. julho', icone: CheckCircle2 },
        { valor: 1636, label: 'Matrículas', nota: '6,5% abaixo da meta', icone: Target, alerta: true },
        { valor: 74, label: 'PurePass', nota: '+37,0% vs. julho', icone: Sparkles },
      ].map((m, i) => (
        <AnimatedSection key={m.label} variant="scale-up" delay={i * 80}>
          <Papel className="h-full p-5 relative overflow-hidden">
            <m.icone className="h-4 w-4 text-primary mb-3" />
            <p className="font-heading font-black text-3xl sm:text-[2.6rem] leading-none text-foreground tabular-nums">
              <Contador ate={m.valor} />
            </p>
            <p className="text-sm font-semibold text-foreground/70 mt-2 leading-tight">{m.label}</p>
            <p className={cn('text-xs font-bold mt-1', m.alerta ? 'text-primary' : '')} style={m.alerta ? undefined : { color: '#5f7a4e' }}>
              {m.nota}
            </p>
          </Papel>
        </AnimatedSection>
      ))}
    </div>

    {/* comparativo */}
    <AnimatedSection variant="fade-up">
      <Papel className="p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-foreground/60">Julho × Agosto</span>
        </div>
        <Regua className="mb-1" />
        {FUNIL.map((item, i) => (
          <BarraFunil key={item.label} item={item} indice={i} />
        ))}
      </Papel>
    </AnimatedSection>

    {/* leitura do mês */}
    <AnimatedSection variant="fade-up">
      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-5 items-start">
        <Papel tom="areia" className="p-6 sm:p-8 relative overflow-hidden">
          <Ramo className="absolute -right-3 -bottom-4 opacity-40" largura={140} espelhado />
          <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-primary mb-3">A leitura do mês</p>
          <p className="text-base sm:text-lg text-foreground/85 leading-relaxed relative">
            O mês de agosto está com grande destaque para crescimento de <strong>presença</strong>. O fator que a rede
            precisa ter atenção é sobre a <strong>conversão</strong> destes leads, visto que temos déficit de mais de 6%.
            Já o topo de funil — o volume de aula experimental — está em linha com a meta e, em termos de custos de
            aquisição, já com valores menores versus o mês anterior.
          </p>
        </Papel>

        <div className="rounded-2xl bg-foreground text-background p-6 sm:p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -right-8 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
          <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-primary mb-3 relative">Onde concentrar energia</p>
          <p className="font-heading font-black text-2xl sm:text-3xl leading-tight relative">
            Conversão.
          </p>
          <p className="text-sm opacity-80 leading-relaxed mt-3 relative">
            O lead chega e comparece — a presença cresceu 11,9%. A perda está no passo seguinte. Cada aula
            experimental que não vira matrícula é uma oportunidade que não volta no segundo semestre.
          </p>
        </div>
      </div>
    </AnimatedSection>

    <AnimatedSection variant="fade-in">
      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed border-l-2 pl-4" style={{ borderColor: `${FOLHA}88` }}>
        Os valores percentuais em parênteses correspondem à meta do painel de controle de performance. Estes valores são
        estabelecidos para crescimento e otimizações das campanhas da rede entre marketing e prestadores de serviço. São
        parâmetros acompanhados internamente, prezando pelo bom desempenho das campanhas.
      </p>
    </AnimatedSection>

    {/* ═══ CAMPANHAS DE APORTE ═══ */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-none tracking-tight">
            Campanhas de <span className="text-primary">aporte.</span>
          </h3>
          <div className="text-right">
            <p className="font-heading font-black text-4xl sm:text-5xl text-primary leading-none tabular-nums">
              <Contador ate={32} />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/50 mt-1">unidades da rede</p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-foreground/85 leading-relaxed max-w-3xl">
          Considerando as franquias que estão com campanhas dedicadas ao crescimento de aula experimental em
          <strong> 32 unidades da rede</strong>. Este investimento é dedicado a formatos em META e todo o tráfego é
          exclusivo da unidade.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mt-6">
          {[
            { n: '01', t: 'Conteúdo explicativo', d: 'O que é o aporte, como funciona e o que esperar.', i: Lightbulb },
            { n: '02', t: 'Formulário de adesão', d: 'A solicitação da mídia adicional, direto no Hub.', i: CheckCircle2 },
            { n: '03', t: 'Report único', d: 'O valor real das campanhas incrementais na sua região.', i: BarChart3 },
          ].map((c, i) => (
            <AnimatedSection key={c.n} variant="fade-up" delay={i * 90}>
              <Papel className="h-full p-5 group hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center justify-between mb-3">
                  <c.i className="h-4 w-4 text-primary" />
                  <span className="font-heading font-black text-2xl text-foreground/15 group-hover:text-primary/30 transition-colors tabular-nums">{c.n}</span>
                </div>
                <p className="font-heading font-bold text-base text-foreground leading-tight">{c.t}</p>
                <p className="text-sm text-muted-foreground leading-snug mt-1.5">{c.d}</p>
              </Papel>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection variant="scale-up" delay={100}>
          <figure className="mt-6">
            <ReportAporte />
            <figcaption className="mt-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-foreground/45">
              Report de aporte · hubpurepilates.com.br
            </figcaption>
          </figure>
        </AnimatedSection>
      </div>
    </AnimatedSection>

    {/* ═══ PURE MATCH ═══ */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Handshake className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Recrutamento de profissionais</span>
        </div>
        <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-none tracking-tight mb-5">
          Pure <span className="text-primary">Match.</span>
        </h3>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5 items-start">
          <div className="grid grid-cols-2 gap-3">
            {[
              { julho: 119, agosto: 191, label: 'Leads', delta: '+60,5%' },
              { julho: 3, agosto: 8, label: 'Unidades ativas', delta: '+167%' },
            ].map((m, i) => (
              <AnimatedSection key={m.label} variant="scale-up" delay={i * 100}>
                <Papel tom="blush" className="h-full p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/50">{m.label}</p>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-lg font-semibold text-foreground/40 tabular-nums line-through decoration-foreground/25">
                      {m.julho}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-foreground/30" />
                    <span className="font-heading font-black text-4xl text-primary leading-none tabular-nums">
                      <Contador ate={m.agosto} />
                    </span>
                  </div>
                  <p className="text-xs font-bold mt-2" style={{ color: '#5f7a4e' }}>{m.delta} no mês</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-foreground/40 mt-3">
                    Julho → Agosto
                  </p>
                </Papel>
              </AnimatedSection>
            ))}
          </div>

          <Papel className="p-6 sm:p-7 space-y-4 text-sm sm:text-base text-foreground/85 leading-relaxed">
            <p>
              Dentro da verba de mídia de contribuição da rede, dedicamos <strong>+10% do recurso</strong> para ações de
              recrutamento de profissionais. Contudo, existem necessidades especiais e a equipe também atua com campanhas
              de aporte para atender estes casos.
            </p>
            <p>
              A solicitação desta campanha é realizada para a equipe de RH e direcionada internamente para marketing.
              Todos os leads conquistados são repassados também entre os departamentos para o franqueado.
            </p>
            <div className="pt-3 border-t border-foreground/10">
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-foreground/50 mb-3">Além da mídia paga</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { t: 'Redes do Pure Academy', i: Instagram },
                  { t: 'E-mail para a base de leads', i: Mail },
                  { t: 'Grupos de Telegram', i: Radio },
                ].map((x) => (
                  <span
                    key={x.t}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground/75 border border-foreground/10"
                    style={{ background: FOLHA_CLARA }}
                  >
                    <x.i className="h-3 w-3" style={{ color: FOLHA }} /> {x.t}
                  </span>
                ))}
              </div>
            </div>
          </Papel>
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   REDES SOCIAIS — destaques de agosto
   ══════════════════════════════════════════════════════════════════════ */
const POSTS = [
  {
    titulo: 'Trend · Acho chique',
    code: IG_TREND_CHIQUE,
    metricas: [
      { l: 'Visualizações', v: '24,1 mil' },
      { l: 'Interações líquidas', v: '712' },
      { l: 'Cliques no link', v: '0' },
      { l: 'Seguidores', v: '4' },
    ],
    quebra: '412 do Facebook · 23.708 do Instagram',
    destaque: true,
  },
  {
    titulo: 'Carrossel · Musculação',
    code: IG_CARROSSEL_MUSCULACAO,
    metricas: [
      { l: 'Visualizações', v: '26,0 mil' },
      { l: 'Interações líquidas', v: '618' },
      { l: 'Cliques no link', v: '0' },
      { l: 'Seguidores', v: '1' },
    ],
    quebra: '244 do Facebook · 25.715 do Instagram',
    destaque: false,
  },
  {
    titulo: 'Carrossel · Agendamento',
    code: IG_CARROSSEL_AGENDAMENTO,
    metricas: [
      { l: 'Visualizações', v: '18,6 mil' },
      { l: 'Alcance', v: '8.142' },
      { l: 'Interações líquidas', v: '516' },
      { l: 'Seguidores', v: '8' },
    ],
    quebra: 'Mais visualizações que os posts recentes do perfil',
    destaque: false,
  },
];

const Social = () => (
  <>
    <Cabecalho
      kicker="Destaques de agosto"
      titulo="Redes"
      destaque="sociais."
      lead="Três peças, uma parceria nova no TikTok e o ritmo de crescimento da base. O que a rede publicou e o que isso rendeu."
      icone={Instagram}
    />

    {/* posts */}
    <div className="space-y-5">
      {POSTS.map((post, i) => (
        <AnimatedSection key={post.code} variant="fade-up" delay={i * 70}>
          <Papel className="overflow-hidden">
            <div className="grid lg:grid-cols-[minmax(0,380px)_1fr]">
              <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-foreground/[0.07]" style={{ background: '#0000000a' }}>
                <div className="rounded-xl overflow-hidden border border-foreground/10 bg-white">
                  <iframe
                    src={igEmbed(post.code)}
                    title={post.titulo}
                    className="w-full block"
                    style={{ height: 560, border: 0 }}
                    loading="lazy"
                    scrolling="no"
                  />
                </div>
                <a
                  href={igPost(post.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors group"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  Ver no Instagram
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-heading font-black text-xl text-foreground/15 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {post.destaque && (
                    <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] font-bold">
                      Trend
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-black text-2xl sm:text-3xl text-foreground leading-tight tracking-tight">
                  {post.titulo}
                </h3>
                <Regua className="!my-4" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {post.metricas.map((m) => (
                    <div key={m.l}>
                      <p className="font-heading font-black text-2xl sm:text-3xl text-foreground leading-none tabular-nums">{m.v}</p>
                      <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-foreground/45 mt-1.5">{m.l}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-5 pt-4 border-t border-foreground/10">{post.quebra}</p>
              </div>
            </div>
          </Papel>
        </AnimatedSection>
      ))}
    </div>

    {/* ═══ NOVOS SEGUIDORES ═══ */}
    <AnimatedSection variant="fade-up">
      <div className="relative overflow-hidden rounded-2xl p-7 sm:p-10" style={{ background: AREIA }}>
        <Ramo className="absolute -left-5 -bottom-6 opacity-45" largura={180} />
        <div className="relative grid lg:grid-cols-[1fr_1.1fr] gap-8 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary mb-3">Novos seguidores</p>
            <p className="font-heading font-black text-[3.4rem] sm:text-[5rem] leading-[0.85] text-foreground tabular-nums">
              <Contador ate={2578} />
            </p>
            <p className="text-sm font-semibold text-foreground/60 mt-3">novos fãs entre 1º e 24 de agosto</p>

            <div className="flex items-center gap-4 mt-6 pt-5 border-t border-foreground/15">
              <div>
                <p className="font-heading font-black text-2xl text-foreground/45 tabular-nums">2.586</p>
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-foreground/40 mt-1">mesmo período em 2025</p>
              </div>
              <div className="h-10 w-px bg-foreground/15" />
              <div>
                <p className="font-heading font-black text-2xl tabular-nums" style={{ color: FOLHA }}>−8</p>
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-foreground/40 mt-1">de diferença</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-foreground text-background p-7 sm:p-9 relative overflow-hidden">
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative">
              <Users className="h-5 w-5 text-primary mb-4" />
              <p className="font-heading font-black text-[3rem] sm:text-[4.2rem] leading-[0.85] tabular-nums">
                <Contador ate={134073} />
              </p>
              <p className="text-sm opacity-75 mt-3">fãs no total, com cinco dias ainda pela frente para o fechamento do mês.</p>
              <p className="text-xs opacity-55 mt-4 leading-relaxed">
                Praticamente em linha com o ano anterior — um ritmo consistente de crescimento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* ═══ ESTHER EM CENA ═══ */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Music2 className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Parceria por permuta · TikTok</span>
        </div>
        <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-none tracking-tight mb-6">
          Esther em <span className="text-primary">Cena.</span>
        </h3>

        <div className="grid lg:grid-cols-[minmax(0,300px)_1fr] gap-6 items-start">
          <a
            href={ESTHER_TIKTOK}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden rounded-2xl border border-foreground/10 shadow-lg"
          >
            <img
              src={estherVideo}
              alt="Esther em Cena gravando na Pure Pilates"
              className="w-full h-auto block transition-transform [transition-duration:1200ms] ease-out group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-background/90 shadow-xl transition-transform duration-300 group-hover:scale-110">
                <Play className="h-5 w-5 fill-current text-primary translate-x-0.5" />
              </span>
            </span>
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-foreground">
              <Eye className="h-3 w-3 text-primary" /> 15,8 mil
            </span>
          </a>

          <div className="space-y-5">
            <img
              src={estherPerfil}
              alt="Perfil de Esther em Cena no TikTok"
              className="w-full h-auto block rounded-xl border border-foreground/10 shadow-sm"
            />

            <div className="grid grid-cols-3 gap-3">
              {[
                { v: '353,4 mil', l: 'Seguidores' },
                { v: '1,9 M', l: 'Curtidas' },
                { v: 'R$ 0', l: 'de cachê' },
              ].map((s) => (
                <Papel key={s.l} tom="folha" className="p-4 text-center">
                  <p className="font-heading font-black text-xl sm:text-2xl text-foreground leading-none tabular-nums">{s.v}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-foreground/50 mt-2">{s.l}</p>
                </Papel>
              ))}
            </div>

            <div className="lg:columns-2 lg:gap-8 [&>p]:mb-3 [&>p]:break-inside-avoid text-sm sm:text-base text-foreground/85 leading-relaxed">
              <p>
                Também fechamos uma parceria por permuta com a <strong>Esther em Cena</strong>, criadora de grande alcance
                no TikTok, com mais de 350 mil seguidores e forte conexão com o público jovem.
              </p>
              <p>
                A ação amplia a visibilidade da Pure com um investimento reduzido, já que não envolve cachê, e permite que
                a marca se aproxime de uma nova geração de potenciais alunos.
              </p>
              <p>
                Além do alcance, a parceria contribui para renovar a comunicação da Pure, ampliar sua presença em
                diferentes plataformas e fortalecer sua relevância entre públicos mais jovens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* ═══ CRESCIMENTO TIKTOK ═══ */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-none tracking-tight mb-6">
          Crescimento no <span className="text-primary">TikTok.</span>
        </h3>

        <div className="grid lg:grid-cols-[1fr_minmax(0,320px)] gap-6 items-start">
          <div className="space-y-5">
            <Papel tom="blush" className="p-6 sm:p-7 relative overflow-hidden">
              <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-primary mb-3">Vídeo do mês</p>
              <p className="font-heading font-black text-2xl sm:text-[2.1rem] leading-[1.05] text-foreground tracking-tight">
                “4 coisas que o Pilates faz no SEU corpo”
              </p>
              <div className="flex items-baseline gap-3 mt-5">
                <span className="font-heading font-black text-[3rem] sm:text-[4rem] leading-none text-primary tabular-nums">
                  <Contador ate={40.9} decimais={1} />
                </span>
                <span className="text-sm font-bold text-foreground/60 uppercase tracking-[0.14em]">mil visualizações</span>
              </div>
            </Papel>

            <div className="text-sm sm:text-base text-foreground/85 leading-relaxed space-y-3">
              <p>
                De longe o post de maior alcance, mostrando que conteúdos leves e diretos seguem performando melhor. Os
                vídeos “Eu acho chique falar casualmente…” e “Vem cá, deixa…” completam o top 3, reforçando o bom
                desempenho do formato selfie/lifestyle.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 2666, l: 'Seguidores', s: '' },
                { v: 16.6, l: 'Curtidas acumuladas', s: ' mil', d: 1 },
              ].map((s) => (
                <Papel key={s.l} className="p-5">
                  <p className="font-heading font-black text-3xl text-foreground leading-none tabular-nums">
                    <Contador ate={s.v} decimais={s.d ?? 0} sufixo={s.s} />
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-foreground/45 mt-2">{s.l}</p>
                </Papel>
              ))}
            </div>
          </div>

          <figure>
            <img
              src={tiktokGrid}
              alt="Top vídeos do TikTok da Pure Pilates em agosto"
              className="w-full h-auto block rounded-2xl border border-foreground/10 shadow-lg"
            />
            <figcaption className="mt-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-foreground/45">
              Os vídeos mais vistos do mês
            </figcaption>
          </figure>
        </div>

        {/* players do TikTok */}
        <div className="grid sm:grid-cols-2 gap-4 mt-7">
          {TIKTOKS.map((id, i) => (
            <AnimatedSection key={id} variant="fade-up" delay={i * 90}>
              <Papel className="p-4 sm:p-5">
                <div className="rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={tiktokEmbed(id)}
                    title={`Vídeo do TikTok da Pure Pilates ${i + 1}`}
                    className="w-full block"
                    style={{ height: 620, border: 0 }}
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture; fullscreen"
                  />
                </div>
                <a
                  href={tiktokPost(id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors group"
                >
                  <Music2 className="h-3.5 w-3.5" />
                  Ver no TikTok
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Papel>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>

    {/* ═══ LUCIELLEN ═══ */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Histórias que mostram a Pure pelo Brasil</span>
        </div>
        <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-none tracking-tight mb-2">
          Luciellen, <span className="text-primary">na Bahia.</span>
        </h3>
        <p className="text-sm text-foreground/55 mb-6">Influenciadora e designer de moda</p>

        <div className="rounded-2xl overflow-hidden border border-foreground/10 bg-black aspect-video shadow-lg">
          <iframe
            src={`https://drive.google.com/file/d/${LUCIELLEN_DRIVE_ID}/preview`}
            title="Luciellen · Pure Pilates"
            className="w-full h-full block"
            style={{ border: 0 }}
            loading="lazy"
            allow="autoplay"
            allowFullScreen
          />
        </div>

        <div className="lg:columns-2 lg:gap-10 [&>p]:mb-4 [&>p]:break-inside-avoid text-sm sm:text-base text-foreground/85 leading-relaxed mt-6">
          <p>
            Também temos um conteúdo especial com a Luciellen, influenciadora e designer de moda com quem gravamos na
            Bahia. Com uma comunicação autêntica e forte conexão com seu público, o conteúdo apresenta grande potencial de
            alcance e engajamento.
          </p>
          <p>
            A participação faz parte de uma série criada para mostrar como a Pure Pilates está inserida na vida das
            pessoas de forma natural, acompanhando diferentes rotinas, histórias e estilos de vida. Além da Luciellen, a
            série contará com relatos de outros alunos da rede, reforçando a pluralidade das experiências e a
            capilaridade da Pure em diferentes regiões do país.
          </p>
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   PURE STATION — a plataforma de comunicação da rede
   ══════════════════════════════════════════════════════════════════════ */
const RECURSOS = [
  { i: Mail, t: 'E-mail em escala', d: 'Custo por disparo bem menor que o da plataforma anterior — o que permite alcançar mais gente na mesma campanha.' },
  { i: MessageCircle, t: 'WhatsApp integrado', d: 'O canal de maior abertura do país na mesma régua — o lead que não abriu o e-mail recebe o toque no WhatsApp.' },
  { i: Smartphone, t: 'SMS', d: 'Para o recado curto e urgente: confirmação de aula, lembrete de horário, aviso de vaga.' },
  { i: Workflow, t: 'Automações', d: 'Jornadas que rodam sozinhas. Você desenha uma vez; a régua trabalha todo dia, para toda a base.' },
  { i: Filter, t: 'Segmentação', d: 'Base fatiada por unidade, estágio do funil, origem do lead e tempo sem interação.' },
  { i: BarChart3, t: 'Relatórios', d: 'Entrega, abertura, clique e resposta — por campanha e por unidade. Dá para ver o que funcionou.' },
];

const AUTOMACOES = [
  {
    t: 'Abandono de carrinho',
    gatilho: 'A compra começa e não é concluída',
    d: 'A mensagem de retomada sai sozinha, sem ninguém precisar perceber que aquela venda ficou pela metade.',
    i: ShoppingBag,
  },
  {
    t: 'Relacionamento com clientes',
    gatilho: 'Momentos da jornada de quem já é aluno',
    d: 'A régua acompanha o cliente ao longo do tempo, mantendo a conversa viva sem depender da rotina da unidade.',
    i: Heart,
  },
  {
    t: 'Promoções e campanhas',
    gatilho: 'Uma oferta entra no ar',
    d: 'O disparo vai para a base segmentada — e agora cabe mais gente na mesma ação.',
    i: Tag,
  },
  {
    t: 'Ativação de leads por WhatsApp',
    gatilho: 'O lead entra na base',
    d: 'Recurso já disponível para as unidades, no canal de maior abertura do país.',
    i: MessageCircle,
  },
];

const Station = () => (
  <>
    {/* hero */}
    <AnimatedSection variant="fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 sm:p-14">
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full blur-3xl" style={{ background: `${FOLHA}44` }} />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] text-primary font-bold">
            <Server className="h-3 w-3" /> Tecnologia própria · no ar
          </span>
          <h2 className="font-heading font-black text-[2.6rem] sm:text-[5rem] leading-[0.9] tracking-tight mt-5">
            Pure <span className="text-primary">Station.</span>
          </h2>
          <p className="text-base sm:text-xl opacity-85 leading-relaxed mt-5 max-w-3xl">
            A plataforma de comunicação da rede saiu de casa de terceiros e passou a ser nossa. E-mail, WhatsApp, SMS e
            automações no mesmo lugar — construída pela Pure, operada pela Pure.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-9">
            {[
              { v: 'Custo reduzido', d: 'o disparo continua tendo custo — só que bem menor que antes' },
              { v: 'Mais alcance', d: 'com a conta menor, dá para falar com mais gente a cada campanha' },
              { v: 'Um só lugar', d: 'e-mail, WhatsApp e SMS na mesma régua' },
            ].map((x) => (
              <div key={x.v} className="rounded-xl bg-background/[0.07] border border-background/10 p-4">
                <p className="font-heading font-bold text-lg">{x.v}</p>
                <p className="text-xs opacity-65 mt-1 leading-snug">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* por que importa */}
    <AnimatedSection variant="fade-up">
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Por que isso muda o jogo</span>
            <span className="h-px flex-1 max-w-[120px]" style={{ background: `${FOLHA}66` }} />
          </div>
          <p className="text-base sm:text-lg text-foreground/85 leading-relaxed mb-5 first-letter:float-left first-letter:font-heading first-letter:font-black first-letter:text-primary first-letter:text-6xl first-letter:leading-[0.7] first-letter:pr-3 first-letter:pt-1">
            Falar com a base sempre teve um custo — e continua tendo. O que mudou foi o tamanho dele: com a plataforma
            internalizada, o valor por disparo caiu bastante em relação à ferramenta que usávamos antes.
          </p>
          <div className="lg:columns-2 lg:gap-8 [&>p]:mb-4 [&>p]:break-inside-avoid text-sm sm:text-base text-foreground/85 leading-relaxed">
            <p>
              É essa diferença que abre espaço para o que mais importa na prática: <strong>alcançar mais gente</strong>.
              Com a conta menor, o tamanho da audiência deixa de ser o primeiro corte do planejamento e cabe mais gente
              na mesma campanha.
            </p>
            <p>
              O ganho maior, porém, não é o preço: é o <strong>controle</strong>. Quando a plataforma é nossa, cada
              melhoria pedida pela rede vira desenvolvimento, não ticket de suporte. A Station evolui com os
              aprendizados de cada unidade.
            </p>
          </div>
        </div>

        <Papel tom="areia" className="p-6 sm:p-7 relative overflow-hidden">
          <Ramo className="absolute -right-4 -bottom-5 opacity-40" largura={130} espelhado />
          <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-primary mb-4">O que a rede ganha agora</p>
          <ul className="space-y-3 relative">
            {[
              'Ativação de leads da base via WhatsApp já disponível para as unidades.',
              'Automações de abandono de carrinho, relacionamento com clientes e promoções já rodando.',
              'Custo por disparo menor — e, com ele, mais gente alcançada a cada campanha.',
              'Comunicação com clientes, leads e profissionais de Pilates num padrão só.',
              'Uma plataforma que cresce com a rede, e não contra ela.',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-sm text-foreground/85 leading-snug">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Papel>
      </div>
    </AnimatedSection>

    {/* recursos */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-none tracking-tight mb-6">
          O que tem <span className="text-primary">dentro.</span>
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECURSOS.map((r, i) => (
            <AnimatedSection key={r.t} variant="fade-up" delay={i * 70}>
              <Papel className="group h-full p-6 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100"
                />
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110">
                  <r.i className="h-5 w-5" />
                </div>
                <p className="font-heading font-bold text-lg text-foreground leading-tight">{r.t}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{r.d}</p>
              </Papel>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>

    {/* jornada */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">O que já está rodando</span>
        </div>
        <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-none tracking-tight mb-2">
          As réguas no <span className="text-primary">ar.</span>
        </h3>
        <p className="text-sm sm:text-base text-foreground/70 max-w-2xl mb-7">
          Cada automação tem um gatilho. Quando ele acontece, a mensagem sai sozinha — não depende de alguém lembrar de
          disparar.
        </p>

        <div className="relative">
          {/* haste vertical */}
          <span
            className="absolute left-[19px] top-3 bottom-3 w-px hidden sm:block"
            style={{ background: `linear-gradient(180deg, ${FOLHA}, ${FOLHA}22)` }}
            aria-hidden="true"
          />
          <div className="space-y-3">
            {AUTOMACOES.map((a, i) => (
              <AnimatedSection key={a.t} variant="fade-left" delay={i * 90}>
                <div className="flex gap-4 items-start">
                  <div
                    className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 relative z-10"
                    style={{ background: CREME, borderColor: FOLHA }}
                  >
                    <a.i className="h-4 w-4" style={{ color: FOLHA }} />
                  </div>
                  <Papel className="flex-1 p-4 sm:p-5">
                    <p className="font-heading font-bold text-base sm:text-lg text-foreground leading-tight">{a.t}</p>
                    <p className="inline-flex items-center gap-1.5 mt-2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-foreground/70" style={{ background: FOLHA_CLARA }}>
                      <span className="text-[9px] uppercase tracking-[0.14em] font-bold" style={{ color: '#5f7a4e' }}>Gatilho</span>
                      {a.gatilho}
                    </p>
                    <p className="text-sm text-muted-foreground leading-snug mt-2.5">{a.d}</p>
                  </Papel>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>

        <AnimatedSection variant="scale-up" delay={120}>
          <div className="mt-6 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden" style={{ background: BLUSH }}>
            <p className="font-heading font-black text-xl sm:text-3xl text-foreground leading-tight max-w-2xl mx-auto">
              A conversão é o ponto de atenção de agosto.<br className="hidden sm:block" />
              <span className="text-primary">A Station é a ferramenta para atacá-lo.</span>
            </p>
          </div>
        </AnimatedSection>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   SETEMBRO — calendário editorial, conteúdo local e Pure Metrics
   ══════════════════════════════════════════════════════════════════════ */
const Setembro = () => (
  <>
    {/* abertura de mês */}
    <AnimatedSection variant="fade-in">
      <div className="relative overflow-hidden rounded-3xl" style={{ background: AREIA }}>
        <ChuvaDePetalas />
        <Ramo className="absolute -left-6 bottom-2 opacity-40" largura={200} />
        <div className="relative p-7 sm:p-12">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary mb-3">A primavera começa em 22/09</p>
            <h2 className="font-heading font-black text-[3rem] sm:text-[6rem] leading-[0.85] text-foreground tracking-tighter">
              Setembro<span className="text-primary">.</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 leading-relaxed mt-4 max-w-lg">
              O que a rede tem em mãos para o mês: um calendário que já nasce com estratégia e o conteúdo que só a sua
              unidade sabe produzir.
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* calendário editorial */}
    <AnimatedSection variant="fade-up">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Redes sociais</span>
        </div>
        <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-[0.95] tracking-tight mb-5">
          O calendário editorial<br />já nasce com <span className="text-primary">estratégia.</span>
        </h3>

        <p className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-3xl mb-6">
          Utilize o material que produzimos para o perfil oficial nas redes locais.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
          {[
            { t: 'Comportamento do público', i: Users },
            { t: 'Leitura de SEO', i: Search },
            { t: 'Formatos que performam', i: TrendingUp },
            { t: 'Identidade da marca', i: Heart },
            { t: 'Dinâmica do algoritmo', i: Radio },
          ].map((c, i) => (
            <AnimatedSection key={c.t} variant="scale-up" delay={i * 70}>
              <Papel tom="folha" className="h-full p-4 text-center">
                <c.i className="h-4 w-4 mx-auto mb-3" style={{ color: '#5f7a4e' }} />
                <p className="text-sm font-semibold text-foreground/85 leading-snug">{c.t}</p>
              </Papel>
            </AnimatedSection>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
          <Papel className="p-6 sm:p-7 space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
            <p>
              Todo mês, a rede desenvolve o calendário considerando comportamento do público, leitura de SEO, formatos
              com melhor desempenho, identidade da marca e dinâmica do algoritmo.
            </p>
            <p>A inteligência artificial também pode apoiar esse processo. Mas sempre com direção, curadoria e intenção.</p>
          </Papel>

          <div className="rounded-2xl bg-foreground text-background p-6 sm:p-8 relative overflow-hidden flex flex-col justify-center">
            <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
            <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-primary mb-4 relative">A diferença está aqui</p>
            <p className="font-heading font-black text-xl sm:text-[1.75rem] leading-tight relative">
              Não é usar IA para preencher espaço.
            </p>
            <p className="font-heading font-black text-xl sm:text-[1.75rem] leading-tight text-primary relative mt-2">
              É usar estratégia para criar conteúdo que aproxima, posiciona e vende melhor a experiência Pure Pilates.
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* conteúdo local */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <h3 className="font-heading font-black text-[2rem] sm:text-[3.4rem] leading-[0.95] text-foreground tracking-tight mb-6">
          O conteúdo mais forte<br />está dentro da <span className="text-primary">sua unidade.</span>
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
          {[
            { t: 'Alunos em movimento', i: Users },
            { t: 'Professores orientando', i: GraduationCap },
            { t: 'Desafios acontecendo', i: Target },
            { t: 'Bastidores reais', i: Camera },
            { t: 'Depoimentos espontâneos', i: Quote },
            { t: 'A rotina viva do estúdio', i: Heart },
          ].map((c, i) => (
            <AnimatedSection key={c.t} variant="fade-up" delay={i * 60}>
              <Papel className="group h-full p-5 flex items-center gap-3 hover:-translate-y-1 transition-transform duration-300">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <c.i className="h-4 w-4" />
                </span>
                <p className="font-heading font-bold text-base text-foreground leading-tight">{c.t}</p>
              </Papel>
            </AnimatedSection>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5 items-start">
          <Papel tom="blush" className="p-6 sm:p-8">
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed">
              Esse tipo de conteúdo cria presença, aproxima a comunidade e mostra a experiência Pure Pilates
              <strong> como ela realmente acontece</strong>.
            </p>
            <Regua className="!my-5" />
            <p className="text-sm text-foreground/70 leading-relaxed">
              Com o tempo, conteúdos locais bem produzidos também podem ganhar espaço na rede nacional. A comunicação
              fica mais humana quando a unidade aparece de verdade.
            </p>
          </Papel>

          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-foreground/50 mb-4">O pedido da rede</p>
            <div className="space-y-2.5">
              {[
                'Incentivem seus professores a criarem.',
                'Repostem bons conteúdos.',
                'Valorizem os alunos.',
                'Mostrem a energia da unidade.',
              ].map((t, i) => (
                <AnimatedSection key={t} variant="fade-left" delay={i * 80}>
                  <div className="flex items-center gap-3 border-b border-foreground/10 pb-2.5">
                    <span className="font-heading font-black text-lg text-primary/40 tabular-nums w-6">{i + 1}</span>
                    <p className="font-heading font-bold text-base sm:text-lg text-foreground leading-tight">{t}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* Pure Metrics */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Megaphone className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Em breve · Pesquisa de marca</span>
        </div>
        <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-none tracking-tight mb-5">
          Pure <span className="text-primary">Metrics.</span>
        </h3>

        <p className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-3xl mb-6 first-letter:float-left first-letter:font-heading first-letter:font-black first-letter:text-primary first-letter:text-6xl first-letter:leading-[0.7] first-letter:pr-3 first-letter:pt-1">
          Em breve, a rede contará com uma nova ferramenta criada para transformar a percepção dos alunos em
          inteligência estratégica.
        </p>

        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-7">
          {['Acolhimento', 'Acessibilidade', 'Capilaridade', 'Facilidade', 'Eficiência'].map((p, i) => (
            <AnimatedSection key={p} variant="scale-up" delay={i * 80}>
              <div className="rounded-xl border border-foreground/10 p-4 text-center" style={{ background: '#fffdfa' }}>
                <span className="font-heading font-black text-xl text-primary/30 tabular-nums block mb-1.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="font-heading font-bold text-sm text-foreground leading-tight">{p}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="lg:columns-2 lg:gap-10 [&>p]:mb-4 [&>p]:break-inside-avoid text-sm sm:text-base text-foreground/85 leading-relaxed">
          <p>
            A Pure Metrics vai permitir compreender, de forma mais profunda, como a Pure Pilates é reconhecida, quais
            atributos estão mais presentes na experiência e como a marca é percebida em diferentes regiões e perfis de
            público.
          </p>
          <p>
            Por meio de uma jornada de pesquisa simples e conectada ao cadastro dos alunos, será possível acompanhar
            pilares como acolhimento, acessibilidade, capilaridade, facilidade e eficiência. A ferramenta também vai
            avaliar os benefícios percebidos com a prática, a experiência com o aplicativo, o nível de recomendação e
            <strong> a relação entre aquilo que a marca comunica e o que o aluno realmente vivencia</strong> dentro das
            unidades.
          </p>
          <p>
            Essas informações vão apoiar as decisões futuras da Pure Pilates, oferecendo uma base concreta para avaliar
            caminhos de posicionamento, mensagens, campanhas e prioridades estratégicas. Assim, a evolução da marca deixa
            de depender apenas de percepções internas e passa a considerar, de forma estruturada, a visão de quem vive a
            Pure todos os dias.
          </p>
          <p>
            Mais do que medir resultados, a Pure Metrics será uma ferramenta para compreender o presente, identificar
            oportunidades e construir os próximos capítulos da marca com mais clareza, consistência e conexão com o
            público.
          </p>
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   PURE ACADEMY — workshop e curso online
   ══════════════════════════════════════════════════════════════════════ */
const Academy = () => (
  <>
    <Cabecalho
      kicker="Formação e capacitação"
      titulo="Pure"
      destaque="Academy."
      lead="Duas novidades a caminho para fortalecer a equipe da sua unidade."
      icone={GraduationCap}
    />

    {/* workshop gestante */}
    <AnimatedSection variant="fade-up">
      <Papel tom="areia" className="overflow-hidden">
        <div className="relative">
          <Ramo className="absolute right-2 top-4 opacity-40 hidden sm:block" largura={150} espelhado />
          <div className="p-7 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold">
              <Sparkles className="h-3 w-3" /> Vem aí
            </span>
            <h3 className="font-heading font-black text-3xl sm:text-[3.2rem] leading-[0.95] text-foreground tracking-tight mt-4">
              Workshop de Pilates<br />para <span className="text-primary">Gestante.</span>
            </h3>
            <p className="text-sm sm:text-base text-foreground/85 leading-relaxed mt-5 max-w-xl">
              Mais uma capacitação chegando para fortalecer a sua equipe! O Workshop de Pilates para Gestante vai
              preparar seus instrutores para atender esse público com mais segurança, confiança e qualidade, agregando
              valor às aulas e ampliando as oportunidades da sua unidade. Em breve, mais informações.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">
              <div className="rounded-xl bg-foreground text-background px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] uppercase tracking-[0.18em] font-bold opacity-60">Data</span>
                </div>
                <p className="font-heading font-black text-lg leading-none">07 e 08 de Novembro</p>
              </div>
              <div className="rounded-xl border border-foreground/15 px-5 py-4" style={{ background: '#fffdfa' }}>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-foreground/50">Local</span>
                </div>
                <p className="font-heading font-black text-lg leading-none text-foreground">Sede Belenzinho · SP</p>
              </div>
            </div>
          </div>

        </div>
      </Papel>
    </AnimatedSection>

    {/* curso online */}
    <AnimatedSection variant="fade-up">
      <div className="relative overflow-hidden rounded-2xl bg-foreground text-background">
        <div className="pointer-events-none absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1fr_minmax(0,300px)] items-center gap-4">
          <div className="p-7 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
              <Sparkles className="h-3 w-3" /> Vem aí
            </span>
            <h3 className="font-heading font-black text-3xl sm:text-[3.2rem] leading-[0.95] tracking-tight mt-4">
              Curso de Formação<br />em Pilates <span className="text-primary">100% online.</span>
            </h3>
            <p className="text-sm sm:text-base opacity-80 leading-relaxed mt-5 max-w-xl">
              Franqueados Pure, vem novidade da Pure Academy para fortalecer ainda mais a nossa rede! Em breve,
              lançaremos o Curso de Formação em Pilates 100% online, com a qualidade e a metodologia da Pure Pilates.
            </p>
            <p className="text-sm sm:text-base opacity-80 leading-relaxed mt-4 max-w-xl">
              Uma nova oportunidade para facilitar o acesso à formação em Pilates, preparar mais profissionais e apoiar o
              crescimento dos nossos estúdios.
            </p>

            <div className="flex flex-wrap gap-2 mt-7">
              {['Mais acessibilidade', 'Mais profissionais capacitados', 'Uma rede ainda mais forte'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-background/10 border border-background/15 px-3 py-1.5 text-xs font-semibold">
                  <CheckCircle2 className="h-3 w-3 text-primary" /> {t}
                </span>
              ))}
            </div>
            <p className="font-heading font-black text-2xl text-primary mt-7">Aguardem!</p>
          </div>

          <MockupCelular className="mb-9 lg:mb-9 lg:mr-6">
            <iframe
              src={`https://drive.google.com/file/d/${CURSO_DRIVE_ID}/preview`}
              title="Curso de Formação em Pilates 100% online"
              className="absolute inset-0 w-full h-full block"
              style={{ border: 0 }}
              loading="lazy"
              allow="autoplay"
              allowFullScreen
            />
          </MockupCelular>
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   PURE STORE — Mês do Franqueado
   ══════════════════════════════════════════════════════════════════════ */
const Store = () => (
  <>
    <Cabecalho
      kicker="Setembro · Mês do Franqueado"
      titulo="Pure"
      destaque="Store."
      lead="Economize mais, compre melhor e renove sua unidade. Durante todo o mês de setembro, condições exclusivas."
      icone={ShoppingBag}
    />

    {/* faixa em marquee */}
    <AnimatedSection variant="fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground py-3">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-8 px-4" aria-hidden={dup === 1}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="inline-flex items-center gap-2.5 whitespace-nowrap text-sm font-bold uppercase tracking-[0.18em]">
                  <Heart className="h-3.5 w-3.5 fill-current" /> Setembro · Mês do Franqueado
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>

    {/* ofertas */}
    <div className="grid lg:grid-cols-2 gap-4">
      <AnimatedSection variant="scale-up">
        <div className="h-full rounded-2xl p-7 sm:p-9 relative overflow-hidden" style={{ background: BLUSH }}>
          <Ramo className="absolute -right-4 -top-4 opacity-40" largura={130} espelhado />
          <Tag className="h-5 w-5 text-primary mb-4" />
          <p className="font-heading font-black text-[3.4rem] sm:text-[5rem] leading-[0.82] text-primary tabular-nums">
            <Contador ate={35} sufixo="%" />
          </p>
          <p className="font-heading font-black text-2xl text-foreground mt-2">OFF em todo o site</p>
          <p className="text-sm text-foreground/70 mt-3">Até 35% de desconto com o cupom:</p>
          <p className="mt-3 inline-block rounded-lg bg-foreground text-background px-4 py-2.5 font-heading font-black tracking-[0.14em] text-base">
            MESDOFRANQUEADO
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection variant="scale-up" delay={100}>
        <div className="h-full rounded-2xl p-7 sm:p-9 relative overflow-hidden" style={{ background: FOLHA_CLARA }}>
          <Ramo className="absolute -left-4 -bottom-5 opacity-45" largura={140} />
          <Truck className="h-5 w-5 text-primary mb-4" />
          <p className="font-heading font-black text-[2.6rem] sm:text-[4rem] leading-[0.85] text-foreground">
            Frete <span className="text-primary">grátis</span>
          </p>
          <p className="font-heading font-black text-2xl text-foreground mt-2">em pedidos acima de R$ 900</p>
          <p className="text-sm text-foreground/70 mt-4 max-w-sm leading-relaxed">
            Aproveite para reforçar seu estoque, renovar a arara e garantir os produtos que fazem a diferença na
            experiência dos seus alunos.
          </p>
        </div>
      </AnimatedSection>
    </div>

    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl bg-foreground text-background p-7 sm:p-9 relative overflow-hidden">
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <p className="font-heading font-black text-2xl sm:text-3xl leading-tight">
              Corra! As ofertas são válidas por tempo limitado<span className="text-primary">.</span>
            </p>
            <p className="text-sm opacity-75 mt-2">E enquanto durarem os estoques.</p>
          </div>
          <a
            href={LOJA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 self-start rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-bold hover:bg-primary/90 transition-colors shrink-0"
          >
            Ir para a loja
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </AnimatedSection>

    {/* fecho da edição */}
    <AnimatedSection variant="fade-up">
      <div className="border-t-2 border-foreground pt-8">
        <div className="grid lg:grid-cols-[1fr_minmax(0,420px)] gap-7 items-center">
          <div>
            <Ramo className="opacity-60 mb-4" largura={150} />
            <p className="font-heading font-black text-[2.4rem] sm:text-[4rem] leading-[0.9] text-foreground tracking-tight">
              Excelente<br /><span className="text-primary">setembro.</span>
            </p>
            <p className="text-base text-foreground/70 mt-5 max-w-md leading-relaxed">
              O calendário aperta, a estrutura está pronta e os dados mostram o caminho. Agora é execução — com muitas
              matrículas, crescimento e resultados para toda a rede.
            </p>
            <p className="text-[11px] uppercase tracking-[0.28em] font-bold text-foreground/45 mt-6">
              Marketing Pure Pilates
            </p>
          </div>
          <img
            src={fechamentoSetembro}
            alt="Aluno Pure Pilates em movimento"
            className="w-full h-auto rounded-2xl select-none pointer-events-none"
          />
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════════════ */
const MonthLanding_2026_09 = () => {
  const [abaAtiva, setAbaAtiva] = useState<TabKey>('capa');
  const abasRef = useRef<HTMLDivElement>(null);
  const [podeEsquerda, setPodeEsquerda] = useState(false);
  const [podeDireita, setPodeDireita] = useState(false);

  useEffect(() => {
    const el = abasRef.current;
    if (!el) return;
    const atualizar = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setPodeEsquerda(scrollLeft > 4);
      setPodeDireita(scrollLeft + clientWidth < scrollWidth - 4);
    };
    atualizar();
    el.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    return () => {
      el.removeEventListener('scroll', atualizar);
      window.removeEventListener('resize', atualizar);
    };
  }, []);

  useEffect(() => {
    const el = abasRef.current;
    if (!el) return;
    el.querySelector<HTMLButtonElement>(`[data-tab="${abaAtiva}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [abaAtiva]);

  const rolar = (dir: 'left' | 'right') => {
    abasRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const renderSecao = () => {
    switch (abaAtiva) {
      case 'capa': return <Capa irPara={setAbaAtiva} />;
      case 'resultados': return <Resultados />;
      case 'social': return <Social />;
      case 'station': return <Station />;
      case 'setembro': return <Setembro />;
      case 'academy': return <Academy />;
      case 'store': return <Store />;
    }
  };

  return (
    <div className="rounded-3xl p-5 sm:p-8 pb-10 relative" style={{ background: CREME }}>
      <style>{estilosPrimavera}</style>

      {/* navegação */}
      <div className="relative mb-6">
        <div
          ref={abasRef}
          className="flex gap-2 overflow-x-auto scroll-smooth pb-2 px-1 -mx-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              data-tab={tab.key}
              onClick={() => setAbaAtiva(tab.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all border shrink-0',
                abaAtiva === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-white/70 text-foreground/70 border-foreground/10 hover:bg-white hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 bottom-2 w-16 flex items-center transition-opacity duration-200',
            podeEsquerda ? 'opacity-100' : 'opacity-0'
          )}
          style={{ background: `linear-gradient(90deg, ${CREME}, ${CREME}d9, transparent)` }}
        >
          <button
            type="button"
            onClick={() => rolar('left')}
            aria-label="Ver abas anteriores"
            className="pointer-events-auto rounded-full bg-white shadow-md border border-foreground/10 p-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 bottom-2 w-16 flex items-center justify-end transition-opacity duration-200',
            podeDireita ? 'opacity-100' : 'opacity-0'
          )}
          style={{ background: `linear-gradient(270deg, ${CREME}, ${CREME}d9, transparent)` }}
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
  );
};

export default MonthLanding_2026_09;

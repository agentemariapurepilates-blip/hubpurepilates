import { useState, useEffect, useRef } from 'react';
import AnimatedSection from './AnimatedSection';
import AnimatedCounter from './AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SectionTitle, MetricCard } from './shared';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingDown, AlertTriangle, HandHeart, Megaphone, Sparkles, ArrowRight,
  Star, ExternalLink, BookOpen, LayoutDashboard, DollarSign, Palette,
  Flag, Trophy, Rainbow, Heart, Calendar, Quote, ShieldCheck, Eye,
  ThumbsUp, Minus, ThumbsDown, Tag, BarChart3, FileText, Lightbulb,
  ChevronRight, CheckCircle2, Users, UserPlus, Snowflake, ArrowDownRight,
  ArrowUpRight, Instagram, MessageCircle, Heart as HeartIcon,
  Shirt, Scale, Ban, Ticket, PartyPopper, MessageSquare, Hash,
  Gift, X, Smartphone, Share2, CalendarCheck, ChevronLeft, Download,
} from 'lucide-react';
import logoPure from '@/assets/logo-pure-pilates.png';

type TabKey =
  | 'inicio'
  | 'resultados'
  | 'promocao'
  | 'saude-marca'
  | 'indique'
  | 'calendario'
  | 'guia-copa'
  | 'hub-tutorial';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Página Inicial' },
  { key: 'resultados', label: 'Resultados Maio' },
  { key: 'promocao', label: 'Mês das Mães' },
  { key: 'saude-marca', label: 'Saúde de Marca' },
  { key: 'indique', label: 'Indique Pure' },
  { key: 'calendario', label: 'Calendário Junho' },
  { key: 'guia-copa', label: 'Guia Copa do Mundo' },
  { key: 'hub-tutorial', label: 'Novidades (você não pode perder!)' },
];

const PEACH = '#f3d7a7';
const PEACH_DARK = '#e9c688';

/* Dados parciais até 24/05 — Abril vs Maio */
const FUNIL_DATA = [
  { metric: 'Aulas Experimentais', abril: 8465, maio: 5748 },
  { metric: 'Presenças', abril: 6665, maio: 4940 },
  { metric: 'Matrículas', abril: 1288, maio: 210 },
  { metric: 'PurePass', abril: 1476, maio: 160 },
];

/* Saúde de Marca — sentimento */
const SENTIMENTO_ABRIL = [
  { name: 'Positivo', value: 41.7, color: 'hsl(var(--primary))' },
  { name: 'Neutro', value: 55.9, color: PEACH_DARK },
  { name: 'Negativo', value: 2.4, color: '#d97f7f' },
];
const SENTIMENTO_MAIO = [
  { name: 'Positivo', value: 28.4, color: 'hsl(var(--primary))' },
  { name: 'Neutro', value: 70.5, color: PEACH_DARK },
  { name: 'Negativo', value: 1.2, color: '#d97f7f' },
];

/* Trends em destaque · Abril e Maio 2026 — @purepilatesbr */
type TrendAnalysis = {
  introParas: React.ReactNode[];
  kpis: { value: number; label: string }[];
  comparativeParas?: React.ReactNode[];
  vsLabel?: string;
  vsItems?: { label: string; value: number }[];
  highlight?: {
    icon: 'star' | 'arrow-up' | 'trophy';
    eyebrow: string;
    content: React.ReactNode;
  };
  insightParas: React.ReactNode[];
};

type TrendPost = {
  shortcode: string;
  title: string;
  caption: string;
  likes: number;
  comments: number;
  postedAt: string;
  analysis: TrendAnalysis;
};

const TREND_POSTS: TrendPost[] = [
  {
    shortcode: 'DXRyymeEfeO',
    title: 'Trend "Será?"',
    caption: 'Pilates não fortalece, não define, não muda o corpo… será?',
    likes: 926,
    comments: 43,
    postedAt: '18/04',
    analysis: {
      introParas: [
        <>
          Em abril, o destaque de performance foi o Reel <em>"Pilates não fortalece, não define, não muda o corpo… será?"</em>, publicado em <strong>18/04</strong>.
        </>,
        <>
          O conteúdo registrou <strong>1.171 interações</strong>, <strong>18.454 contas alcançadas</strong> e <strong>26.261 visualizações</strong>, consolidando-se como o <strong>melhor post do mês</strong> em interações e alcance.
        </>,
      ],
      kpis: [
        { value: 1171, label: 'interações' },
        { value: 18454, label: 'contas alcançadas' },
        { value: 26261, label: 'visualizações' },
      ],
      comparativeParas: [
        <>
          O resultado ficou muito acima da média mensal: <strong>+423% em interações</strong>, <strong>+264% em alcance</strong>, <strong>+227% em visualizações</strong> e <strong>+398% em compartilhamentos</strong>. Além disso, o post também se destacou no comparativo geral do período analisado, ficando como o <strong>2º melhor conteúdo entre 129 publicações</strong> de janeiro a maio.
        </>,
      ],
      vsLabel: 'vs. média mensal',
      vsItems: [
        { label: 'Interações', value: 423 },
        { label: 'Alcance', value: 264 },
        { label: 'Visualizações', value: 227 },
        { label: 'Compartilhamentos', value: 398 },
      ],
      highlight: {
        icon: 'star',
        eyebrow: 'Comparativo geral do período',
        content: (
          <>
            <strong className="text-primary text-xl">2º melhor</strong> conteúdo entre{' '}
            <strong>129 publicações</strong> de <strong>janeiro a maio</strong>.
          </>
        ),
      },
      insightParas: [
        <>
          A boa performance indica que conteúdos com <strong>gancho provocativo</strong>, <strong>quebra de objeções</strong> e <strong>mensagem direta</strong> sobre os benefícios do Pilates têm alto potencial de gerar <strong>alcance, engajamento e conversas</strong> com o público.
        </>,
      ],
    },
  },
  {
    shortcode: 'DW6xdj2ET70',
    title: 'Trend "Frutas"',
    caption: 'Pilates como suas frutas favoritas.',
    likes: 528,
    comments: 35,
    postedAt: '09/04 · 13h54',
    analysis: {
      introParas: [
        <>
          O post publicado em <strong>09/04/2026 às 13h54</strong> foi um dos destaques de abril, com <strong>749 interações</strong>, <strong>13.197 contas alcançadas</strong> e <strong>20.951 visualizações</strong>, ficando entre os conteúdos de <strong>melhor desempenho do mês</strong>.
        </>,
      ],
      kpis: [
        { value: 749, label: 'interações' },
        { value: 13197, label: 'contas alcançadas' },
        { value: 20951, label: 'visualizações' },
      ],
      comparativeParas: [
        <>
          Em comparação com a média de abril, o conteúdo registrou resultado bastante superior, com <strong>+234% em interações</strong>, <strong>+160% em alcance</strong> e <strong>+161% em visualizações</strong>. Também se destacou em compartilhamentos, com <strong>186 envios</strong>, número <strong>358% acima</strong> da média do mês.
        </>,
      ],
      vsLabel: 'vs. média de abril',
      vsItems: [
        { label: 'Interações', value: 234 },
        { label: 'Alcance', value: 160 },
        { label: 'Visualizações', value: 161 },
      ],
      highlight: {
        icon: 'arrow-up',
        eyebrow: 'Destaque em compartilhamentos',
        content: (
          <>
            <strong className="text-primary text-xl">186 envios</strong> — <strong>358% acima</strong> da média do mês.
          </>
        ),
      },
      insightParas: [
        <>
          Um ponto importante para destacar é que esse conteúdo aproveitou uma <strong>trend em alta</strong>, adaptada de forma criativa para o contexto da marca. O uso dos <strong>personagens de frutas indo para o Pilates</strong> ajudou a gerar <strong>identificação imediata</strong>, trouxe um tom mais leve e bem-humorado e aumentou o <strong>potencial de compartilhamento</strong>. Além disso, a execução conseguiu unir <strong>repertório de internet</strong> com o universo da Pure Pilates, o que torna o conteúdo mais <strong>atual, memorável e próximo da linguagem das redes</strong>.
        </>,
      ],
    },
  },
  {
    shortcode: 'DYiG8zUpcEL',
    title: 'Reel "Des-coisar"',
    caption: 'Pilates para des-coisar as coisas que estão coisadas.',
    likes: 1700,
    comments: 12,
    postedAt: '19/05',
    analysis: {
      introParas: [
        <>
          O post publicado em <strong>19/05/2026</strong>, com a frase <em>"Pilates para des-coisar as coisas que estão coisadas"</em>, foi o <strong>principal destaque de maio</strong> e o <strong>melhor conteúdo do ano até agora</strong>.
        </>,
        <>
          A publicação alcançou <strong>2.090 interações</strong>, <strong>24.999 contas alcançadas</strong> e <strong>39.520 visualizações</strong>, ficando em <strong>1º lugar no ranking geral de janeiro a maio</strong> em interações, alcance, visualizações, curtidas, compartilhamentos e salvamentos.
        </>,
      ],
      kpis: [
        { value: 2090, label: 'interações' },
        { value: 24999, label: 'contas alcançadas' },
        { value: 39520, label: 'visualizações' },
      ],
      highlight: {
        icon: 'trophy',
        eyebrow: '1º lugar geral · janeiro a maio',
        content: (
          <>
            <span className="block mb-2 text-sm opacity-90">
              Líder do período em <strong>seis categorias</strong>:
            </span>
            <span className="flex flex-wrap gap-1.5">
              {['Interações', 'Alcance', 'Visualizações', 'Curtidas', 'Compartilhamentos', 'Salvamentos'].map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold"
                >
                  <Star className="h-3 w-3 fill-primary" />
                  {cat}
                </span>
              ))}
            </span>
          </>
        ),
      },
      insightParas: [
        <>
          O desempenho reforça a força de conteúdos com <strong>frase autoral</strong>, <strong>estética marcante</strong> e <strong>alta identificação emocional</strong>. A mensagem traduziu de forma simples uma <strong>dor comum do público</strong>: mente cheia, corpo travado e rotina no automático, conectando essa sensação ao Pilates como um momento de <strong>pausa, organização e autocuidado</strong>.
        </>,
        <>
          Além do alcance, o post gerou alto volume de <strong>compartilhamentos e salvamentos</strong>, mostrando que o conteúdo teve <strong>valor de identificação</strong> e reforçou bem o conceito <em>"A melhor hora do seu dia"</em>.
        </>,
      ],
    },
  },
];

const TrendBlock = ({ post }: { post: TrendPost }) => {
  const postUrl = `https://www.instagram.com/p/${post.shortcode}/`;
  const embedUrl = `https://www.instagram.com/p/${post.shortcode}/embed`;
  const HighlightIcon =
    post.analysis.highlight?.icon === 'star' ? Star :
    post.analysis.highlight?.icon === 'trophy' ? Trophy :
    ArrowUpRight;
  const vsCols = (post.analysis.vsItems?.length ?? 0) >= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  return (
    <Card className="overflow-hidden border-t-4 border-t-primary">
      <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-0">
        {/* Coluna esquerda — vídeo + KPIs do post */}
        <div className="bg-muted/20 border-b lg:border-b-0 lg:border-r border-foreground/5 p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Instagram className="h-4 w-4 text-primary" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                @purepilatesbr · {post.postedAt}
              </span>
            </div>
            <h3 className="font-heading font-bold text-xl">{post.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
              "{post.caption}"
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-foreground/10 bg-background">
            <iframe
              src={embedUrl}
              title={post.title}
              className="w-full block"
              style={{ height: 640, border: 0 }}
              loading="lazy"
              allowTransparency
              scrolling="no"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <HeartIcon className="h-4 w-4 text-primary mx-auto mb-1 fill-primary" />
              <p className="text-2xl font-heading font-bold text-primary tabular-nums">
                <AnimatedCounter end={post.likes} />
              </p>
              <p className="text-[10px] uppercase tracking-widest text-primary font-semibold mt-0.5">curtidas</p>
            </div>
            <div className="rounded-lg bg-background border border-foreground/5 p-3 text-center">
              <MessageCircle className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-2xl font-heading font-bold text-foreground tabular-nums">
                <AnimatedCounter end={post.comments} />
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">comentários</p>
            </div>
          </div>

          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors group"
          >
            <Instagram className="h-3.5 w-3.5" />
            Já engajou? Curta no Instagram
            <ExternalLink className="h-3 w-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Coluna direita — análise (parágrafos do relatório + visuais como reforço) */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Header da análise */}
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
              Análise da performance
            </span>
          </div>

          {/* Parágrafos de introdução (texto verbatim do relatório) */}
          <div className="space-y-3">
            {post.analysis.introParas.map((para, idx) => (
              <p key={idx} className="text-sm sm:text-base text-foreground/85 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Visual: KPIs dos números citados acima */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {post.analysis.kpis.map((k, idx) => (
              <div
                key={k.label}
                className={cn(
                  'rounded-xl p-4 text-center',
                  idx === 0 ? 'bg-primary/10' : 'bg-[#f3d7a7]/40'
                )}
              >
                <p className={cn(
                  'text-3xl font-heading font-bold tabular-nums',
                  idx === 0 ? 'text-primary' : 'text-foreground'
                )}>
                  <AnimatedCounter end={k.value} />
                </p>
                <p className={cn(
                  'text-[10px] uppercase tracking-widest font-semibold mt-1',
                  idx === 0 ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {k.label}
                </p>
              </div>
            ))}
          </div>

          {/* Parágrafos da comparação (texto verbatim, opcional) */}
          {post.analysis.comparativeParas && post.analysis.comparativeParas.length > 0 && (
            <div className="space-y-3">
              {post.analysis.comparativeParas.map((para, idx) => (
                <p key={idx} className="text-sm sm:text-base text-foreground/85 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          )}

          {/* Visual: badges de variação vs. média (opcional) */}
          {post.analysis.vsItems && post.analysis.vsItems.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                {post.analysis.vsLabel}
              </p>
              <div className={cn('grid grid-cols-2 gap-3', vsCols)}>
                {post.analysis.vsItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-primary/20 bg-card p-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span className="text-xl font-heading font-bold tabular-nums">
                        <AnimatedCounter end={item.value} suffix="%" />
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual: destaque (ranking ou shares) */}
          {post.analysis.highlight && (
            <div className="rounded-xl bg-foreground text-background p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="rounded-full bg-primary/20 p-3 shrink-0 w-fit">
                <HighlightIcon className={cn(
                  'h-5 w-5 text-primary',
                  post.analysis.highlight.icon === 'star' && 'fill-primary'
                )} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold mb-1">
                  {post.analysis.highlight.eyebrow}
                </p>
                <p className="text-base leading-snug">
                  {post.analysis.highlight.content}
                </p>
              </div>
            </div>
          )}

          {/* Parágrafos de insight (texto verbatim) */}
          <div className="rounded-xl bg-[#fdf3df] border border-primary/20 p-5 flex gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              {post.analysis.insightParas.map((para, idx) => (
                <p key={idx} className="text-sm text-foreground/85 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════════
   PÁGINA INICIAL — A carta do franqueado
   ══════════════════════════════════════════════════════════════ */
const PaginaInicial = ({ goTo }: { goTo: (tab: TabKey) => void }) => (
  <>
    {/* Hero */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-8 sm:p-12">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8 items-start">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <img src={logoPure} alt="Pure Pilates" className="h-9 sm:h-11 object-contain" />
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">
                Timeline · Junho 2026
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-bold leading-[1.1] text-foreground">
              Caro<br />franqueado,
            </h1>

            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              O mês de Maio trouxe um aviso importante: novas matrículas superaram a meta em <strong>11%</strong>, mas isso foi impulsionado por campanhas anteriores e pela promoção <strong>Dia das Mães</strong>. Nos indicadores de aquisição, o sinal é diferente: <strong>custos crescentes</strong>, sazonalidade de inverno em movimento, <strong>leads novos 10% abaixo da meta</strong>.
            </p>
          </div>

          <div className="space-y-4 rounded-xl bg-background/70 backdrop-blur-sm border border-foreground/5 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs uppercase tracking-widest font-bold">O padrão de Junho e Julho</span>
            </div>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              Este é o padrão que se repetirá e intensificará em junho e julho.<br />
              <strong>A demanda cairá. Os custos subirão.</strong> A aquisição via mídia paga enfrentará desafios cada vez maiores.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="flex flex-col items-center rounded-lg bg-background p-3 border border-foreground/5">
                <TrendingDown className="h-5 w-5 text-primary mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Demanda</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-background p-3 border border-foreground/5">
                <ArrowUpRight className="h-5 w-5 text-primary mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Custos</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-background p-3 border border-foreground/5">
                <Snowflake className="h-5 w-5 text-primary mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Inverno</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* Carta completa */}
    <AnimatedSection>
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Quote className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold">Mensagem do Departamento de Marketing</span>
          </div>

          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Neste cenário, há apenas <strong>uma resposta: as indicações</strong>. Não como complemento, mas como estratégia principal. Encaminhamos um pack completo de materiais para ativar <strong>"Indique Pilates"</strong> em cada aula, em cada momento de conexão com seus alunos. Orientem suas equipes para falar sobre a recompensa: <strong>uma massagem para quem indica</strong>. Façam das indicações o centro da estratégia de crescimento.
          </p>

          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Paralelamente, usem a criatividade nas <strong>comunicações temáticas</strong> (festa junina, Copa, Orgulho, Dia dos Namorados) para reter clientes atuais. Preparamos um guia rápido para explicar o que podemos fazer com o tema <strong>Copa do Mundo</strong>.
          </p>

          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Os números estão aqui. O sinal está claro. O resultado será construído nos estúdios, nas aulas, nas conversas entre vocês e seus alunos. <strong>Junho e julho serão meses de crescimento através das recomendações.</strong>
          </p>

          <p className="text-xs uppercase tracking-widest text-primary font-bold pt-2">
            Departamento de Marketing Pure Pilates
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Agenda — preview clicável */}
    <AnimatedSection>
      <SectionTitle>Agenda de Junho</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Clique em qualquer bloco para ir direto à seção:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { key: 'resultados' as TabKey, icon: BarChart3, title: 'Resultados Abril + Maio', desc: 'Campanhas A–E, leitura parcial até 25/05.' },
        { key: 'promocao' as TabKey, icon: Heart, title: 'Promoção Dia das Mães', desc: 'Códigos PUREPASSMAES e PUREMAES50 — vendas e visualizações.' },
        { key: 'saude-marca' as TabKey, icon: ShieldCheck, title: 'Saúde de marca', desc: 'Sentimento abril vs maio e publicações em destaque.' },
        { key: 'indique' as TabKey, icon: HandHeart, title: 'Indique Pure', desc: 'A resposta estratégica para junho e julho.' },
        { key: 'calendario' as TabKey, icon: Calendar, title: 'Calendário do mês', desc: 'Festa junina, Copa, Orgulho, Dia dos Namorados.' },
        { key: 'hub-tutorial' as TabKey, icon: BookOpen, title: 'Seções novas no HUB', desc: 'Tutorial do Marketing e Mídia apartada.' },
      ].map((item, i) => (
        <AnimatedSection key={item.key} variant="fade-up" delay={i * 70}>
          <button
            type="button"
            onClick={() => goTo(item.key)}
            className="text-left w-full h-full rounded-lg border bg-card p-5 hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <item.icon className="h-6 w-6 text-primary" />
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="font-heading font-bold text-base mb-1">{item.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </button>
        </AnimatedSection>
      ))}
    </div>
  </>
);

/* ══════════════════════════════════════════════════════════════
   RESULTADOS MAIO — parcial até 24/05
   ══════════════════════════════════════════════════════════════ */
const ResultadosPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Maio · Performance · Resultado parcial (até 24/05)
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Abril vs <span className="text-primary">Maio.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Campanhas A–E. Leitura parcial dos quatro principais indicadores de aquisição.
        </p>
      </div>
    </AnimatedSection>

    {/* Indicadores destaque */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <AnimatedSection variant="scale-up" delay={0}>
        <Card className="border-t-4 border-t-[#e9c688]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-primary/10 p-2">
                <ArrowDownRight className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">vs. meta de Maio</span>
            </div>
            <p className="text-4xl sm:text-5xl font-heading font-bold text-primary">
              −10,9%
            </p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Leads novos abaixo da meta — sinal de sazonalidade de inverno em movimento.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="scale-up" delay={120}>
        <Card className="border-t-4 border-t-[#e9c688]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-primary/10 p-2">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">vs. meta de Maio</span>
            </div>
            <p className="text-4xl sm:text-5xl font-heading font-bold text-primary">
              +33,8%
            </p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Matrículas acima da meta — impulso de campanhas anteriores e Dia das Mães.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* Gráfico comparativo */}
    <AnimatedSection variant="fade-up">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-heading font-semibold mb-1">Comparativo Abril × Maio (parcial)</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Os quatro indicadores principais da aquisição via Campanhas A–E.
          </p>
          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FUNIL_DATA} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e9c688',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => v.toLocaleString('pt-BR')}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="abril" name="Abril" fill={PEACH_DARK} radius={[6, 6, 0, 0]} animationDuration={1200} />
                <Bar dataKey="maio" name="Maio (até 24/05)" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={1200} animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Tabela detalhada */}
    <AnimatedSection>
      <SectionTitle>Detalhamento por indicador</SectionTitle>
    </AnimatedSection>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {FUNIL_DATA.map((row, i) => {
        const delta = ((row.maio - row.abril) / row.abril) * 100;
        return (
          <AnimatedSection key={row.metric} variant="fade-up" delay={i * 90}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3">
                  {row.metric}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Abril</span>
                    <span className="text-lg font-heading font-bold tabular-nums">
                      <AnimatedCounter end={row.abril} />
                    </span>
                  </div>
                  <div className="h-px bg-foreground/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Maio<span className="text-[10px] ml-1">(até 24/05)</span></span>
                    <span className="text-lg font-heading font-bold text-primary tabular-nums">
                      <AnimatedCounter end={row.maio} />
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-foreground/10 flex items-center gap-1 text-xs">
                  <ArrowDownRight className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">
                    {delta.toFixed(1).replace('.', ',')}% parcial
                  </span>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        );
      })}
    </div>

    {/* Nota de rodapé */}
    <AnimatedSection>
      <div className="rounded-xl bg-muted/40 border border-foreground/5 p-5 flex gap-3">
        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          *os valores de meta correspondem ao painel de controle de performance com valores estabelecidos para crescimento e otimizações das campanhas da rede. São parâmetros acompanhados internamente prezando pelo bom desempenho e clusterizações das campanhas.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   PROMOÇÃO MÊS DAS MÃES — códigos utilizados
   ══════════════════════════════════════════════════════════════ */
const PromocaoPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Promoção mês das Mães · Códigos utilizados
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Cupons,<br />
          <span className="text-primary">visualizações e vendas.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Como cada código se comportou na ativação da campanha de Maio.
        </p>
      </div>
    </AnimatedSection>

    {/* Como foi a ativação */}
    <AnimatedSection>
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Quote className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold">Como foi a ativação</span>
          </div>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Para o <strong>Pure Pass</strong>, tivemos esforços em leads da base através das ativações de <strong>e-mails, mídia paga e aplicativo</strong>, com mais de <strong>18 mil visualizações</strong>, totalizando o resgate do cupom <strong>"PUREPASSMAES"</strong> em mais de <strong>116 vendas</strong>. Em termos de <strong>Pure Club</strong>, onde os esforços foram somados com a exposição nos estúdios, tivemos <strong>1,8 mil visualizações</strong> e <strong>11 vendas</strong> com o cupom <strong>"PUREMAES50"</strong>.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Cupons em destaque */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatedSection variant="scale-up" delay={0}>
        <Card className="h-full border-t-4 border-t-[#e9c688]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Tag className="h-7 w-7 text-primary" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Pure Pass</span>
            </div>
            <div className="rounded-lg border-2 border-dashed border-primary/40 bg-amber-50 px-4 py-3 mb-4">
              <span className="font-mono text-base font-bold tracking-wide text-foreground">
                PUREPASSMAES
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              Esforços em leads da base através das ativações de <strong>e-mails</strong>, <strong>mídia paga</strong> e <strong>aplicativo</strong>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <Eye className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold tabular-nums">
                  <AnimatedCounter end={18} suffix=" mil+" />
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">visualizações</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <CheckCircle2 className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold text-primary tabular-nums">
                  <AnimatedCounter end={116} suffix="+" />
                </p>
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mt-1">vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="scale-up" delay={150}>
        <Card className="h-full border-t-4 border-t-[#e9c688]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Tag className="h-7 w-7 text-primary" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Pure Club</span>
            </div>
            <div className="rounded-lg border-2 border-dashed border-primary/40 bg-amber-50 px-4 py-3 mb-4">
              <span className="font-mono text-base font-bold tracking-wide text-foreground">
                PUREMAES50
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              Esforços somados com <strong>exposição nos estúdios</strong> — ativação local + digital.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <Eye className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold tabular-nums">1,8 mil</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">visualizações</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <CheckCircle2 className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold text-primary tabular-nums">
                  <AnimatedCounter end={11} />
                </p>
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mt-1">vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* Conclusão */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-2xl bg-[#f3d7a7] p-8 sm:p-10">
        <Sparkles className="h-7 w-7 text-primary mb-3" />
        <p className="text-lg sm:text-xl font-heading font-semibold text-foreground leading-snug max-w-3xl">
          O empurrão do <span className="text-primary">Dia das Mães</span> levou as matrículas acima da meta. Em Junho, a tarefa é <span className="text-primary">sustentar a demanda sem o mesmo gatilho sazonal</span>.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   SAÚDE DE MARCA — sentimento + publicações
   ══════════════════════════════════════════════════════════════ */
const SentimentRing = ({ data, title, sub }: { data: typeof SENTIMENTO_ABRIL; title: string; sub: string }) => (
  <Card className="h-full">
    <CardContent className="pt-6">
      <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{sub}</p>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              animationDuration={1200}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e9c688', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => `${v.toFixed(1).replace('.', ',')}%`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-3">
        {data.map((item) => {
          const Icon = item.name === 'Positivo' ? ThumbsUp : item.name === 'Neutro' ? Minus : ThumbsDown;
          return (
            <div key={item.name} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: item.color }} />
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground flex-1">{item.name}</span>
              <span className="text-sm font-bold tabular-nums">{item.value.toFixed(1).replace('.', ',')}%</span>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

const SaudeMarcaPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Saúde de Marca · Resultado parcial (até 25/05)
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Sentimento <span className="text-primary">da marca.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Análise de menções e percepção pública da Pure Pilates em abril e maio.
        </p>
      </div>
    </AnimatedSection>

    {/* Sentimento abril vs maio */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatedSection variant="fade-up" delay={0}>
        <SentimentRing data={SENTIMENTO_ABRIL} title="Abril" sub="Mês fechado" />
      </AnimatedSection>
      <AnimatedSection variant="fade-up" delay={150}>
        <SentimentRing data={SENTIMENTO_MAIO} title="Maio" sub="Parcial até 25/05" />
      </AnimatedSection>
    </div>

    {/* Publicações em destaque */}
    <AnimatedSection>
      <SectionTitle>Publicações em destaque</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Os reels com maior tração no <strong>@purepilatesbr</strong> em abril e maio. Veja o vídeo de cada um, leia a análise e, se gostou, curta direto no Instagram.
      </p>
    </AnimatedSection>

    <div className="space-y-8">
      {TREND_POSTS.map((post, i) => (
        <AnimatedSection key={post.shortcode} variant="fade-up" delay={i * 100}>
          <TrendBlock post={post} />
        </AnimatedSection>
      ))}
    </div>

    <AnimatedSection>
      <div className="rounded-xl bg-muted/40 border border-foreground/5 p-5 flex gap-3">
        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Snapshot dos números atualizado em <strong>25/05/2026</strong>. Engajamento continua acumulando nos posts originais — clique para conferir o valor atual.
        </p>
      </div>
    </AnimatedSection>

  </>
);

/* ══════════════════════════════════════════════════════════════
   INDIQUE PURE PILATES — a resposta estratégica
   ══════════════════════════════════════════════════════════════ */
const IndiquePage = () => (
  <>
    {/* Hero · arte pronta da campanha Indique Pure */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <img
          src="/Arte%20pronta.jpeg"
          alt="Indique Pure — quanto mais você indica, mais massagem você ganha"
          className="block w-full h-auto"
        />
      </div>
    </AnimatedSection>

    {/* CTA · Baixar artes da campanha em Artes Prontas */}
    <AnimatedSection variant="fade-up">
      <a
        href="/artes-prontas"
        className="block rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6 hover:border-primary hover:bg-primary/10 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/15 p-3 shrink-0 group-hover:scale-110 transition-transform">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1">
              Pack da campanha
            </p>
            <p className="font-heading font-bold text-base sm:text-lg text-foreground leading-snug">
              Baixar as artes do <span className="text-primary">Indique Pure</span>
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              Materiais oficiais para ativar a campanha em cada aula, atendimento e canal local.
            </p>
          </div>
          <ChevronRight className="hidden sm:block h-6 w-6 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </a>
    </AnimatedSection>

    {/* Subtítulo de transição */}
    <AnimatedSection>
      <div className="flex items-center gap-3 max-w-3xl">
        <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
          <HandHeart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
            A resposta · Junho e Julho
          </p>
          <p className="text-base text-foreground/85 leading-relaxed mt-1">
            Neste cenário, há apenas <strong>uma resposta: as indicações</strong>. Não como complemento, mas como <strong className="text-primary">estratégia principal</strong>.
          </p>
        </div>
      </div>
    </AnimatedSection>

    {/* Três pilares da estratégia */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full border-t-4 border-t-[#e9c688] hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <FileText className="h-7 w-7 text-primary mb-4" />
            <h4 className="font-heading font-bold text-lg mb-2">Pack completo de materiais</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Encaminhamos um pack completo para ativar <strong>"Indique Pilates"</strong> em cada aula, em cada momento de conexão com seus alunos.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={150}>
        <Card className="h-full border-t-4 border-t-[#e9c688] hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Sparkles className="h-7 w-7 text-primary mb-4" />
            <h4 className="font-heading font-bold text-lg mb-2">A recompensa: massagem</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Orientem suas equipes para falar sobre a recompensa: <strong>uma massagem para quem indica</strong>.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={300}>
        <Card className="h-full border-t-4 border-t-[#e9c688] hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Users className="h-7 w-7 text-primary mb-4" />
            <h4 className="font-heading font-bold text-lg mb-2">Indicações no centro</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Façam das indicações o <strong>centro da estratégia de crescimento</strong> — toda equipe alinhada.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* Por que indicações: jornada do cliente */}
    <AnimatedSection>
      <SectionTitle>Por que indicações, agora?</SectionTitle>
    </AnimatedSection>

    <AnimatedSection variant="fade-up">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Snowflake className="h-5 w-5 text-primary" />
                <span className="text-xs uppercase tracking-widest text-primary font-bold">Sazonalidade</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sazonalidade de inverno em movimento — leads novos <strong>10% abaixo da meta</strong>.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-primary" />
                <span className="text-xs uppercase tracking-widest text-primary font-bold">Custos</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Custos crescentes na mídia paga — eficiência cai conforme o leilão esquenta.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="text-xs uppercase tracking-widest text-primary font-bold">Aluno indicando</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A indicação chega com <strong>confiança e contexto</strong> — converte com custo zero de mídia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Closing */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-2xl bg-[#f3d7a7] p-8 sm:p-10">
        <Quote className="h-7 w-7 text-primary mb-3" />
        <p className="text-lg sm:text-xl font-heading font-semibold text-foreground leading-snug max-w-3xl">
          O resultado será construído nos <span className="text-primary">estúdios</span>, nas <span className="text-primary">aulas</span>, nas <span className="text-primary">conversas</span> entre vocês e seus alunos.
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          Junho e julho serão meses de crescimento através das recomendações.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   CALENDÁRIO — temáticos de junho
   ══════════════════════════════════════════════════════════════ */
const CalendarioPage = ({ goTo }: { goTo: (tab: TabKey) => void }) => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Comunicações temáticas · Junho
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Criatividade <br />
          <span className="text-primary">para reter.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Usem a criatividade nas comunicações temáticas para reter clientes atuais. Quatro temas no mês:
        </p>
      </div>
    </AnimatedSection>

    {/* Banner · Mídias Sociais já com os conteúdos */}
    <AnimatedSection variant="fade-up">
      <a
        href="/midias-sociais"
        className="block rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6 hover:border-primary hover:bg-primary/10 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/15 p-3 shrink-0 group-hover:scale-110 transition-transform">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                Conteúdos disponíveis
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                <CheckCircle2 className="h-3 w-3" />
                já no ar
              </span>
            </div>
            <p className="font-heading font-bold text-base sm:text-lg text-foreground leading-snug">
              Artes prontas dos 4 temas em <span className="text-primary">Mídias Sociais</span>
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              Festa Junina, Copa do Mundo, Orgulho e Dia dos Namorados — baixe os KVs e use no canal local.
            </p>
          </div>
          <ChevronRight className="hidden sm:block h-6 w-6 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </a>
    </AnimatedSection>

    {/* 4 temas em cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { icon: Flag, title: 'Festa Junina', desc: 'Tradição, sanfona e quentinho — toque local em cada unidade.', color: 'from-amber-400 to-orange-500' },
        { icon: Trophy, title: 'Copa do Mundo', desc: 'Guia rápido preparado: como ativar a campanha com o tema.', color: 'from-emerald-500 to-emerald-700', highlight: true, onClick: () => goTo('guia-copa') },
        { icon: Rainbow, title: 'Orgulho', desc: 'Acolhimento e diversidade — Pure para todos os corpos.', color: 'from-pink-400 to-purple-500' },
        { icon: Heart, title: 'Dia dos Namorados', desc: 'Plano em dupla, presentes e ativações de relacionamento.', color: 'from-rose-400 to-red-500' },
      ].map((tema, i) => {
        const cardInner = (
          <>
            <div className={cn('h-2 bg-gradient-to-r rounded-t-lg', tema.color)} />
            <CardContent className="pt-5">
              <tema.icon className="h-7 w-7 text-primary mb-3" />
              <h4 className="font-heading font-bold text-base mb-2">{tema.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tema.desc}
              </p>
              {tema.highlight && (
                <div className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary font-bold group-hover:gap-2 transition-all">
                  <Star className="h-3 w-3 fill-primary" />
                  Guia rápido disponível
                  <ChevronRight className="h-3 w-3" />
                </div>
              )}
            </CardContent>
          </>
        );
        return (
          <AnimatedSection key={tema.title} variant="fade-up" delay={i * 100}>
            {tema.onClick ? (
              <button
                type="button"
                onClick={tema.onClick}
                className="text-left w-full h-full group"
              >
                <Card className={cn(
                  'h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer',
                  tema.highlight && 'ring-2 ring-primary/40'
                )}>
                  {cardInner}
                </Card>
              </button>
            ) : (
              <Card className="h-full hover:shadow-lg transition-all">
                {cardInner}
              </Card>
            )}
          </AnimatedSection>
        );
      })}
    </div>

    {/* Destaque Copa do Mundo — leva pra aba dedicada */}
    <AnimatedSection variant="scale-up">
      <button
        type="button"
        onClick={() => goTo('guia-copa')}
        className="w-full text-left rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 hover:border-primary hover:bg-primary/10 hover:shadow-lg transition-all group"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="rounded-full bg-primary/10 p-5 shrink-0 group-hover:bg-primary/20 transition-colors">
            <Trophy className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
              Destaque · Copa do Mundo
            </p>
            <h3 className="text-2xl font-heading font-bold mb-2">
              Guia rápido para o tema Copa
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Preparamos um guia completo com as <strong>diretrizes de marca</strong> e o <strong>guia de uso comercial</strong> para o tema Copa do Mundo. Acesse para alinhar a comunicação local sem descaracterizar a identidade Pure.
            </p>
          </div>
          <ChevronRight className="hidden md:block h-7 w-7 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </button>
    </AnimatedSection>

    <AnimatedSection>
      <div className="rounded-xl bg-muted/40 border border-foreground/5 p-5 flex gap-3">
        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          A função do calendário temático é <strong>reter clientes atuais</strong>. O motor de aquisição em junho é o <strong>Indique Pure</strong>.
        </p>
      </div>
    </AnimatedSection>

    {/* Calendário critérios safras e DT's */}
    <AnimatedSection>
      <SectionTitle>Calendário · critérios safras e DT's</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-4xl leading-relaxed">
        Critérios para o calendário promocional considerando <strong>DT's</strong> e <strong>sazonalidades do varejo</strong>. O acompanhamento de <strong>leads novos de A–E por dia trabalhado</strong> parametriza o volume adequado para os resultados. As unidades estão clusterizadas dentro das campanhas para entregabilidade da mídia — mas, visto o desafio do ano e os resultados de clientes ativos, o escopo abaixo é mais uma <strong>atividade estratégica</strong>.
      </p>
    </AnimatedSection>

    {/* Tabela de safras × atividade */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          tier: 'Alta',
          months: ['Janeiro'],
          activity: 'Awareness',
          subActivity: 'Aula Experimental',
          color: 'bg-emerald-50 border-emerald-200',
          tierColor: 'text-emerald-700',
        },
        {
          tier: 'Média-Alta',
          months: ['Fevereiro', 'Março', 'Agosto', 'Setembro', 'Outubro'],
          activity: 'Média-Alta',
          subActivity: 'Aula Experimental',
          color: 'bg-sky-50 border-sky-200',
          tierColor: 'text-sky-700',
        },
        {
          tier: 'Média',
          months: ['Abril', 'Maio', 'Novembro'],
          activity: 'Média',
          subActivity: 'Aula Experimental',
          color: 'bg-amber-50 border-amber-200',
          tierColor: 'text-amber-700',
        },
        {
          tier: 'Baixa',
          months: ['Junho', 'Julho', 'Dezembro'],
          activity: 'Baixa',
          subActivity: 'MGM "Indique Pilates"',
          color: 'bg-primary/10 border-primary',
          tierColor: 'text-primary',
          isCurrent: true,
        },
      ].map((col, i) => (
        <AnimatedSection key={col.tier} variant="fade-up" delay={i * 100}>
          <Card className={cn(
            'h-full border-2 transition-all',
            col.color,
            col.isCurrent && 'ring-2 ring-primary shadow-lg'
          )}>
            <CardContent className="pt-5 space-y-4">
              {col.isCurrent && (
                <div className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] uppercase tracking-widest text-primary-foreground font-bold">
                  <Star className="h-3 w-3 fill-current" />
                  Mês atual
                </div>
              )}
              <div>
                <p className={cn('text-2xl font-heading font-black mb-2', col.tierColor)}>
                  {col.tier}
                </p>
                <ul className="space-y-1">
                  {col.months.map((m) => (
                    <li key={m} className={cn(
                      'text-sm leading-snug',
                      col.isCurrent && m === 'Junho'
                        ? 'font-bold text-primary'
                        : 'text-foreground/75'
                    )}>
                      {m}
                      {col.isCurrent && m === 'Junho' && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wider text-primary font-bold">
                          ← agora
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divisor com seta para baixo */}
              <div className="flex justify-center">
                <ArrowDownRight className={cn(
                  'h-5 w-5 rotate-45',
                  col.isCurrent ? 'text-primary' : 'text-muted-foreground/40'
                )} />
              </div>

              <div>
                <p className={cn(
                  'text-[10px] uppercase tracking-widest font-bold mb-1',
                  col.tierColor
                )}>
                  {col.activity}
                </p>
                <p className={cn(
                  'text-sm leading-snug',
                  col.isCurrent ? 'font-bold text-foreground' : 'text-foreground/75'
                )}>
                  {col.subActivity}
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>

    {/* Nota de leitura */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-xl bg-foreground text-background p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="rounded-full bg-primary/20 p-3 shrink-0 w-fit">
          <Snowflake className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold mb-1">
            Junho · Safra baixa
          </p>
          <p className="text-base sm:text-lg leading-snug">
            Cluster <strong className="text-primary">Baixa</strong> — atividade principal é a campanha <strong className="text-primary">MGM "Indique Pilates"</strong>. Por isso o foco do mês é em <strong>indicações</strong>, não em mídia paga.
          </p>
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   GUIA COPA DO MUNDO — diretrizes de marca + uso comercial
   ══════════════════════════════════════════════════════════════ */

type RuleVariant = 'allow' | 'gift' | 'forbid' | 'balance';

const RuleItem = ({
  variant,
  title,
  desc,
  delay = 0,
}: {
  variant: RuleVariant;
  title: string;
  desc: string;
  delay?: number;
}) => {
  const style =
    variant === 'forbid'
      ? 'border-2 border-destructive/30 bg-destructive/5'
      : variant === 'balance'
      ? 'border-2 border-primary/20 bg-primary/5'
      : 'border bg-card';
  const Icon =
    variant === 'allow' ? CheckCircle2 :
    variant === 'gift' ? Gift :
    variant === 'forbid' ? X :
    Scale;
  const iconWrap =
    variant === 'forbid'
      ? 'bg-destructive/10 text-destructive'
      : variant === 'gift'
      ? 'bg-primary/10 text-primary'
      : variant === 'balance'
      ? 'bg-primary/15 text-primary'
      : 'bg-emerald-100 text-emerald-700';
  const titleClass =
    variant === 'forbid' ? 'text-destructive' :
    variant === 'balance' ? 'text-primary' :
    'text-foreground';
  return (
    <AnimatedSection variant="fade-up" delay={delay}>
      <div className={cn('rounded-xl p-4 flex gap-3 hover:shadow-md transition-shadow', style)}>
        <div className={cn('rounded-full p-1.5 shrink-0 mt-0.5', iconWrap)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className={cn('font-heading font-bold text-sm mb-1 leading-snug', titleClass)}>{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      </div>
    </AnimatedSection>
  );
};

const GuideHeader = ({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) => (
  <div className="bg-gradient-to-r from-primary to-primary/85 text-primary-foreground px-6 py-5 sm:px-8 sm:py-6">
    <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80 mb-1">{eyebrow}</p>
    <h3 className="text-2xl sm:text-3xl font-heading font-bold leading-tight">{title}</h3>
    <p className="text-sm opacity-90 mt-3 max-w-3xl leading-relaxed">{desc}</p>
  </div>
);

const GuideFooter = () => (
  <div className="bg-foreground text-background px-6 py-4 sm:px-8 flex items-center gap-3">
    <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
    <p className="text-sm">
      <strong className="uppercase tracking-widest text-xs text-primary">Lembre-se:</strong>{' '}
      Nossa identidade é o que nos torna únicos. Cada detalhe comunica quem somos.
    </p>
  </div>
);

const ColumnLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-block bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
    {children}
  </div>
);

const GuiaCopaPage = () => (
  <>
    {/* Hero da aba */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-primary/10 animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
              Guia do mês · Copa do Mundo
            </span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
            Torcida com <span className="text-primary">identidade Pure.</span>
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
            Dois guias para alinhar a equipe e a comunicação durante o mundial: <strong>diretrizes visuais</strong> da rede e o <strong>guia de uso comercial</strong> com o que pode e o que não pode falar publicamente.
          </p>
        </div>
      </div>
    </AnimatedSection>

    {/* GUIA 1 — Diretrizes de marca */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden">
        <GuideHeader
          eyebrow="Diretrizes de marca"
          title="Torcida com identidade Pure Pilates"
          desc="Este guia define as regras para o uso de uniformes e a decoração das unidades Pure Pilates durante períodos de celebração, garantindo a preservação da identidade visual limpa, organizada e elegante da rede."
        />
        <CardContent className="pt-6 grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* UNIFORME DA EQUIPE */}
          <div className="space-y-4">
            <ColumnLabel>
              <span className="inline-flex items-center gap-2">
                <Shirt className="h-3 w-3" />
                Uniforme da equipe
              </span>
            </ColumnLabel>
            <RuleItem
              variant="allow"
              title="Uso obrigatório do uniforme oficial Pure Pilates"
              desc="Professores devem vestir o padrão da rede em aulas, atendimentos e vídeos."
              delay={0}
            />
            <RuleItem
              variant="gift"
              title="Camisetas promocionais são apenas brindes"
              desc="Peças temáticas criadas pela unidade não substituem o uniforme oficial da equipe."
              delay={120}
            />
            <RuleItem
              variant="forbid"
              title="Proibição de camisetas da seleção brasileira ou temáticas"
              desc="Peças que descaracterizam o padrão visual da marca não são permitidas como uniforme."
              delay={240}
            />
          </div>

          {/* DECORAÇÃO DA UNIDADE */}
          <div className="space-y-4">
            <ColumnLabel>
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Decoração da unidade
              </span>
            </ColumnLabel>
            <RuleItem
              variant="allow"
              title="Foco em espaços instagramáveis e recepção"
              desc="Priorize um cantinho para fotos ou painéis simples para não descaracterizar a experiência."
              delay={0}
            />
            <RuleItem
              variant="allow"
              title="Decoração pontual e controlada"
              desc="Elementos visuais não devem ocupar o estúdio inteiro ou poluir o ambiente."
              delay={120}
            />
            <RuleItem
              variant="balance"
              title="Preservação da identidade visual Pure"
              desc="O ambiente deve permanecer limpo, organizado, elegante e alinhado ao padrão."
              delay={240}
            />
          </div>
        </CardContent>
        <GuideFooter />
      </Card>
    </AnimatedSection>

    {/* GUIA 2 — Guia de uso comercial */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden">
        <GuideHeader
          eyebrow="Guia de uso comercial"
          title="Copa do Mundo"
          desc="O que está proibido por restrições oficiais e o que dá pra explorar com criatividade genérica — para comunicar a marca sem cair em violação de direitos."
        />
        <CardContent className="pt-6 grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* O QUE É PROIBIDO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <ColumnLabel>
                <span className="inline-flex items-center gap-2">
                  <Ban className="h-3 w-3" />
                  O que é proibido
                </span>
              </ColumnLabel>
              <span className="text-[10px] uppercase tracking-widest text-destructive font-bold">
                Restrições oficiais
              </span>
            </div>

            <AnimatedSection variant="fade-up" delay={0}>
              <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 flex gap-3 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-destructive/10 p-1.5 shrink-0 mt-0.5 text-destructive">
                  <Ban className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm mb-1 leading-snug text-destructive">
                    Termos e marcas registradas
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    É proibido usar <strong>"FIFA"</strong>, <strong>"Copa do Mundo"</strong> ou <strong>"World Cup"</strong> em posts comerciais.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection variant="fade-up" delay={120}>
              <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 flex gap-3 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-destructive/10 p-1.5 shrink-0 mt-0.5 text-destructive">
                  <Hash className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm mb-1 leading-snug text-destructive">
                    Identidade visual e símbolos
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Não utilize logotipos oficiais, hashtags da marca ou elementos visuais exclusivos do evento.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection variant="fade-up" delay={240}>
              <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 flex gap-3 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-destructive/10 p-1.5 shrink-0 mt-0.5 text-destructive">
                  <Ticket className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm mb-1 leading-snug text-destructive">
                    Promoções e ingressos
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Proibido sortear ingressos ou sugerir que sua marca é parceira oficial do torneio.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* Tabela de termos proibidos */}
            <AnimatedSection variant="fade-up" delay={360}>
              <div className="rounded-xl overflow-hidden border border-foreground/10 mt-2">
                <div className="grid grid-cols-[140px_1fr] bg-foreground text-background text-[10px] uppercase tracking-widest font-bold">
                  <div className="px-3 py-2.5 border-r border-background/15">Categoria</div>
                  <div className="px-3 py-2.5">Termos proibidos</div>
                </div>
                {[
                  { cat: 'Nomes oficiais', terms: 'Copa do Mundo da FIFA 26™, Mundial™' },
                  { cat: 'Internacionais', terms: 'World Cup 26™, World Cup™' },
                  { cat: 'Entidade', terms: 'FIFA®' },
                ].map((row, i) => (
                  <div
                    key={row.cat}
                    className={cn(
                      'grid grid-cols-[140px_1fr] text-xs',
                      i % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                    )}
                  >
                    <div className="px-3 py-2.5 border-r border-foreground/10 font-semibold text-muted-foreground">
                      {row.cat}
                    </div>
                    <div className="px-3 py-2.5 flex items-center gap-2 text-foreground/85">
                      <X className="h-3.5 w-3.5 text-destructive shrink-0" />
                      <span className="font-mono">{row.terms}</span>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* O QUE É PERMITIDO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <ColumnLabel>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  O que é permitido
                </span>
              </ColumnLabel>
              <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">
                Criatividade genérica
              </span>
            </div>

            <AnimatedSection variant="fade-up" delay={0}>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 flex gap-3 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-emerald-100 p-1.5 shrink-0 mt-0.5 text-emerald-700">
                  <PartyPopper className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm mb-1 leading-snug">Foco no clima da torcida</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use termos genéricos sobre futebol e o sentimento de torcer pelo país.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* Frases seguras como speech bubbles */}
            <AnimatedSection variant="fade-up" delay={120}>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <p className="font-heading font-bold text-sm">Frases seguras para uso</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Torcendo pelo Brasil', 'Entrando no ritmo', 'Dia de jogo'].map((phrase, i) => (
                    <AnimatedSection key={phrase} variant="scale-up" delay={i * 100}>
                      <span className="inline-flex items-center gap-1.5 rounded-2xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 hover:scale-105 transition-all cursor-default">
                        <CheckCircle2 className="h-3 w-3" />
                        "{phrase}"
                      </span>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection variant="fade-up" delay={240}>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 flex gap-3 hover:shadow-md transition-shadow">
                <div className="rounded-full bg-emerald-100 p-1.5 shrink-0 mt-0.5 text-emerald-700">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm mb-1 leading-snug">Conteúdo temático amplo</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Explore o esporte de forma criativa <strong>sem copiar a identidade visual da FIFA</strong>.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* Resumo verde de boas práticas */}
            <AnimatedSection variant="fade-up" delay={360}>
              <div className="rounded-xl bg-foreground text-background p-4 flex gap-3">
                <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed opacity-90">
                  Em caso de dúvida: <strong className="text-primary">se o termo é registrado, não use</strong>. Prefira sempre comunicar o <strong>sentimento</strong>, não o evento.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </CardContent>
        <GuideFooter />
      </Card>
    </AnimatedSection>

    {/* CTA voltar pro calendário */}
    <AnimatedSection>
      <div className="rounded-xl bg-muted/40 border border-foreground/5 p-5 flex gap-3">
        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Guias preparados pelo <strong>Marketing Pure Pilates</strong>. Aplicam-se às unidades durante todo o período do mundial — mantenha à mão antes de criar peças temáticas.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   HUB & TUTORIAL DO MARKETING — seções novas
   ══════════════════════════════════════════════════════════════ */
const HubTutorialPage = () => (
  <>
    {/* Hub é o centro */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-primary fill-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            hub.purepilates.com.br
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Nosso <span className="text-primary">centro de tudo.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Você sabe aquele lugar onde tudo acontece? Onde você encontra as campanhas, os materiais, as atualizações, os dados do seu estúdio, o suporte da equipe? <strong>Pois é — adicione aos favoritos agora!</strong>
        </p>
      </div>
    </AnimatedSection>

    {/* Por que favoritar */}
    <AnimatedSection>
      <SectionTitle>Por que adicionar aos favoritos?</SectionTitle>
    </AnimatedSection>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {[
        { title: 'Acesso em 1 clique', desc: 'Sem digitar URL, sem procurar emails.' },
        { title: 'Nunca perder uma atualização', desc: 'Tudo centralizado em um lugar.' },
        { title: 'Novas funcionalidades', desc: 'Você quer estar lá para descobrir primeiro.' },
        { title: 'Suporte rápido', desc: 'Quando precisa, está a um clique de distância.' },
        { title: 'Dados em tempo real', desc: 'Franqueados com campanhas aporte podem ver o desempenho, suas métricas, suas oportunidades.' },
      ].map((item, i) => (
        <AnimatedSection key={item.title} variant="fade-up" delay={i * 80}>
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
              <p className="font-heading font-bold text-sm mb-1.5 leading-snug">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>

    {/* Como adicionar */}
    <AnimatedSection>
      <SectionTitle>Como adicionar aos favoritos</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Leva 5 segundos. Muda tudo.
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { num: 1, text: 'Abra a plataforma Pure Pilates' },
        { num: 2, text: 'Clique na estrela ⭐ (ou Ctrl+D no navegador)' },
        { num: 3, text: 'Pronto! Está nos seus favoritos' },
      ].map((step, i) => (
        <AnimatedSection key={step.num} variant="fade-up" delay={i * 130}>
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-heading font-black text-2xl mb-4">
                {step.num}
              </div>
              <p className="text-base text-foreground leading-relaxed">
                {step.text}
              </p>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>

    {/* Tutorial do Marketing — novidade */}
    <AnimatedSection>
      <div className="rounded-2xl bg-foreground text-background p-10 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">
            Novidade!
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
          Tutorial do <span className="text-primary">Marketing.</span>
        </h2>

        <p className="opacity-80 leading-relaxed mb-6 max-w-3xl">
          A seção de Tutorial de Marketing é o <strong>coração informativo</strong> da plataforma Pure Pilates. Não é um lugar onde você encontra apenas respostas rápidas. É um guia completo e estruturado que reúne tudo que você precisa saber sobre como estamos operando, quais são nossas políticas, como funcionam nossas campanhas, como você deve executar as promoções, e qual é a estratégia por trás de cada ação.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <ShieldCheck className="h-5 w-5 mb-3 text-primary" />
            <p className="font-heading font-bold text-base mb-1">Políticas de Marketing</p>
            <p className="text-sm opacity-70">
              Todas as políticas que guiam nossas ações de mídia e como aplicamos cada recurso financeiro.
            </p>
          </div>
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <Megaphone className="h-5 w-5 mb-3 text-primary" />
            <p className="font-heading font-bold text-base mb-1">Campanhas Explicadas</p>
            <p className="text-sm opacity-70">
              Cada campanha que estamos rodando tem uma página dedicada aqui.
            </p>
          </div>
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <BookOpen className="h-5 w-5 mb-3 text-primary" />
            <p className="font-heading font-bold text-base mb-1">Operação e Execução</p>
            <p className="text-sm opacity-70">
              Como executamos as ações, links rápidos para validação de influencers, uso das redes sociais locais e Google Meu Negócio.
            </p>
          </div>
        </div>

        <a
          href="https://hub.purepilates.com.br/tutorial-marketing"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Acesse o Tutorial de Marketing
          <ChevronRight className="h-4 w-4" />
        </a>

        <p className="mt-5 italic opacity-60 text-sm max-w-2xl">
          Consulte sempre que tiver dúvida. Você ganha <strong>autonomia, clareza e velocidade</strong>.
        </p>
      </div>
    </AnimatedSection>

    {/* Pure Design — novidade expandida */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <CardContent className="pt-6 sm:pt-8">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-6 w-6 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
              Novidade!
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
            Pure <span className="text-primary">Design.</span>
          </h2>

          <p className="text-foreground/85 leading-relaxed mb-3 max-w-3xl">
            A Função de Design oferece algo que o Canva nunca ofereceu: uma <strong>biblioteca completa de materiais já prontos</strong>, desenvolvidos pela equipe de design Pure Pilates, <strong>testados, validados e prontos para você adaptar em segundos</strong>.
          </p>
          <p className="text-foreground/85 leading-relaxed mb-6 max-w-3xl">
            Não estamos falando de templates. Estamos falando de <strong>criativos profissionais, completos</strong>, que você só precisa personalizar com seu nome, sua data, sua promoção, e publicar.
          </p>

          {/* Fluxo de uso · 4 passos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { num: '1', title: 'Acesse', desc: 'A plataforma de Pure Design' },
              { num: '2', title: 'Escolha', desc: 'O criativo que você precisa' },
              { num: '3', title: 'Edite', desc: 'Data, horário, promoção, nome, telefone' },
              { num: '4', title: 'Salve', desc: 'Pronto pra publicar' },
            ].map((step, i) => (
              <AnimatedSection key={step.num} variant="scale-up" delay={i * 100}>
                <div className="rounded-xl bg-[#fdf3df] border border-primary/15 p-4 h-full">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-heading font-black text-base mb-3">
                    {step.num}
                  </div>
                  <p className="font-heading font-bold text-base mb-1">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Reforço dos benefícios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              'Não precisa de Photoshop',
              'Não precisa de conhecimento de design',
              'Não precisa de horas',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
                <X className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-xs sm:text-sm text-foreground/80">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-foreground/75 italic mb-5">
            Você preenche alguns campos e pronto.
          </p>

          <a
            href="https://hub.purepilates.com.br/pure-design"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Acessar o Pure Design
            <ChevronRight className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Verba Adicional — novidade expandida */}
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl bg-foreground text-background p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">
            Novidade!
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
          Verba <span className="text-primary">Adicional.</span>
        </h2>

        <p className="opacity-80 leading-relaxed mb-3 max-w-3xl">
          Imagine que você está acompanhando suas campanhas e vê que os <strong>leads estão caindo</strong>. Você sabe que precisa aumentar o investimento em mídia. Mas você não sabe como solicitar.
        </p>
        <p className="opacity-90 leading-relaxed mb-6 max-w-3xl">
          Agora, você tem a <strong className="text-primary">Verba Adicional</strong>.
        </p>

        {/* Fluxo "como funciona" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Passo 1</div>
            <p className="font-heading font-bold text-base mb-1">Acesse a seção de Mídia</p>
            <p className="text-sm opacity-70">Clique em "Solicitar Verba Adicional".</p>
          </div>
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Passo 2</div>
            <p className="font-heading font-bold text-base mb-1">Preencha o formulário</p>
            <p className="text-sm opacity-70">Informações sobre sua unidade e quanto você quer investir.</p>
          </div>
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Passo 3</div>
            <p className="font-heading font-bold text-base mb-1">Equipe ativa em tempo real</p>
            <p className="text-sm opacity-70">Marketing analisa seus dados e aciona a agência para iniciar as campanhas adicionais.</p>
          </div>
        </div>

        <a
          href="https://hub.purepilates.com.br/autorizar-midia-adicional"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Autorizar verba adicional
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </AnimatedSection>

    {/* Dashboard campanhas apartadas — novidade expandida */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <CardContent className="pt-6 sm:pt-8">
          <div className="flex items-center gap-3 mb-4">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
              Novidade!
            </span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-primary font-bold">
              <Star className="h-3 w-3 fill-primary" />
              Exclusivo · franqueados com aporte
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
            Dashboard de <span className="text-primary">campanhas apartadas.</span>
          </h2>

          <p className="text-foreground/85 leading-relaxed mb-3 max-w-3xl">
            Você acessa o Dashboard e <strong>sabe exatamente como está sua performance</strong>.
          </p>

          {/* O que sai do caminho */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 mt-5">
            {[
              'Não precisa esperar por relatórios',
              'Não precisa enviar email perguntando',
              'Não precisa adivinhar',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
                <X className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-xs sm:text-sm text-foreground/80">{item}</span>
              </div>
            ))}
          </div>

          <a
            href="https://hub.purepilates.com.br/minha-area/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Abrir o Dashboard
            <ChevronRight className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Closing */}
    <AnimatedSection variant="scale-up">
      <div className="text-center py-8">
        <p className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
          Obrigado<span className="text-primary">.</span>
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
          Bom junho para todos.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
const MonthLanding_2026_06 = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Atualiza visibilidade das setas conforme posição do scroll
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    };
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  // Mantém a aba ativa sempre visível quando o usuário troca de seção
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const activeButton = el.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`);
    activeButton?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeTab]);

  const scrollBy = (dir: 'left' | 'right') => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'inicio': return <PaginaInicial goTo={setActiveTab} />;
      case 'resultados': return <ResultadosPage />;
      case 'promocao': return <PromocaoPage />;
      case 'saude-marca': return <SaudeMarcaPage />;
      case 'indique': return <IndiquePage />;
      case 'calendario': return <CalendarioPage goTo={setActiveTab} />;
      case 'guia-copa': return <GuiaCopaPage />;
      case 'hub-tutorial': return <HubTutorialPage />;
    }
  };

  return (
    <div className="rounded-3xl bg-[#fdf3df] p-5 sm:p-8 pb-10">
      {/* Tab bar com setas fixas indicando que há mais abas */}
      <div className="relative mb-6">
        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto scroll-smooth pb-2 px-1 -mx-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              data-tab={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all border shrink-0',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background/70 text-foreground/70 border-foreground/10 hover:bg-background hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Fade + seta · esquerda */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-[#fdf3df] via-[#fdf3df]/85 to-transparent flex items-center transition-opacity duration-200',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button
            type="button"
            onClick={() => scrollBy('left')}
            aria-label="Ver abas anteriores"
            className="pointer-events-auto rounded-full bg-background shadow-md border border-foreground/10 p-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Fade + seta · direita (com pulso pra chamar atenção quando há mais abas) */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-[#fdf3df] via-[#fdf3df]/85 to-transparent flex items-center justify-end transition-opacity duration-200',
            canScrollRight ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button
            type="button"
            onClick={() => scrollBy('right')}
            aria-label="Ver mais abas"
            className="pointer-events-auto rounded-full bg-primary text-primary-foreground shadow-md p-1.5 hover:bg-primary/90 transition-colors animate-pulse"
            style={{ animationDuration: '2.5s' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-16">
        {renderSection()}
      </div>
    </div>
  );
};

export default MonthLanding_2026_06;

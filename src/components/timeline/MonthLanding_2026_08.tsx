import { useState, useEffect, useRef } from 'react';
import AnimatedSection from './AnimatedSection';
import AnimatedCounter from './AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { SectionTitle } from './shared';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  Quote, AlertTriangle, ArrowUpRight, HandHeart, Sparkles, Sun,
  Users, Calendar, BarChart3, ShieldCheck, BookOpen, Heart,
  ArrowRight, ChevronRight, ChevronLeft, Star, Lightbulb, CheckCircle2,
  Megaphone, DollarSign, X, ThumbsUp, Minus, Trophy, Crown, Flame, Zap,
  ThumbsDown, Instagram, Eye, MessageCircle, Heart as HeartIcon, Share2,
  Bot, GraduationCap, Building2, Network, Smartphone, MapPin, TrendingUp,
  ArrowDownRight, Clock, Play, Music2, Gift, Rocket, Palette, Mail, Server,
} from 'lucide-react';
import logoPure from '@/assets/logo-pure-pilates.png';
import heroAgosto from '@/assets/hero-agosto-2026.jpg';
import promoLucas from '@/assets/promo-lucas-agosto.jpg';
import lucasSticker from '@/assets/lucas-sticker.png';

type TabKey =
  | 'inicio'
  | 'resultados'
  | 'influencer'
  | 'social'
  | 'clusters'
  | 'marca'
  | 'hub'
  | 'institucional';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Página Inicial' },
  { key: 'resultados', label: 'Resultados Julho' },
  { key: 'influencer', label: '★ A melhor hora do meu dia' },
  { key: 'social', label: 'Redes Sociais · Destaques' },
  { key: 'clusters', label: 'Clusters 1s26' },
  { key: 'marca', label: 'Saúde de Marca & Capilaridade' },
  { key: 'hub', label: 'Novidades no HUB' },
  { key: 'institucional', label: 'Agosto & Pure Academy' },
];

const PEACH_DARK = '#e9c688';
const LUCAS_INSTAGRAM = 'https://www.instagram.com/lucaspizane/?hl=en';
const ESTHER_TIKTOK_ID = '7659818732646173973';

/* Shortcodes dos posts do Instagram para embed (o trecho entre /p/ ou /reel/ e a próxima barra). */
const IG_LUCAS_SHORTCODE = 'DbDz1jGxni-';  // vídeo/collab do Lucas Pizane — "A melhor hora do meu dia"
const IG_MEME_BANDEIRA = 'DaV2wLAJ48w';    // 2º lugar — meme da bandeira
const IG_DIA_AMIGO = 'DbBX6oMhpn9';        // 3º lugar — desafio extra de Dia do Amigo
const IG_MARIA_INDIQUE = 'Dan99CPpbV6';    // Indique e Ganhe — vídeo da personagem Maria

const igEmbedUrl = (shortcode: string) => `https://www.instagram.com/p/${shortcode}/embed`;
const igPostUrl = (shortcode: string) => `https://www.instagram.com/p/${shortcode}/`;

/* Vídeo da Luciellen hospedado no Google Drive (precisa estar compartilhado como "qualquer pessoa com o link"). */
const LUCIELLEN_DRIVE_ID = '1-sYU2lkyZU7JzIXkEvKAAKQZUwUxtnZJ';

/* Saúde de marca · Buzz Monitor (verbatim do Canva) */
const SENTIMENTO = [
  { name: 'Positivo', value: 37.4, color: 'hsl(var(--primary))' },
  { name: 'Neutro', value: 59.6, color: PEACH_DARK },
  { name: 'Negativos', value: 2.8, color: '#d97f7f' },
];

/* ══════════════════════════════════════════════════════════════
   PÁGINA INICIAL — A carta do franqueado (Agosto)
   ══════════════════════════════════════════════════════════════ */
const PaginaInicial = ({ goTo }: { goTo: (tab: TabKey) => void }) => (
  <>
    {/* ═══ CAPA ═══ */}
    <AnimatedSection variant="fade-in">
      <div>
        {/* nameplate / masthead */}
        <div className="flex items-end justify-between border-b-2 border-foreground pb-2.5 mb-4 gap-4">
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
            <p className="font-heading font-black text-primary text-lg sm:text-2xl leading-none">Nº 08</p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-foreground/50 font-semibold mt-1">Agosto 2026</p>
          </div>
        </div>

        {/* cover image */}
        <button
          type="button"
          onClick={() => goTo('influencer')}
          className="group relative block w-full overflow-hidden rounded-sm ring-1 ring-foreground/10"
          aria-label="A melhor hora do meu dia — Lucas Pizane"
        >
          <img
            src={heroAgosto}
            alt="Capa — Agosto 2026 · Lucas Pizane"
            className="w-full h-auto block transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-3 w-3 fill-current text-primary" /> Ver a campanha
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>

        {/* folio / legenda da capa */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-foreground/15 mt-3 pt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-foreground/50 font-semibold">
          <span>Capa · <span className="text-primary">A melhor hora do meu dia</span></span>
          <span>Foto: Lucas Pizane</span>
          <span className="hidden sm:inline">Departamento de Marketing</span>
        </div>
      </div>
    </AnimatedSection>

    {/* ═══ MENSAGEM DO DEPARTAMENTO DE MARKETING ═══ */}
    <AnimatedSection variant="fade-up">
      <div>
        {/* kicker */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Mensagem do Departamento de Marketing</span>
          <span className="h-px flex-1 bg-foreground/15" />
        </div>

        <h2 className="font-heading font-black text-4xl sm:text-6xl text-foreground leading-[0.95] mb-6 tracking-tight">
          Caro<br /><span className="text-primary">franqueado,</span>
        </h2>

        {/* lead com drop cap */}
        <p className="text-base sm:text-lg text-foreground/85 leading-relaxed mb-6 first-letter:float-left first-letter:font-heading first-letter:font-black first-letter:text-primary first-letter:text-6xl sm:first-letter:text-7xl first-letter:leading-[0.7] first-letter:pr-3 first-letter:pt-1">
          Entramos em agosto, um dos meses mais importantes do ano para o mercado de saúde e bem-estar. Com a retomada da rotina após o período de férias, observamos um aumento natural na procura por atividades físicas e na busca por hábitos mais saudáveis. Este é o momento ideal para intensificar as ações comerciais, fortalecer a presença da marca na sua região e aproveitar o aumento da demanda para converter mais interessados em novos alunos.
        </p>

        {/* pull quote — trecho verbatim da carta */}
        <blockquote className="my-8 border-l-4 border-primary pl-5 sm:pl-7">
          <p className="font-heading font-bold text-2xl sm:text-4xl text-foreground leading-tight">
            “O resultado já começou a aparecer e conseguimos retomar um ritmo consistente de crescimento na geração de leads.”
          </p>
        </blockquote>

        {/* corpo em colunas de revista */}
        <div className="lg:columns-2 lg:gap-10 [&>p]:mb-4 [&>p]:break-inside-avoid text-sm sm:text-base text-foreground/85 leading-relaxed">
          <p>Neste mês, preparamos diversas novidades para fortalecer a comunicação da rede. Damos continuidade à campanha publicitária com histórias reais de alunos, desta vez apresentando a trajetória de <strong>Lucas Pizane</strong>, reforçando como o Pilates transforma a qualidade de vida das pessoas. Além disso, renovamos nossos materiais criativos com imagens que representam diferentes perfis de público, destacando a diversidade dos praticantes e os inúmeros benefícios que o método oferece para todas as idades e estilos de vida.</p>
          <p>Julho foi um mês desafiador para as campanhas de Aula Experimental. O cenário exigiu uma série de ajustes estratégicos, revisões de segmentação, otimizações e aplicação das melhores práticas de performance para restabelecer a eficiência das campanhas. O resultado já começou a aparecer e conseguimos retomar um ritmo consistente de crescimento na geração de leads. Nossa expectativa é que esse desempenho seja ainda mais intensificado nos primeiros dias de agosto, impulsionado pelo retorno das atividades e pelo aumento do interesse do público em iniciar uma nova rotina de exercícios.</p>
          <p>Para apoiar ainda mais os estúdios, o Hub da Pure Pilates continua sendo o principal canal para solicitação de autorizações de aporte destinadas às campanhas de Aula Experimental e de Recrutamento de Profissionais. Pensando em facilitar a execução dessas ações, disponibilizamos um novo roteiro com orientações detalhadas, além de exemplos de criativos e boas práticas para que as campanhas sejam implementadas de forma mais eficiente e alinhadas à estratégia nacional da marca.</p>
          <p>Também seguimos evoluindo o Pure System, com melhorias importantes apresentadas na última reunião de Updates. Essas novidades têm como objetivo tornar a operação mais prática, otimizar processos e contribuir para uma gestão cada vez mais eficiente dos estúdios. Recomendamos que todos acompanhem atentamente os comunicados oficiais, as notificações do aplicativo e os conteúdos disponibilizados no Hub, garantindo que nenhuma atualização importante passe despercebida.</p>
          <p>Contamos com o engajamento de toda a rede para aproveitar as oportunidades que agosto oferece. Nossa equipe permanece à disposição para prestar suporte, esclarecer dúvidas e auxiliar na implementação das ações de marketing e operação sempre que necessário.</p>
          <p>Desejamos um excelente mês, com muitas matrículas, crescimento e resultados para toda a rede.</p>
        </div>

        {/* assinatura */}
        <div className="flex items-center gap-4 mt-8 pt-5 border-t border-foreground/15">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Quote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-xl text-foreground leading-none">Departamento de Marketing</p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-foreground/50 font-semibold mt-1">Pure Pilates</p>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* ═══ DESTAQUE — spread do influencer ═══ */}
    <AnimatedSection variant="fade-up">
      <div className="relative overflow-hidden rounded-2xl bg-[#141414] text-background">
        <div className="grid lg:grid-cols-2 items-stretch">
          {/* texto */}
          <div className="relative z-10 p-7 sm:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">A melhor hora do meu dia</span>
              <span className="h-px w-10 bg-primary/40" />
            </div>
            <h3 className="font-heading font-black text-3xl sm:text-5xl leading-[1.02] mb-4 tracking-tight">
              Lucas <span className="text-primary">Pizane.</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Vídeo do influencer', 'Brand content · Luciellen', 'TOP 3 de julho'].map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-background/10 border border-background/15 px-3 py-1.5 text-xs font-semibold">
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo('influencer')}
              className="group inline-flex items-center gap-2 self-start rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" /> Abrir a seção
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          {/* imagem promocional */}
          <button
            type="button"
            onClick={() => goTo('influencer')}
            className="group relative min-h-[280px] overflow-hidden"
            aria-label="Abrir a seção do Lucas Pizane"
          >
            <img
              src={promoLucas}
              alt="Campanha A melhor hora do meu dia · Lucas Pizane"
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#141414] via-transparent to-transparent opacity-70" />
          </button>
        </div>
      </div>
    </AnimatedSection>

    {/* ═══ Pure Station ═══ */}
    <AnimatedSection variant="scale-up">
      <button
        type="button"
        onClick={() => goTo('hub')}
        className="text-left w-full rounded-2xl bg-foreground text-background p-6 sm:p-9 hover:shadow-2xl transition-shadow group relative overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-16 -right-10 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="rounded-2xl bg-primary text-primary-foreground p-4 shrink-0 w-fit">
            <Zap className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
              <Server className="h-3 w-3" /> Tecnologia própria
            </span>
            <p className="font-heading font-black text-3xl sm:text-4xl leading-tight">
              Pure <span className="text-primary">Station.</span>
            </p>
            <p className="text-sm sm:text-base opacity-80 leading-relaxed mt-2 max-w-2xl">
              Internalizamos a nossa plataforma de disparos de e-mails — <strong className="opacity-100">mais tecnologia, menos custo</strong> e autonomia para campanhas ainda maiores, como <strong className="opacity-100">WhatsApp</strong>.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-primary font-semibold text-sm shrink-0">
            Ver no HUB
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </button>
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

    <div className="lg:grid lg:grid-cols-[minmax(0,250px)_1fr] lg:gap-10 items-end">
      {/* Lucas integrado ao lado do índice — maior, transbordando à esquerda sem mexer no índice */}
      <img
        src={lucasSticker}
        alt="Lucas Pizane em movimento"
        className="hidden lg:block self-end justify-self-start max-w-none w-[340px] -ml-16 -mb-2 select-none pointer-events-none"
      />
      <div>
      {[
        { key: 'resultados' as TabKey, title: 'Resultados de Julho', desc: 'Performance A–E e evolução dos criativos — parcial até 22/07.' },
        { key: 'influencer' as TabKey, title: 'A melhor hora do meu dia', desc: 'O vídeo do influencer Lucas Pizane e o brand content da designer.' },
        { key: 'social' as TabKey, title: 'Redes Sociais · Destaques', desc: 'TOP 3 de julho, ações da Copa, Indique e Ganhe e o TikTok.' },
        { key: 'clusters' as TabKey, title: 'Clusters 1º semestre', desc: 'Visão de clusters m-m, concentração da rede e aporte de mídia.' },
        { key: 'marca' as TabKey, title: 'Saúde de Marca & Capilaridade', desc: 'Buzz Monitor, novos ciclos e a presença da Pure pelo Brasil.' },
        { key: 'hub' as TabKey, title: 'Novidades no HUB', desc: 'Tutorial de Marketing, Pure Metrics e Pure Station.' },
        { key: 'institucional' as TabKey, title: 'Agosto & Pure Academy', desc: 'Calendário das redes, conteúdo local e o Curso 100% online.' },
      ].map((item, i) => (
        <AnimatedSection key={item.key} variant="fade-up" delay={i * 60}>
          <button
            type="button"
            onClick={() => goTo(item.key)}
            className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6 w-full text-left border-b border-foreground/15 py-4 sm:py-5 hover:bg-primary/5 transition-colors px-1"
          >
            <span className="font-heading font-black text-2xl sm:text-4xl text-foreground/30 group-hover:text-primary tabular-nums transition-colors w-10 sm:w-14">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>
              <span className="block font-heading font-bold text-base sm:text-xl text-foreground group-hover:text-primary transition-colors leading-tight">
                {item.title}
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

/* ══════════════════════════════════════════════════════════════
   RESULTADOS JULHO — performance (parcial até 22/07)
   ══════════════════════════════════════════════════════════════ */
const FUNIL_ROWS = [
  { label: 'Aula Experimental', junho: '6.760', junhoDelta: '-7,8%', julho: '6.542', julhoDelta: '+10,1%' },
  { label: 'Presença Aula Experimental', junho: '4.530', junhoDelta: '-21%', julho: '5.134', julhoDelta: '+11,1%' },
  { label: 'Matrículas', junho: '1.234', junhoDelta: '-4,3%', julho: '1.078', julhoDelta: '+9%' },
  { label: 'PurePass', junho: '63', junhoDelta: '', julho: '31', julhoDelta: '' },
];

const ResultadosPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Performance · Resultado parcial (até 22/07)
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Resultados de <span className="text-primary">Julho.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Performance A–E, evolução e criativos vigentes. Leitura parcial dos principais indicadores de aquisição.
        </p>
      </div>
    </AnimatedSection>

    {/* Tabela de performance Junho × Julho */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Julho · Performance</p>
              <h3 className="text-xl font-heading font-semibold">Indicadores de aquisição</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest text-primary font-bold">
              <Clock className="h-3 w-3" />
              Resultado parcial (até 22/07)
            </span>
          </div>

          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 sm:gap-3">
            <div />
            <div className="rounded-t-xl bg-[#e9c688]/40 text-center py-2.5 text-xs uppercase tracking-widest font-bold text-foreground/70">
              Junho
            </div>
            <div className="rounded-t-xl bg-primary text-center py-2.5 text-xs uppercase tracking-widest font-bold text-primary-foreground">
              Julho
            </div>
          </div>

          {/* Linhas */}
          <div className="space-y-2 mt-1">
            {FUNIL_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 sm:gap-3 items-stretch">
                <div className="flex items-center rounded-lg bg-muted/40 px-3 sm:px-4 py-3 text-sm font-semibold text-foreground/80">
                  {row.label}
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-[#e9c688]/15 border border-[#e9c688]/30 py-2.5 text-base sm:text-lg font-heading font-bold text-foreground/70 tabular-nums">
                  {row.junho}
                  {row.junhoDelta && (
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">({row.junhoDelta})</span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-primary/5 border border-primary/20 py-2.5 text-base sm:text-lg font-heading font-bold text-primary tabular-nums">
                  {row.julho}
                  {row.julhoDelta && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 tabular-nums">
                      <ArrowUpRight className="h-3 w-3" />{row.julhoDelta}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Leitura de recuperação */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-xl bg-foreground text-background p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="rounded-full bg-primary/20 p-3 shrink-0 w-fit">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold mb-1">
            Retomada de ritmo
          </p>
          <p className="text-base sm:text-lg leading-snug">
            Depois dos ajustes de segmentação e otimização, <strong className="text-primary">presença em aula experimental</strong> e <strong className="text-primary">matrículas</strong> voltaram a crescer em julho. A expectativa é intensificar esse desempenho nos primeiros dias de agosto.
          </p>
        </div>
      </div>
    </AnimatedSection>

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
   ★ A MELHOR HORA DO MEU DIA — destaque especial do influencer
   ══════════════════════════════════════════════════════════════ */
const InfluencerPage = () => (
  <>
    {/* keyframes locais para os efeitos do destaque */}
    <style>{`
      @keyframes ppFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes ppShine { 0% { transform: translateX(-120%); } 60%,100% { transform: translateX(220%); } }
      @keyframes ppGlow { 0%,100% { opacity: .45; } 50% { opacity: .9; } }
    `}</style>

    {/* abertura editorial */}
    <AnimatedSection variant="fade-up">
      <div className="flex items-center gap-3 border-b-2 border-foreground pb-2.5">
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-primary font-bold">Matéria de capa</span>
        <span className="h-px flex-1 bg-foreground/15" />
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-foreground/50 font-semibold">Campanha de Agosto</span>
      </div>
    </AnimatedSection>

    {/* HERO cinematográfico */}
    <AnimatedSection variant="fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-[#141414] text-background p-8 sm:p-14">
        {/* glows animados */}
        <div
          className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
          style={{ animation: 'ppGlow 4s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-[#e9c688]/30 blur-3xl"
          style={{ animation: 'ppGlow 5s ease-in-out infinite' }}
        />

        <div className="relative grid lg:grid-cols-[1.1fr_minmax(0,420px)] gap-10 items-center">
          {/* Texto */}
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-primary font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              #AMelhorHoraDoMeuDia
            </span>

            <h2 className="text-4xl sm:text-6xl font-heading font-black leading-[1.02]">
              A melhor hora<br />do <span className="text-primary">meu dia.</span>
            </h2>

            <p className="text-base sm:text-lg opacity-85 leading-relaxed max-w-xl">
              Vídeo do influencer <strong className="opacity-100">com o Felipe</strong> para mostrar o que fizemos em termos de publicidade. Damos continuidade à campanha publicitária com histórias reais de alunos — desta vez apresentando a trajetória de <strong className="text-primary">Lucas Pizane</strong>.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={LUCAS_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors group"
              >
                <Play className="h-4 w-4 fill-current" />
                Ver o vídeo no Instagram
                <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <span className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-background/10 border border-background/15 text-xs font-semibold uppercase tracking-widest">
                <Megaphone className="h-4 w-4 text-primary" />
                Usado nas campanhas pagas
              </span>
            </div>
          </div>

          {/* Card do player */}
          {IG_LUCAS_SHORTCODE ? (
            <div className="rounded-2xl overflow-hidden border border-background/15 bg-background shadow-2xl">
              <iframe
                src={igEmbedUrl(IG_LUCAS_SHORTCODE)}
                title="A melhor hora do meu dia · Lucas Pizane"
                className="w-full block"
                style={{ height: 720, border: 0 }}
                loading="lazy"
                scrolling="no"
              />
            </div>
          ) : (
            <div style={{ animation: 'ppFloat 6s ease-in-out infinite' }}>
              <a
                href={LUCAS_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[4/5] rounded-2xl overflow-hidden border border-background/15 bg-gradient-to-br from-[#2a2a2a] via-[#1c1c1c] to-black shadow-2xl"
              >
                {/* brilho que passa */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    style={{ animation: 'ppShine 4.5s ease-in-out infinite' }}
                  />
                </div>

                {/* Play */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="absolute h-24 w-24 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2.5s' }} />
                  <span className="relative flex items-center justify-center h-20 w-20 rounded-full bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-9 w-9 fill-current ml-1" />
                  </span>
                </div>

                {/* rodapé do card */}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-2 text-primary">
                    <Instagram className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-widest font-bold">@lucaspizane</span>
                  </div>
                  <p className="font-heading font-bold text-lg leading-tight mt-1">Lucas Pizane</p>
                  <p className="text-xs opacity-70">Cliente Pure Pilates · história real</p>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    </AnimatedSection>

    {/* Recorde — boxout de dados */}
    <AnimatedSection variant="fade-up">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Números · Collab Lucas Pizane</span>
          <span className="h-px flex-1 bg-foreground/15" />
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-[#141414] text-background p-7 sm:p-10">
          <div className="pointer-events-none absolute -top-16 -right-12 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-9 items-center">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary shrink-0" />
              <span className="font-heading font-black text-7xl sm:text-8xl leading-none text-primary">1º</span>
            </div>
            <div>
              <p className="font-heading font-black text-2xl sm:text-3xl leading-tight mb-4">
                O melhor post da história da Pure até o momento.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Curtidas', 'Alcance', 'Visualizações', 'Desempenho geral'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-background/10 border border-background/15 px-3 py-1.5 text-xs font-semibold">
                    <Crown className="h-3.5 w-3.5 text-primary" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="relative text-sm sm:text-base opacity-85 leading-relaxed mt-7 max-w-3xl">
            O conteúdo com Lucas Pizane se tornou o melhor post da história da Pure até o momento, liderando não apenas em curtidas, mas também em alcance, visualizações e desempenho geral. A collab ampliou significativamente a presença da marca e mostrou a força de unir um nome com alta conexão com o público a um conteúdo alinhado ao universo do Pilates.
          </p>
        </div>
      </div>
    </AnimatedSection>

    {/* Institucional — pull quote editorial */}
    <AnimatedSection variant="fade-up">
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Institucional</span>
          <span className="h-px flex-1 bg-foreground/15" />
        </div>
        <blockquote className="border-l-4 border-primary pl-5 sm:pl-7 mb-5">
          <p className="font-heading font-black text-2xl sm:text-4xl text-foreground leading-tight">
            Participe indicando personas.
          </p>
        </blockquote>
        <p className="text-sm sm:text-base text-foreground/85 leading-relaxed max-w-3xl">
          A série apresenta histórias reais que mostram como a Pure Pilates está inserida na vida das pessoas de forma natural. Renovamos nossos materiais criativos com imagens que representam diferentes perfis de público, destacando a diversidade dos praticantes e os inúmeros benefícios que o método oferece para todas as idades e estilos de vida.
        </p>
      </div>
    </AnimatedSection>

    {/* Brand content — Luciellen (editorial, vídeo grande horizontal) */}
    <AnimatedSection variant="fade-up">
      <div>
        {/* kicker */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">Brand content · Histórias que mostram a Pure pelo Brasil</span>
          <span className="h-px flex-1 bg-foreground/15" />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h3 className="font-heading font-black text-3xl sm:text-5xl text-foreground leading-[1.0] tracking-tight">
            Luciellen<span className="text-primary">.</span>
          </h3>
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold pb-1">
            Influenciadora e designer de moda · gravado na Bahia
          </p>
        </div>

        {/* VÍDEO GRANDE — horizontal 16:9, largura total */}
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

        {/* texto em colunas de revista (verbatim) */}
        <div className="lg:columns-2 lg:gap-10 [&>p]:mb-4 [&>p]:break-inside-avoid text-sm sm:text-base text-foreground/85 leading-relaxed mt-6">
          <p>Também temos um conteúdo especial com a Luciellen, influenciadora e designer de moda com quem gravamos na Bahia. Com uma comunicação autêntica e forte conexão com seu público, o conteúdo apresenta grande potencial de alcance e engajamento.</p>
          <p>A participação faz parte de uma série criada para mostrar como a Pure Pilates está inserida na vida das pessoas de forma natural, acompanhando diferentes rotinas, histórias e estilos de vida. Além da Luciellen, a série contará com relatos de outros alunos da rede, reforçando a pluralidade das experiências e a capilaridade da Pure em diferentes regiões do país.</p>
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* Embed oficial do TikTok (blockquote + embed.js) — evita o "overload-protect" do /embed/v2 */
const TikTokEmbed = ({ videoId }: { videoId: string }) => {
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://www.tiktok.com/embed.js';
    s.async = true;
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch { /* noop */ } };
  }, []);
  const url = `https://www.tiktok.com/@estheremcena/video/${videoId}`;
  return (
    <blockquote
      className="tiktok-embed"
      cite={url}
      data-video-id={videoId}
      style={{ maxWidth: '100%', minWidth: 260, margin: 0 }}
    >
      <section>
        <a href={url} target="_blank" rel="noopener noreferrer">@estheremcena</a>
      </section>
    </blockquote>
  );
};

/* ══════════════════════════════════════════════════════════════
   REDES SOCIAIS · DESTAQUES — TOP 3, Copa, Indique, TikTok
   ══════════════════════════════════════════════════════════════ */
const TOP3 = [
  {
    rank: 1, icon: Crown, title: 'Collab com Lucas Pizane', shortcode: IG_LUCAS_SHORTCODE,
    text: 'O conteúdo com Lucas Pizane se tornou o melhor post da história da Pure até o momento, liderando não apenas em curtidas, mas também em alcance, visualizações e desempenho geral. A collab ampliou significativamente a presença da marca e mostrou a força de unir um nome com alta conexão com o público a um conteúdo alinhado ao universo do Pilates.',
  },
  {
    rank: 2, icon: Flame, title: 'Meme da bandeira', shortcode: IG_MEME_BANDEIRA,
    text: 'O meme da bandeira confirmou o potencial dos conteúdos de oportunidade. Com uma linguagem rápida, divertida e conectada ao momento, o post conquistou alto alcance e reforçou a importância de inserir a Pure em conversas que já estão acontecendo nas redes.',
  },
  {
    rank: 3, icon: Gift, title: 'Desafio extra de Dia do Amigo', shortcode: IG_DIA_AMIGO,
    text: 'O desafio extra de Dia do Amigo mostrou como datas sazonais podem potencializar formatos que já fazem parte da rotina do perfil. A combinação entre tema comemorativo, linguagem leve e dinâmica de participação gerou um desempenho expressivo e fortaleceu o engajamento da comunidade.',
  },
];

const SocialPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Instagram className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Destaques de social · @purepilatesbr
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Redes <span className="text-primary">sociais.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          As publicações que mais engajaram em julho, as ações de oportunidade da Copa, a campanha Indique e Ganhe e a nova parceria no TikTok.
        </p>
      </div>
    </AnimatedSection>

    {/* Publicações Julho TOP 3 */}
    <AnimatedSection>
      <SectionTitle>Publicações Julho · TOP 3</SectionTitle>
    </AnimatedSection>

    <div className="space-y-4">
      {TOP3.map((post, i) => (
        <AnimatedSection key={post.rank} variant="fade-up" delay={i * 100}>
          <Card className={cn('overflow-hidden', post.rank === 1 ? 'border-t-4 border-t-primary' : 'border-t-4 border-t-[#e9c688]')}>
            <div className={cn('grid gap-0', post.shortcode ? 'lg:grid-cols-[minmax(0,360px)_1fr]' : 'grid-cols-1')}>
              {post.shortcode && (
                <div className="bg-muted/20 border-b lg:border-b-0 lg:border-r border-foreground/5 p-5 sm:p-6 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-foreground/10 bg-background">
                    <iframe
                      src={igEmbedUrl(post.shortcode)}
                      title={post.title}
                      className="w-full block"
                      style={{ height: 560, border: 0 }}
                      loading="lazy"
                      scrolling="no"
                    />
                  </div>
                  <a
                    href={igPostUrl(post.shortcode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors group"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    Ver no Instagram
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              )}
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex flex-col items-center justify-center rounded-2xl w-16 h-16 shrink-0',
                    post.rank === 1 ? 'bg-primary text-primary-foreground' : 'bg-[#f3d7a7]/60 text-foreground'
                  )}>
                    <post.icon className="h-5 w-5 mb-0.5" />
                    <span className="font-heading font-black text-lg leading-none">{post.rank}º</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-xl mb-2">{post.title}</h3>
                    <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">{post.text}</p>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </AnimatedSection>
      ))}
    </div>

    {/* Copa do Mundo */}
    <AnimatedSection>
      <SectionTitle>Instagram @purepilatesbr · Ações Copa do Mundo</SectionTitle>
    </AnimatedSection>

    <AnimatedSection variant="fade-up">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6 space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
          <p>Durante a Copa, entre junho e julho, aproveitamos o contexto esportivo para criar conteúdos de oportunidade com humor e conexão direta com o momento. O primeiro e o terceiro posts exploraram a percepção de que o Brasil não estava apresentando seu melhor desempenho, transformando o assunto em brincadeiras alinhadas ao universo da Pure.</p>
          <p>Também desenvolvemos um conteúdo mais elaborado com a temática do VAR, comparando quem faz e quem não faz Pilates. O vídeo trouxe uma construção criativa mais forte, unindo entretenimento, identidade de marca e uma mensagem fácil de reconhecer e compartilhar.</p>
          <p>Antes da partida entre Brasil e Noruega, reunimos diferentes referências e brincadeiras envolvendo os jogadores para montar um novo vídeo de oportunidade. O conteúdo teve excelente resposta do público e terminou o mês como o <strong>quarto vídeo com maior engajamento do perfil</strong>.</p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Indique e Ganhe */}
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-[#fdf3df] to-white">
        <div className="bg-primary text-primary-foreground px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <HandHeart className="h-6 w-6" />
            <span className="text-2xl sm:text-3xl font-heading font-black tracking-tight">Indique e Ganhe</span>
          </div>
          <div className="sm:ml-auto inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold">
            <Heart className="h-4 w-4 fill-current" />
            A cada matrícula confirmada, uma nova massagem.
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="grid lg:grid-cols-[1fr_minmax(0,340px)] gap-6 items-start">
            <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
              Também reforçamos a campanha Indique Pilates com um vídeo protagonizado pela nossa personagem <strong>Maria</strong>. De forma leve e divertida, mostramos que o aluno pode indicar vários amigos e, a cada nova matrícula confirmada, conquistar uma nova massagem.
            </p>
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-primary/15 bg-background">
                <iframe
                  src={igEmbedUrl(IG_MARIA_INDIQUE)}
                  title="Indique e Ganhe · Maria"
                  className="w-full block"
                  style={{ height: 560, border: 0 }}
                  loading="lazy"
                  scrolling="no"
                />
              </div>
              <a
                href={igPostUrl(IG_MARIA_INDIQUE)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors group"
              >
                <Instagram className="h-3.5 w-3.5" />
                Ver no Instagram
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* TikTok · Esther em Cena */}
    <AnimatedSection>
      <SectionTitle>TikTok · Parceria Esther em Cena</SectionTitle>
    </AnimatedSection>

    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-foreground">
        <div className="grid lg:grid-cols-[1fr_minmax(0,340px)] gap-0">
          {/* Texto */}
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-foreground text-background p-2.5">
                <Music2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Permuta · sem cachê</p>
                <h3 className="text-2xl font-heading font-bold">Esther em Cena</h3>
                <p className="text-sm text-primary font-semibold">+350 mil seguidores no TikTok</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
              Também fechamos uma parceria por permuta com a Esther em Cena, criadora de grande alcance no TikTok, com mais de 350 mil seguidores e forte conexão com o público jovem. A ação amplia a visibilidade da Pure com um investimento reduzido, já que não envolve cachê, e permite que a marca se aproxime de uma nova geração de potenciais alunos. Além do alcance, a parceria contribui para renovar a comunicação da Pure, ampliar sua presença em diferentes plataformas e fortalecer sua relevância entre públicos mais jovens.
            </p>
          </div>

          {/* Embed do TikTok */}
          <div className="bg-muted/20 border-t lg:border-t-0 lg:border-l border-foreground/5 p-5 sm:p-6 space-y-3">
            <div className="rounded-xl overflow-hidden bg-background min-h-[500px]">
              <TikTokEmbed videoId={ESTHER_TIKTOK_ID} />
            </div>
            <a
              href={`https://www.tiktok.com/@estheremcena/video/${ESTHER_TIKTOK_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors group"
            >
              <Music2 className="h-3.5 w-3.5" />
              Ver no TikTok
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </Card>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   CLUSTERS — 1º semestre 2026 (reforço)
   ══════════════════════════════════════════════════════════════ */
const CLUSTER_BARS = [
  { mes: 'Janeiro', Rede: 401, 'Cluster crítico': 227 },
  { mes: 'Julho', Rede: 468, 'Cluster crítico': 278 },
];

const ClustersPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Visão de clusters · 1º semestre 2026
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Clusters <span className="text-primary">1s26.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Concentração da rede e a lógica da verba de contribuição mensal por estágio e maturidade da unidade.
        </p>
      </div>
    </AnimatedSection>

    {/* Indicadores-chave */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AnimatedSection variant="scale-up" delay={0}>
        <Card className="h-full border-t-4 border-t-[#e9c688]">
          <CardContent className="pt-6 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Início do ano</p>
            <p className="text-4xl sm:text-5xl font-heading font-bold text-foreground tabular-nums">
              <AnimatedCounter end={401} />
            </p>
            <p className="text-sm text-muted-foreground mt-2">unidades</p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="scale-up" delay={120}>
        <Card className="h-full border-t-4 border-t-primary">
          <CardContent className="pt-6 text-center">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Hoje</p>
            <p className="text-4xl sm:text-5xl font-heading font-bold text-primary tabular-nums">
              <AnimatedCounter end={468} />
            </p>
            <p className="text-sm text-muted-foreground mt-2">unidades ativas · +67 (+16,7%)</p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="scale-up" delay={240}>
        <Card className="h-full border-t-4 border-t-[#e9c688]">
          <CardContent className="pt-6 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Maior atenção</p>
            <p className="text-4xl sm:text-5xl font-heading font-bold text-foreground tabular-nums">
              ~<AnimatedCounter end={60} suffix="%" />
            </p>
            <p className="text-sm text-muted-foreground mt-2">da rede no cluster crítico</p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* Texto verbatim */}
    <AnimatedSection variant="fade-up">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            A verba de contribuição mensal tem como objetivo alcançar leads novos para aula experimental, evidenciar o canal Trabalhe Conosco e reforçar a marca. Desde out/25 adotamos clusters, colocando atenção nas unidades críticas e em crescimento através do indicador de mensalistas ativos. A rede segue em forte expansão: começamos o ano com <strong>401 unidades</strong> e hoje já são <strong>468 unidades ativas</strong> — um crescimento de <strong>+67 unidades (+16,7%)</strong> no período.
          </p>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Boa parte desse avanço vem de novas unidades ainda em estágio inicial de maturidade, o que concentra <strong>quase 60% da rede</strong> no cluster de maior atenção (até 39 mensalistas ativos) — que cresceu de <strong>227 para 278 unidades</strong> de janeiro a julho. A seguir, o gráfico que evidencia essa concentração.
          </p>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Com a rede cada vez maior e um recurso limitado, o aporte de mídia é o que viabiliza o incremento e o suporte dessas ações. Para auxiliar na decisão de franqueados criamos um guia completo dentro do tutorial de marketing. Estes investimentos adicionais auxiliam no crescimento do topo do funil da unidade específica e já apresentou resultados significativos após meses de ativação.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Gráfico de concentração */}
    <AnimatedSection variant="fade-up">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Concentração da rede</p>
              <h3 className="text-xl font-heading font-semibold">Rede total × cluster crítico (até 39 ativos)</h3>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Janeiro → Julho
            </span>
          </div>

          <div style={{ width: '100%', height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CLUSTER_BARS} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d8b8" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 13, fill: '#5b5b5b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9a8c6f' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e9c688', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => `${v} unidades`}
                  cursor={{ fill: 'rgba(233,198,136,0.12)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="Rede" fill={PEACH_DARK} radius={[6, 6, 0, 0]} animationDuration={1100} />
                <Bar dataKey="Cluster crítico" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={1100} animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-muted-foreground/80 text-right italic mt-1">
            Pure System · janeiro a julho de 2026
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    <AnimatedSection>
      <div className="rounded-xl bg-muted/40 border border-foreground/5 p-5 flex gap-3">
        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          O aporte de mídia é o que viabiliza o incremento e o suporte dessas ações. Para auxiliar na decisão, criamos um <strong>guia completo dentro do tutorial de marketing</strong>.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   SAÚDE DE MARCA & CAPILARIDADE
   ══════════════════════════════════════════════════════════════ */
const MarcaPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Saúde de marca · Buzz Monitor
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Saúde de <span className="text-primary">marca.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Sentimento da marca e o novo ciclo de mensuração — além da presença da Pure por todo o Brasil.
        </p>
      </div>
    </AnimatedSection>

    {/* Buzz Monitor */}
    <AnimatedSection variant="fade-up">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Buzz Monitor</span>
          </div>
          <div className="grid md:grid-cols-[minmax(0,360px)_1fr] gap-6 items-center">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SENTIMENTO}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    animationDuration={1200}
                  >
                    {SENTIMENTO.map((entry, i) => (
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

            <div className="space-y-3">
              {SENTIMENTO.map((item) => {
                const Icon = item.name === 'Positivo' ? ThumbsUp : item.name === 'Neutro' ? Minus : ThumbsDown;
                return (
                  <div key={item.name} className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3">
                    <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground/80 flex-1 uppercase tracking-wide font-semibold">{item.name}</span>
                    <span className="text-xl font-heading font-bold tabular-nums text-foreground">
                      {item.value.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Novos indicadores, novos ciclos */}
    <AnimatedSection variant="fade-up">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Sparkles className="h-5 w-5" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Novos indicadores, novos ciclos</span>
          </div>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            A partir do segundo semestre teremos um novo modelo de mensuração de saúde de marca. Até junho-26 o monitoramento de social media e ondas de pesquisa das campanhas eram tratados separadamente. A partir deste novo ciclo teremos uma plataforma proprietária capaz de fazer pesquisas frequentes para entender percepção e reputação de diversos perfis dentro de canais oficiais. Além disso, continuaremos o monitoramento das páginas oficiais e da brandpage do Reclame Aqui.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Capilaridade da rede */}
    <AnimatedSection>
      <SectionTitle>Presença e capilaridade da rede</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Conteúdo franchising e studios.
      </p>
    </AnimatedSection>

    <AnimatedSection variant="scale-up">
      <div className="rounded-2xl bg-foreground text-background p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">Campanha nacional</span>
        </div>
        <h3 className="text-3xl sm:text-4xl font-heading font-bold leading-tight mb-5">
          A Pure <span className="text-primary">pelo Brasil.</span>
        </h3>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { city: 'São Paulo', tag: 'Início · mês passado' },
            { city: 'Salvador', tag: 'Julho' },
            { city: 'Santa Catarina', tag: 'Julho' },
          ].map((c) => (
            <div key={c.city} className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/25 px-4 py-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold">{c.city}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-60">{c.tag}</span>
            </div>
          ))}
        </div>

        <p className="opacity-85 leading-relaxed max-w-3xl">
          Também desenvolvemos uma campanha nacional para destacar a presença da Pure pelo Brasil. A iniciativa começou por São Paulo no mês passado e, em julho, avançou para Salvador e Santa Catarina. A proposta é expandir esse formato para outras capitais e cidades do interior de São Paulo, reforçando a capilaridade da marca e seu posicionamento como a <strong className="text-primary opacity-100">maior rede de estúdios de Pilates da América Latina</strong>.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   NOVIDADES NO HUB
   ══════════════════════════════════════════════════════════════ */
const HubPage = () => (
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
        <p className="max-w-3xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Você sabe aquele lugar onde tudo acontece? Onde você encontra as campanhas, os materiais, as atualizações, os dados do seu estúdio, o suporte da equipe? <strong>Pois é - adicione aos favoritos agora!</strong> A plataforma de comunicação interna Pure Pilates é hub.purepilates.com.br. E a cada dia estamos entregando novas funcionalidades para facilitar sua vida e potencializar seu negócio.
        </p>
      </div>
    </AnimatedSection>

    {/* Tutorial do Marketing */}
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl bg-foreground text-background p-10 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">Leitura obrigatória</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
          Tutorial de <span className="text-primary">Marketing.</span>
        </h2>

        <p className="opacity-80 leading-relaxed mb-6 max-w-3xl">
          A seção de Tutorial de Marketing é leitura obrigatória para os nossos franqueados. É um guia completo e estruturado que reúne tudo que você precisa saber sobre como estamos operando, quais são nossas políticas, como funcionam nossas campanhas, como você deve executar as promoções, e qual é a estratégia por trás de cada ação.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <ShieldCheck className="h-5 w-5 mb-3 text-primary" />
            <p className="font-heading font-bold text-base mb-1">Políticas de Marketing</p>
            <p className="text-sm opacity-70">Aqui estão todas as políticas que guiam nossas ações de mídia e como aplicamos cada recurso financeiro.</p>
          </div>
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <Megaphone className="h-5 w-5 mb-3 text-primary" />
            <p className="font-heading font-bold text-base mb-1">Campanhas Explicadas</p>
            <p className="text-sm opacity-70">Cada campanha que estamos rodando tem uma página dedicada aqui.</p>
          </div>
          <div className="rounded-xl bg-background/10 border border-background/15 p-5">
            <BookOpen className="h-5 w-5 mb-3 text-primary" />
            <p className="font-heading font-bold text-base mb-1">Operação e Execução</p>
            <p className="text-sm opacity-70">Como você executamos as ações, links rápidos para validação de influencers, uso das redes sociais locais e google meu negócio.</p>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          Novo! Exemplos das peças publicitárias das campanhas de aporte.
        </div>

        <div className="mt-6">
          <a
            href="https://hub.purepilates.com.br/tutorial-marketing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Acesse o Tutorial de Marketing
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </AnimatedSection>

    {/* Pure Metrics */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <CardContent className="pt-6 sm:pt-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Em breve · Pesquisa de Marca</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
            Pure <span className="text-primary">Metrics.</span>
          </h2>

          <div className="space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed max-w-3xl">
            <p>Em breve, a rede contará com uma nova ferramenta criada para transformar a percepção dos alunos em inteligência estratégica. A Pure Metrics vai permitir compreender, de forma mais profunda, como a Pure Pilates é reconhecida, quais atributos estão mais presentes na experiência e como a marca é percebida em diferentes regiões e perfis de público.</p>
            <p>Por meio de uma jornada de pesquisa simples e conectada ao cadastro dos alunos, será possível acompanhar pilares como acolhimento, acessibilidade, capilaridade, facilidade e eficiência. A ferramenta também vai avaliar os benefícios percebidos com a prática, a experiência com o aplicativo, o nível de recomendação e a relação entre aquilo que a marca comunica e o que o aluno realmente vivencia dentro das unidades.</p>
            <p>Essas informações vão apoiar as decisões futuras da Pure Pilates, oferecendo uma base concreta para avaliar caminhos de posicionamento, mensagens, campanhas e prioridades estratégicas. Assim, a evolução da marca deixa de depender apenas de percepções internas e passa a considerar, de forma estruturada, a visão de quem vive a Pure todos os dias.</p>
            <p className="font-semibold text-foreground">Mais do que medir resultados, a Pure Metrics será uma ferramenta para compreender o presente, identificar oportunidades e construir os próximos capítulos da marca com mais clareza, consistência e conexão com o público.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-6">
            {['Acolhimento', 'Acessibilidade', 'Capilaridade', 'Facilidade', 'Eficiência'].map((pilar) => (
              <div key={pilar} className="rounded-lg bg-[#fdf3df] border border-primary/15 px-3 py-2.5 text-center text-xs sm:text-sm font-semibold text-foreground/80">
                {pilar}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Pure Station */}
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl bg-foreground text-background p-8 sm:p-12 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-primary text-primary-foreground p-3 shrink-0">
            <Zap className="h-7 w-7" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-[10px] uppercase tracking-widest text-primary font-bold">
              <Server className="h-3 w-3" />
              Tecnologia própria
            </span>
          </div>
        </div>

        <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-2 leading-tight">
          Pure <span className="text-primary">Station.</span>
        </h2>
        <p className="text-lg sm:text-xl font-heading font-semibold text-primary mb-5">
          Hub de automações de e-mails, sms e muito mais!
        </p>

        <div className="space-y-3 opacity-85 leading-relaxed max-w-3xl">
          <p>
            <strong className="opacity-100">Internalizamos a nossa plataforma de disparos de e-mails.</strong> Trazer essa operação para dentro de casa é mais uma prova de que o <strong className="opacity-100">compromisso da Pure Pilates com a tecnologia é sempre prioridade</strong> — deixamos de depender de ferramentas de terceiros e passamos a controlar toda a jornada de comunicação com o cliente.
          </p>
          <p>
            Na prática, isso significa <strong className="opacity-100 text-primary">redução de custos</strong> e, principalmente, <strong className="opacity-100 text-primary">autonomia para campanhas cada vez maiores</strong>. Com uma base própria e escalável, abrimos caminho para novos canais de relacionamento — como os <strong className="opacity-100">disparos de WhatsApp</strong> — levando a mensagem da rede ainda mais longe, com mais velocidade e inteligência.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
          {[
            { icon: Server, title: 'Plataforma internalizada', desc: 'Disparos de e-mail sob nosso controle, sem depender de terceiros.' },
            { icon: DollarSign, title: 'Redução de custos', desc: 'Mais eficiência operacional e economia para a rede.' },
            { icon: Rocket, title: 'Autonomia para escalar', desc: 'Preparados para campanhas maiores — incluindo WhatsApp.' },
          ].map((item, i) => (
            <AnimatedSection key={item.title} variant="scale-up" delay={i * 110}>
              <div className="rounded-xl bg-background/10 border border-background/15 p-5 h-full">
                <item.icon className="h-5 w-5 text-primary mb-3" />
                <p className="font-heading font-bold text-base mb-1">{item.title}</p>
                <p className="text-sm opacity-70 leading-snug">{item.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/10 border border-background/15 px-3 py-1.5 text-xs font-semibold">
            <Mail className="h-3.5 w-3.5 text-primary" /> E-mail
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/10 border border-background/15 px-3 py-1.5 text-xs font-semibold">
            <Smartphone className="h-3.5 w-3.5 text-primary" /> SMS
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp · em breve
          </span>
        </div>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   AGOSTO NAS REDES & PURE ACADEMY
   ══════════════════════════════════════════════════════════════ */
const InstitucionalPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Agosto · Redes Sociais</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Agosto <span className="text-primary">começa aqui.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          O calendário editorial e o conteúdo local que fortalecem a marca — mais o spoiler da Pure Academy.
        </p>
      </div>
    </AnimatedSection>

    {/* Calendário editorial */}
    <AnimatedSection variant="fade-up">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6 space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
          <p className="font-bold text-foreground">O calendário editorial já nasce com estratégia.</p>
          <p>Utilize o material que produzimos para o perfil oficial nas redes locais. Todo mês, a rede desenvolve o calendário considerando comportamento do público, leitura de SEO, formatos com melhor desempenho, identidade da marca e dinâmica do algoritmo.</p>
          <p>A inteligência artificial também pode apoiar esse processo. Mas sempre com direção, curadoria e intenção.</p>
          <p>A diferença está aqui: não é usar IA para preencher espaço. É usar estratégia para criar conteúdo que aproxima, posiciona e vende melhor a experiência Pure Pilates.</p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* O conteúdo mais forte está dentro da sua unidade */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-2xl bg-foreground text-background p-8 sm:p-12">
        <Sparkles className="h-7 w-7 text-primary mb-4" />
        <h3 className="text-3xl sm:text-4xl font-heading font-bold leading-tight mb-6">
          O conteúdo mais forte<br />está <span className="text-primary">dentro da sua unidade.</span>
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {[
            'Alunos em movimento.',
            'Professores orientando.',
            'Desafios acontecendo.',
            'Bastidores reais.',
            'Depoimentos espontâneos.',
            'A rotina viva do estúdio.',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg bg-background/10 border border-background/15 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm opacity-90">{item}</span>
            </div>
          ))}
        </div>

        <p className="opacity-85 leading-relaxed mb-5 max-w-3xl">
          Esse tipo de conteúdo cria presença, aproxima a comunidade e mostra a experiência Pure Pilates como ela realmente acontece.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            'Incentivem seus professores a criarem.',
            'Repostem bons conteúdos.',
            'Valorizem os alunos.',
            'Mostrem a energia da unidade.',
          ].map((item) => (
            <div key={item} className="rounded-lg bg-primary/15 border border-primary/20 px-3 py-2.5 text-sm opacity-95">
              {item}
            </div>
          ))}
        </div>

        <p className="opacity-85 leading-relaxed max-w-3xl">
          Com o tempo, conteúdos locais bem produzidos também podem ganhar espaço na rede nacional. A comunicação fica mais humana quando a unidade aparece de verdade.
        </p>
      </div>
    </AnimatedSection>

    {/* Pure Academy — Curso 100% online */}
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl bg-gradient-to-br from-[#fdf3df] to-white border-2 border-primary/20 p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-primary-foreground">
            <Rocket className="h-3 w-3" />
            Vem aí
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Pure Academy</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight text-foreground">
          Curso de Formação em Pilates <span className="text-primary">100% Online.</span>
        </h2>

        <div className="space-y-3 text-foreground/85 leading-relaxed max-w-3xl">
          <p>Franqueados Pure, vem novidade da Pure Academy para fortalecer ainda mais a nossa rede!</p>
          <p>Em breve, lançaremos o Curso de Formação em Pilates 100% online, com a qualidade e a metodologia da Pure Pilates. Uma nova oportunidade para facilitar o acesso à formação em Pilates, preparar mais profissionais e apoiar o crescimento dos nossos estúdios.</p>
          <p className="font-semibold text-primary">Mais acessibilidade, mais profissionais capacitados e uma rede ainda mais forte.</p>
          <p className="font-bold text-foreground">Aguardem!</p>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground/70">Pure Academy</span>
        </div>
      </div>
    </AnimatedSection>

    {/* Closing */}
    <AnimatedSection variant="scale-up">
      <div className="text-center py-8">
        <p className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
          Excelente agosto<span className="text-primary">.</span>
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
          Com muitas matrículas, crescimento e resultados para toda a rede.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
const MonthLanding_2026_08 = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
      case 'influencer': return <InfluencerPage />;
      case 'social': return <SocialPage />;
      case 'clusters': return <ClustersPage />;
      case 'marca': return <MarcaPage />;
      case 'hub': return <HubPage />;
      case 'institucional': return <InstitucionalPage />;
    }
  };

  return (
    <div className="rounded-3xl bg-[#fdf3df] p-5 sm:p-8 pb-10">
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

export default MonthLanding_2026_08;

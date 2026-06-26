import { useState, useEffect, useRef } from 'react';
import AnimatedSection from './AnimatedSection';
import AnimatedCounter from './AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { SectionTitle } from './shared';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import {
  Quote, AlertTriangle, Snowflake, ArrowUpRight, HandHeart, Sparkles,
  Users, FileText, Calendar, BarChart3, ShieldCheck, BookOpen, Heart,
  ArrowRight, ChevronRight, ChevronLeft, Star, Lightbulb, CheckCircle2,
  Megaphone, Palette, DollarSign, LayoutDashboard, X, ThumbsUp, Minus,
  ThumbsDown, Instagram, Eye, MessageCircle, Heart as HeartIcon, Share2,
  Bot, Lock, GraduationCap, Building2, Network, Ban, Smartphone,
  CalendarCheck, ArrowDownRight, Clock, Bookmark,
} from 'lucide-react';
import logoPure from '@/assets/logo-pure-pilates.png';

type TabKey =
  | 'inicio'
  | 'resultados'
  | 'publicacoes'
  | 'conteudo'
  | 'clusters'
  | 'julho'
  | 'hub'
  | 'institucional';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Página Inicial' },
  { key: 'resultados', label: 'Resultados Junho' },
  { key: 'publicacoes', label: 'Publicações em destaque' },
  { key: 'conteudo', label: 'Conteúdo & IA' },
  { key: 'clusters', label: 'Clusters 1º semestre' },
  { key: 'julho', label: 'Foco Julho · Indique' },
  { key: 'hub', label: 'Novidades no HUB' },
  { key: 'institucional', label: 'Institucional' },
];

const PEACH_DARK = '#e9c688';

/* Saúde de marca · Junho 2026 (parcial até 24/06) */
const SENTIMENTO_JUNHO = [
  { name: 'Positivo', value: 37.4, color: 'hsl(var(--primary))' },
  { name: 'Neutro', value: 59.6, color: PEACH_DARK },
  { name: 'Negativos', value: 2.8, color: '#d97f7f' },
];

/* Publicações de Junho em destaque — métricas e análises verbatim do relatório */
type DestaquePost = {
  title: string;
  postedAt: string;
  embedShortcode?: string;
  metrics: { icon: React.ElementType; value: number; label: string; highlight?: boolean }[];
  paras: React.ReactNode[];
};

const DESTAQUES: DestaquePost[] = [
  {
    title: 'Desafio da semana',
    postedAt: '07/06',
    metrics: [
      { icon: ArrowUpRight, value: 1007, label: 'interações', highlight: true },
      { icon: Eye, value: 19513, label: 'visualizações' },
      { icon: HeartIcon, value: 790, label: 'curtidas' },
    ],
    paras: [
      <>Em junho, o principal destaque de performance foi o Reel "Desafio da Semana", publicado em 07/06.</>,
      <>O conteúdo registrou 1.007 interações, 19.513 visualizações e 790 curtidas, consolidando-se como o post com maior número de interações do mês.</>,
      <>O resultado reforça a força do formato que já é carro-chefe da Pure Pilates. Com a entrada de mais pessoas no time criativo dos desafios e ajustes feitos a partir dos feedbacks recebidos, o conteúdo evoluiu sem perder sua essência: movimento técnico, desafio visual e alto potencial de engajamento.</>,
      <>A performance mostra que inovar dentro de um formato já validado pode ampliar ainda mais o alcance, mantendo consistência editorial e fortalecendo a percepção de comunidade em torno dos desafios semanais.</>,
    ],
  },
  {
    title: 'Trend Namorados',
    postedAt: '11/06',
    embedShortcode: 'DZc1dkXpUBA',
    metrics: [
      { icon: ArrowUpRight, value: 820, label: 'interações', highlight: true },
      { icon: Eye, value: 21608, label: 'visualizações' },
      { icon: Users, value: 13240, label: 'contas alcançadas' },
      { icon: MessageCircle, value: 53, label: 'comentários' },
    ],
    paras: [
      <>O Reel de Dia dos Namorados, publicado em 11/06, foi o segundo melhor conteúdo do mês em interações.</>,
      <>A publicação registrou 820 interações, 21.608 visualizações, 13.240 contas alcançadas e 53 comentários, sendo o conteúdo com maior alcance, maior volume de visualizações e mais comentários entre os destaques de junho.</>,
      <>A proposta aproveitou uma trend sazonal para criar uma brincadeira leve com o Pilates, conectando a data ao autocuidado e à ideia de que o melhor presente também pode ser para si mesmo.</>,
      <>A boa performance indica que conteúdos com humor, identificação e timing de calendário têm alto potencial de gerar conversa, especialmente quando a mensagem mantém conexão direta com bem-estar, autoestima e experiência de marca.</>,
    ],
  },
  {
    title: 'Desafio Junino',
    postedAt: '08/06',
    embedShortcode: 'DZVS1vokaii',
    metrics: [
      { icon: ArrowUpRight, value: 754, label: 'interações', highlight: true },
      { icon: Eye, value: 17593, label: 'visualizações' },
      { icon: Users, value: 10312, label: 'contas alcançadas' },
      { icon: Share2, value: 225, label: 'compartilhamentos' },
      { icon: Bookmark, value: 96, label: 'salvamentos' },
    ],
    paras: [
      <>O Desafio Junino, publicado em 08/06, ficou entre os três conteúdos com maior número de interações do mês.</>,
      <>O post registrou 754 interações, 17.593 visualizações, 10.312 contas alcançadas, 225 compartilhamentos e 96 salvamentos, sendo o destaque do mês em compartilhamentos e salvamentos.</>,
      <>Mesmo não sendo um Desafio da Semana oficial, o conteúdo funcionou como uma extensão criativa do formato, trazendo a energia junina para dentro do estúdio e transformando o exercício em uma dinâmica de engajamento.</>,
      <>O resultado mostra que conteúdos extras, quando conectados a datas culturais e à linguagem de desafio, conseguem ampliar o alcance da marca e estimular participação, compartilhamento e pertencimento.</>,
    ],
  },
];

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
                Timeline · Julho 2026
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-bold leading-[1.1] text-foreground">
              Caro<br />franqueado,
            </h1>

            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              <strong>Faltam menos de 115 dias para terminar 2026!</strong> Este ano além dos desafios que já conhecemos teremos um segundo semestre muito mais corrido e, por isso, reforçamos a necessidade de planejamento neste mês de julho e uma dedicação nas ações de marketing visto que ainda temos número de unidades em estágio de crescimento. Preparamos diversas novidades nas campanhas publicitárias e na nossa plataforma central de comunicação. <strong>Enjoy it!</strong>
            </p>
          </div>

          <div className="space-y-4 rounded-xl bg-background/70 backdrop-blur-sm border border-foreground/5 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs uppercase tracking-widest font-bold">Junho confirmou as indicações</span>
            </div>
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              O mês de junho confirmou as nossas indicações: descréscimo na busca de aula experimental, sazonalidade de inverno já conhecida nas principais praças resultando em <strong>leads novos 9% abaixo da meta</strong>. A aquisição via mídia paga enfrentará desafios cada vez maiores e as unidades que estão com aporte já apresentam melhor fôlego para esta baixa temporada.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="flex flex-col items-center rounded-lg bg-background p-3 border border-foreground/5">
                <Snowflake className="h-5 w-5 text-primary mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Inverno</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-background p-3 border border-foreground/5">
                <ArrowUpRight className="h-5 w-5 text-primary mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Custos</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-background p-3 border border-foreground/5">
                <HandHeart className="h-5 w-5 text-primary mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Indique</span>
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
            Como complemento seguimos com o reforço da comunicação das indicações dentro da comunidade da Pure Pilates. Continue na ativação <strong>"Indique Pilates"</strong> em cada aula, em cada momento de conexão com seus alunos. Orientem suas equipes para falar sobre a recompensa: <strong>uma massagem para quem indica</strong> após fechamento de qualquer plano da Pure Pilates.
          </p>

          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Como nas estratégias de mídia temos o trabalho de verba dedicada com mais intensidade por necessidade de clusters enviamos um resumo do que tivemos de concentração e migração de lojas no último semestre. Importante reforçar sempre investimentos de marketing e para que a sua unidade performe melhor o processo tem que ser <strong>consistente e persistente</strong>. No Hub da Pure Pilates você pode seguir com as autorizações de aporte para campanhas de aula experimental e de recrutamento de profissionais. Para as unidades que já estão com esta conduta preparamos a seção de analytics também!
          </p>

          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Para dar suporte na nossa <strong>"melhor hora do dia"</strong> preparamos uma edição mais que especial: direto de Salvador/BA mais dois grandes vídeos: um com o Lucas Pizane{' '}
            <a href="https://www.instagram.com/lucaspizane/?hl=en" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 break-words">https://www.instagram.com/lucaspizane/?hl=en</a>{' '}
            que é cliente Pure Pilates e topou contar como participamos da vida dele. Este material será usado nas campanhas pagas. Em paralelo, teremos a história da nossa querida aluna que conta um pouco mais da sua história com a cidade e como a Pure Pilates é a melhor hora do seu dia!
          </p>

          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            A pedido do nosso Diretor Roberto Serroni preparamos um guia para auxiliar nas negociações de pontos comerciais. Estas credenciais valorizam nossa chegada de marca nos principais varejistas e imobiliárias. E já concentração total para agosto organize seus pedidos na <strong>Pure Store!</strong>
          </p>

          <p className="text-xs uppercase tracking-widest text-primary font-bold pt-2">
            Departamento de Marketing Pure Pilates.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Agenda — preview clicável */}
    <AnimatedSection>
      <SectionTitle>Agenda de Julho</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Clique em qualquer bloco para ir direto à seção:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { key: 'resultados' as TabKey, icon: BarChart3, title: 'Resultados de Junho', desc: 'Performance A–E e saúde de marca — leitura parcial até 24/06.' },
        { key: 'publicacoes' as TabKey, icon: Instagram, title: 'Publicações em destaque', desc: 'Desafio da Semana, Trend Namorados e Desafio Junino.' },
        { key: 'conteudo' as TabKey, icon: Bot, title: 'Conteúdo & IA nas redes', desc: 'IA ajuda, mas conteúdo automático atrapalha. O que fortalece a marca.' },
        { key: 'clusters' as TabKey, icon: Network, title: 'Clusters 1º semestre', desc: 'Concentração e migração de lojas, verba de contribuição e aporte.' },
        { key: 'julho' as TabKey, icon: HandHeart, title: 'Foco Julho · Indique Pilates', desc: 'Resumo das ações, calendário e a campanha de indicações.' },
        { key: 'hub' as TabKey, icon: Star, title: 'Novidades no HUB', desc: 'Tutorial do Marketing, Verba Adicional, Pure Design e Dashboard.' },
        { key: 'institucional' as TabKey, icon: GraduationCap, title: 'Institucional', desc: 'Clube de Vantagens, LGPD, Curso 100% online e Expansão.' },
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
   RESULTADOS JUNHO — performance (parcial) + saúde de marca
   ══════════════════════════════════════════════════════════════ */
const FUNIL_ROWS = [
  { label: 'Aula Experimental', maio: 7436, junho: 6453 },
  { label: 'Presença Aula Experimental', maio: 5146, junho: 4688 },
  { label: 'Matrículas', maio: 1330, junho: 1163 },
  { label: 'PurePass', maio: 219, junho: 53 },
];

const ResultadosPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Junho · Performance · Resultado parcial (até 24/06)
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Resultados de <span className="text-primary">Junho.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Performance A–E e visão de clusters. Leitura parcial dos principais indicadores de aquisição.
        </p>
      </div>
    </AnimatedSection>

    {/* Tabela de performance Maio × Junho */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Junho · Performance</p>
              <h3 className="text-xl font-heading font-semibold">Indicadores de aquisição</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest text-primary font-bold">
              <Clock className="h-3 w-3" />
              Resultado parcial (até 24/06)
            </span>
          </div>

          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 sm:gap-3">
            <div />
            <div className="rounded-t-xl bg-[#e9c688]/40 text-center py-2.5 text-xs uppercase tracking-widest font-bold text-foreground/70">
              Maio
            </div>
            <div className="rounded-t-xl bg-primary text-center py-2.5 text-xs uppercase tracking-widest font-bold text-primary-foreground">
              Junho
            </div>
          </div>

          {/* Linhas */}
          <div className="space-y-2 mt-1">
            {FUNIL_ROWS.map((row) => {
              const delta = row.maio > 0 ? ((row.junho - row.maio) / row.maio) * 100 : 0;
              return (
                <div key={row.label} className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 sm:gap-3 items-stretch">
                  <div className="flex items-center rounded-lg bg-muted/40 px-3 sm:px-4 py-3 text-sm font-semibold text-foreground/80">
                    {row.label}
                  </div>
                  <div className="flex items-center justify-center rounded-lg bg-[#e9c688]/15 border border-[#e9c688]/30 py-3 text-base sm:text-lg font-heading font-bold text-foreground/70 tabular-nums">
                    {row.maio.toLocaleString('pt-BR')}
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-primary/5 border border-primary/20 py-2.5 text-base sm:text-lg font-heading font-bold text-primary tabular-nums">
                    {row.junho.toLocaleString('pt-BR')}
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                      {delta >= 0 ? '+' : ''}{delta.toFixed(0)}% vs maio
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Saúde de marca */}
    <AnimatedSection>
      <SectionTitle>Junho · Saúde de marca</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Sentimento da marca — análise de menções e percepção pública. <strong>Resultado parcial (até 24/06)</strong>.
      </p>
    </AnimatedSection>

    <AnimatedSection variant="fade-up">
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-[minmax(0,360px)_1fr] gap-6 items-center">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SENTIMENTO_JUNHO}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    animationDuration={1200}
                  >
                    {SENTIMENTO_JUNHO.map((entry, i) => (
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
              {SENTIMENTO_JUNHO.map((item) => {
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
   PUBLICAÇÕES EM DESTAQUE — junho
   ══════════════════════════════════════════════════════════════ */
const DestaqueBlock = ({ post }: { post: DestaquePost }) => {
  const hasEmbed = Boolean(post.embedShortcode);
  const postUrl = post.embedShortcode ? `https://www.instagram.com/p/${post.embedShortcode}/` : undefined;
  const embedUrl = post.embedShortcode ? `https://www.instagram.com/p/${post.embedShortcode}/embed` : undefined;

  const header = (
    <>
      <div className="flex items-center gap-2 mb-1">
        <Instagram className="h-4 w-4 text-primary" />
        <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
          @purepilatesbr · {post.postedAt}
        </span>
      </div>
      <h3 className="font-heading font-bold text-2xl mb-5">{post.title}</h3>
    </>
  );

  const metrics = (
    <div className={cn(
      'grid gap-3 grid-cols-2',
      hasEmbed
        ? 'sm:grid-cols-2'
        : post.metrics.length >= 5 ? 'sm:grid-cols-5' : post.metrics.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
    )}>
      {post.metrics.map((m) => (
        <div
          key={m.label}
          className={cn(
            'rounded-xl p-4 text-center',
            m.highlight ? 'bg-primary/10' : 'bg-[#f3d7a7]/40'
          )}
        >
          <m.icon className={cn('h-4 w-4 mx-auto mb-1.5', m.highlight ? 'text-primary' : 'text-foreground/60')} />
          <p className={cn(
            'text-2xl sm:text-3xl font-heading font-bold tabular-nums',
            m.highlight ? 'text-primary' : 'text-foreground'
          )}>
            <AnimatedCounter end={m.value} />
          </p>
          <p className={cn(
            'text-[10px] uppercase tracking-widest font-semibold mt-1',
            m.highlight ? 'text-primary' : 'text-muted-foreground'
          )}>
            {m.label}
          </p>
        </div>
      ))}
    </div>
  );

  const analysis = (
    <div className="space-y-3">
      {post.paras.map((para, idx) => (
        <p key={idx} className="text-sm sm:text-base text-foreground/85 leading-relaxed">
          {para}
        </p>
      ))}
    </div>
  );

  if (hasEmbed) {
    return (
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-0">
          {/* Coluna esquerda — embed do Instagram */}
          <div className="bg-muted/20 border-b lg:border-b-0 lg:border-r border-foreground/5 p-5 sm:p-6 space-y-4">
            <div className="rounded-xl overflow-hidden border border-foreground/10 bg-background">
              <iframe
                src={embedUrl}
                title={post.title}
                className="w-full block"
                style={{ height: 640, border: 0 }}
                loading="lazy"
                scrolling="no"
              />
            </div>
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors group"
            >
              <Instagram className="h-3.5 w-3.5" />
              Ver no Instagram
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Coluna direita — métricas + análise verbatim */}
          <div className="p-5 sm:p-7 space-y-6">
            <div>{header}{metrics}</div>
            {analysis}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-t-4 border-t-primary">
      <CardContent className="pt-6 sm:pt-7">
        {header}
        <div className="mb-6">{metrics}</div>
        {analysis}
      </CardContent>
    </Card>
  );
};

const PublicacoesPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Instagram className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Publicações Junho · @purepilatesbr
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Destaques <span className="text-primary">de junho.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Os três conteúdos com maior tração no mês — números e análise de performance de cada um.
        </p>
      </div>
    </AnimatedSection>

    <div className="space-y-8">
      {DESTAQUES.map((post, i) => (
        <AnimatedSection key={post.title} variant="fade-up" delay={i * 100}>
          <DestaqueBlock post={post} />
        </AnimatedSection>
      ))}
    </div>
  </>
);

/* ══════════════════════════════════════════════════════════════
   CONTEÚDO & IA — filosofia de conteúdo das redes
   ══════════════════════════════════════════════════════════════ */
const ConteudoPage = () => (
  <>
    {/* IA ajuda mas */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Uso de conteúdo com IA nas redes sociais
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-3">
          IA ajuda mas
        </h2>
        <p className="text-2xl sm:text-3xl font-heading font-bold text-primary leading-snug">
          Conteúdo automático atrapalha.
        </p>
      </div>
    </AnimatedSection>

    <AnimatedSection variant="fade-up">
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
          <p>A tecnologia pode acelerar a criação.</p>
          <p>Mas quando o conteúdo sai sem curadoria, com excesso de texto, layout poluído, logo distorcido, cores fora da identidade e informação demais na mesma arte, ele deixa de parecer estratégico.</p>
          <p>E começa a parecer genérico.</p>
          <p>Na prática, isso enfraquece a percepção da unidade e reduz a força da marca.</p>
          <p className="font-bold text-foreground">Mais informação não significa mais resultado.</p>
          <p>O Instagram não prioriza uma arte porque ela tem muito texto.</p>
          <p>Ele tende a entregar melhor conteúdos que prendem atenção, geram identificação, criam conversa e fazem sentido para quem está vendo.</p>
          <p>Por isso, um post com cara de infográfico automático pode até parecer completo, mas muitas vezes não gera conexão.</p>
          <p>E quando não existe conexão, o engajamento cai.</p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Calendário editorial */}
    <AnimatedSection>
      <SectionTitle>Calendário</SectionTitle>
    </AnimatedSection>

    <AnimatedSection variant="fade-up">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6 space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
          <p className="font-bold text-foreground">O calendário editorial já nasce com estratégia.</p>
          <p>Todo mês, a rede desenvolve o calendário considerando comportamento do público, leitura de SEO, formatos com melhor desempenho, identidade da marca e dinâmica do algoritmo.</p>
          <p>A inteligência artificial também pode apoiar esse processo.</p>
          <p>Mas sempre com direção, curadoria e intenção.</p>
          <p>A diferença está aqui:</p>
          <p>não é usar IA para preencher espaço.</p>
          <p>É usar estratégia para criar conteúdo que aproxima, posiciona e vende melhor a experiência Pure Pilates.</p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* O conteúdo mais forte */}
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
  </>
);

/* ══════════════════════════════════════════════════════════════
   CLUSTERS — 1º semestre 2026
   ══════════════════════════════════════════════════════════════ */
/* Concentração da rede por banda de mensalistas ativos — Pure System até 23/06/2026.
   Radar com Janeiro × Maio × Junho, evidenciando a concentração no cluster <39 ativos. */
const CLUSTER_RADAR = [
  { band: 'Até 39 ativos', Janeiro: 210, Maio: 285, Junho: 300 },
  { band: '40-59 ativos', Janeiro: 60, Maio: 70, Junho: 80 },
  { band: '60-79 ativos', Janeiro: 30, Maio: 35, Junho: 40 },
  { band: '>80 ativos', Janeiro: 28, Maio: 30, Junho: 33 },
];

const CLUSTER_SERIES = [
  { key: 'Junho', color: 'hsl(var(--primary))' },
  { key: 'Maio', color: '#f4b1b1' },
  { key: 'Janeiro', color: '#3aa6b0' },
] as const;

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
          Clusters <span className="text-primary">1s2026.</span>
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
              <AnimatedCounter end={453} />
            </p>
            <p className="text-sm text-muted-foreground mt-2">unidades ativas</p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="scale-up" delay={240}>
        <Card className="h-full border-t-4 border-t-[#e9c688]">
          <CardContent className="pt-6 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Maior atenção</p>
            <p className="text-4xl sm:text-5xl font-heading font-bold text-foreground tabular-nums">
              +<AnimatedCounter end={60} suffix="%" />
            </p>
            <p className="text-sm text-muted-foreground mt-2">da rede no cluster crítico</p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* Texto verbatim */}
    <AnimatedSection variant="fade-up">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            A verba de contribuição mensal tem como objetivo alcançar leads novos para aula experimental, evidenciar canal trabalhe conosco e reforçar a marca. Desde out/25 adotamos clusters colocando atenção nas unidades críticas e em crescimento através do indicador de mensalistas. Começamos o ano com <strong>401 unidades</strong> e hoje temos <strong>453 unidades ativas</strong> sendo que <strong>mais de 60% da rede</strong> hoje esta no cluster de maior atenção. Com muitas unidades e um recurso limitado o aporte de mídia auxilia no incremento e suporte destas ações. A seguir o gráfico que evidencia a concentração da rede com <strong>&lt;39 mensalistas ativos</strong> devido estágio e maturidade da unidade.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Radar · concentração da rede por cluster (página 20 do Canva) */}
    <AnimatedSection variant="fade-up">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Concentração da rede</p>
              <h3 className="text-xl font-heading font-semibold">Unidades ativas por cluster de mensalistas</h3>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Janeiro · Maio · Junho
            </span>
          </div>

          <div style={{ width: '100%', height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={CLUSTER_RADAR} startAngle={90} endAngle={-270} outerRadius="72%">
                <PolarGrid stroke="#cbb994" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="band"
                  tick={{ fontSize: 12, fill: '#5b5b5b', fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 300]}
                  tickCount={4}
                  tick={{ fontSize: 10, fill: '#9a8c6f' }}
                  axisLine={false}
                />
                {CLUSTER_SERIES.map((s, i) => (
                  <Radar
                    key={s.key}
                    name={s.key}
                    dataKey={s.key}
                    stroke={s.color}
                    fill={s.color}
                    fillOpacity={s.key === 'Janeiro' ? 0.35 : 0.05}
                    strokeWidth={2}
                    animationDuration={1100}
                    animationBegin={i * 200}
                  />
                ))}
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e9c688', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => `${v} unidades`}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-muted-foreground/80 text-right italic mt-1">
            Pure System até 23-06-2026
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    <AnimatedSection>
      <div className="rounded-xl bg-muted/40 border border-foreground/5 p-5 flex gap-3">
        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Importante reforçar sempre investimentos de marketing: para que a sua unidade performe melhor, o processo tem que ser <strong>consistente e persistente</strong>. No Hub você segue com as autorizações de aporte — e, para quem já está nessa conduta, há a seção de <strong>analytics</strong>.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   FOCO JULHO — ações, calendário e Indique Pilates
   ══════════════════════════════════════════════════════════════ */
const SAFRAS = [
  { tier: 'Alta', months: ['Janeiro'], activity: 'Awareness', sub: 'Aula Experimental', color: 'bg-emerald-50 border-emerald-200', tierColor: 'text-emerald-700' },
  { tier: 'Média-Alta', months: ['Fevereiro', 'Março', 'Agosto', 'Setembro', 'Outubro'], activity: 'Média-Alta', sub: 'Aula Experimental', color: 'bg-sky-50 border-sky-200', tierColor: 'text-sky-700' },
  { tier: 'Média', months: ['Abril', 'Maio', 'Novembro'], activity: 'Média', sub: 'Aula Experimental', color: 'bg-amber-50 border-amber-200', tierColor: 'text-amber-700' },
  { tier: 'Baixa', months: ['Junho', 'Julho', 'Dezembro'], activity: 'Baixa', sub: 'MGM "Indique Pilates"', color: 'bg-primary/10 border-primary', tierColor: 'text-primary', isCurrent: true },
];

const JulhoPage = () => (
  <>
    {/* Hero */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Foco Julho
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Julho<span className="text-primary">.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Resumo das ações e calendário das redes sociais locais.
        </p>
      </div>
    </AnimatedSection>

    {/* Indique Pure — campanha */}
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-[#fdf3df] to-white">
        <div className="bg-primary text-primary-foreground px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <HandHeart className="h-6 w-6" />
            <span className="text-2xl sm:text-3xl font-heading font-black tracking-tight">Indique Pure</span>
          </div>
          <div className="sm:ml-auto inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold">
            <Heart className="h-4 w-4 fill-current" />
            Quanto mais você indica, mais massagem você ganha.
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Smartphone, step: 'Acesse', desc: 'O programa no site ou app' },
              { icon: Share2, step: 'Compartilhe', desc: 'seu link com seus amigos' },
              { icon: CalendarCheck, step: 'Eles agendam', desc: 'uma aula e você ganha uma massagem' },
            ].map((s, i) => (
              <AnimatedSection key={s.step} variant="scale-up" delay={i * 120}>
                <div className="rounded-xl bg-card border border-primary/15 p-5 h-full text-center hover:shadow-md transition-shadow">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1">{s.step}</p>
                  <p className="text-sm text-foreground/80 leading-snug">{s.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Indique. Transforme. <span className="text-primary">E relaxe!</span>
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* Critérios safras */}
    <AnimatedSection>
      <SectionTitle>Calendário · critérios safras e DT's</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-4xl leading-relaxed">
        Critérios para calendário promocional considerando <strong>DT's</strong> e sazonalidades do varejo. O acompanhamento de leads novos de A-E por dia trabalhado é acompanhado para parametrizar volume adequado para os resultados. Além disso, temos as unidades clusterizadas dentro das campanhas para entregabilidade da mídia, mas visto o desafio do ano e os resultados de clientes ativos o escopo abaixo é mais uma <strong>atividade estratégia</strong>.
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {SAFRAS.map((col, i) => (
        <AnimatedSection key={col.tier} variant="fade-up" delay={i * 100}>
          <Card className={cn('h-full border-2 transition-all', col.color, col.isCurrent && 'ring-2 ring-primary shadow-lg')}>
            <CardContent className="pt-5 space-y-4">
              {col.isCurrent && (
                <div className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] uppercase tracking-widest text-primary-foreground font-bold">
                  <Star className="h-3 w-3 fill-current" />
                  Mês atual
                </div>
              )}
              <div>
                <p className={cn('text-2xl font-heading font-black mb-2', col.tierColor)}>{col.tier}</p>
                <ul className="space-y-1">
                  {col.months.map((m) => (
                    <li key={m} className={cn(
                      'text-sm leading-snug',
                      col.isCurrent && m === 'Julho' ? 'font-bold text-primary' : 'text-foreground/75'
                    )}>
                      {m}
                      {col.isCurrent && m === 'Julho' && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wider text-primary font-bold">← agora</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <ArrowDownRight className={cn('h-5 w-5 rotate-45', col.isCurrent ? 'text-primary' : 'text-muted-foreground/40')} />
              </div>
              <div>
                <p className={cn('text-[10px] uppercase tracking-widest font-bold mb-1', col.tierColor)}>{col.activity}</p>
                <p className={cn('text-sm leading-snug', col.isCurrent ? 'font-bold text-foreground' : 'text-foreground/75')}>{col.sub}</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>

    {/* Nota safra baixa */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-xl bg-foreground text-background p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="rounded-full bg-primary/20 p-3 shrink-0 w-fit">
          <Snowflake className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold mb-1">
            Julho · Safra baixa
          </p>
          <p className="text-base sm:text-lg leading-snug">
            Cluster <strong className="text-primary">Baixa</strong> — atividade principal é a campanha <strong className="text-primary">MGM "Indique Pilates"</strong>. Por isso o foco do mês é em <strong>indicações</strong>.
          </p>
        </div>
      </div>
    </AnimatedSection>

    {/* Calendário das redes sociais */}
    <AnimatedSection>
      <div className="rounded-xl bg-muted/40 border border-foreground/5 p-5 flex gap-3">
        <Megaphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Calendário das redes sociais</strong> — o resumo das ações e o calendário das redes sociais locais acompanham este material. Mantenha o canal local alinhado ao calendário editorial da rede.
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

    {/* Por que favoritar */}
    <AnimatedSection>
      <SectionTitle>Por que adicionar aos favoritos?</SectionTitle>
    </AnimatedSection>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { title: 'Acesso em 1 clique', desc: 'Sem digitar URL, sem procurar emails.' },
        { title: 'Nunca perder uma atualização', desc: 'Tudo centralizado em um lugar.' },
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
      <SectionTitle>Como adicionar aos favoritos?</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Leva 5 segundos. Muda tudo. Nos vemos lá!
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
              <p className="text-base text-foreground leading-relaxed">{step.text}</p>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>

    {/* Tutorial do Marketing */}
    <AnimatedSection>
      <div className="rounded-2xl bg-foreground text-background p-10 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">hub.purepilates.com.br</span>
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

        <a
          href="https://hub.purepilates.com.br/tutorial-marketing"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Acesse o Tutorial de Marketing
          <ChevronRight className="h-4 w-4" />
        </a>

        <p className="mt-5 italic opacity-60 text-sm max-w-2xl">
          Consulte sempre que tiver dúvida. Você ganha autonomia, clareza e velocidade.
        </p>
      </div>
    </AnimatedSection>

    {/* Verba Adicional */}
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl bg-foreground text-background p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">hub.purepilates.com.br</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
          Autorizar <span className="text-primary">mídia adicional.</span>
        </h2>

        <p className="opacity-80 leading-relaxed mb-3 max-w-3xl">
          Imagine que você está acompanhando suas campanhas e vê que os <strong>leads estão caindo</strong>. Você sabe que precisa aumentar o investimento em mídia. Mas você não sabe como solicitar. Agora, você tem a <strong className="text-primary">Verba Adicional</strong>.
        </p>
        <p className="opacity-80 leading-relaxed mb-6 max-w-3xl">
          É simples: você acessa a plataforma, vai para a seção de Mídia, e clica em "Solicitar Verba Adicional". Você preenche um formulário simples com informações sobre sua unidade, quanto você quer investir e a equipe de marketing recebe sua solicitação em tempo real, analisa seus dados, e avisa a agência para iniciar as campanhas adicionais.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://hub.purepilates.com.br/autorizar-midia-adicional"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Autorizar verba adicional
            <ChevronRight className="h-4 w-4" />
          </a>
          <a
            href="https://hub.purepilates.com.br/minha-area/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-background/10 border border-background/20 text-background font-medium text-sm hover:bg-background/20 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard campanhas apartadas
          </a>
        </div>

        <p className="mt-5 opacity-70 text-sm max-w-2xl leading-relaxed">
          Você não precisa esperar por relatórios. Você não precisa enviar email perguntando. Você não precisa adivinhar. Você acessa o Dashboard e sabe exatamente como está sua performance. <strong className="opacity-100">Área exclusiva para os franqueados que tem aporte.</strong>
        </p>
      </div>
    </AnimatedSection>

    {/* Pure Design */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <CardContent className="pt-6 sm:pt-8">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-6 w-6 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Novidade!</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
            Pure <span className="text-primary">Design.</span>
          </h2>

          <p className="text-foreground/85 leading-relaxed mb-3 max-w-3xl">
            A Função de Design oferece algo que o Canva nunca ofereceu: uma <strong>biblioteca completa de materiais já prontos</strong>, desenvolvidos pela equipe de design Pure Pilates, testados, validados, e prontos para você adaptar em segundos. Não estamos falando de templates. Estamos falando de <strong>criativos profissionais, completos</strong>, que você só precisa personalizar com seu nome, sua data, sua promoção, e publicar.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-6">
            {[
              { num: '1', title: 'Acesse', desc: 'A plataforma' },
              { num: '2', title: 'Escolha', desc: 'O criativo que precisa' },
              { num: '3', title: 'Edite', desc: 'Data, horário, promoção, nome, telefone' },
              { num: '4', title: 'Salve', desc: 'Pronto para publicar' },
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {['Não precisa de Photoshop', 'Não precisa de conhecimento de design', 'Não precisa de horas'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
                <X className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-xs sm:text-sm text-foreground/80">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-foreground/75 italic mb-5">Você preenche alguns campos e pronto.</p>

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
  </>
);

/* ══════════════════════════════════════════════════════════════
   INSTITUCIONAL — Clube RIP, LGPD, Curso online, Expansão
   ══════════════════════════════════════════════════════════════ */
const InstitucionalPage = () => (
  <>
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Institucional</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Avisos <span className="text-primary">da rede.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          Clube de Vantagens, proteção de dados, formação e expansão — o que muda na rede neste mês.
        </p>
      </div>
    </AnimatedSection>

    {/* Clube de Vantagens RIP */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-destructive/10 p-2">
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-destructive font-bold">Descontinuado</p>
              <h3 className="text-2xl font-heading font-bold">Clube de Vantagens da Pure</h3>
            </div>
          </div>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Analisamos a utilização dos clientes no Clube de Vantagens e a matriz decidiu <strong>descontinuar este benefício da rede</strong>. A baixa utilização e o acréscimo desproporcional das condições comerciais foram decisivos. Com isso, os clientes mensalistas não terão mais acesso a plataforma e também solicitamos que façam a adequação de discurso de vendas. Os materiais e demais conteúdos serão ajustados nos próximos dias.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* LGPD */}
    <AnimatedSection variant="fade-up">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">LGPD · Ação preventiva</p>
              <h3 className="text-2xl font-heading font-bold">Atualização de Senha Preventiva</h3>
            </div>
          </div>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            Durante todo o mês de julho teremos avisos por email e no aplicativo da Pure Pilates reforçando a medida preventiva para proteção de dados dos clientes. A atualização de senha será feita de forma integral seguindo os padrões legais e com criptografia.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Curso 100% online */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-2xl bg-foreground text-background p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-white">
            <AlertTriangle className="h-3 w-3" />
            Spoiler
          </span>
          <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">Pure Academy</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-heading font-bold mb-5 leading-tight">
          Vem aí! O nosso Curso de Formação em Pilates <span className="text-primary">100% Online</span>
        </h2>

        <div className="space-y-3 opacity-85 leading-relaxed max-w-3xl">
          <p>Franqueados Pure, vem novidade da Pure Academy para fortalecer ainda mais a nossa rede!</p>
          <p>Em breve, lançaremos o Curso de Formação em Pilates 100% online, com a qualidade e a metodologia da Pure Pilates. Uma nova oportunidade para facilitar o acesso à formação em Pilates, preparar mais profissionais e apoiar o crescimento dos nossos estúdios.</p>
          <p><strong className="opacity-100 text-primary">Mais acessibilidade, mais profissionais capacitados e uma rede ainda mais forte.</strong></p>
          <p>Aguardem!</p>
        </div>
      </div>
    </AnimatedSection>

    {/* Expansão */}
    <AnimatedSection variant="fade-up">
      <Card className="overflow-hidden border-t-4 border-t-[#e9c688]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-bold">Expansão</h3>
          </div>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            <strong>Guia de apoio para negociações de pontos comerciais.</strong> A pedido do nosso Diretor Roberto Serroni, preparamos um guia para auxiliar nas negociações de pontos comerciais — credenciais que valorizam nossa chegada de marca nos principais varejistas e imobiliárias.
          </p>
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
          Bom julho para todos.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
const MonthLanding_2026_07 = () => {
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
      case 'publicacoes': return <PublicacoesPage />;
      case 'conteudo': return <ConteudoPage />;
      case 'clusters': return <ClustersPage />;
      case 'julho': return <JulhoPage />;
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

export default MonthLanding_2026_07;

import { useRef, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Wallet,
  Target,
  TrendingUp,
  BarChart3,
  Share2,
  Users,
  MapPin,
  ClipboardList,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  Sparkles,
  Megaphone,
} from 'lucide-react';

type Chapter = {
  id: string;
  num: string;
  title: string;
  desc: string;
  icon: typeof Wallet;
};

const CHAPTERS: Chapter[] = [
  { id: 'verba', num: '01', title: 'Verba Operacional', desc: 'Taxa de propaganda e despesas estruturais de marketing', icon: Wallet },
  { id: 'midia', num: '02', title: 'Contribuição de Mídia', desc: 'Distribuição do investimento em tráfego pago', icon: Target },
  { id: 'aportes', num: '03', title: 'Aportes Adicionais', desc: 'Investimento adicional do franqueado', icon: TrendingUp },
  { id: 'report', num: '04', title: 'Report & Resultados', desc: 'Transparência e acompanhamento de campanhas', icon: BarChart3 },
  { id: 'criativos', num: '05', title: 'Criativos das Campanhas de Aporte', desc: 'Anúncios e materiais usados na mídia apartada', icon: Megaphone },
  { id: 'social', num: '06', title: 'Redes Sociais Locais', desc: 'Diretrizes para perfis das unidades', icon: Share2 },
  { id: 'influencers', num: '07', title: 'Influenciadores', desc: 'Manual de parceria, fluxo e formulário', icon: Users },
  { id: 'gmb', num: '08', title: 'Google Meu Negócio', desc: 'Presença digital local como construção contínua', icon: MapPin },
];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const ChapterHeader = ({ chapter }: { chapter: Chapter }) => {
  const Icon = chapter.icon;
  return (
    <div id={chapter.id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-pure-red/10 text-pure-red">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-bold tracking-[0.3em] uppercase text-pure-red">
          Capítulo {chapter.num}
        </span>
      </div>
    </div>
  );
};

const SectionTitle = ({ children, accent }: { children: React.ReactNode; accent?: React.ReactNode }) => (
  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 leading-tight">
    {children}
    {accent && <span className="text-pure-red"> {accent}</span>}
  </h2>
);

// Iframe que cresce até a altura real do conteúdo — sem rolagem própria,
// pra ele viver dentro da rolagem única da página (mesma origem, então dá pra medir).
const AutoHeightIframe = ({ src, title }: { src: string; title: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);

  const handleLoad = () => {
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    const doc = iframe?.contentDocument;
    if (!win || !doc) return;
    const fullHeight = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
    setHeight(fullHeight);
    // O guia revela seções ao rolar; sem rolagem própria no iframe, força tudo visível de uma vez.
    win.dispatchEvent(new Event('beforeprint'));
  };

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      onLoad={handleLoad}
      className="w-full block"
      style={{ height, border: 0 }}
    />
  );
};

const TutorialMarketing = () => {
  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-pure-red/5 via-background to-accent/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--pure-red)/0.08),transparent_60%)]" />
          <div className="relative px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-pure-red/10 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-pure-red mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Documento Oficial · Agosto 2025
              </div>
              <p className="text-xs font-light tracking-[0.25em] uppercase text-muted-foreground mb-3">
                Rede Pure Pilates — Franqueados
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight uppercase leading-[0.95] mb-6">
                Políticas
                <br />
                de <span className="text-pure-red">Marketing</span>
              </h1>
              <div className="mx-auto h-1 w-14 bg-pure-red mb-6" />
              <p className="text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-8">
                Diretrizes, verbas e práticas para toda a rede
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Badge variant="outline" className="border-pure-red/30 text-xs font-semibold tracking-widest uppercase px-3 py-1.5">
                  Versão <span className="text-pure-red ml-1.5">1.0</span>
                </Badge>
                <Badge variant="outline" className="border-pure-red/30 text-xs font-semibold tracking-widest uppercase px-3 py-1.5">
                  Uso <span className="text-pure-red ml-1.5">Interno</span>
                </Badge>
                <Badge variant="outline" className="border-pure-red/30 text-xs font-semibold tracking-widest uppercase px-3 py-1.5">
                  <span className="text-pure-red mr-1.5">8</span> Capítulos
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
          {/* SUMÁRIO */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-pure-red" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-pure-red">Sumário</span>
            </div>
            <SectionTitle accent="neste documento">O que está</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
              {CHAPTERS.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => scrollTo(c.id)}
                    className="group text-left rounded-lg border border-border bg-card p-5 transition-all hover:border-pure-red/40 hover:bg-pure-red/5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold tracking-[0.35em] text-pure-red">{c.num}</span>
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-pure-red transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-1.5 leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs font-light text-muted-foreground leading-relaxed">{c.desc}</p>
                    <ArrowRight className="h-4 w-4 text-pure-red mt-3 transition-transform group-hover:translate-x-1" />
                  </button>
                );
              })}
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-[0.35em] text-muted-foreground">→</span>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-muted-foreground mb-1.5">
                  Resumo Executivo
                </h3>
                <p className="text-xs font-light text-muted-foreground leading-relaxed">
                  Consulta rápida de todas as diretrizes
                </p>
              </div>
            </div>
          </section>

          {/* 01 VERBA */}
          <section>
            <ChapterHeader chapter={CHAPTERS[0]} />
            <SectionTitle accent="mantém a marca viva">A estrutura que</SectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
              A verba de marketing operacional é o valor mensal oriundo da{' '}
              <strong className="text-foreground">taxa de propaganda</strong>. Destinamos este recurso
              para despesas estruturais da área de marketing da franqueadora.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-muted/40 border-border">
                <CardContent className="p-7">
                  <span className="block text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-3">
                    Finalidade da verba
                  </span>
                  <p className="text-sm font-light leading-relaxed text-muted-foreground">
                    Este recurso sustenta a operação estratégica e criativa da marca em nível nacional —
                    do time que pensa os conteúdos às ferramentas que distribuem. Ele não é revertido em
                    mídia paga para as unidades individualmente, mas é a base que viabiliza toda a
                    comunicação da rede.
                  </p>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {[
                  'Staff e equipe de marketing da franqueadora',
                  'Licenças de ferramentas, plataformas e softwares',
                  'Gestão e operação das redes sociais da marca',
                  'Produção de conteúdos institucionais e criativos',
                  'Manutenção e desenvolvimento de ativos de marca',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-pure-red flex-shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
                <div className="rounded-md border-l-4 border-pure-red bg-pure-red/5 p-4 mt-3">
                  <div className="flex items-start gap-2 mb-1.5">
                    <AlertCircle className="h-4 w-4 text-pure-red flex-shrink-0 mt-0.5" />
                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red">
                      Atenção
                    </span>
                  </div>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    Esta verba não é revertida em mídia paga para as unidades. Ela sustenta a operação
                    estratégica e criativa da marca a nível nacional.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 02 MÍDIA */}
          <section>
            <ChapterHeader chapter={CHAPTERS[1]} />
            <SectionTitle accent="o investimento">Como distribuímos</SectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
              O valor mensal de mídia é destinado exclusivamente à compra de espaço publicitário em
              plataformas digitais para geração de leads e aquisição de novos alunos. A distribuição é
              estratégica em três frentes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  num: '01',
                  icon: Target,
                  title: 'Foco: Aula Experimental',
                  body: 'A maior parcela é direcionada para campanhas com foco em conversão direta — levando potenciais alunos a agendarem uma aula experimental. Principal métrica de aquisição da rede.',
                  tag: 'Prioridade máxima',
                },
                {
                  num: '02',
                  icon: Sparkles,
                  title: 'Campanhas Promocionais',
                  body: 'Parcela reservada para ações sazonais — campanhas de datas comemorativas, períodos de alta demanda e ativações especiais ao longo do calendário da marca.',
                  tag: 'Sazonal',
                },
                {
                  num: '03',
                  icon: Users,
                  title: 'Institucional & Trabalhe Conosco',
                  body: 'Fração que apoia campanhas de fortalecimento de marca no Google (pesquisa e display) e ações de atração de instrutores qualificados para expansão da rede.',
                  tag: 'Marca & Talentos',
                },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <Card key={c.num} className="relative overflow-hidden border-border hover:border-pure-red/40 hover:bg-pure-red/5 transition-all">
                    <CardContent className="p-6 pt-7">
                      <span className="absolute top-4 right-5 text-5xl font-extrabold leading-none text-pure-red/10">
                        {c.num}
                      </span>
                      <Icon className="h-7 w-7 text-pure-red mb-4" />
                      <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2 leading-snug">
                        {c.title}
                      </h3>
                      <p className="text-xs font-light leading-relaxed text-muted-foreground mb-4">
                        {c.body}
                      </p>
                      <span className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase text-pure-red border border-pure-red/30 px-2.5 py-1">
                        {c.tag}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* 03 APORTES */}
          <section>
            <ChapterHeader chapter={CHAPTERS[2]} />
            <SectionTitle accent="além do básico">Investimento</SectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
              Além das contribuições obrigatórias, o franqueado pode realizar aportes adicionais para
              ampliar presença local e acelerar resultados específicos da sua unidade.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Card className="overflow-hidden border-border">
                  <div className="grid grid-cols-3 bg-pure-black text-white px-5 py-3">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase">Pacote</span>
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase">Valor Mensal</span>
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase">Período</span>
                  </div>
                  {[
                    { name: 'Essencial', val: 'R$ 1.500', dur: '3 meses' },
                    { name: 'Crescimento', val: 'R$ 2.000', dur: '3 meses' },
                    { name: 'Aceleração', val: 'R$ 2.500', dur: '3 meses' },
                  ].map((pkg, i, arr) => (
                    <div
                      key={pkg.name}
                      className={`grid grid-cols-3 px-5 py-4 items-center hover:bg-pure-red/5 transition-colors ${
                        i < arr.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <span className="text-sm text-foreground">{pkg.name}</span>
                      <span className="text-base font-extrabold text-pure-red">{pkg.val}</span>
                      <span className="text-xs font-light text-muted-foreground">{pkg.dur}</span>
                    </div>
                  ))}
                </Card>
                <div className="rounded-md border-l-4 border-pure-red bg-pure-red/5 p-4">
                  <div className="flex items-start gap-2 mb-1.5">
                    <Target className="h-4 w-4 text-pure-red flex-shrink-0 mt-0.5" />
                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red">
                      Orientação
                    </span>
                  </div>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    O aporte adicional é recomendado para unidades em inauguração ou que desejam acelerar
                    o crescimento local. A escolha considera o potencial do mercado e a capacidade de
                    absorção da unidade.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: 'Novas Unidades',
                    title: 'Reforço de Presença Local',
                    body: 'Unidades em inauguração podem investir valor adicional nos primeiros 3 meses para acelerar a captação inicial e consolidar presença no mercado local.',
                    highlight: false,
                  },
                  {
                    label: 'Captação de Talentos',
                    title: 'Leads de Instrutores',
                    body: 'O franqueado pode aportar verbas para campanhas específicas de atração de instrutores qualificados, garantindo um time de alta performance.',
                    highlight: false,
                  },
                  {
                    label: 'Unidades Críticas',
                    title: 'Plano de Reforço',
                    body: 'Unidades com queda de performance podem acionar o time de marketing para proposta personalizada — mesmos patamares aplicados a novas unidades.',
                    highlight: true,
                  },
                ].map((card) => (
                  <Card
                    key={card.title}
                    className={`border-border transition-all hover:border-pure-red/40 ${
                      card.highlight ? 'bg-pure-red/5' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <span className="block text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-2">
                        {card.label}
                      </span>
                      <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2">
                        {card.title}
                      </h3>
                      <p className="text-xs font-light leading-relaxed text-muted-foreground">{card.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* 04 REPORT */}
          <section>
            <ChapterHeader chapter={CHAPTERS[3]} />
            <SectionTitle accent="os resultados">Como funcionam</SectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
              A gestão de campanhas é centralizada pelo Pure System, que possui visão total dos leads
              gerados em toda a rede.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border hover:border-pure-red/40 hover:bg-pure-red/5 transition-all">
                <CardContent className="p-7">
                  <CheckCircle2 className="h-7 w-7 text-pure-red mb-4" />
                  <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2">
                    Coordenação por Clusters
                  </h3>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    Campanhas gerenciadas por agrupamentos geográficos (clusters) para garantir
                    eficiência. Por este motivo,{' '}
                    <strong className="text-foreground">não existe report individual por unidade</strong>{' '}
                    no modelo padrão.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border hover:border-pure-red/40 hover:bg-pure-red/5 transition-all">
                <CardContent className="p-7">
                  <BarChart3 className="h-7 w-7 text-pure-red mb-4" />
                  <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2">
                    Report para Aportes Adicionais
                  </h3>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    Com aporte adicional, o franqueado recebe relatório específico do veículo digital
                    utilizado (Meta Ads, Google Ads), apresentando os resultados do investimento
                    realizado.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-4 rounded-md bg-pure-black text-white p-6 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-pure-red flex-shrink-0 mt-0.5" />
              <p className="text-xs font-light leading-relaxed text-white/70">
                <strong className="text-white font-semibold">Importante:</strong> O relatório de aporte é
                gerado diretamente pelo veículo digital. O franqueado não tem acesso à visão consolidada
                do cluster — essa gestão é responsabilidade da franqueadora via Pure System.
              </p>
            </div>
          </section>

          {/* 05 CRIATIVOS */}
          <section>
            <ChapterHeader chapter={CHAPTERS[4]} />
            <SectionTitle accent="das campanhas de aporte">Os criativos</SectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
              Veja abaixo os anúncios reais usados nas campanhas de mídia apartada — o mesmo material
              que aparece para os futuros alunos dentro do raio de cobertura de cada unidade, com o
              nome dela na faixa do anúncio.
            </p>
            <Card className="bg-pure-black text-white border-l-4 border-l-pure-red rounded-md mb-6">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-1.5">
                    Guia visual · Campanha apartada
                  </span>
                  <div className="text-base font-bold uppercase tracking-tight">
                    O que o seu aporte faz
                  </div>
                  <div className="text-xs font-light text-white/50 mt-1">
                    Anúncios, mapa de cobertura e caminho completo até a aula marcada
                  </div>
                </div>
                <Button
                  asChild
                  className="bg-pure-red hover:bg-pure-red-light text-white text-xs font-bold tracking-[0.25em] uppercase px-6"
                >
                  <a href="/campanha-apartada.html" target="_blank" rel="noopener noreferrer">
                    <Megaphone className="h-4 w-4 mr-2" />
                    Abrir em tela cheia
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
            <div className="rounded-xl overflow-hidden border border-border bg-background">
              <AutoHeightIframe
                src="/campanha-apartada.html"
                title="Campanha apartada — o que o seu aporte faz"
              />
            </div>
          </section>

          {/* 06 SOCIAL */}
          <section>
            <ChapterHeader chapter={CHAPTERS[5]} />
            <SectionTitle accent="extensão da marca">Perfis locais:</SectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
              A gestão das redes sociais locais é responsabilidade do franqueado, que deve atuar como
              extensão fiel da comunicação da matriz.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border hover:border-pure-red/40 transition-all">
                <CardContent className="p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-muted-foreground">
                      Obrigatório
                    </span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2">
                    Suporte ao Conteúdo da Matriz
                  </h3>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    Todas as unidades devem suportar mensalmente os conteúdos produzidos e distribuídos
                    pela franqueadora. Inclui reposts, compartilhamentos e alinhamento com o calendário
                    nacional da marca.
                  </p>
                  <Separator className="my-4" />
                  <p className="text-xs italic text-muted-foreground">
                    O calendário de conteúdo da matriz é enviado mensalmente pelo time de marketing.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border hover:border-pure-red/40 transition-all">
                <CardContent className="p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-muted-foreground">
                      Opcional — com restrições
                    </span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2">
                    Produção de Conteúdo Próprio
                  </h3>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    Não é obrigatória a produção própria. Caso o franqueado opte, todo conteúdo deve
                    seguir rigorosamente os padrões visuais e editoriais da marca Pure Pilates.
                  </p>
                  <Separator className="my-4" />
                  <p className="text-xs italic text-muted-foreground">
                    Em dúvida, consulte o time de marketing antes de publicar.
                  </p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2 border-pure-red/20 bg-pure-red/5">
                <CardContent className="p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-pure-red" />
                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red">
                      Proibido
                    </span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-pure-red mb-2">
                    Conteúdos fora dos padrões da marca
                  </h3>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    Produção ou publicação que fuja dos padrões do Manual de Identidade da Marca Pure
                    Pilates é expressamente proibida — cores, fontes, linguagem e tom de comunicação.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 07 INFLUENCERS */}
          <section>
            <ChapterHeader chapter={CHAPTERS[6]} />
            <SectionTitle accent="aprovação obrigatória">Parcerias com</SectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
              Os influenciadores são a extensão da marca, levando a experiência Pure Pilates a mais
              pessoas. A parceria exige fluxo oficial de aprovação e alinhamento com a identidade da
              rede.
            </p>

            {/* CTA Formulário */}
            <Card className="bg-pure-black text-white border-l-4 border-l-pure-red rounded-md mb-6">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-1.5">
                    Ação obrigatória · Primeiro passo
                  </span>
                  <div className="text-base font-bold uppercase tracking-tight">
                    Formulário de Validação de Influencers
                  </div>
                  <div className="text-xs font-light text-white/50 mt-1">
                    SLA: análise e aprovação em até 7 dias úteis pelo time de marketing
                  </div>
                </div>
                <Button
                  asChild
                  className="bg-pure-red hover:bg-pure-red-light text-white text-xs font-bold tracking-[0.25em] uppercase px-6"
                >
                  <a
                    href="https://docs.google.com/forms/d/1t1GRUbC9J_eG-Wef_qVfrZPW_Ubkg1fO275uSLa5QwA/viewform?edit_requested=true"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Acessar Formulário
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Fluxo + Diretrizes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border">
                <CardContent className="p-7">
                  <span className="block text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-6">
                    Fluxo de Parceria — 4 etapas
                  </span>
                  {[
                    {
                      n: '01',
                      title: 'Escolha & Formulário',
                      body: 'O estúdio identifica o influenciador e preenche o formulário oficial para centralizar informações e agilizar a análise.',
                    },
                    {
                      n: '02',
                      title: 'Análise e Aprovação — Marketing',
                      body: 'O time de marketing avalia em até 7 dias úteis: autenticidade da base, engajamento, público alinhado, reputação e qualidade do conteúdo.',
                    },
                    {
                      n: '03',
                      title: 'Negociação e Cadastro — Marketing',
                      body: 'Com aprovação, o time de marketing formaliza a parceria. O franqueado conduz a permuta diretamente com o influenciador.',
                    },
                    {
                      n: '04',
                      title: 'Acompanhamento via BuzzMonitor',
                      body: 'Todas as entregas são monitoradas pelo time de marketing. Publicações e stories devem sempre incluir @ da Pure Pilates.',
                    },
                  ].map((s, i, arr) => (
                    <div
                      key={s.n}
                      className={`flex gap-4 py-4 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pure-red/10 border border-pure-red/25 flex-shrink-0">
                        <span className="text-[10px] font-extrabold text-pure-red">{s.n}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground mb-1">{s.title}</div>
                        <div className="text-xs font-light text-muted-foreground leading-relaxed">
                          {s.body}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Card className="border-border hover:border-pure-red/40 hover:bg-pure-red/5 transition-all">
                  <CardContent className="p-6">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-2">
                      <CheckCircle2 className="h-3 w-3" /> Pacote de Permuta
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2">
                      O que a Pure oferece
                    </h3>
                    <p className="text-xs font-light leading-relaxed text-muted-foreground mb-3">
                      Pacote de <strong className="text-foreground">10 aulas por 45 dias</strong> em
                      permuta. Com renovação, o influenciador migra para pacote manual com 2 aulas por
                      semana.
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        'Fase 1: 10 aulas em 45 dias — agendar pelo app',
                        'Renovação: plano manual recorrente (2x/semana)',
                        'Periodicidade definida com o time de marketing',
                      ].map((li) => (
                        <li
                          key={li}
                          className="flex items-center gap-2 text-xs font-light text-muted-foreground py-1.5 border-b border-border last:border-0"
                        >
                          <div className="h-px w-3 bg-pure-red flex-shrink-0" />
                          {li}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-border hover:border-pure-red/40 hover:bg-pure-red/5 transition-all">
                  <CardContent className="p-6">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-2">
                      <CheckCircle2 className="h-3 w-3" /> Pode
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-3">
                      Diretrizes — O que é permitido
                    </h3>
                    <ul className="space-y-1.5">
                      {[
                        'Mostrar benefícios do Pilates na rotina',
                        'Compartilhar a experiência da aula experimental',
                        <>
                          Marcar <strong className="text-foreground">@purepilatesbr</strong> em todas as
                          publicações
                        </>,
                        'Produzir conteúdo com linguagem leve e motivadora',
                        <>
                          Usar o selo <em>"A MELHOR HORA DO SEU DIA · TÔ PAGO"</em>
                        </>,
                      ].map((li, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-xs font-light text-muted-foreground py-1.5 border-b border-border last:border-0"
                        >
                          <div className="h-px w-3 bg-pure-red flex-shrink-0" />
                          <span>{li}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-6">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.35em] uppercase text-muted-foreground mb-2">
                      <XCircle className="h-3 w-3" /> Não pode
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground mb-3">
                      O que é proibido
                    </h3>
                    <ul className="space-y-1.5">
                      {[
                        'Usar termos negativos relacionados ao Pilates',
                        'Divulgar informações incorretas sobre a prática',
                        'Criar conteúdo com linguagem ofensiva ou polêmica',
                        'Promover concorrentes na mesma campanha',
                      ].map((li) => (
                        <li
                          key={li}
                          className="flex items-center gap-2 text-xs font-light text-muted-foreground py-1.5 border-b border-border last:border-0"
                        >
                          <div className="h-px w-3 bg-muted-foreground/40 flex-shrink-0" />
                          {li}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Critérios de aprovação */}
            <Card className="mt-6 overflow-hidden border-border">
              <div className="bg-pure-black text-white px-7 py-5 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-pure-red" />
                <div>
                  <div className="text-sm font-bold tracking-wider uppercase">
                    Critérios de Aprovação de Influenciadores
                  </div>
                  <div className="text-[11px] font-light text-white/40 mt-0.5">
                    Política oficial Pure Pilates · AGO 2025
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-border">
                {[
                  { n: '01', title: 'Autenticidade da base', body: 'Seguidores reais e qualificados — evitar público fake ou adquirido.' },
                  { n: '02', title: 'Crescimento saudável', body: 'Evolução orgânica, sem picos artificiais no histórico de seguidores.' },
                  { n: '03', title: 'Engajamento compatível', body: 'Taxa adequada ao tamanho e nicho. Comentários genuínos, não genéricos.' },
                  { n: '04', title: 'Público alinhado', body: 'Localização, gênero, faixa etária e interesses compatíveis com a marca.' },
                  { n: '05', title: 'Autoridade no nicho', body: 'Influência real na decisão de compra. Evitar perfis generalistas sem identidade.' },
                  { n: '06', title: 'Qualidade do conteúdo', body: 'Estética, frequência e coerência com o posicionamento da marca Pure Pilates.' },
                  { n: '07', title: 'Reputação e conduta', body: 'Histórico sem polêmicas que possam prejudicar a imagem da marca.' },
                  { n: '08', title: 'Profissionalismo', body: 'Cumpre prazos, responde com agilidade e entende o briefing sem resistências.' },
                  { n: '09', title: 'Segmentação por porte', body: 'Nano–Micro: narrativas. Médio+: narrativas + performance remunerada.' },
                ].map((c) => (
                  <div key={c.n} className="bg-muted/30 p-6 hover:bg-pure-red/5 transition-colors">
                    <span className="block text-[10px] font-bold tracking-[0.3em] text-pure-red mb-2">
                      {c.n}
                    </span>
                    <h4 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2">
                      {c.title}
                    </h4>
                    <p className="text-xs font-light leading-relaxed text-muted-foreground">{c.body}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Dor → Solução */}
            <Card className="mt-6 overflow-hidden border-border">
              <div className="bg-pure-red text-white px-7 py-5 flex items-center gap-3">
                <Target className="h-5 w-5 text-white" />
                <div>
                  <div className="text-sm font-bold tracking-wider uppercase">
                    Dor → Solução: narrativas para o influenciador
                  </div>
                  <div className="text-[11px] font-light text-white/70 mt-0.5">
                    Campanha "A melhor hora do seu dia" · Etapa 1: foco em alcance e narrativa
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-border">
                {[
                  {
                    n: '01',
                    dor: 'Dor nas costas',
                    dorText: '"Eu vivia com dor nas costas, sentar no trabalho era um desafio."',
                    sol: '"No Pilates aprendi a fortalecer o core e alinhar a postura. Hoje minha coluna agradece — é minha melhor hora do dia."',
                  },
                  {
                    n: '02',
                    dor: 'Estresse e ansiedade',
                    dorText: '"Minha cabeça não parava nem um segundo. Trabalho, rotina, tudo me deixava esgotada."',
                    sol: '"No estúdio, eu respiro, foco e volto leve. O Pilates virou meu reset mental — aquele momento só meu."',
                  },
                  {
                    n: '03',
                    dor: 'Falta de autocuidado',
                    dorText: '"Eu passava o dia cuidando de tudo, menos de mim."',
                    sol: '"Os treinos da Pure cabem na rotina e mudam o meu dia. É o tempo que eu tiro pra me reconectar."',
                  },
                  {
                    n: '04',
                    dor: 'Corpo rígido / home office',
                    dorText: '"Home office acabou com a minha postura. Pescoço e ombros sempre duros."',
                    sol: '"Com os exercícios da Pure, voltei a ter mobilidade. Hoje trabalho sem dor e com mais energia."',
                  },
                  {
                    n: '05',
                    dor: 'Falta de motivação',
                    dorText: '"Eu já tinha desistido de tentar treinar. Academia me cansava antes de começar."',
                    sol: '"Na Pure, a aula em grupo me motiva. É leve, divertida, e saio sempre melhor do que entrei."',
                  },
                ].map((d) => (
                  <div key={d.n} className="bg-card p-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-pure-red mb-2">
                      <span>{d.n}</span>
                      <span>{d.dor}</span>
                    </div>
                    <p className="text-xs font-light italic text-muted-foreground border-l-2 border-border pl-3 mb-4">
                      {d.dorText}
                    </p>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-2">
                      Solução
                    </div>
                    <p className="text-xs font-light text-muted-foreground border-l-2 border-pure-red pl-3">
                      {d.sol}
                    </p>
                  </div>
                ))}
                <div className="bg-pure-red/5 p-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-pure-red mb-3">
                    <AlertCircle className="h-3.5 w-3.5" /> Etapa 1
                  </div>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    Neste momento{' '}
                    <strong className="text-foreground">
                      não vamos atrelar a ação à geração de leads
                    </strong>
                    . O foco é alcance e fortalecimento da narrativa. A conversão ocorre em formatos
                    posteriores com cupom e performance remunerada.
                  </p>
                </div>
              </div>
            </Card>

            {/* Script */}
            <Card className="mt-6 bg-muted/40 border-border">
              <CardContent className="p-7">
                <span className="block text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-4">
                  Sugestão de Script · Abordagem inicial
                </span>
                <p className="text-sm font-light leading-relaxed text-muted-foreground max-w-3xl">
                  Olá, <strong className="text-foreground">[Nome do Influenciador]</strong>! Tudo bem? Me
                  chamo <strong className="text-foreground">[Seu Nome]</strong> e represento a Pure
                  Pilates na unidade <strong className="text-foreground">[Nome da Unidade]</strong>.
                  <br />
                  <br />
                  Gostamos muito do seu perfil e acreditamos que você tem tudo a ver com a nossa marca!
                  Estamos buscando parceiros para divulgar a experiência de uma aula de Pilates e
                  acreditamos que seus seguidores iriam adorar.
                  <br />
                  <br />
                  Caso tenha interesse, podemos conversar melhor? Um grande abraço e espero seu retorno!
                </p>
              </CardContent>
            </Card>
          </section>

          {/* 08 GMB */}
          <section>
            <ChapterHeader chapter={CHAPTERS[7]} />
            <SectionTitle accent="construção">
              Presença local
              <br />é uma
            </SectionTitle>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
              O Google Meu Negócio é uma das ferramentas mais importantes para a presença digital local.
              Manter ativo não é opcional — é parte fundamental da estratégia da unidade.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-muted/40 border-border">
                <CardContent className="p-7">
                  <span className="block text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red mb-4">
                    Responsabilidades da Franquia
                  </span>
                  <p className="text-sm font-light leading-relaxed text-muted-foreground mb-5">
                    A ativação, gestão e manutenção do perfil é de responsabilidade direta de cada
                    franquia. Perfis desatualizados prejudicam o ranqueamento local e comprometem a
                    captação orgânica de novos alunos.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      'Informações sempre atualizadas: endereço, horário, telefone e fotos',
                      'Solicitação ativa de avaliações de alunos após cada aula',
                      'Resposta às avaliações recebidas — positivas e negativas',
                      'Publicação periódica de posts e novidades no perfil',
                      'Fotos da unidade, equipe e equipamentos em alta qualidade',
                      'Categorias e serviços cadastrados corretamente',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-xs text-foreground py-2 border-b border-border last:border-0"
                      >
                        <div className="h-4 w-4 rounded-sm border-[1.5px] border-pure-red flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <div className="space-y-3">
                <Card className="border-border hover:border-pure-red/40 hover:bg-pure-red/5 transition-all">
                  <CardContent className="p-7">
                    <span className="block text-5xl font-extrabold text-pure-red leading-none mb-2">
                      97%
                    </span>
                    <span className="block text-xs font-semibold uppercase tracking-widest text-foreground mb-2">
                      dos usuários pesquisam antes de decidir
                    </span>
                    <p className="text-xs font-light leading-relaxed text-muted-foreground">
                      Perfil incompleto ou desatualizado representa perda direta de alunos que estão
                      buscando no Google agora.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border hover:border-pure-red/40 hover:bg-pure-red/5 transition-all">
                  <CardContent className="p-7">
                    <span className="block text-5xl font-extrabold text-pure-red leading-none mb-2">
                      #1
                    </span>
                    <span className="block text-xs font-semibold uppercase tracking-widest text-foreground mb-2">
                      Canal Orgânico Local
                    </span>
                    <p className="text-xs font-light leading-relaxed text-muted-foreground">
                      O Google Meu Negócio é o principal canal de tráfego orgânico sem custo de mídia
                      para unidades físicas.
                    </p>
                  </CardContent>
                </Card>
                <div className="rounded-md border-l-4 border-pure-red bg-pure-red/5 p-4">
                  <div className="flex items-start gap-2 mb-1.5">
                    <AlertCircle className="h-4 w-4 text-pure-red flex-shrink-0 mt-0.5" />
                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-pure-red">
                      Atenção
                    </span>
                  </div>
                  <p className="text-xs font-light leading-relaxed text-muted-foreground">
                    A franqueadora não gerencia perfis locais. Esta ativação é de responsabilidade
                    exclusiva de cada franquia.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* RESUMO EXECUTIVO */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-pure-red" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-pure-red">
                Resumo Executivo
              </span>
            </div>
            <SectionTitle accent="das diretrizes">Consulta rápida</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
              {[
                { n: '01', title: 'Verba Operacional', body: 'Oriunda da taxa de propaganda. Cobre staff, ferramentas, social e conteúdos. Não reverte em mídia paga para unidades.' },
                { n: '02', title: 'Verba de Mídia', body: 'Tráfego pago: foco aula experimental (prioridade), campanhas promocionais e institucional/Google.' },
                { n: '03', title: 'Aporte Adicional', body: 'R$1.500, R$2.000 ou R$2.500/mês por 3 meses. Para novas unidades, captação de instrutores ou unidades críticas.' },
                { n: '04', title: 'Report', body: 'Gerido por cluster — sem report individual no padrão. Com aporte, o franqueado recebe report do veículo digital.' },
                { n: '05', title: 'Criativos de Aporte', body: 'Anúncios reais das campanhas apartadas — foto, faixa com o nome da unidade e caminho até a aula marcada.' },
                { n: '06', title: 'Social Local', body: 'Suporte ao conteúdo da matriz é obrigatório. Produção própria permitida, desde que siga os padrões da marca.' },
                { n: '07', title: 'Influencers', body: 'Formulário obrigatório — aprovação em 7 dias úteis. Pacote: 10 aulas/45 dias. Permutas conduzidas pelo franqueado.' },
              ].map((c) => (
                <Card
                  key={c.n}
                  className="border-border hover:border-pure-red/40 hover:bg-pure-red/5 transition-all"
                >
                  <CardContent className="p-6">
                    <span className="block text-[10px] font-bold tracking-[0.3em] text-pure-red mb-3">
                      {c.n}
                    </span>
                    <h4 className="text-sm font-bold uppercase tracking-tight text-foreground mb-2">
                      {c.title}
                    </h4>
                    <p className="text-xs font-light leading-relaxed text-muted-foreground">{c.body}</p>
                  </CardContent>
                </Card>
              ))}
              <Card className="md:col-span-2 lg:col-span-3 bg-pure-black text-white border-pure-black hover:bg-pure-black/90 transition-all">
                <CardContent className="p-6">
                  <span className="block text-[10px] font-bold tracking-[0.3em] text-pure-red mb-3">
                    08
                  </span>
                  <h4 className="text-sm font-bold uppercase tracking-tight text-white mb-2">
                    Google Meu Negócio
                  </h4>
                  <p className="text-xs font-light leading-relaxed text-white/55 max-w-2xl">
                    Presença local é uma construção contínua — responsabilidade exclusiva da franquia.
                    Manter ativo, atualizado e com avaliações constantes é parte fundamental da
                    estratégia de captação orgânica.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="bg-pure-black border-t-4 border-pure-red px-4 sm:px-6 lg:px-8 py-10">
          <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-sm font-extrabold tracking-[0.25em] uppercase text-white">
              <span className="text-pure-red">Pure</span> Pilates
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/30 leading-relaxed">
                Políticas de Marketing · Versão 1.0 · Agosto 2025
              </p>
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/30 leading-relaxed">
                Uso interno — Franqueados e Equipe de Marketing
              </p>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
};

export default TutorialMarketing;

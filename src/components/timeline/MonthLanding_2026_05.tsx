import { useEffect, useState } from 'react';
import AnimatedSection from './AnimatedSection';
import AnimatedCounter from './AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SectionTitle, MetricCard } from './shared';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Heart, Target, Cpu, Gift, Tag, GraduationCap, Star, QrCode,
  Calendar, UserPlus, ArrowRight, ExternalLink, Megaphone, Sparkles,
  Rocket, ShieldCheck, Copy, Check, Award, Zap, Clock, PlayCircle,
  Instagram, Quote, BadgeCheck, Handshake, CircleDollarSign, X,
  HandHeart, BarChart3, TrendingUp, Users,
} from 'lucide-react';
import logoPure from '@/assets/logo-pure-pilates.png';
import promoMaesBanner from '@/assets/promo-maes-banner.png';

type TabKey = 'inicio' | 'resultados' | 'promocao' | 'vem-ai' | 'leo-young' | 'pure-select' | 'indique';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Página Inicial' },
  { key: 'resultados', label: 'Resultados' },
  { key: 'promocao', label: 'Mês das Mães' },
  { key: 'vem-ai', label: 'Vem Aí' },
  { key: 'leo-young', label: 'Leo Young' },
  { key: 'pure-select', label: 'Pure Select' },
  { key: 'indique', label: 'Indique Pure Pilates' },
];

const PROMO_DEADLINE = new Date('2026-05-31T23:59:59-03:00');

/* Cor do tema peach unificada */
const PEACH = '#f3d7a7';

/* Dados do 1T 2026 — usados na Pagina Inicial e na Resultados */
const Q1_FUNIL = [
  { mes: 'Janeiro', meta: 9599, realizado: 11547, presencas: 8061, matriculas: 1619 },
  { mes: 'Fevereiro', meta: 8189, realizado: 7548, presencas: 5624, matriculas: 1500 },
  { mes: 'Março', meta: 7932, realizado: 7932, presencas: 5920, matriculas: 1200 },
];

const Q1_TOTAIS = {
  aulasExperimentais: 27308,
  presencas: 19605,
  matriculas: 4319,
};

/* ── COUNTDOWN ───────────────────────────────────────────────── */
const useCountdown = (target: Date) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, expired: diff === 0 };
};

const Countdown = () => {
  const { days, hours, minutes, seconds, expired } = useCountdown(PROMO_DEADLINE);
  if (expired) {
    return (
      <p className="text-sm font-semibold text-muted-foreground">Promoção encerrada.</p>
    );
  }
  const Cell = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center min-w-[64px] sm:min-w-[78px]">
      <div className="text-3xl sm:text-4xl font-heading font-bold text-primary tabular-nums">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <Cell value={days} label="Dias" />
      <span className="text-2xl text-muted-foreground/40">:</span>
      <Cell value={hours} label="Horas" />
      <span className="text-2xl text-muted-foreground/40">:</span>
      <Cell value={minutes} label="Min" />
      <span className="text-2xl text-muted-foreground/40">:</span>
      <Cell value={seconds} label="Seg" />
    </div>
  );
};

/* ── COUPON CARD com copy-to-clipboard ───────────────────────── */
const CouponCard = ({
  plan,
  code,
  url,
  highlight,
  delay = 0,
}: {
  plan: string;
  code: string;
  url: string;
  highlight: string;
  delay?: number;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`Cupom ${code} copiado!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.');
    }
  };
  return (
    <AnimatedSection variant="scale-up" delay={delay}>
      <Card className="h-full border-t-4 border-t-[#e9c688] group hover:shadow-xl transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Rocket className="h-7 w-7 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
              {highlight}
            </span>
          </div>
          <h4 className="font-heading font-bold text-xl mb-1">{plan}</h4>
          <p className="text-xs text-muted-foreground mb-4">50% OFF no 1º mês</p>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-amber-50 px-4 py-3 mb-3 transition-all hover:border-primary hover:bg-amber-100 active:scale-[0.98]"
          >
            <span className="font-mono text-sm font-bold tracking-wide text-foreground">
              {code}
            </span>
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4 text-primary" />
            )}
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            Abrir landing da campanha
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
};

/* ══════════════════════════════════════════════════════════════
   PÁGINA INICIAL
   ══════════════════════════════════════════════════════════════ */
const PaginaInicial = ({ goTo }: { goTo: (tab: TabKey) => void }) => (
  <>
    {/* Hero */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-8 sm:p-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-8 items-center">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <img src={logoPure} alt="Pure Pilates" className="h-9 sm:h-11 object-contain" />
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">
                Timeline · Maio 2026
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-bold leading-[1.1] text-foreground">
              Caros<br />franqueados,
            </h1>

            <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
              Maio chega com a temática do <strong>Mês das Mães</strong> e a continuidade das ofertas que já vêm performando bem. Mantemos foco nos <strong>três pilares estratégicos</strong> e damos mais um passo na qualificação do funil.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src={promoMaesBanner}
              alt="Promoção Dupla Dinâmica · 50% OFF no primeiro mês · Cupom PUREMAES50"
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* Pilares estratégicos */}
    <AnimatedSection>
      <SectionTitle>Pilares estratégicos</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Os três pilares que orientam todas as ações da rede em 2026:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full border-t-4 border-t-[#e9c688] hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Heart className="h-7 w-7 text-primary mb-4" />
            <h3 className="font-heading font-bold text-lg mb-3 leading-snug">Contagiar pessoas pelo exemplo</h3>
            <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed">
              "A melhor hora do seu dia. A melhor hora do meu dia."
            </p>
            <p className="text-xs font-semibold text-primary">No ar desde 18/04</p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={120}>
        <Card className="h-full border-t-4 border-t-[#e9c688] hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Target className="h-7 w-7 text-primary mb-4" />
            <h3 className="font-heading font-bold text-lg mb-3 leading-snug">Precisão e assertividade na comunicação</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Consistência</strong> e <strong>persistência</strong> em cada canal — para que a mensagem chegue clara, no momento certo, ao consumidor certo.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={240}>
        <Card className="h-full border-t-4 border-t-[#e9c688] hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Cpu className="h-7 w-7 text-primary mb-4" />
            <h3 className="font-heading font-bold text-lg mb-3 leading-snug">Apoiar a transformação com dados e tecnologia</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Decisões guiadas por dados e ferramentas que destravam a operação — do agendamento à validação do lead.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* O que tem nesta timeline — preview clicável */}
    <AnimatedSection>
      <SectionTitle className="text-2xl">Navegue pela timeline</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Clique em qualquer bloco abaixo para ir direto à seção:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <AnimatedSection variant="fade-up" delay={0}>
        <button
          type="button"
          onClick={() => goTo('promocao')}
          className="text-left w-full h-full rounded-lg border bg-card p-5 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <Gift className="h-6 w-6 text-primary" />
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading font-bold text-base mb-1">Mês das Mães</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pure Pass + Pure Club com 50% OFF no 1º mês.
          </p>
        </button>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={80}>
        <button
          type="button"
          onClick={() => goTo('vem-ai')}
          className="text-left w-full h-full rounded-lg border bg-card p-5 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <Megaphone className="h-6 w-6 text-primary" />
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading font-bold text-base mb-1">Vem aí</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Treinamento de vendas, QR Code de validação e mais iniciativas.
          </p>
        </button>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={160}>
        <button
          type="button"
          onClick={() => goTo('leo-young')}
          className="text-left w-full h-full rounded-lg border bg-card p-5 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <PlayCircle className="h-6 w-6 text-primary" />
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading font-bold text-base mb-1">Leo Young: a nova cara da Pure</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conheça o novo influencer Pure Pilates — vídeos da campanha.
          </p>
        </button>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={240}>
        <button
          type="button"
          onClick={() => goTo('pure-select')}
          className="text-left w-full h-full rounded-lg border bg-card p-5 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <BadgeCheck className="h-6 w-6 text-primary" />
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading font-bold text-base mb-1">Pure Select</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Programa voluntário de afiliados para instrutores que quiserem vender e ganhar comissão.
          </p>
        </button>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={320}>
        <button
          type="button"
          onClick={() => goTo('indique')}
          className="text-left w-full h-full rounded-lg border bg-card p-5 hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <UserPlus className="h-6 w-6 text-primary" />
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading font-bold text-base mb-1">Indique Pure Pilates</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O que muda em junho e julho — comece a engajar agora.
          </p>
        </button>
      </AnimatedSection>
    </div>
  </>
);

/* ══════════════════════════════════════════════════════════════
   RESULTADOS DE MÍDIA PAGA — análise do 1T 2026
   ══════════════════════════════════════════════════════════════ */
const ResultadosPage = () => (
  <>
    {/* Hero */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Resultados de mídia paga · 1T 2026
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          Marca forte, <span className="text-primary">demanda real.</span>
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed">
          O primeiro trimestre confirmou: a marca está gerando demanda e despertando interesse real do consumidor — com volumes consistentes de aula experimental e presença na rede.
        </p>
      </div>
    </AnimatedSection>

    {/* Totais 1T */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard icon={Target} value={Q1_TOTAIS.aulasExperimentais} label="Aulas experimentais" sub="Acumulado 1T 2026" delay={0} />
      <MetricCard icon={Users} value={Q1_TOTAIS.presencas} label="Presenças" sub="Acumulado 1T 2026" delay={120} />
      <MetricCard icon={TrendingUp} value={Q1_TOTAIS.matriculas} label="Matrículas" sub="Acumulado 1T 2026" delay={240} />
    </div>

    {/* Gráfico Funil completo */}
    <AnimatedSection variant="fade-up">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-heading font-semibold mb-1">Funil de aquisição · 1T 2026</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Comparativo mensal: meta vs. aulas realizadas, presenças e matrículas.
          </p>
          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Q1_FUNIL} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e9c688',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="meta" name="Meta" fill="#e9c688" radius={[6, 6, 0, 0]} animationDuration={1400} />
                <Bar dataKey="realizado" name="Realizado" fill={PEACH} radius={[6, 6, 0, 0]} animationDuration={1400} animationBegin={150} />
                <Bar dataKey="presencas" name="Presenças" fill="#e9b86a" radius={[6, 6, 0, 0]} animationDuration={1400} animationBegin={300} />
                <Bar dataKey="matriculas" name="Matrículas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={1400} animationBegin={450} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Leitura por mês */}
    <AnimatedSection>
      <SectionTitle>Leitura mês a mês</SectionTitle>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Janeiro · 21 DTs</p>
            <h4 className="font-heading font-bold text-lg mb-3">120% da meta</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>11.547</strong> aulas experimentais agendadas (vs. meta de 9.599) e <strong>8.061</strong> presenças. Em matrículas, fechou 87% — gap de 251.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="fade-up" delay={120}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Fevereiro · 18 DTs</p>
            <h4 className="font-heading font-bold text-lg mb-3">Resiliência no Carnaval</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mesmo com Carnaval, mantivemos verba +24% em topo de funil e fechamos com <strong>1.500</strong> matrículas — base sólida para o trimestre.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="fade-up" delay={240}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Março · parcial até 23/03</p>
            <h4 className="font-heading font-bold text-lg mb-3">Atenção à conversão</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>7.932</strong> aulas experimentais e queda de <strong>5 p.p.</strong> em conversão (matrícula vs. agendamento). Sinal pra acionar estratégias antes da entre-safra.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* Conclusão */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-2xl bg-[#f3d7a7] p-8 sm:p-10">
        <Sparkles className="h-7 w-7 text-primary mb-3" />
        <p className="text-lg sm:text-xl font-heading font-semibold text-foreground leading-snug max-w-3xl">
          O grande movimento agora é <span className="text-primary">transformar interesse em decisão</span>. Esse é o ponto de virada — e é onde maio entra com <span className="text-primary">clareza, prova e urgência</span>.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   PROMOÇÃO DE MAIO — MÊS DAS MÃES
   ══════════════════════════════════════════════════════════════ */
const PromocaoMaio = () => (
  <>
    {/* Hero da promo */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Mês das Mães · 2026
          </span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05] mb-4">
          <span className="text-primary">50% OFF</span>
          <br />
          no primeiro mês
        </h2>
        <p className="max-w-2xl text-base sm:text-lg text-foreground/75 leading-relaxed mb-8">
          Continuidade de <strong>Pure Pass</strong> e <strong>Pure Club</strong>. Todas as ativações de base por e-mail já estão com os links configurados — comunicação institucional já no ar.
        </p>

        <div className="rounded-xl bg-background border border-foreground/10 shadow-sm p-5 sm:p-6 inline-block">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
            <Clock className="h-3.5 w-3.5" />
            Termina em
          </div>
          <Countdown />
          <p className="text-center text-xs text-muted-foreground mt-3">
            Até 31/05/2026 · 23:59
          </p>
        </div>
      </div>
    </AnimatedSection>

    {/* KPIs */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard icon={Tag} value={50} suffix="%" label="OFF no 1º mês" sub="Pure Pass + Pure Club" delay={0} />
      <MetricCard icon={Calendar} value={31} suffix="/05" label="Validade da promoção" sub="Até 23:59" delay={100} />
      <MetricCard icon={Sparkles} value={2} label="Cupons disponíveis" sub="Um por plano" delay={200} />
    </div>

    {/* Peça oficial da campanha */}
    <AnimatedSection variant="scale-up">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
            Peça oficial da campanha
          </span>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-foreground/5">
          <img
            src={promoMaesBanner}
            alt="Promoção Dupla Dinâmica · 50% OFF no primeiro mês · Cupom PUREMAES50"
            className="w-full h-auto block"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Use o KV nas ativações locais e nos canais da unidade. Acesse a aba "Mídias Sociais" para fazer o download das artes.
        </p>
      </div>
    </AnimatedSection>

    {/* Cupons */}
    <AnimatedSection>
      <SectionTitle className="text-2xl">Cupons da campanha</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Clique no código para copiar e usar nas ativações:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CouponCard
        plan="Pure Pass"
        code="PUREPASSMAES"
        url="https://www.purepilates.com.br/purepass?cupom=PUREPASSMAES"
        highlight="Mídia paga · Foco"
        delay={0}
      />
      <CouponCard
        plan="Pure Club"
        code="PUREMAES50"
        url="https://www.purepilates.com.br/pure-club/PUREMAES50"
        highlight="Comunicação institucional"
        delay={150}
      />
    </div>

    <AnimatedSection>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <ShieldCheck className="h-6 w-6 text-primary mb-3" />
          <h4 className="font-semibold text-foreground mb-2">Regras da promoção</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Promoção válida até <strong>31/05/2026</strong>. Para <strong>novos alunos</strong> e com condições de cancelamento conforme as regras promocionais do plano escolhido — vigente.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Calendário sazonal */}
    <AnimatedSection>
      <SectionTitle className="text-2xl">
        <Calendar className="inline h-7 w-7 mr-2 text-primary align-middle" />
        Calendário · safras e DTs
      </SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        O calendário promocional considera os <strong>dias trabalhados (DTs)</strong> e as sazonalidades do varejo. Acompanhamos leads novos de A–E por DT para parametrizar o volume adequado de resultados, e as unidades estão clusterizadas dentro das campanhas para entregabilidade da mídia.
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full border-l-4 border-l-[#e9c688]">
          <CardContent className="pt-6">
            <p className="font-heading font-semibold text-base mb-2">Dias trabalhados (DTs)</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Volume de leads por DT calibra a expectativa do mês — bate com a sazonalidade do varejo.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="fade-up" delay={120}>
        <Card className="h-full border-l-4 border-l-[#e9c688]">
          <CardContent className="pt-6">
            <p className="font-heading font-semibold text-base mb-2">Leads A–E por DT</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Acompanhamos a qualificação para parametrizar volume adequado por categoria de unidade.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="fade-up" delay={240}>
        <Card className="h-full border-l-4 border-l-[#e9c688]">
          <CardContent className="pt-6">
            <p className="font-heading font-semibold text-base mb-2">Clusterização de unidades</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cada unidade entra na campanha conforme cluster — entregabilidade da mídia ajustada.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  </>
);

/* ══════════════════════════════════════════════════════════════
   VEM AÍ: MAIO
   ══════════════════════════════════════════════════════════════ */
const VemAiMaio = () => (
  <>
    <AnimatedSection>
      <SectionTitle>
        <Megaphone className="inline h-7 w-7 mr-2 text-primary align-middle" />
        Vem aí
      </SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Três frentes para qualificar o funil e melhorar a conversão neste mês:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Treinamento de vendas */}
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <GraduationCap className="h-7 w-7 text-primary mb-4" />
            <h4 className="font-heading font-bold text-lg mb-2">Treinamento de vendas</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Ajustes finais e abordagens novas para conversão de planos: <strong>Pure Pass</strong>, <strong>Pure Club</strong> e pacotes — para extrair mais resultado dos leads novos.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>Discurso afinado por plano</span></li>
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>Abordagens objeções → fechamento</span></li>
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>Otimização de funil pós aula experimental</span></li>
            </ul>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Avalie sua aula experimental */}
      <AnimatedSection variant="fade-up" delay={120}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Star className="h-7 w-7 text-primary mb-4" />
            <h4 className="font-heading font-bold text-lg mb-2">Avalie sua aula experimental</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              App pós-aula experimental: link com código <strong>válido por 48h</strong> para venda online — quem não fechou na hora ainda converte pelo app.
            </p>
            <div className="rounded-lg border-2 border-dashed border-primary/40 bg-[#faead0] px-3 py-2 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-mono text-xs font-bold tracking-wide">PROFVILA-ANASHOW</span>
              <span className="text-[10px] text-muted-foreground ml-auto">10% OFF</span>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* QR Code */}
      <AnimatedSection variant="fade-up" delay={240}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <QrCode className="h-7 w-7 text-primary mb-4" />
            <h4 className="font-heading font-bold text-lg mb-2">Aula experimental + QR Code</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Para os meses de baixa demanda, seguimos com aula experimental e adicionamos uma <strong>camada de validação</strong>: QR Code para autenticar o número de telefone do cadastro.
            </p>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
              <p className="mb-1">
                <strong className="text-foreground">Foco em qualidade</strong>: o lead que chega na unidade passa a ter cadastro autenticado, com pequeno ajuste esperado nos indicadores de topo de funil.
              </p>
              <p className="text-[11px] italic">
                Ajuste desenhado com contribuição dos franqueados na reunião de updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

    </div>

    {/* Banner de fechamento */}
    <AnimatedSection variant="scale-up">
      <div className="rounded-xl bg-[#f3d7a7] p-6 flex items-center gap-3">
        <Zap className="h-6 w-6 text-primary shrink-0" />
        <p className="text-sm sm:text-base font-heading font-semibold text-foreground">
          Mais qualificação, melhor conversão. Maio prepara o terreno para o segundo semestre.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   LEO YOUNG — A NOVA CARA DA PURE
   ══════════════════════════════════════════════════════════════ */
const LEO_VIDEOS: { title: string; subtitle: string; embedUrl?: string }[] = [
  {
    title: 'A melhor hora do seu dia',
    subtitle: 'Campanha institucional · No ar desde 18/04',
    embedUrl: 'https://drive.google.com/file/d/1GoDSh0NiMHEC0dcbPlao8bA30UAhAZsq/preview',
  },
  {
    title: 'Play · A partir de 18/04',
    subtitle: 'Vinheta de abertura · Pilates é a melhor hora do dia',
    embedUrl: 'https://drive.google.com/file/d/1uAJikpZe8ntBcC-GEeQxuFo_87X-oKYe/preview',
  },
];

const LeoYoungPage = () => (
  <>
    {/* Hero */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-14">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
                Pilar 1 · Contagiar pelo exemplo
              </span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-heading font-bold leading-[1.05]">
              Leo Young<span className="text-primary">,</span>
              <br />
              <span className="text-foreground/85 text-3xl sm:text-4xl font-semibold">
                a nova cara da Pure.
              </span>
            </h2>

            <p className="max-w-xl text-base sm:text-lg text-foreground/75 leading-relaxed">
              Fechamos contrato com o <strong>Leo Young</strong> como o influencer Pure Pilates dos próximos meses. Ele vai estampar a campanha <em>"A melhor hora do seu dia"</em>, no ar desde <strong>18/04</strong>, e dar rosto à mensagem que vamos amplificar nas unidades.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-3 py-1.5 text-xs font-medium">
                <Instagram className="h-3.5 w-3.5 text-primary" />
                Conteúdo em redes sociais
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-3 py-1.5 text-xs font-medium">
                <PlayCircle className="h-3.5 w-3.5 text-primary" />
                Campanha em vídeo
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-3 py-1.5 text-xs font-medium">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Maio · Junho · Julho
              </span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* Citação da campanha */}
    <AnimatedSection>
      <div className="relative max-w-3xl mx-auto py-4">
        <Quote className="absolute -top-2 -left-2 h-10 w-10 text-primary/20" />
        <p className="text-2xl sm:text-3xl font-heading font-semibold text-foreground leading-snug pl-8">
          "A melhor hora do seu dia.<br />
          A melhor hora do <span className="text-primary">meu</span> dia."
        </p>
      </div>
    </AnimatedSection>

    {/* Players de vídeo */}
    <AnimatedSection>
      <SectionTitle className="text-2xl">
        <PlayCircle className="inline h-7 w-7 mr-2 text-primary align-middle" />
        Vídeos da campanha
      </SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Material oficial para as unidades. Use no atendimento, nos stories e nas reuniões com leads.
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {LEO_VIDEOS.map((video, i) => (
        <AnimatedSection key={video.title} variant="fade-up" delay={i * 120}>
          <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-foreground/5 relative">
              {video.embedUrl ? (
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  loading="lazy"
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                  <div>
                    <PlayCircle className="h-12 w-12 text-primary mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-semibold text-foreground/70 mb-1">Vídeo em preparação</p>
                    <p className="text-xs text-muted-foreground">
                      Aguardando upload do arquivo final.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <CardContent className="pt-5">
              <h4 className="font-heading font-bold text-lg mb-1">{video.title}</h4>
              <p className="text-sm text-muted-foreground">{video.subtitle}</p>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>

    {/* Como usar */}
    <AnimatedSection>
      <SectionTitle className="text-2xl">Como usar nas unidades</SectionTitle>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full border-l-4 border-l-[#e9c688]">
          <CardContent className="pt-6">
            <Instagram className="h-6 w-6 text-primary mb-3" />
            <p className="font-heading font-semibold text-base mb-2">Stories e reels</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reposte o conteúdo oficial marcando @purepilates. Reforça a campanha localmente.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="fade-up" delay={120}>
        <Card className="h-full border-l-4 border-l-[#e9c688]">
          <CardContent className="pt-6">
            <Megaphone className="h-6 w-6 text-primary mb-3" />
            <p className="font-heading font-semibold text-base mb-2">Atendimento</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use os vídeos como prova social na hora de apresentar a Pure para leads novos.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
      <AnimatedSection variant="fade-up" delay={240}>
        <Card className="h-full border-l-4 border-l-[#e9c688]">
          <CardContent className="pt-6">
            <Sparkles className="h-6 w-6 text-primary mb-3" />
            <p className="font-heading font-semibold text-base mb-2">Comunidade</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Compartilhe nos grupos de alunos e reforce a mensagem "a melhor hora do seu dia".
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  </>
);

/* ══════════════════════════════════════════════════════════════
   PURE SELECT — programa voluntário de afiliados
   ══════════════════════════════════════════════════════════════ */
const PureSelectPage = () => (
  <>
    {/* Hero — fora do padrão das outras abas */}
    <AnimatedSection variant="fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#f3d7a7] to-white p-10 sm:p-16">
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
                Programa de afiliação · Para sua unidade
              </span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-heading font-bold leading-[0.95] text-foreground">
              Pure
              <br />
              <span className="text-primary">Select.</span>
            </h1>

            <p className="text-base sm:text-lg text-foreground/75 leading-relaxed max-w-xl">
              Programa que dá aos <strong>seus instrutores</strong> a opção de <strong>fechar pacotes</strong> e <strong>ganhar comissão</strong> pelas vendas.
            </p>
          </div>

          <AnimatedSection variant="scale-up" delay={200}>
            <div className="rounded-2xl border-l-4 border-l-primary bg-background/70 backdrop-blur-sm p-6 sm:p-7 shadow-sm">
              <p className="text-base sm:text-lg font-heading font-semibold leading-snug text-foreground">
                Oportunidade de <span className="text-primary">renda extra</span> para o instrutor.
              </p>
              <div className="h-px bg-foreground/10 my-4" />
              <p className="text-base sm:text-lg font-heading font-semibold leading-snug text-foreground">
                Mais <span className="text-primary">conversão</span> para o seu estúdio.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </AnimatedSection>

    {/* O que é */}
    <AnimatedSection>
      <div className="max-w-3xl">
        <SectionTitle>O que é o Pure Select?</SectionTitle>
        <p className="text-base sm:text-lg text-foreground/80 leading-relaxed mt-4">
          Pure Select é o nosso <strong>programa de afiliação para a equipe de instrutores</strong>. Os instrutores da sua unidade que aderirem passam a poder <strong>fechar pacotes</strong> e receber <strong>comissão</strong> por cada venda. A adesão é voluntária — cabe a cada instrutor escolher participar.
        </p>
      </div>
    </AnimatedSection>

    {/* Switch obrigatório vs. opcional — visual */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatedSection variant="fade-up" delay={0}>
        <div className="rounded-xl border border-foreground/10 bg-muted/30 p-5 flex items-center gap-4">
          <div className="relative w-14 h-7 rounded-full bg-foreground/15 shrink-0">
            <div className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-foreground/40 transition-transform" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Obrigatório?</p>
            <p className="font-heading font-bold text-lg text-foreground/70 flex items-center gap-1">
              <X className="h-5 w-5" /> Não.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={120}>
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
          <div className="relative w-14 h-7 rounded-full bg-primary shrink-0 shadow-sm">
            <div className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-transform" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-bold">Voluntário?</p>
            <p className="font-heading font-bold text-lg text-primary flex items-center gap-1">
              <Check className="h-5 w-5" /> Sempre.
            </p>
          </div>
        </div>
      </AnimatedSection>
    </div>

    {/* Como funciona — 3 passos */}
    <AnimatedSection>
      <SectionTitle>Como funciona em 3 passos</SectionTitle>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-heading font-black text-2xl mb-4">
              1
            </div>
            <HandHeart className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-heading font-bold text-lg mb-2">O instrutor decide aderir</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A iniciativa parte de cada instrutor da sua equipe — uma escolha individual, com total liberdade para entrar quando fizer sentido.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={150}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-heading font-black text-2xl mb-4">
              2
            </div>
            <Handshake className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-heading font-bold text-lg mb-2">Adesão como afiliado oficial Pure</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sua unidade formaliza a entrada com o instrutor, alinhando regras, comissões e responsabilidades.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={300}>
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-heading font-black text-2xl mb-4">
              3
            </div>
            <CircleDollarSign className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-heading font-bold text-lg mb-2">Pacote fechado, comissão paga</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A cada pacote fechado, o instrutor afiliado recebe a comissão acordada — de forma transparente e direta.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* Por que "Select"? */}
    <AnimatedSection>
      <div className="rounded-2xl bg-foreground text-background p-10 sm:p-12">
        <Quote className="h-10 w-10 text-primary mb-4" />
        <p className="text-2xl sm:text-3xl font-heading font-semibold leading-snug mb-4">
          <span className="text-primary">Select</span> significa <span className="text-primary">"selecionar".</span>
        </p>
        <p className="opacity-80 leading-relaxed max-w-2xl mb-3">
          Ou seja, <strong>escolher</strong>. O nome tem um propósito: comunicar que o programa é <strong>voluntário</strong>, com adesão livre.
        </p>
        <p className="opacity-80 leading-relaxed max-w-2xl">
          A função do instrutor segue sendo a de <strong>instrutor</strong> — dar aulas, acompanhar alunos, manter a qualidade da experiência dentro da unidade. A afiliação ao Pure Select é <strong>algo a mais</strong>, como qualquer programa de afiliados do mercado: uma oportunidade de gerar renda adicional via comissão para quem quiser participar.
        </p>
      </div>
    </AnimatedSection>

  </>
);

/* ══════════════════════════════════════════════════════════════
   INDIQUE PURE PILATES
   ══════════════════════════════════════════════════════════════ */
const IndiquePurePilates = () => (
  <>
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl bg-foreground text-background p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-3">
          <UserPlus className="h-6 w-6" />
          <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">
            Próximo capítulo · Junho e Julho
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 leading-tight">
          Indique <span className="text-primary">Pure Pilates</span>
        </h2>

        <p className="opacity-80 leading-relaxed mb-6 max-w-2xl">
          Em <strong>junho</strong> e <strong>julho</strong> teremos um esforço adicional na campanha de indicações. Fique atento porque vêm <strong>ajustes na comunicação de todos os materiais</strong> e <strong>esforços adicionais</strong> para impulsionar nossos atuais clientes na jornada de recompensas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <AnimatedSection variant="fade-up" delay={0}>
            <div className="rounded-xl bg-background/10 border border-background/15 p-5">
              <Megaphone className="h-5 w-5 mb-3" />
              <p className="font-heading font-bold text-base mb-1">Comunicação revista</p>
              <p className="text-sm opacity-70">
                Ajustes em todos os materiais da campanha para reforçar o programa.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection variant="fade-up" delay={150}>
            <div className="rounded-xl bg-background/10 border border-background/15 p-5">
              <Rocket className="h-5 w-5 mb-3" />
              <p className="font-heading font-bold text-base mb-1">Reforço operacional</p>
              <p className="text-sm opacity-70">
                Esforços adicionais para mobilizar clientes ativos e ampliar indicações.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection variant="fade-up" delay={300}>
            <div className="rounded-xl bg-background/10 border border-background/15 p-5">
              <Sparkles className="h-5 w-5 mb-3" />
              <p className="font-heading font-bold text-base mb-1">Régua de recompensas</p>
              <p className="text-sm opacity-70">
                Continuidade da jornada de benefícios para quem indica Pure.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </AnimatedSection>

    {/* Roadmap visual */}
    <AnimatedSection>
      <SectionTitle className="text-2xl">Linha do tempo</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Maio é a hora de preparar a base — quem vai aproveitar o "Indique" em junho começa a engajar agora.
      </p>
    </AnimatedSection>

    <AnimatedSection>
      <div className="relative">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-primary/30" />
        <div className="space-y-5 pl-10">
          <div className="relative">
            <span className="absolute -left-10 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              1
            </span>
            <p className="font-heading font-bold text-base mb-1">Maio · Preparação</p>
            <p className="text-sm text-muted-foreground">
              Engajar clientes ativos com a comunicação atual e mapear quem mais indica.
            </p>
          </div>
          <div className="relative">
            <span className="absolute -left-10 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              2
            </span>
            <p className="font-heading font-bold text-base mb-1">Junho · Lançamento dos novos materiais</p>
            <p className="text-sm text-muted-foreground">
              Comunicação revista entra no ar com os ajustes — todas as unidades alinhadas.
            </p>
          </div>
          <div className="relative">
            <span className="absolute -left-10 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              3
            </span>
            <p className="font-heading font-bold text-base mb-1">Julho · Pico do esforço</p>
            <p className="text-sm text-muted-foreground">
              Reforço operacional para impulsionar a régua de recompensas no auge da campanha.
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* Closing */}
    <AnimatedSection variant="scale-up">
      <div className="text-center py-8">
        <p className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
          Obrigado<span className="text-primary">.</span>
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
          Bom maio para todos. Qualquer dúvida, fale com o time pelo Hub.
        </p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
const MonthLanding_2026_05 = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');

  const renderSection = () => {
    switch (activeTab) {
      case 'inicio': return <PaginaInicial goTo={setActiveTab} />;
      case 'resultados': return <ResultadosPage />;
      case 'promocao': return <PromocaoMaio />;
      case 'vem-ai': return <VemAiMaio />;
      case 'leo-young': return <LeoYoungPage />;
      case 'pure-select': return <PureSelectPage />;
      case 'indique': return <IndiquePurePilates />;
    }
  };

  return (
    <div className="rounded-3xl bg-[#fdf3df] p-5 sm:p-8 pb-10">
      <ScrollArea className="w-full mb-6">
        <div className="flex gap-2 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all border',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background/70 text-foreground/70 border-foreground/10 hover:bg-background hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="space-y-16">
        {renderSection()}
      </div>
    </div>
  );
};

export default MonthLanding_2026_05;

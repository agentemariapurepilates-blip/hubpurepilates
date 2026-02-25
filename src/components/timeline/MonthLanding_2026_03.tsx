import AnimatedSection from './AnimatedSection';
import AnimatedCounter from './AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Target, Megaphone, Youtube, Shield, Star,
  Percent, Tag, BarChart3, Smartphone, MessageSquare, Users,
  ExternalLink, Sparkles,
} from 'lucide-react';

/* ─── DATA ─── */

const janVsFevData = [
  { name: 'Meta Aula', janeiro: 9599, fevereiro: 8189 },
  { name: 'Realizado Aula', janeiro: 11547, fevereiro: 7548 },
  { name: 'Presença', janeiro: 8061, fevereiro: 5624 },
  { name: 'Matrículas', janeiro: 1619, fevereiro: 1439 },
];

const shareMidiaData = [
  { name: 'Conversão Google', value: 31.9 },
  { name: 'Awareness YouTube', value: 34.6 },
  { name: 'Consideração', value: 33.5 },
];

const buzzJanData = [
  { name: 'Positivas', value: 41.27 },
  { name: 'Neutras', value: 55.65 },
  { name: 'Negativas', value: 3.08 },
];

const buzzFevData = [
  { name: 'Positivas', value: 36.5 },
  { name: 'Neutras', value: 60.79 },
  { name: 'Negativas', value: 2.71 },
];

const PIE_COLORS = ['hsl(350 72% 45%)', 'hsl(0 0% 60%)', 'hsl(0 0% 85%)'];
const SHARE_COLORS = ['hsl(350 72% 45%)', 'hsl(0 84% 60%)', 'hsl(350 72% 70%)'];

/* ─── HELPERS ─── */

const MetricCard = ({
  icon: Icon,
  value,
  suffix,
  label,
  sub,
  delay = 0,
}: {
  icon: React.ElementType;
  value: number;
  suffix?: string;
  label: string;
  sub?: string;
  delay?: number;
}) => (
  <AnimatedSection variant="scale-up" delay={delay}>
    <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6 pb-5 px-4">
        <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
        <p className="text-3xl font-bold text-foreground">
          <AnimatedCounter end={value} suffix={suffix} />
        </p>
        <p className="text-sm font-medium text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs text-primary font-semibold mt-1">{sub}</p>}
      </CardContent>
    </Card>
  </AnimatedSection>
);

const SectionTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-2xl sm:text-3xl font-heading font-bold text-foreground ${className}`}>{children}</h2>
);

/* ─── COMPONENT ─── */

const MonthLanding_2026_03 = () => {
  return (
    <div className="space-y-16 pb-12">
      {/* ── HERO ── */}
      <AnimatedSection variant="fade-in">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-foreground p-8 sm:p-12 text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(350_72%_55%/0.4),transparent_60%)]" />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-widest opacity-80 mb-2">Timeline · Março 2026</p>
            <h1 className="text-3xl sm:text-5xl font-heading font-bold leading-tight mb-4">
              Resultados do<br />1º Bimestre
            </h1>
            <p className="max-w-2xl text-base sm:text-lg opacity-90 leading-relaxed">
              O primeiro bimestre de 2026 trouxe grandes entregas para a rede. Confira o resumo da saúde de marca e das campanhas de mídia paga.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ── BRANDFORMANCE INTRO ── */}
      <AnimatedSection>
        <SectionTitle>
          <BarChart3 className="inline h-7 w-7 mr-2 text-primary align-middle" />
          Brandformance
        </SectionTitle>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Com o conceito de <strong>DT (dia trabalhado)</strong>, calibramos esforços em semanas com feriados, inaugurações ou demandas promocionais. Os relatórios agora trazem mais números visando produtividade das agências e estratégias de alcance.
        </p>
      </AnimatedSection>

      {/* ── JANEIRO ── */}
      <div className="space-y-4">
        <AnimatedSection>
          <h3 className="text-xl font-heading font-semibold text-foreground">Janeiro · 21 dias trabalhados</h3>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard icon={Target} value={11547} label="Aulas Experimentais" sub="120% da meta" delay={0} />
          <MetricCard icon={Users} value={8061} label="Presenças" sub="120% da meta" delay={100} />
          <MetricCard icon={Star} value={1619} label="Matrículas" sub="87% da meta" delay={200} />
        </div>
      </div>

      {/* ── FEVEREIRO ── */}
      <div className="space-y-4">
        <AnimatedSection>
          <h3 className="text-xl font-heading font-semibold text-foreground">
            Fevereiro · 18 dias trabalhados <span className="text-xs text-muted-foreground">(até 22/02)</span>
          </h3>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard icon={Target} value={7548} label="Aulas Experimentais" sub="92% da meta" delay={0} />
          <MetricCard icon={Users} value={5624} label="Presenças" sub="96% da meta" delay={100} />
          <MetricCard icon={Star} value={1439} label="Matrículas" sub="100% da meta" delay={200} />
        </div>
      </div>

      {/* ── GRÁFICO COMPARATIVO ── */}
      <AnimatedSection>
        <Card>
          <CardContent className="pt-6">
            <SectionTitle className="mb-6">Comparativo Jan × Fev</SectionTitle>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={janVsFevData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="janeiro" name="Janeiro" fill="hsl(350 72% 45%)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  <Bar dataKey="fevereiro" name="Fevereiro" fill="hsl(350 72% 70%)" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={300} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ── ACUMULADO ── */}
      <div className="space-y-4">
        <AnimatedSection>
          <SectionTitle>Acumulado Jan + Fev</SectionTitle>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard icon={Target} value={19095} label="Aulas Experimentais" delay={0} />
          <MetricCard icon={Users} value={13685} label="Presenças" delay={100} />
          <MetricCard icon={Star} value={3058} label="Matrículas" delay={200} />
        </div>
      </div>

      {/* ── EVOLUÇÃO DA CONVERSÃO ── */}
      <AnimatedSection variant="fade-left">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <SectionTitle>Evolução da Conversão</SectionTitle>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                A taxa de conversão de presença em matrícula subiu de <strong>20,1%</strong> em janeiro para{' '}
                <strong>25,6%</strong> em fevereiro parcial, uma evolução de <strong>+5,5 p.p.</strong> que sinaliza melhora na qualidade do atendimento e/ou do lead.
              </p>
            </div>
            <div className="text-center shrink-0">
              <TrendingUp className="h-10 w-10 text-primary mx-auto mb-2" />
              <p className="text-4xl font-bold text-primary">
                <AnimatedCounter end={5.5} suffix=" p.p." prefix="+" decimals={1} />
              </p>
              <p className="text-xs text-muted-foreground">20,1% → 25,6%</p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ── SHARE DE MÍDIA JANEIRO ── */}
      <AnimatedSection>
        <Card>
          <CardContent className="pt-6">
            <SectionTitle className="mb-6">
              <Megaphone className="inline h-6 w-6 mr-2 text-primary align-middle" />
              Share de Mídia — Janeiro 2026
            </SectionTitle>
            <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed">
              Um movimento relevante no mercado publicitário impacta a aplicação de investimentos: desconto de pelo menos 15% de impostos para todos os anunciantes. Já temos reforços e otimizações em andamento.
            </p>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shareMidiaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={1200}
                    label={({ name, value }) => `${value}%`}
                  >
                    {shareMidiaData.map((_, i) => (
                      <Cell key={i} fill={SHARE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* ── CAMPANHA YOUTUBE ── */}
      <AnimatedSection>
        <SectionTitle>
          <Youtube className="inline h-7 w-7 mr-2 text-primary align-middle" />
          Campanha YouTube — &quot;A Melhor Hora do Dia&quot;
        </SectionTitle>
        <p className="text-muted-foreground mt-2 mb-6 max-w-3xl leading-relaxed">
          Com a primeira campanha de YouTube, tivemos recorde de busca e agendamentos. Os resultados reforçam a necessidade de manter a marca em momentos de descoberta.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AnimatedSection variant="scale-up" delay={0}>
          <Card className="text-center border-none shadow-lg">
            <CardContent className="pt-6 pb-5">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter end={3} prefix="+" suffix="%" />
              </p>
              <p className="text-sm text-muted-foreground mt-1">vs Janeiro 2025</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection variant="scale-up" delay={100}>
          <Card className="text-center border-none shadow-lg">
            <CardContent className="pt-6 pb-5">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter end={7.1} suffix="x" decimals={1} />
              </p>
              <p className="text-sm text-muted-foreground mt-1">Chance de pesquisa pela marca</p>
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection variant="scale-up" delay={200}>
          <Card className="text-center border-none shadow-lg">
            <CardContent className="pt-6 pb-5">
              <Megaphone className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter end={115} prefix="+" suffix="%" />
              </p>
              <p className="text-sm text-muted-foreground mt-1">Lift relativo de pesquisa</p>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>

      {/* ── BUZZ MONITOR ── */}
      <AnimatedSection>
        <SectionTitle>
          <Shield className="inline h-6 w-6 mr-2 text-primary align-middle" />
          Buzz Monitor — Saúde de Marca
        </SectionTitle>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Janeiro */}
        <AnimatedSection variant="fade-left">
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-lg mb-1">Janeiro</h4>
              <p className="text-xs text-muted-foreground mb-4">
                41,27% positivas · 55,65% neutras · 3,08% negativas
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={buzzJanData} cx="50%" cy="50%" outerRadius={70} dataKey="value" animationDuration={1200} label={({ value }) => `${value}%`}>
                      {buzzJanData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Menções positivas reforçam experiência acolhedora, melhora na postura e bem-estar. Aumento nas conversas sobre preços e planos.
              </p>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Fevereiro */}
        <AnimatedSection variant="fade-right">
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-lg mb-1">Fevereiro</h4>
              <p className="text-xs text-muted-foreground mb-4">
                36,5% positivas · 60,79% neutras · 2,71% negativas
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={buzzFevData} cx="50%" cy="50%" outerRadius={70} dataKey="value" animationDuration={1200} label={({ value }) => `${value}%`}>
                      {buzzFevData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Aumento nas interações neutras, refletindo buscas por informações práticas. Audiência interessada, porém mais analítica e sensível a preço.
              </p>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>

      {/* ── VEM AÍ: MARÇO ── */}
      <AnimatedSection>
        <SectionTitle>
          <Sparkles className="inline h-6 w-6 mr-2 text-primary align-middle" />
          Vem Aí: Março
        </SectionTitle>
        <p className="text-muted-foreground mt-2 mb-6 max-w-3xl leading-relaxed">
          O Carnaval acabou e o comércio já está no ritmo de Páscoa! Novos movimentos são necessários para ganhar fôlego. Confira o que preparamos:
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: Percent,
            title: '50% OFF',
            desc: 'Pacotes de 4 e 8 aulas para leads da base. Disparo para leads não convertidos até 31/01/2026.',
          },
          {
            icon: Tag,
            title: 'Cupom PURE10',
            desc: '10% off para novos planos. Aplicação conforme negociação, sem comunicação em massa.',
          },
          {
            icon: Megaphone,
            title: 'Mídia +20%',
            desc: 'Plano de mídia nos moldes do 1º bimestre: alta performance em final de funil e awareness.',
          },
          {
            icon: Smartphone,
            title: 'TikTok Oficial',
            desc: 'Perfil único e centralizado @purepilatesbr. Desafios, conteúdo nativo e crescimento de seguidores.',
          },
          {
            icon: MessageSquare,
            title: 'Reclame Aqui',
            desc: 'Company Page com vídeos explicativos, FAQ e links diretos. +13 mil consultas nos últimos 12 meses.',
          },
          {
            icon: Users,
            title: 'Pure Match',
            desc: 'Plataforma que conecta franqueados a instrutores. Otimizar oportunidades e fortalecer a rede.',
          },
        ].map((item, i) => (
          <AnimatedSection key={item.title} variant="scale-up" delay={i * 80}>
            <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 pb-5">
                <item.icon className="h-6 w-6 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          </AnimatedSection>
        ))}
      </div>

      {/* ── DESAFIO FRANCHISING ── */}
      <AnimatedSection variant="fade-up">
        <div className="rounded-2xl bg-foreground text-background p-8 sm:p-10">
          <h3 className="text-2xl font-heading font-bold mb-3">
            🏆 Desafio das Unidades Pure
          </h3>
          <p className="opacity-80 leading-relaxed mb-4 max-w-2xl">
            Poste nos seus stories uma foto da sua unidade, marque <strong>@purepilates.franchising</strong> e a gente compartilha! Quando várias unidades entram juntas, a ação ganha tração e cria atração de rede.
          </p>
          <p className="opacity-70 text-sm mb-6">
            Publicações toda terça e quinta. Entrem para curtir e comentar! Quem quiser gravar depoimento, procure o William.
          </p>
          <a
            href="https://www.instagram.com/purepilates.franchising"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Seguir @purepilates.franchising
          </a>
        </div>
      </AnimatedSection>

      {/* ── ENCERRAMENTO ── */}
      <AnimatedSection variant="fade-in">
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Preparados! Que venha o mês de março e o fechamento do primeiro trimestre de 2026! 🚀
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default MonthLanding_2026_03;

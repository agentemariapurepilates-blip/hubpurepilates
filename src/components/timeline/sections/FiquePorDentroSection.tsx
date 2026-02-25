import AnimatedSection from '../AnimatedSection';
import AnimatedCounter from '../AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Sparkles, Youtube, Target, TrendingUp, Megaphone, Shield,
  Percent, Tag, Users, Smartphone, MessageSquare, Monitor,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import { SectionTitle, MetricCard } from '../shared';

/* ── DADOS DOS GRÁFICOS ── */

const shareMidiaData = [
  { name: 'Conversão Google', value: 31.9 },
  { name: 'Awareness YouTube', value: 34.6 },
  { name: 'Consideração', value: 33.5 },
];
const SHARE_COLORS = ['hsl(350 72% 45%)', 'hsl(0 84% 60%)', 'hsl(350 72% 70%)'];

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

/* ── VEM AÍ MARÇO ITEMS ── */

const vemAiItems = [
  {
    icon: Percent,
    title: 'Promoção 50% OFF',
    desc: 'Pacotes de 4 e 8 aulas para leads da base. Disparo para leads não convertidos até 31/01/2026. Os leads de fevereiro não estarão na base como medida protetiva das negociações.',
  },
  {
    icon: Tag,
    title: 'Cupom PURE10',
    desc: 'Todas as unidades podem aplicar o cupom PURE10 (10% off para novos planos) a fim de acelerar a decisão de compra. Não teremos esforços de e-mails e outras comunicações para esta oferta — é uma aplicação conforme negociação.',
  },
  {
    icon: Megaphone,
    title: 'Plano de Mídia +20%',
    desc: 'Seguirá nos moldes do 1º bimestre: alta performance em categorias de final de funil e awareness com +20%, prezando o desempenho de aula experimental.',
  },
  {
    icon: Smartphone,
    title: 'TikTok',
    desc: 'Se você é fã do TikTok, continue seguindo o nosso perfil — teremos uma nova configuração da marca Pure Pilates. Confira a página dedicada no menu acima.',
  },
  {
    icon: MessageSquare,
    title: 'BrandPage Reclame Aqui',
    desc: 'Isso já impacta a nossa reputação e este novo formato proporcionará um tratamento das ações de clientes com mais destaque e agilidade com consultoras, franqueados e acompanhamento da equipe de marketing. Confira a página dedicada no menu acima.',
  },
  {
    icon: Users,
    title: 'Pure Match',
    desc: 'A plataforma exclusiva que conecta o ecossistema Pure Pilates, abrindo um mundo de novas oportunidades. De um lado, franqueados em busca de profissionais incríveis para expandir seus horários. Do outro, instrutores talentosos prontos para assumir novos desafios. Nossa missão é simples: fortalecer a rede, otimizar oportunidades e garantir que mais pessoas tenham acesso à experiência Pure Pilates.',
  },
  {
    icon: Monitor,
    title: 'Treinamentos Pure System',
    desc: 'Confira aqui no HUB a nova sessão de treinamentos do sistema! Com certeza você vai salvar nos seus favoritos este novo jeito de aprender um pouco mais sobre o Pure System.',
  },
];

/* ── COMPONENTE ── */

const FiquePorDentroSection = () => (
  <>
    {/* ══════════════════════════════════════════
        1. CAMPANHA YOUTUBE
    ══════════════════════════════════════════ */}
    <AnimatedSection>
      <SectionTitle>
        <Youtube className="inline h-7 w-7 mr-2 text-primary align-middle" />
        Campanha YouTube — "A Melhor Hora do Dia"
      </SectionTitle>
      <p className="text-muted-foreground mt-2 mb-2 max-w-3xl leading-relaxed">
        Apostamos em janeiro com a primeira campanha de YouTube trazendo a campanha <strong>"A melhor hora do dia"</strong>. Com isso, tivemos um <strong>recorde de busca e agendamentos</strong>. Em paralelo, rodamos pesquisas para entendimento do impacto desta ativação e os resultados reforçam a necessidade de manter a nossa marca em momentos de descoberta, ou seja, refletir um composto de mídia que proporciona:
      </p>
      <ul className="text-muted-foreground max-w-3xl leading-relaxed space-y-1 ml-4 mb-6">
        <li className="flex items-start gap-2">
          <span className="text-primary font-bold shrink-0">1.</span>
          <span><strong>Alta performance</strong> nas pessoas que já buscam</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary font-bold shrink-0">2.</span>
          <span><strong>Vídeos</strong> que abordam nossos diferenciais e a posição de liderança no mercado</span>
        </li>
      </ul>
    </AnimatedSection>

    {/* Métricas YouTube */}
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

    {/* ══════════════════════════════════════════
        2. SHARE DE MÍDIA
    ══════════════════════════════════════════ */}
    <AnimatedSection>
      <Card>
        <CardContent className="pt-6">
          <SectionTitle className="mb-4">
            <Megaphone className="inline h-6 w-6 mr-2 text-primary align-middle" />
            Share de Mídia — Janeiro 2026
          </SectionTitle>

          <div style={{ width: '100%', minHeight: 400 }}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={shareMidiaData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" animationDuration={1200} label={({ value }) => `${value}%`}>
                  {shareMidiaData.map((_, i) => <Cell key={i} fill={SHARE_COLORS[i]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Impostos + Pesquisa */}
    <AnimatedSection>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <AlertCircle className="h-6 w-6 text-primary mb-3" />
          <h4 className="font-semibold text-foreground mb-2">Impacto tributário e otimizações</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Um movimento relevante no mercado publicitário vem impactando a aplicação de investimentos: este ano todos os anunciantes passam pelo <strong>desconto de pelo menos 15% de impostos</strong>. Isso impacta e dilui consideravelmente os recursos da verba de marketing. Para isso, já temos reforços e políticas para novas unidades na rede e também otimizações dentro das rotinas e agências.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            Com o modelo de janeiro, aplicamos uma pesquisa que confirmou que a Pure Pilates tem <strong>grande capacidade de gerar consideração</strong> a partir do momento que se faz mais presente nas mídias. Esta elasticidade em janeiro foi confirmada através dos anúncios de YouTube (Awareness).
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* ══════════════════════════════════════════
        3. BUZZ MONITOR — SAÚDE DE MARCA
    ══════════════════════════════════════════ */}
    <AnimatedSection>
      <SectionTitle>
        <Shield className="inline h-6 w-6 mr-2 text-primary align-middle" />
        Buzz Monitor — Saúde de Marca
      </SectionTitle>
      <p className="text-muted-foreground mt-2 mb-6 max-w-3xl leading-relaxed">
        Em termos de saúde de marca, estamos com movimento que evidencia a boa reputação nas principais redes sociais.
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Janeiro */}
      <AnimatedSection variant="fade-left">
        <Card className="h-full">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-lg mb-1">Janeiro</h4>
            <p className="text-xs text-muted-foreground mb-4">
              41,27% positivas · 55,65% neutras · 3,08% negativas
            </p>
            <div style={{ width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={buzzJanData} cx="50%" cy="50%" outerRadius={80} dataKey="value" animationDuration={1200} label={({ value }) => `${value}%`}>
                    {buzzJanData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-muted-foreground mt-3 leading-relaxed space-y-2">
              <p>O mês apresentou volume expressivo de interações, impulsionado pelo período de retomada de rotina e metas de início de ano.</p>
              <p>As <strong>menções positivas</strong> reforçam a experiência acolhedora das aulas, com destaque para:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Melhora na postura, força e bem-estar geral</li>
                <li>Sentimento de comunidade forte entre alunos</li>
                <li>Participação ativa nos desafios semanais</li>
              </ul>
              <p className="mt-2">
                Houve aumento nas <strong>conversas sobre preços, planos e localização</strong> das unidades, indicando interesse em iniciar ou retomar as aulas, mas também revelando maior sensibilidade ao tema acessibilidade financeira. Comentários sobre aceitação de benefícios como <strong>Gympass</strong> e dúvidas operacionais demonstram uma audiência mais ativa e investigativa.
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Fevereiro */}
      <AnimatedSection variant="fade-right">
        <Card className="h-full">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-lg mb-1">Fevereiro</h4>
            <p className="text-xs text-muted-foreground mb-4">
              36,5% positivas · 60,79% neutras · 2,71% negativas
            </p>
            <div style={{ width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={buzzFevData} cx="50%" cy="50%" outerRadius={80} dataKey="value" animationDuration={1200} label={({ value }) => `${value}%`}>
                    {buzzFevData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-muted-foreground mt-3 leading-relaxed space-y-2">
              <p>O mês apresentou aumento nas <strong>interações neutras</strong>, refletindo maior volume de perguntas e buscas por informações práticas.</p>
              <p>Grande parte das conversas se concentrou em <strong>valores, planos e condições de pagamento</strong>, além de questionamentos sobre localização das unidades e aceitação de benefícios como <strong>Gympass e TotalPass</strong>. Isso indica uma audiência interessada, porém mais analítica e sensível a preço.</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>As <strong>menções positivas</strong> continuam destacando benefícios físicos e emocionais do Pilates: fortalecimento muscular, melhora da postura e bem-estar geral</li>
                <li>Os <strong>desafios semanais</strong> seguem como ponto de engajamento relevante</li>
                <li>As <strong>menções negativas</strong> (2,71%) permanecem associadas a clareza de informações e tempo de resposta no atendimento</li>
              </ul>
              <p className="mt-2">
                O cenário mostra uma <strong>comunidade ativa e interessada</strong> em aderir às aulas, com oportunidade estratégica para reforçar transparência nas informações comerciais e agilidade no atendimento, facilitando a conversão de interesse em matrícula.
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* ══════════════════════════════════════════
        4. VEM AÍ: MARÇO
    ══════════════════════════════════════════ */}
    <AnimatedSection>
      <SectionTitle>
        <Sparkles className="inline h-6 w-6 mr-2 text-primary align-middle" />
        Vem Aí: Março
      </SectionTitle>
      <p className="text-muted-foreground mt-2 mb-6 max-w-3xl leading-relaxed">
        O Carnaval acabou ontem e o comércio já está no ritmo de Páscoa! Este movimento evidencia o quão desafiador este ano será para o varejo como um todo. O nosso segmento está em alta, temos números e pesquisas que evidenciam que a nossa presença gera demanda nas unidades, mas a concorrência cresceu e novos movimentos são necessários para ganharmos fôlego e recuperação como uma rede. Por isso, teremos:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {vemAiItems.map((item, i) => (
        <AnimatedSection key={item.title} variant="scale-up" delay={i * 80}>
          <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-5">
              <item.icon className="h-7 w-7 text-primary mb-3" />
              <h4 className="font-semibold text-lg text-foreground mb-2">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>

    {/* Encerramento */}
    <AnimatedSection variant="fade-in">
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Preparados? Que venha o mês de março e o fechamento do primeiro trimestre de 2026! 🚀
        </p>
      </div>
    </AnimatedSection>
  </>
);

export default FiquePorDentroSection;

import { useState } from 'react';
import AnimatedSection from './AnimatedSection';
import AnimatedCounter from './AnimatedCounter';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { SectionTitle, MetricCard } from './shared';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Target, Users, Star, BarChart3, TrendingUp, Lightbulb, MessageSquare, Trophy,
  CheckCircle, Search, Video, HelpCircle, Instagram, Calendar, ExternalLink,
  Megaphone, ArrowRight, AlertTriangle, Zap, Eye, ShieldCheck, Rocket,
} from 'lucide-react';
import logoPure from '@/assets/logo-pure-pilates.png';
import heroSvg from '@/assets/pilates-hero.svg';

type TabKey = 'inicio' | 'brandformance' | 'vem-ai-abril' | 'reclame-aqui' | 'desafio';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Página Inicial' },
  { key: 'brandformance', label: 'Brandformance' },
  { key: 'vem-ai-abril', label: 'Vem Aí: Abril' },
  { key: 'reclame-aqui', label: 'Projeto Reclame Aqui' },
  { key: 'desafio', label: 'Desafio do Franchising' },
];

/* ── DADOS DOS GRÁFICOS ── */
const aulaExperimentalData = [
  { name: 'Meta Aula Experimental (LN)', janeiro: 9599, fevereiro: 8189, marco: 7932 },
  { name: 'Realizado Aula Experimental (LN)', janeiro: 11547, fevereiro: 7548, marco: 7932 },
  { name: 'Aula Experimental mídia paga (LN)', janeiro: 3200, fevereiro: 3500, marco: 3800 },
  { name: 'Comparecimento', janeiro: 8061, fevereiro: 5624, marco: 5920 },
  { name: 'Matrículas', janeiro: 1619, fevereiro: 1500, marco: 1200 },
];

const sentimentoData = [
  { name: 'Promotores', janeiro: 38, fevereiro: 42, marco: 28 },
  { name: 'Neutro', janeiro: 57, fevereiro: 62, marco: 70 },
  { name: 'Detratores', janeiro: 3, fevereiro: 4, marco: 3.75 },
];

const clusterData = [
  { cluster: 'Críticas e Novas Unidades', tendencia: 'Alto e estável', emoji: '🔴' },
  { cluster: '+59', tendencia: 'Crescimento', emoji: '🟡' },
  { cluster: '60–79', tendencia: 'Oscilação leve', emoji: '⚠️' },
  { cluster: '+80', tendencia: 'Estável', emoji: '🟢' },
];

const promoHistorico = [
  { tipo: 'Pure Pass 2025 (Black Friday)', impacto: 7325, conversao: 135 },
  { tipo: 'Pure Club 2025 (Black Friday)', impacto: 12785, conversao: 85 },
];

/* ══════════════════════════════════════════════════════════════
   PÁGINA INICIAL
   ══════════════════════════════════════════════════════════════ */
const PaginaInicial = () => (
  <>
    {/* Hero */}
    <AnimatedSection variant="fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-muted/50 to-muted min-h-[340px] sm:min-h-[420px]">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-primary/8 blur-2xl" />
        <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-primary/4 blur-xl animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-8 sm:p-12">
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-3">
              <img src={logoPure} alt="Pure Pilates" className="h-8 sm:h-10 object-contain" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Timeline · Abril 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-heading font-bold leading-tight text-foreground">
              Caros franqueados,
            </h1>

            <p className="max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
              O primeiro trimestre de 2026 nos deixa uma mensagem clara: <strong>a marca está forte, gerando demanda e despertando interesse real do consumidor</strong>. Os números comprovam isso — mais de <strong>27 mil aulas experimentais geradas e quase 20 mil presenças</strong> — um volume que posiciona a rede em um patamar consistente de aquisição
            </p>

            <p className="max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
              Mas, ao olharmos além do volume, os dados revelam algo ainda mais importante: <strong>estamos vivendo uma mudança no comportamento do consumidor e no momento do funil.</strong>
            </p>

            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Em abril teremos a oferta Pure Pass e Pure Club com 50% off no primeiro mês.
            </div>
          </div>

          <div className="hidden md:block shrink-0">
            <img src={heroSvg} alt="Pilates illustration" className="w-48 lg:w-64 opacity-80" />
          </div>
        </div>
      </div>
    </AnimatedSection>

    {/* KPIs do 1T */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard icon={Target} value={27308} label="Aulas Experimentais" sub="Acumulado 1T (até 23/03)" delay={0} />
      <MetricCard icon={Users} value={19605} label="Presenças" sub="Acumulado 1T (até 23/03)" delay={100} />
      <MetricCard icon={TrendingUp} value={50} suffix="%" label="OFF no 1º mês" sub="Pure Pass + Pure Club" delay={200} />
    </div>

    {/* Citação destaque */}
    <AnimatedSection>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-lg font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            "Não falta interesse. Falta decisão. Esse é o ponto de virada".
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* A mudança de cenário */}
    <AnimatedSection>
      <SectionTitle>A mudança de cenário: de crescimento para eficiência</SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        O que estamos vendo é um comportamento típico de uma marca que amadureceu sua base:
      </p>
      <ul className="mt-3 space-y-1 text-muted-foreground">
        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> O consumidor já conhece</li>
        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Já considera</li>
        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Já demonstra interesse</li>
      </ul>
      <p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed">
        Mas agora ele <strong>compara, analisa e pondera mais antes de decidir</strong>.
      </p>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Essa leitura é evidente pela atual saúde da marca, onde há um crescimento significativo das interações neutras. Isso significa mais perguntas, mais dúvidas e mais busca por informações práticas como preço, horários e condições.
      </p>
      <p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed italic">
        "O consumidor não está mais sendo convencido — ele está avaliando".
      </p>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        E isso muda completamente a forma como precisamos atuar.
      </p>
    </AnimatedSection>

    {/* Diretriz */}
    <AnimatedSection>
      <p className="text-muted-foreground max-w-3xl leading-relaxed">
        Diante desse cenário, surge a diretriz que deve guiar todas as ações da rede: <strong>Transformar interesse em decisão através de clareza + prova + urgência.</strong>
      </p>
    </AnimatedSection>

    {/* 3 Pilares */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <Eye className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-heading font-bold text-lg mb-2">1. Clareza: reduzir fricção e facilitar a decisão</h3>
            <p className="text-sm text-muted-foreground mb-3">Os dados mostram que grande parte das interações gira em torno de dúvidas básicas. Isso indica que ainda existem barreiras na jornada.</p>
            <p className="text-sm text-muted-foreground mb-3">Quando o consumidor precisa perguntar muito, ele demora mais para decidir.</p>
            <p className="text-xs text-muted-foreground mb-2">👉 Isso exige:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Comunicação direta sobre preços e planos</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Facilidade de acesso a horários e disponibilidade</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Explicação simples do funcionamento</span></li>
            </ul>
            <p className="text-xs font-semibold text-primary mt-3">Clareza não é detalhe — é conversão.</p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={150}>
        <Card className="h-full border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <ShieldCheck className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-heading font-bold text-lg mb-2">2. Prova: reforçar valor e reduzir insegurança</h3>
            <p className="text-sm text-muted-foreground mb-3">As menções positivas continuam destacando benefícios claros: bem-estar, força, flexibilidade, experiência com instrutores</p>
            <p className="text-sm text-muted-foreground mb-3">Isso mostra que: <strong>Quem experimenta, valoriza.</strong> Mas quem ainda não decidiu precisa de mais evidência.</p>
            <p className="text-xs text-muted-foreground mb-2">👉 Por isso, precisamos manter a atual dinâmica e ampliar o alcance local:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Depoimentos</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Experiências reais</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Resultados percebidos</span></li>
            </ul>
            <p className="text-xs font-semibold text-primary mt-3">A prova reduz risco e acelera decisão.</p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={300}>
        <Card className="h-full border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <Zap className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-heading font-bold text-lg mb-2">3. Urgência: estimular ação imediata</h3>
            <p className="text-sm text-muted-foreground mb-3">Com a aproximação da entre-safra, entra um fator crítico: <strong>tempo</strong>.</p>
            <p className="text-sm text-muted-foreground mb-3">Sem estímulo, o consumidor adia.</p>
            <p className="text-sm text-muted-foreground mb-3">É aqui que entram as promoções estratégicas — como Pure Pass e Pure Club com 50% OFF — não apenas como incentivo, mas como <strong>gatilho de decisão</strong>.</p>
            <p className="text-sm text-muted-foreground mb-3">Os dados históricos mostram que essas ações geram impacto real no funil, seja em volume ou conversão</p>
            <p className="text-xs font-semibold text-primary mt-3">👉 Urgência não é pressão — é direcionamento.</p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    {/* Encerramento */}
    <AnimatedSection>
      <div className="text-center py-6">
        <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Os dados, os gráficos e o comportamento do consumidor apontam todos na mesma direção: Estamos diante de um momento de maturidade.
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">E nesse momento, vence quem executa melhor.</p>
        <p className="text-lg sm:text-xl font-heading font-bold text-foreground max-w-2xl mx-auto mt-4">
          <span className="text-primary">Transformar interesse em decisão através de clareza + prova + urgência</span> não é apenas uma diretriz — é o caminho para destravar crescimento real nos próximos meses.
        </p>
        <p className="text-muted-foreground mt-3">Agora, mais do que nunca, o foco está na ação.</p>
      </div>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   BRANDFORMANCE (MATRIZ)
   ══════════════════════════════════════════════════════════════ */
const BrandformanceAbril = () => (
  <>
    <AnimatedSection>
      <SectionTitle>
        <BarChart3 className="inline h-7 w-7 mr-2 text-primary align-middle" />
        BRANDFORMANCE
      </SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Vivemos um início de ano extremamente forte. Janeiro superou metas com folga, impulsionado por um contexto natural de alta demanda e reforço de mídia. Fevereiro manteve a consistência mesmo com interferências sazonais. Já março, embora ainda robusto em volume, começa a mostrar um sinal importante: <strong>queda na conversão.</strong>
      </p>
    </AnimatedSection>

    {/* Acumulado 1T */}
    <AnimatedSection>
      <p className="text-muted-foreground max-w-3xl leading-relaxed">
        No acumulado 1T <strong>(até 23/03)</strong>, o volume de leads gerados soma <strong>27.308 aulas experimentais</strong> e <strong>19.605 presenças</strong>, números que reforçam a consistência do topo e meio de funil.
      </p>
    </AnimatedSection>

    {/* Gráfico Aula Experimental */}
    <AnimatedSection>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-heading font-semibold mb-4">Aula experimental</h3>
          <div style={{ width: '100%', minHeight: 400 }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={aulaExperimentalData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="janeiro" name="Janeiro" fill="hsl(20 80% 30%)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                <Bar dataKey="fevereiro" name="Fevereiro" fill="hsl(20 80% 45%)" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={300} />
                <Bar dataKey="marco" name="Março (até 23-03)" fill="hsl(25 90% 60%)" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Janeiro */}
    <div className="space-y-4">
      <AnimatedSection>
        <h3 className="text-xl font-heading font-semibold">Janeiro · 21 dias trabalhados</h3>
      </AnimatedSection>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={Target} value={11547} label="Aulas experimentais agendadas" sub="120% da meta de 9.599" delay={0} />
        <MetricCard icon={Users} value={8061} label="Presenças" sub="120% da meta de 6.743" delay={100} />
        <MetricCard icon={Star} value={1619} label="Matrículas" sub="87% — contra a meta de 1.870" delay={200} />
      </div>
      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          O mês de janeiro teve 21 dias trabalhados e com o movimento "ano novo, vida nova" pautamos o crescimento de leads novos com reforço de You Tube Ads. Como rede fechamos acima da meta em geração de leads e presença: foram <strong>11.547 aulas experimentais agendadas</strong> (120% da meta de 9.599) e <strong>8.061 presenças</strong> (120% da meta de 6.743). Em matrículas, o mês ficou ligeiramente abaixo, com <strong>1.619 contra a meta de 1.870</strong> (87%), um gap de 251 matrículas;
        </p>
      </AnimatedSection>
    </div>

    {/* Fevereiro */}
    <div className="space-y-4">
      <AnimatedSection>
        <h3 className="text-xl font-heading font-semibold">Fevereiro · 18 dias trabalhados</h3>
      </AnimatedSection>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={Target} value={7548} label="Aulas Experimentais" delay={0} />
        <MetricCard icon={Users} value={5624} label="Presenças" delay={100} />
        <MetricCard icon={Star} value={1500} label="Matrículas" sub="Resultado sólido na base do funil" delay={200} />
      </div>
      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Em fevereiro foram 18 dias trabalhados e com o conhecido impacto do carnaval em novos leads e vendas mantivemos uma verba de <strong>+24%</strong> para os formatos de mídia para topo de funil e reforçamos a estratégia de final de funil para unidades críticas. O resultado foi sólido na base do funil: <strong>1500 matrículas</strong>;
        </p>
      </AnimatedSection>
    </div>

    {/* Março */}
    <div className="space-y-4">
      <AnimatedSection>
        <h3 className="text-xl font-heading font-semibold">Março · Parcial até 23/03</h3>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={Target} value={7932} label="Aulas Experimentais" sub="Até 23/03" delay={0} />
        <MetricCard icon={Users} value={5920} label="Presenças" delay={100} />
        <MetricCard icon={AlertTriangle} value={-5} suffix=" p.p." label="Queda na Conversão" sub="Matrícula vs. agendamento" delay={200} />
      </div>

      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Já na parcial de Março atingimos mais de <strong>7932 aulas experimentais</strong> até o dia 23 com uma conversão em vendas <strong>-5p.p</strong> na rede considerando matrícula vs. agendamento. Com isso, temos condições para aplicar na rede estratégicas de captação antes do período de baixa demanda - além da Copa do Mundo e datas sazonais do varejo que como histórico já dividem a atenção do consumidor.
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          O ponto de atenção segue sendo a taxa de conversão: sinalizando que o comparecimento com redução, custos de aquisição em leve crescimento resultando já decréscimo no volume de leads de mídia paga. Acreditamos que o amadurecimento da base conquistada até aqui trouxe o resultado saudável, porém precisamos criar "colchão" pensando nos meses do próximo trimestre.
        </p>
      </AnimatedSection>
    </div>

    {/* Clusters */}
    <AnimatedSection>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-heading font-semibold mb-2">Cluster vs mensalistas</h3>
          <p className="text-sm text-muted-foreground mb-4">As segmentações de mídia em clusters já trouxeram migração de lojas do clusters críticas para em crescimento. Isso enfatiza que a disponibilidade de recursos considerando estes indicadores será sustentado nos próximos meses:</p>
          <div className="space-y-3">
            {clusterData.map((row) => (
              <div key={row.cluster} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{row.cluster}</span>
                <span className="text-sm">{row.emoji} {row.tendencia}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Gráfico Sentimento */}
    <AnimatedSection>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-heading font-semibold mb-4">Sentimento nas Redes Sociais</h3>
          <div style={{ width: '100%', minHeight: 350 }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={sentimentoData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="janeiro" name="Janeiro" fill="hsl(200 70% 55%)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                <Bar dataKey="fevereiro" name="Fevereiro" fill="hsl(200 80% 35%)" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={300} />
                <Bar dataKey="marco" name="Março (Até 23-3)" fill="hsl(25 90% 55%)" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            Março apresentou aumento nas <strong>interações neutras</strong>, refletindo maior volume de perguntas e buscas por informações práticas sobre aulas, horários, valores e funcionamento das unidades.
          </p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Grande parte das conversas se concentrou em <strong>mensalidades, aulas experimentais, horários disponíveis e aceitação de benefícios como Wellhub</strong>, além de comentários sobre localização e abertura de novas unidades. Isso indica uma audiência interessada, porém mais analítica, avaliando conveniência, acessibilidade e custo antes da decisão.
          </p>
          <div className="mt-4 space-y-2">
            {[
              'As menções positivas continuam destacando benefícios físicos e emocionais do Pilates, como melhora da consciência corporal, ganho de força, flexibilidade e sensação de bem-estar',
              'O interesse por novas unidades e por estúdios mais próximos reforça uma demanda ativa e desejo de adesão, especialmente entre usuários que demonstram intenção de experimentar a modalidade',
              'Os desafios semanais seguem como ponto de engajamento relevante, incentivando a participação e fortalecendo a conexão com a comunidade',
              'Os comentários também reforçam a valorização do suporte dos instrutores e das adaptações feitas conforme as necessidades dos alunos, ampliando a percepção de cuidado e personalização',
              'As menções negativas 3,75% permanecem associadas principalmente a preço, acessibilidade e clareza de informações comerciais',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                <span className="text-muted-foreground mt-0.5">•</span>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            O cenário mostra uma <strong>comunidade ativa e interessada</strong> nas aulas, com oportunidade estratégica para reforçar transparência nas informações comerciais, facilitar o acesso a horários e condições de entrada, e destacar os diferenciais da experiência em aula para apoiar a conversão de interesse em matrícula.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>

    {/* Promo Abril */}
    <AnimatedSection>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <Rocket className="h-6 w-6 text-primary mb-3" />
          <h3 className="text-xl font-heading font-bold mb-3">Promoção de Abril — 50% OFF no 1º mês</h3>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            Para compor teremos na abertura do segundo trimestre a promoção de Abril - uma estrutura de dois planos com a mesma condição de desconto no primeiro mês:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 mb-4">
            <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Na mídia paga o foco será no <strong>Pure Pass</strong> onde já tivemos ótimos resultados e trazemos a mesma condição para rede;</span></li>
            <li className="flex items-start gap-2"><ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>O <strong>Pure Club</strong> terá a mesma atenção em termos de comunicação institucional, nos canais oficiais e com a equipe das lojas podendo reforçar localmente esta oportunidade.</span></li>
          </ul>
          <h4 className="text-sm font-semibold mb-2">Abaixo o histórico desta ativação:</h4>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2 font-medium">Tipo Promo</th>
                  <th className="text-right p-2 font-medium">Impacto</th>
                  <th className="text-right p-2 font-medium">Conversão absoluta</th>
                </tr>
              </thead>
              <tbody>
                {promoHistorico.map((row) => (
                  <tr key={row.tipo} className="border-t">
                    <td className="p-2">{row.tipo}</td>
                    <td className="p-2 text-right font-semibold">{row.impacto.toLocaleString('pt-BR')}</td>
                    <td className="p-2 text-right font-semibold">{row.conversao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Imagem da promoção */}
          <div className="mt-6 flex justify-center">
            <img
              src="/images/promo-abril.jpeg"
              alt="Pure Pilates - 50% OFF no primeiro mês - Use o cupom 50PUREPASS"
              className="rounded-xl max-w-md w-full shadow-lg"
            />
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   VEM AÍ: ABRIL
   ══════════════════════════════════════════════════════════════ */
const VemAiAbril = () => (
  <>
    <AnimatedSection>
      <SectionTitle>
        <Megaphone className="inline h-7 w-7 mr-2 text-primary align-middle" />
        VEM AÍ: ABRIL
      </SectionTitle>
      <p className="text-lg font-heading font-semibold text-foreground mt-3 mb-2">O mês que define o próximo trimestre:</p>
      <ul className="text-muted-foreground space-y-1 mb-6">
        <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> Converter melhor o que já geramos</li>
        <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> Comunicar com mais clareza</li>
        <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> Reduzir dúvidas do consumidor</li>
        <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> Criar estímulos de decisão mais fortes</li>
        <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> Atuar de forma coordenada como rede</li>
      </ul>
    </AnimatedSection>

    <AnimatedSection>
      <SectionTitle className="text-xl">As principais iniciativas serão:</SectionTitle>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatedSection variant="fade-left">
        <Card className="h-full">
          <CardContent className="pt-6">
            <BarChart3 className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-2">Plano de Mídia</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O Plano de mídia seguirá nos moldes do primeiro trimestre, ou seja, vamos manter a alta performance da marca em categorias de final de funil e awareness com +20% prezando o desempenho de aula experimental. Com a mídia paga apresentando aula experimental, awareness e também venda de Pure Pass teremos custos diferenciados de aquisição na rede;
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-right">
        <Card className="h-full">
          <CardContent className="pt-6">
            <Instagram className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-2">Redes Sociais</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Confira o calendário de redes sociais: reforce ações com as iniciativas de Pure Club localmente; Se você é fã do Tik Tok continue seguindo o nosso perfil já que teremos uma nova configuração da marca Pure Pilates;
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-left">
        <Card className="h-full">
          <CardContent className="pt-6">
            <Instagram className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-2">@purepilates.franchising</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Siga @purepilates.franchising e participe do desafio semanal dos franqueados! É isso mesmo! A idéia é ter a presença das nossas fachadas e também enquetes para ampliar a nossa presença;
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-right">
        <Card className="h-full">
          <CardContent className="pt-6">
            <Users className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-2">Pure Match — Recrutamento</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Melhorias no processo de recrutamento e cobertura de professores: Com a primeira fase do Pure Match já temos ajustes em andamento visando comunicação rápida e divulgação de oportunidades abaixo de sete dias. Além disso, estamos desevolvendo uma segunda plataforma para termos banco de talento com modelagem e triagem padronizada para toda a rede;
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-left">
        <Card className="h-full md:col-span-2">
          <CardContent className="pt-6">
            <Lightbulb className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-2">Treinamentos no HUB</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Confira aqui no HUB a nova sessão de treinamentos do sistema! Com certeza você vai salvar nos seus favoritos este novo jeito de aprender um pouco mais sobre o Pure System.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  </>
);

/* ══════════════════════════════════════════════════════════════
   PROJETO RECLAME AQUI
   ══════════════════════════════════════════════════════════════ */
const ReclameAquiAbril = () => (
  <>
    <AnimatedSection>
      <SectionTitle>
        <MessageSquare className="inline h-6 w-6 mr-2 text-primary align-middle" />
        Projeto Reclame Aqui
      </SectionTitle>
      <h4 className="text-foreground font-semibold mt-3 mb-2">Por que isso importa</h4>
      <p className="text-muted-foreground mb-2 max-w-3xl leading-relaxed">
        O Reclame AQUI não é acessado só por quem reclama. Existe um volume grande de pessoas que entra lá só para pesquisar a marca antes de tomar uma decisão, e a própria plataforma destaca que normalmente há mais acessos do que reclamações. Ou seja, é tráfego com intenção.
      </p>
      <p className="text-muted-foreground mb-6 max-w-3xl leading-relaxed">
        E aqui entra um dado importante: só nos últimos 12 meses, mais de <strong>13 mil pessoas</strong> consultaram a nossa página. Isso mostra o tamanho do público que chega ali querendo entender, comparar e decidir.
      </p>
    </AnimatedSection>

    <AnimatedSection>
      <h4 className="text-foreground font-semibold mb-4">O que vai ter na nossa Company Page</h4>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnimatedSection variant="fade-up" delay={0}>
        <Card className="h-full">
          <CardContent className="pt-6">
            <Video className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold mb-2">1. Vídeos explicativos</h4>
            <p className="text-sm text-muted-foreground">Foco em dúvidas que mais travam a jornada, principalmente agendamento de aula, incluindo os pontos críticos do fluxo com o Hub.</p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={150}>
        <Card className="h-full">
          <CardContent className="pt-6">
            <HelpCircle className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold mb-2">2. FAQ direto ao ponto</h4>
            <p className="text-sm text-muted-foreground">Perguntas e respostas objetivas sobre as dúvidas mais frequentes do dia a dia. O FAQ dentro da Brand Page existe justamente para aumentar a chance de comunicação e reduzir atrito antes do consumidor escalar o problema.</p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={300}>
        <Card className="h-full">
          <CardContent className="pt-6">
            <ExternalLink className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold mb-2">3. Links diretos para ação</h4>
            <p className="text-sm text-muted-foreground">A ideia é a pessoa entrar para entender, resolver em minutos e já ter o próximo passo na mão, como link para compra ou para avançar no funil. Isso ajuda a capturar também quem está só pesquisando.</p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    <AnimatedSection>
      <Card className="border-primary/20 bg-primary/5 mt-4">
        <CardContent className="pt-6">
          <ShieldCheck className="h-6 w-6 text-primary mb-3" />
          <h4 className="font-semibold text-foreground mb-2">O que isso agrega de verdade</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Não é só "reduzir reclamações". É melhorar a experiência desde o agendamento até a aula, proteger reputação e converter quem está em fase de pesquisa. Isso é totalmente coerente com a promessa da Pure de entregar a melhor hora do dia, cuidando da jornada inteira e não só da aula.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>
  </>
);

/* ══════════════════════════════════════════════════════════════
   DESAFIO DO FRANCHISING
   ══════════════════════════════════════════════════════════════ */
const DesafioAbril = () => (
  <>
    <AnimatedSection variant="fade-up">
      <div className="rounded-2xl bg-foreground text-background p-8 sm:p-10">
        <h3 className="text-2xl font-heading font-bold mb-3">
          Desafio do Franchising: Informar a rede sobre o desafio que soltaremos a cada semana para aumentar o alcance e o engajamento
        </h3>
        <p className="opacity-80 leading-relaxed mb-4 max-w-2xl">
          Pessoal, este mês o foco principal é o nosso <strong>desafio para mostrar as unidades</strong>.
        </p>

        <h4 className="font-semibold text-lg mb-2">Desafio da fachada da unidade</h4>
        <h5 className="font-semibold mb-3">Como vai funcionar</h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex items-start gap-3 opacity-80">
            <Instagram className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">No começo do mês</p>
              <p className="text-xs opacity-70">Vamos publicar um post oficial explicando o desafio</p>
            </div>
          </div>
          <div className="flex items-start gap-3 opacity-80">
            <Calendar className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Toda semana</p>
              <p className="text-xs opacity-70">Vamos soltar stories de lembrete para manter o ritmo e puxar participação</p>
            </div>
          </div>
          <div className="flex items-start gap-3 opacity-80">
            <Video className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Depoimentos</p>
              <p className="text-xs opacity-70">Quem quiser gravar um depoimento pode procurar o William. Ele agenda com o time de gravação para captar o conteúdo.</p>
            </div>
          </div>
        </div>

        <p className="opacity-80 leading-relaxed mb-4 max-w-2xl">
          A ideia é <strong>intensificar a participação</strong> desde o início. Postem a fachada da sua unidade, marquem o nosso perfil e a gente compartilha nos stories. Quando várias unidades entram juntas, a ação ganha <strong>tração</strong> mais rápido e cria <strong>atração</strong> de rede.
        </p>
        <p className="opacity-80 leading-relaxed mb-4 max-w-2xl">
          Isso aumenta o <strong>alcance</strong> da Pure em diferentes regiões ao mesmo tempo, reforça presença de marca e faz mais gente descobrir que tem uma unidade perto.
        </p>

        <h5 className="font-semibold mb-2">Calendário</h5>
        <p className="opacity-80 text-sm mb-6">
          Além do desafio, seguimos intensificando o conteúdo do Franchising com publicações <strong>toda terça e quinta</strong>. Sempre que puderem, entrem para <strong>curtir e comentar</strong> para ajudar no alcance.
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
  </>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
const MonthLanding_2026_04 = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');

  return (
    <div className="pb-12">
      <ScrollArea className="w-full mb-8">
        <div className="flex gap-2 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all border',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="space-y-16">
        {activeTab === 'inicio' && <PaginaInicial />}
        {activeTab === 'brandformance' && <BrandformanceAbril />}
        {activeTab === 'vem-ai-abril' && <VemAiAbril />}
        {activeTab === 'reclame-aqui' && <ReclameAquiAbril />}
        {activeTab === 'desafio' && <DesafioAbril />}
      </div>
    </div>
  );
};

export default MonthLanding_2026_04;

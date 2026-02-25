import AnimatedSection from '../AnimatedSection';
import AnimatedCounter from '../AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Megaphone, Target, TrendingUp, Youtube } from 'lucide-react';
import { SectionTitle } from '../shared';

const shareMidiaData = [
  { name: 'Conversão Google', value: 31.9 },
  { name: 'Awareness YouTube', value: 34.6 },
  { name: 'Consideração', value: 33.5 },
];

const SHARE_COLORS = ['hsl(350 72% 45%)', 'hsl(0 84% 60%)', 'hsl(350 72% 70%)'];

const ShareMidiaSection = () => (
  <>
    {/* ── SHARE DE MÍDIA JANEIRO ── */}
    <AnimatedSection>
      <Card>
        <CardContent className="pt-6">
          <SectionTitle className="mb-6">
            <Megaphone className="inline h-6 w-6 mr-2 text-primary align-middle" />
            Share de Mídia — Janeiro 2026
          </SectionTitle>
          <p className="text-muted-foreground mb-4 max-w-3xl leading-relaxed">
            O composto de mídia do 1º bimestre combinou duas frentes: <strong>(1) alta performance em final de funil</strong> — com campanhas de conversão no Google Ads focadas em agendamento — e <strong>(2) vídeos de diferenciais no YouTube</strong> — para construção de awareness e consideração da marca.
          </p>
          <p className="text-muted-foreground mb-4 max-w-3xl leading-relaxed">
            Um movimento relevante no mercado publicitário impacta a aplicação de investimentos: <strong>desconto de pelo menos 15% de impostos para todos os anunciantes</strong>. Já temos reforços e otimizações em andamento para aproveitar esse cenário. Para novas unidades, políticas específicas de investimento estão sendo implementadas para garantir um ramp-up saudável.
          </p>
          <div style={{ width: '100%', minHeight: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
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
                  label={({ value }) => `${value}%`}
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
      <p className="text-muted-foreground mt-2 mb-2 max-w-3xl leading-relaxed">
        Com a primeira campanha de YouTube, tivemos <strong>recorde de busca</strong> e agendamentos. As pesquisas de impacto confirmam alta elasticidade entre awareness e conversão: quando o público assiste ao vídeo, a probabilidade de buscar a marca aumenta significativamente.
      </p>
      <p className="text-muted-foreground mb-6 max-w-3xl leading-relaxed">
        Os resultados reforçam a necessidade de manter a marca em momentos de descoberta, criando um ciclo virtuoso entre YouTube Ads → busca orgânica → agendamento → matrícula.
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
  </>
);

export default ShareMidiaSection;

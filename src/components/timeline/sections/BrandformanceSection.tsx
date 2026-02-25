import AnimatedSection from '../AnimatedSection';
import AnimatedCounter from '../AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Star, BarChart3 } from 'lucide-react';
import { SectionTitle, MetricCard } from '../shared';

const BrandformanceSection = () => (
  <>
    {/* ── BRANDFORMANCE INTRO ── */}
    <AnimatedSection>
      <SectionTitle>
        <BarChart3 className="inline h-7 w-7 mr-2 text-primary align-middle" />
        Brandformance
      </SectionTitle>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Com o conceito de <strong>DT (dia trabalhado)</strong>, calibramos esforços em semanas com feriados, inaugurações ou demandas promocionais. Os relatórios agora trazem mais números visando produtividade das agências e estratégias de alcance.
      </p>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Toda a performance via mídia paga é mensurada com novos parâmetros de metas, permitindo análises mais granulares sobre produtividade das agências e eficiência dos investimentos em cada canal.
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

      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Janeiro trouxe o impulso do <strong>"ano novo, vida nova"</strong>, com reforço de YouTube Ads que gerou recorde de buscas orgânicas pela marca. O topo e meio de funil superaram a meta com folga (120%), mas as matrículas ficaram em 87% — um gap de <strong>251 matrículas</strong>.
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          O comportamento de conversão mostra que a decisão de compra é superior a 5 dias na maioria dos casos, indicando que parte dos leads de janeiro converteu apenas em fevereiro. Esse fator é importante para avaliar resultados de forma bimestral.
        </p>
      </AnimatedSection>
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

      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Fevereiro sofreu impacto direto do Carnaval, reduzindo dias úteis. Para compensar, a verba de mídia foi reforçada em <strong>+24% para topo de funil</strong>, mantendo o fluxo de leads aquecido. Em paralelo, a estratégia de final de funil priorizou unidades críticas com campanhas dedicadas.
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Com dados até 22/02, as matrículas já atingiram 100% da meta, e a margem dos últimos dias úteis ainda é recuperável para aulas experimentais e presenças. O resultado parcial já é expressivo considerando os dias perdidos.
        </p>
      </AnimatedSection>
    </div>

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

      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          O acumulado do bimestre demonstra consistência no topo e meio de funil, com volume expressivo de aulas experimentais e presenças. A recuperação de fevereiro frente ao gap de janeiro resultou em um fechamento positivo de matrículas quando analisado de forma conjunta.
        </p>
      </AnimatedSection>
    </div>
  </>
);

export default BrandformanceSection;

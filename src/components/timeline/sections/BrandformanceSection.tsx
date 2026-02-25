import AnimatedSection from '../AnimatedSection';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Star, BarChart3 } from 'lucide-react';
import { SectionTitle, MetricCard } from '../shared';

const BrandformanceSection = () => (
  <>
    {/* ── VIDEO MOCKUP ── */}
    <AnimatedSection variant="scale-up">
      <div className="flex justify-center mb-12">
        <div className="relative w-full max-w-4xl">
          {/* Laptop body */}
          <div className="relative rounded-t-xl border-[3px] border-b-0 border-foreground/80 bg-foreground/90 p-[6px] pt-[6px]">
            {/* Camera dot */}
            <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-muted/30 z-10" />
            {/* Screen bezel */}
            <div className="mt-3 rounded-sm overflow-hidden bg-black">
              <video
                src="/videos/brandformance-intro.mp4"
                controls
                playsInline
                className="w-full h-auto block"
                poster=""
              />
            </div>
          </div>
          {/* Laptop base / keyboard */}
          <div className="relative h-4 bg-gradient-to-b from-foreground/80 to-foreground/60 rounded-b-lg">
            {/* Trackpad notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-foreground/40 rounded-b-md" />
          </div>
          {/* Shadow */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[90%] h-5 bg-foreground/10 rounded-full blur-xl" />
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
        Além do processo de performance através de mídia paga, concretizamos uma visão de metas para as nossas ativações com novos parâmetros. Com isso, os relatórios terão agora mais números visando <strong>produtividade das agências</strong> e membros que desenvolvem as estratégias de alcance para toda a rede.
      </p>
      <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
        Além disso, todos os meses apresentaremos o conceito de <strong>DT — dia trabalhado</strong> — para calibrar os esforços em semanas com feriados, inaugurações ou demandas promocionais.
      </p>
    </AnimatedSection>

    {/* ── JANEIRO ── */}
    <div className="space-y-4">
      <AnimatedSection>
        <h3 className="text-xl font-heading font-semibold text-foreground">Janeiro · 21 dias trabalhados</h3>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={Target} value={11547} label="Aulas Experimentais" sub="120% da meta (9.599)" delay={0} />
        <MetricCard icon={Users} value={8061} label="Presenças" sub="120% da meta (6.743)" delay={100} />
        <MetricCard icon={Star} value={1619} label="Matrículas" sub="87% da meta (1.870)" delay={200} />
      </div>

      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          O mês de janeiro teve 21 dias trabalhados e, com o movimento <strong>"ano novo, vida nova"</strong>, pautamos o crescimento de leads novos com reforço de YouTube Ads. Como rede, fechamos acima da meta em geração de leads e presença: foram <strong>11.547 aulas experimentais agendadas</strong> (120% da meta de 9.599) e <strong>8.061 presenças</strong> (120% da meta de 6.743).
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Em matrículas, o mês ficou ligeiramente abaixo, com 1.619 contra a meta de 1.870 (87%), um gap de <strong>251 matrículas</strong>. Este comportamento de conversão dita uma tendência da própria rede que tem uma <strong>decisão de compra superior a 5 dias</strong> após a primeira experiência.
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
        <MetricCard icon={Target} value={7548} label="Aulas Experimentais" sub="92% da meta (8.189)" delay={0} />
        <MetricCard icon={Users} value={5624} label="Presenças" sub="96% da meta (5.878)" delay={100} />
        <MetricCard icon={Star} value={1439} label="Matrículas" sub="100% da meta (1.439)" delay={200} />
      </div>

      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Em fevereiro, foram 18 dias trabalhados e, com o conhecido impacto do Carnaval em novos leads e vendas, mantivemos uma verba de <strong>+24% para os formatos de mídia para topo de funil</strong> e reforçamos a estratégia de final de funil para unidades críticas.
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Até o dia 22, temos um cenário sólido na base do funil: as matrículas já atingiram <strong>1.439, exatamente 100% da meta proporcional ao período</strong>, e caminham bem para a meta cheia de 1.602. Em aulas experimentais, temos 7.548 agendamentos (92% da meta proporcional de 8.189), e 5.624 presenças (96% da meta proporcional de 5.878) — ambos com <strong>margem recuperável nos últimos dias do mês</strong>.
        </p>
      </AnimatedSection>
    </div>

    {/* ── ACUMULADO ── */}
    <div className="space-y-4">
      <AnimatedSection>
        <SectionTitle>Acumulado Jan + Fev <span className="text-sm font-normal text-muted-foreground">(até 22/02)</span></SectionTitle>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={Target} value={19095} label="Aulas Experimentais" delay={0} />
        <MetricCard icon={Users} value={13685} label="Presenças" delay={100} />
        <MetricCard icon={Star} value={3058} label="Matrículas" delay={200} />
      </div>

      <AnimatedSection>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          No acumulado Jan+Fev (até 22/02), o volume de leads gerados soma <strong>19.095 aulas experimentais</strong> e <strong>13.685 presenças</strong>, números que reforçam a consistência do topo e meio de funil. Já em matrículas, o acumulado de <strong>3.058</strong> mostra uma recuperação importante de fevereiro frente a janeiro, com a conversão ganhando tração.
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          O ponto de atenção segue sendo a taxa de conversão de presença em matrícula: em janeiro, ficou em <strong>20,1%</strong>; em fevereiro parcial, já está em <strong>25,6%</strong>, uma evolução de <strong>+5,5 p.p.</strong> que sinaliza melhora na qualidade do atendimento e/ou do lead.
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Baseado na conversão, a franqueadora está ativando <strong>cupons promocionais</strong> e além disso desenvolvendo <strong>novos mecanismos e treinamentos</strong> para a rede. Em breve, haverá uma convocação para este próximo passo.
        </p>
        <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Em termos de saúde de marca, há uma manutenção do cenário nas redes sociais da Pure Pilates. Este indicador evidencia o que o perfil da franqueadora proporciona em termos de conteúdo e como há construção contínua dos valores e condutas da nossa marca.
        </p>
      </AnimatedSection>
    </div>
  </>
);

export default BrandformanceSection;

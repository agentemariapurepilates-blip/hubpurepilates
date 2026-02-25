import AnimatedSection from '../AnimatedSection';
import AnimatedCounter from '../AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { SectionTitle } from '../shared';

const ConversaoSection = () => (
  <AnimatedSection variant="fade-left">
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <SectionTitle>Evolução da Conversão</SectionTitle>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              A taxa de conversão de presença em matrícula subiu de <strong>20,1%</strong> em janeiro para{' '}
              <strong>25,6%</strong> em fevereiro parcial, uma evolução de <strong>+5,5 p.p.</strong> que sinaliza melhora na qualidade do atendimento e/ou do lead.
            </p>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Para março, novos cupons promocionais e mecanismos de conversão estão sendo preparados. Treinamentos específicos serão realizados com as equipes das unidades, e uma convocação será feita em breve para alinhar as estratégias de negociação.
            </p>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              A saúde de marca nas redes sociais também contribui para essa evolução: o aumento de buscas orgânicas e menções positivas fortalece a confiança do lead no momento da decisão de compra.
            </p>
          </div>
          <div className="text-center shrink-0">
            <TrendingUp className="h-10 w-10 text-primary mx-auto mb-2" />
            <p className="text-4xl font-bold text-primary">
              <AnimatedCounter end={5.5} suffix=" p.p." prefix="+" decimals={1} />
            </p>
            <p className="text-xs text-muted-foreground">20,1% → 25,6%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </AnimatedSection>
);

export default ConversaoSection;

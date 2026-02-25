import AnimatedSection from '../AnimatedSection';
import { Card, CardContent } from '@/components/ui/card';
import { Percent, Tag, Megaphone, Users, Sparkles } from 'lucide-react';
import { SectionTitle } from '../shared';

const items = [
  {
    icon: Percent,
    title: '50% OFF',
    desc: 'Pacotes de 4 e 8 aulas para leads da base. Disparo para leads não convertidos até 31/01/2026. Os leads de fevereiro não estão incluídos na base como medida protetiva, evitando canibalização de conversões orgânicas recentes.',
  },
  {
    icon: Tag,
    title: 'Cupom PURE10',
    desc: '10% de desconto para novos planos. Aplicação conforme negociação individual entre franqueado e lead, sem comunicação em massa. O cupom é uma ferramenta de apoio ao fechamento, não uma promoção aberta.',
  },
  {
    icon: Megaphone,
    title: 'Mídia +20%',
    desc: 'Plano de mídia nos moldes do 1º bimestre: campanhas de alta performance em final de funil (Google Ads com foco em agendamento) combinadas com awareness via YouTube para manter a marca presente no momento de descoberta.',
  },
  {
    icon: Users,
    title: 'Pure Match',
    desc: 'Plataforma que conecta franqueados a instrutores disponíveis na região. O objetivo é otimizar oportunidades de contratação, fortalecer a rede e reduzir o tempo de busca por profissionais qualificados.',
  },
];

const FiquePorDentroSection = () => (
  <>
    <AnimatedSection>
      <SectionTitle>
        <Sparkles className="inline h-6 w-6 mr-2 text-primary align-middle" />
        Fique por dentro!
      </SectionTitle>
      <p className="text-muted-foreground mt-2 mb-6 max-w-3xl leading-relaxed">
        O Carnaval acabou e o comércio já está no ritmo de Páscoa! Novos movimentos são necessários para ganhar fôlego. Confira o que preparamos para março:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {items.map((item, i) => (
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
  </>
);

export default FiquePorDentroSection;

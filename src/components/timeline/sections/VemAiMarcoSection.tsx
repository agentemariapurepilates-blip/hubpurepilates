import AnimatedSection from '../AnimatedSection';
import { Card, CardContent } from '@/components/ui/card';
import {
  Percent, Tag, Megaphone, Users, Sparkles,
} from 'lucide-react';
import { SectionTitle } from '../shared';

const items = [
  {
    icon: Percent,
    title: '50% OFF',
    desc: 'Pacotes de 4 e 8 aulas para leads da base.',
  },
  {
    icon: Tag,
    title: 'Cupom PURE10',
    desc: '10% de desconto para novos planos.',
  },
  {
    icon: Megaphone,
    title: 'Mídia +20%',
    desc: 'Campanhas de alta performance + awareness via YouTube.',
  },
  {
    icon: Users,
    title: 'Pure Match',
    desc: 'Conecta franqueados a instrutores da região.',
  },
];

const VemAiMarcoSection = () => (
  <>
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
      {items.map((item, i) => (
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
  </>
);

export default VemAiMarcoSection;

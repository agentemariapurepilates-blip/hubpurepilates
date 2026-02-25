import AnimatedSection from '../AnimatedSection';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Search, Video, HelpCircle, Link, CheckCircle } from 'lucide-react';
import { SectionTitle } from '../shared';

const PostEspecialReclameAqui = () => (
  <>
    <AnimatedSection>
      <SectionTitle>
        <MessageSquare className="inline h-6 w-6 mr-2 text-primary align-middle" />
        Projeto Reclame Aqui
      </SectionTitle>
      <p className="text-muted-foreground mt-2 mb-6 max-w-3xl leading-relaxed">
        A Pure Pilates terá uma <strong>Company Page</strong> no Reclame Aqui — um espaço dedicado e profissional para a marca dentro da plataforma. Veja o que isso significa para a rede:
      </p>
    </AnimatedSection>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatedSection variant="fade-left">
        <Card className="h-full">
          <CardContent className="pt-6">
            <Search className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-2">Por que importa?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nos últimos 12 meses, a página da Pure Pilates no Reclame Aqui teve mais de <strong>13 mil consultas</strong>. Isso significa que milhares de potenciais alunos pesquisam a marca antes de agendar uma aula experimental. Uma Company Page bem estruturada transmite confiança e profissionalismo.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection variant="fade-right">
        <Card className="h-full">
          <CardContent className="pt-6">
            <Video className="h-6 w-6 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-2">O que vai ter?</h4>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Vídeos explicativos sobre a metodologia e os diferenciais da Pure Pilates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>FAQ completo com as dúvidas mais frequentes dos consumidores</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Links diretos para agendamento e contato com unidades</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>

    <AnimatedSection>
      <Card className="border-primary/20 bg-primary/5 mt-4">
        <CardContent className="pt-6">
          <HelpCircle className="h-6 w-6 text-primary mb-3" />
          <h4 className="font-semibold text-foreground mb-2">O que agrega de verdade?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Company Page transforma o Reclame Aqui de um canal passivo de reclamações em um <strong>canal ativo de comunicação e conversão</strong>. Com conteúdo relevante, FAQ e links diretos, os consumidores que pesquisam a marca encontram respostas antes mesmo de abrir uma reclamação — reduzindo atrito e aumentando a confiança na hora da decisão.
          </p>
        </CardContent>
      </Card>
    </AnimatedSection>
  </>
);

export default PostEspecialReclameAqui;

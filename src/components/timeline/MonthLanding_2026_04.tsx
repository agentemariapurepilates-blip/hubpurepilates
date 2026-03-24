import { useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, TrendingUp, Lightbulb, FolderOpen } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import { SectionTitle } from './shared';

type TabKey = 'save-the-date' | 'brandformance' | 'fique-por-dentro' | 'projetos';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'save-the-date', label: 'Save the Date', icon: Calendar },
  { key: 'brandformance', label: 'Brandformance', icon: TrendingUp },
  { key: 'fique-por-dentro', label: 'Fique por dentro', icon: Lightbulb },
  { key: 'projetos', label: 'Projetos', icon: FolderOpen },
];

const SaveTheDateSection = () => (
  <AnimatedSection>
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-heading font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Abril 2026
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Confira as datas importantes e ações planejadas para o mês de abril.
        </p>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-16 w-16 text-primary/30 mb-4" />
            <p className="text-muted-foreground text-lg">
              Conteúdo em breve
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              As datas e ações de abril serão publicadas em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </AnimatedSection>
);

const BrandformanceAbrilSection = () => (
  <AnimatedSection>
    <div className="space-y-6">
      <SectionTitle>Brandformance</SectionTitle>
      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-16 w-16 text-primary/30 mb-4" />
            <p className="text-muted-foreground text-lg">
              Conteúdo em breve
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Os dados de Brandformance de abril serão publicados em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </AnimatedSection>
);

const FiquePorDentroAbrilSection = () => (
  <AnimatedSection>
    <div className="space-y-6">
      <SectionTitle>Fique por dentro</SectionTitle>
      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Lightbulb className="h-16 w-16 text-primary/30 mb-4" />
            <p className="text-muted-foreground text-lg">
              Conteúdo em breve
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              As novidades de abril serão publicadas em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </AnimatedSection>
);

const ProjetosAbrilSection = () => (
  <AnimatedSection>
    <div className="space-y-6">
      <SectionTitle>Projetos</SectionTitle>
      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-16 w-16 text-primary/30 mb-4" />
            <p className="text-muted-foreground text-lg">
              Conteúdo em breve
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Os projetos de abril serão publicados em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </AnimatedSection>
);

const MonthLanding_2026_04 = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('save-the-date');

  return (
    <div className="pb-12">
      <ScrollArea className="w-full mb-8">
        <div className="flex gap-2 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all border flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="space-y-16">
        {activeTab === 'save-the-date' && <SaveTheDateSection />}
        {activeTab === 'brandformance' && <BrandformanceAbrilSection />}
        {activeTab === 'fique-por-dentro' && <FiquePorDentroAbrilSection />}
        {activeTab === 'projetos' && <ProjetosAbrilSection />}
      </div>
    </div>
  );
};

export default MonthLanding_2026_04;

import { useState } from 'react';
import AnimatedSection from './AnimatedSection';
import HeroSection from './sections/HeroSection';
import BrandformanceSection from './sections/BrandformanceSection';
import ComparativoChart from './sections/ComparativoChart';
import ConversaoSection from './sections/ConversaoSection';
import ShareMidiaSection from './sections/ShareMidiaSection';
import BuzzMonitorSection from './sections/BuzzMonitorSection';
import VemAiMarcoSection from './sections/VemAiMarcoSection';
import FiquePorDentroSection from './sections/FiquePorDentroSection';
import PostEspecialReclameAqui from './sections/PostEspecialReclameAqui';
import PostEspecialTikTok from './sections/PostEspecialTikTok';
import DesafioFranchisingSection from './sections/DesafioFranchisingSection';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type TabKey = 'inicio' | 'brandformance' | 'fique-por-dentro' | 'reclame-aqui' | 'tiktok' | 'desafio';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Página Inicial' },
  { key: 'brandformance', label: 'Brandformance' },
  { key: 'fique-por-dentro', label: 'Fique por dentro!' },
  { key: 'reclame-aqui', label: 'Projeto Reclame Aqui' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'desafio', label: 'Desafio do Franchising' },
];

const MonthLanding_2026_03 = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');

  return (
    <div className="pb-12">
      {/* ── MENU DE NAVEGAÇÃO ── */}
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

      {/* ── CONTEÚDO DA TAB ATIVA ── */}
      <div className="space-y-16">
        {activeTab === 'inicio' && (
          <>
            <HeroSection />
            <VemAiMarcoSection />
            <AnimatedSection variant="fade-in">
              <div className="text-center py-8">
                <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Preparados! Que venha o mês de março e o fechamento do primeiro trimestre de 2026! 🚀
                </p>
              </div>
            </AnimatedSection>
          </>
        )}

        {activeTab === 'brandformance' && (
          <>
            <BrandformanceSection />
            <ComparativoChart />
            <ConversaoSection />
          </>
        )}

        {activeTab === 'fique-por-dentro' && <FiquePorDentroSection />}

        {activeTab === 'reclame-aqui' && <PostEspecialReclameAqui />}

        {activeTab === 'tiktok' && <PostEspecialTikTok />}

        {activeTab === 'desafio' && <DesafioFranchisingSection />}
      </div>
    </div>
  );
};

export default MonthLanding_2026_03;

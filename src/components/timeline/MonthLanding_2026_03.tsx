import AnimatedSection from './AnimatedSection';
import HeroSection from './sections/HeroSection';
import BrandformanceSection from './sections/BrandformanceSection';
import ComparativoChart from './sections/ComparativoChart';
import ConversaoSection from './sections/ConversaoSection';
import ShareMidiaSection from './sections/ShareMidiaSection';
import BuzzMonitorSection from './sections/BuzzMonitorSection';
import VemAiMarcoSection from './sections/VemAiMarcoSection';
import PostEspecialReclameAqui from './sections/PostEspecialReclameAqui';
import PostEspecialTikTok from './sections/PostEspecialTikTok';
import DesafioFranchisingSection from './sections/DesafioFranchisingSection';

const MonthLanding_2026_03 = () => {
  return (
    <div className="space-y-16 pb-12">
      <HeroSection />
      <BrandformanceSection />
      <ComparativoChart />
      <ConversaoSection />
      <ShareMidiaSection />
      <BuzzMonitorSection />
      <VemAiMarcoSection />
      <PostEspecialReclameAqui />
      <PostEspecialTikTok />
      <DesafioFranchisingSection />

      {/* ── ENCERRAMENTO ── */}
      <AnimatedSection variant="fade-in">
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Preparados! Que venha o mês de março e o fechamento do primeiro trimestre de 2026! 🚀
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default MonthLanding_2026_03;

import AnimatedSection from '../AnimatedSection';
import { ExternalLink, Calendar, Video, Instagram } from 'lucide-react';

const DesafioFranchisingSection = () => (
  <AnimatedSection variant="fade-up">
    <div className="rounded-2xl bg-foreground text-background p-8 sm:p-10">
      <h3 className="text-2xl font-heading font-bold mb-3">
        🏆 Desafio das Unidades Pure
      </h3>
      <p className="opacity-80 leading-relaxed mb-4 max-w-2xl">
        Poste nos seus stories uma foto da sua unidade, marque <strong>@purepilates.franchising</strong> e a gente compartilha! Quando várias unidades entram juntas, a ação ganha tração e cria atração de rede.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-start gap-3 opacity-80">
          <Instagram className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Como funciona</p>
            <p className="text-xs opacity-70">Post oficial no começo do mês + stories de lembrete semanal para manter o engajamento ativo.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 opacity-80">
          <Calendar className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Calendário</p>
            <p className="text-xs opacity-70">Publicações toda terça e quinta. Entrem para curtir e comentar! Quanto mais engajamento, mais alcance.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 opacity-80">
          <Video className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Depoimentos</p>
            <p className="text-xs opacity-70">Quem quiser gravar depoimento em vídeo sobre sua experiência como franqueado, procure o William.</p>
          </div>
        </div>
      </div>

      <a
        href="https://www.instagram.com/purepilates.franchising"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        Seguir @purepilates.franchising
      </a>
    </div>
  </AnimatedSection>
);

export default DesafioFranchisingSection;

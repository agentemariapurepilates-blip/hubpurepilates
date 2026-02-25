import AnimatedSection from '../AnimatedSection';

const HeroSection = () => (
  <AnimatedSection variant="fade-in">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-foreground p-8 sm:p-12 text-primary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(350_72%_55%/0.4),transparent_60%)]" />
      <div className="relative z-10">
        <p className="text-sm uppercase tracking-widest opacity-80 mb-2">Timeline · Março 2026</p>
        <h1 className="text-3xl sm:text-5xl font-heading font-bold leading-tight mb-4">
          Resultados do<br />1º Bimestre
        </h1>
        <p className="max-w-2xl text-base sm:text-lg opacity-90 leading-relaxed">
          Caros franqueados, o primeiro bimestre de 2026 trouxe grandes entregas para a rede. Com isso, temos um resumo da saúde de marca e das campanhas de mídia paga. Confira um resumo do que realizamos e já pode começar a programar as redes sociais locais e as negociações de leads não convertidos, já que preparamos reforços para o mês de março.
        </p>
      </div>
    </div>
  </AnimatedSection>
);

export default HeroSection;

import AnimatedSection from '../AnimatedSection';
import logoPure from '@/assets/logo-pure-pilates.png';
import heroSvg from '@/assets/pilates-hero.svg';

const HeroSection = () => (
  <AnimatedSection variant="fade-in">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-muted/50 to-muted min-h-[340px] sm:min-h-[420px]">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-primary/8 blur-2xl" />
      <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-primary/4 blur-xl animate-pulse" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-8 sm:p-12">
        {/* Text content */}
        <div className="flex-1 space-y-5">
          <div className="flex items-center gap-3">
            <img src={logoPure} alt="Pure Pilates" className="h-8 sm:h-10 object-contain" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Timeline · Março 2026
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-heading font-bold leading-tight text-foreground">
            Tudo sobre o<br />
            <span className="text-primary">1º bimestre</span> da rede
          </h1>

          <p className="max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
            Caros franqueados, o primeiro bimestre de 2026 trouxe grandes entregas para a rede. Com isso, temos um resumo da saúde de marca e das campanhas de mídia paga. Confira um resumo do que realizamos e já pode começar a programar as redes sociais locais e as negociações de leads não convertidos, já que preparamos reforços para o mês de março.
          </p>

          <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Navegue pelo menu acima para entender tudo que está sendo feito!
          </div>
        </div>

        {/* Illustration */}
        <div className="hidden md:block shrink-0">
          <img
            src={heroSvg}
            alt="Pilates illustration"
            className="w-48 lg:w-64 opacity-80"
          />
        </div>
      </div>
    </div>
  </AnimatedSection>
);

export default HeroSection;

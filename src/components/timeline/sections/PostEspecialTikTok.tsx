import AnimatedSection from '../AnimatedSection';
import AnimatedCounter from '../AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, AlertTriangle, Users, Heart, ExternalLink } from 'lucide-react';
import { SectionTitle } from '../shared';
import tiktokProfile from '@/assets/tiktok-profile.png';

const PostEspecialTikTok = () => (
  <>
    <AnimatedSection>
      <SectionTitle>
        <Smartphone className="inline h-6 w-6 mr-2 text-primary align-middle" />
        TikTok
      </SectionTitle>
      <p className="text-muted-foreground mt-2 mb-6 max-w-3xl leading-relaxed">
        A Pure Pilates agora tem um perfil oficial e centralizado no TikTok: <strong>@purepilatesbr</strong>. Confira os dados atuais e o alinhamento para a rede:
      </p>
    </AnimatedSection>

    {/* Layout: mockup + conteúdo */}
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Phone mockup */}
      <AnimatedSection variant="scale-up" className="mx-auto lg:mx-0 shrink-0">
        <div className="relative">
          {/* Phone frame */}
          <div className="relative w-[280px] sm:w-[300px] rounded-[2.5rem] border-[6px] border-foreground/90 bg-foreground/90 shadow-2xl overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/90 rounded-b-2xl z-20" />
            {/* Screen */}
            <div className="rounded-[2rem] overflow-hidden">
              <img
                src={tiktokProfile}
                alt="Perfil @purepilatesbr no TikTok"
                className="w-full object-cover object-top"
                style={{ aspectRatio: '9/19.5' }}
              />
            </div>
            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-white/40 z-20" />
          </div>
          {/* Shadow under phone */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-foreground/10 rounded-full blur-xl" />
        </div>
      </AnimatedSection>

      {/* Content side */}
      <div className="flex-1 space-y-6">
        {/* Dados do perfil */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnimatedSection variant="scale-up" delay={0}>
            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-6 pb-5">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter end={2053} />
                </p>
                <p className="text-sm text-muted-foreground mt-1">Seguidores</p>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection variant="scale-up" delay={100}>
            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-6 pb-5">
                <Heart className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter end={11.8} suffix="K" decimals={1} />
                </p>
                <p className="text-sm text-muted-foreground mt-1">Curtidas</p>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection variant="scale-up" delay={200}>
            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-6 pb-5">
                <Smartphone className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xl font-bold text-foreground">@purepilatesbr</p>
                <p className="text-sm text-muted-foreground mt-1">Perfil oficial</p>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Alerta importante */}
        <AnimatedSection>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Importante: Perfil único e centralizado</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong>Nenhuma unidade deve criar um perfil próprio no TikTok.</strong> Todo o conteúdo será produzido e publicado de forma centralizada pelo perfil @purepilatesbr. Isso garante consistência de marca, qualidade do conteúdo e evita fragmentação da audiência.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Conteúdo planejado */}
        <AnimatedSection>
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-foreground mb-3">Conteúdo planejado para a plataforma</h4>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Desafios semanais adaptados para o formato vertical do TikTok</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Conteúdo nativo — não apenas repostagens do Instagram</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Estratégia de crescimento de seguidores com trends e áudios virais</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Conteúdo específico para a plataforma, aproveitando o algoritmo de descoberta do TikTok</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection>
          <div className="text-center sm:text-left">
            <a
              href="https://www.tiktok.com/@purepilatesbr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Seguir @purepilatesbr no TikTok
            </a>
          </div>
        </AnimatedSection>
      </div>
    </div>
  </>
);

export default PostEspecialTikTok;

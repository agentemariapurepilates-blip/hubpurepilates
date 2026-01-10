import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  CalendarDays, 
  Video, 
  User, 
  Palette, 
  Megaphone, 
  MessageCircle,
  ArrowRight,
  Newspaper
} from 'lucide-react';
import logoHero from '@/assets/logo-hero.svg';
import pilatesHero from '@/assets/pilates-hero.svg';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, isApproved, isColaborador } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && user && !isApproved) {
      navigate('/aguardando-aprovacao');
    }
  }, [user, loading, isApproved, navigate]);

  // Quick links para colaboradores (acesso total)
  const colaboradorLinks = [
    { title: 'Feed da Sede', description: 'Acompanhe as novidades', icon: Newspaper, href: '/feed', color: 'bg-primary/10 text-primary' },
    { title: 'Novidades do Mês', description: 'Comunicados importantes', icon: Sparkles, href: '/novidades', color: 'bg-amber-500/10 text-amber-500' },
    { title: 'Calendário de Marketing', description: 'Eventos e campanhas', icon: CalendarDays, href: '/calendario-marketing', color: 'bg-sector-academy/10 text-sector-academy' },
    { title: 'Mídias Sociais', description: 'Conteúdos para redes', icon: Video, href: '/midias-sociais', color: 'bg-sector-franchising/10 text-sector-franchising' },
  ];

  // Quick links para franqueados (acesso limitado)
  const franqueadoLinks = [
    { title: 'Novidades do Mês', description: 'Comunicados importantes', icon: Sparkles, href: '/novidades', color: 'bg-amber-500/10 text-amber-500' },
    { title: 'Calendário de Marketing', description: 'Eventos e campanhas', icon: CalendarDays, href: '/calendario-marketing', color: 'bg-sector-academy/10 text-sector-academy' },
    { title: 'Mídias Sociais', description: 'Conteúdos para redes', icon: Video, href: '/midias-sociais', color: 'bg-sector-franchising/10 text-sector-franchising' },
    { title: 'Meu Perfil', description: 'Suas informações', icon: User, href: '/perfil', color: 'bg-primary/10 text-primary' },
  ];

  const quickLinks = isColaborador ? colaboradorLinks : franqueadoLinks;

  const features = [
    {
      icon: Palette,
      title: 'Artes e materiais',
      description: 'Baixe artes, peças e conteúdos oficiais para usar no dia a dia.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Megaphone,
      title: 'Ações de marketing',
      description: 'Entenda as campanhas em andamento, os objetivos de cada ação e como aplicá-las no estúdio.',
      color: 'text-sector-academy',
      bgColor: 'bg-sector-academy/10',
    },
    {
      icon: MessageCircle,
      title: 'Comunicação aberta',
      description: 'Comente, envie sugestões e participe ativamente das iniciativas da rede.',
      color: 'text-sector-franchising',
      bgColor: 'bg-sector-franchising/10',
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Hero Section - Pilates Balls Style */}
        <section className="relative overflow-hidden rounded-2xl mb-8 min-h-[380px] md:min-h-[420px] bg-gradient-to-b from-muted/30 to-background">
          {/* Decorative Pilates Balls */}
          {/* Large Dark Red Ball - Top Left */}
          <div 
            className="absolute -top-10 -left-16 w-36 h-36 md:w-52 md:h-52 rounded-full opacity-0 animate-fade-in animate-float"
            style={{ 
              animationDelay: '0.2s',
              background: 'radial-gradient(circle at 30% 30%, #b91c1c, #991b1b 40%, #7f1d1d 80%)',
              boxShadow: '25px 25px 60px rgba(0,0,0,0.4), inset -12px -12px 35px rgba(0,0,0,0.3), inset 12px 12px 35px rgba(255,255,255,0.1)'
            }}
          >
            <div className="absolute top-6 left-8 w-12 h-6 rounded-full bg-white/15 blur-md" />
          </div>

          {/* Large Black Ball - Top Right */}
          <div 
            className="absolute -top-6 -right-10 w-32 h-32 md:w-48 md:h-48 rounded-full opacity-0 animate-fade-in animate-float-delayed"
            style={{ 
              animationDelay: '0.4s',
              background: 'radial-gradient(circle at 30% 30%, #404040, #1a1a1a 50%, #0a0a0a 90%)',
              boxShadow: '25px 25px 70px rgba(0,0,0,0.5), inset -10px -10px 30px rgba(0,0,0,0.4), inset 10px 10px 30px rgba(255,255,255,0.05)'
            }}
          >
            <div className="absolute top-4 left-6 w-10 h-5 rounded-full bg-white/10 blur-md" />
          </div>

          {/* Medium Black Ball - Left Side */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -left-8 w-24 h-24 md:w-32 md:h-32 rounded-full opacity-0 animate-fade-in animate-float-slow"
            style={{ 
              animationDelay: '0.6s',
              background: 'radial-gradient(circle at 30% 30%, #525252, #262626 50%, #0f0f0f 90%)',
              boxShadow: '18px 18px 50px rgba(0,0,0,0.45), inset -8px -8px 25px rgba(0,0,0,0.35), inset 8px 8px 25px rgba(255,255,255,0.05)'
            }}
          >
            <div className="absolute top-3 left-5 w-6 h-3 rounded-full bg-white/10 blur-sm" />
          </div>

          {/* Medium Dark Red Ball - Right Side */}
          <div 
            className="absolute bottom-24 -right-6 w-28 h-28 md:w-40 md:h-40 rounded-full opacity-0 animate-fade-in animate-float"
            style={{ 
              animationDelay: '0.5s',
              background: 'radial-gradient(circle at 30% 30%, #dc2626, #b91c1c 40%, #991b1b 80%)',
              boxShadow: '20px 20px 55px rgba(0,0,0,0.4), inset -10px -10px 30px rgba(0,0,0,0.25), inset 10px 10px 30px rgba(255,255,255,0.1)'
            }}
          >
            <div className="absolute top-4 left-6 w-8 h-4 rounded-full bg-white/15 blur-md" />
          </div>

          {/* Small Black Ball - Bottom Left */}
          <div 
            className="absolute bottom-16 left-12 w-16 h-16 md:w-20 md:h-20 rounded-full opacity-0 animate-fade-in animate-float-delayed"
            style={{ 
              animationDelay: '0.7s',
              background: 'radial-gradient(circle at 30% 30%, #404040, #1f1f1f 50%, #0a0a0a 90%)',
              boxShadow: '12px 12px 35px rgba(0,0,0,0.4), inset -5px -5px 18px rgba(0,0,0,0.3), inset 5px 5px 18px rgba(255,255,255,0.05)'
            }}
          >
            <div className="absolute top-2 left-3 w-4 h-2 rounded-full bg-white/10 blur-sm" />
          </div>

          {/* Small Dark Red Ball - Bottom Right */}
          <div 
            className="absolute bottom-8 right-24 w-14 h-14 md:w-18 md:h-18 rounded-full opacity-0 animate-fade-in animate-float-slow"
            style={{ 
              animationDelay: '0.8s',
              background: 'radial-gradient(circle at 30% 30%, #b91c1c, #991b1b 50%, #7f1d1d 90%)',
              boxShadow: '10px 10px 30px rgba(0,0,0,0.35), inset -4px -4px 15px rgba(0,0,0,0.2), inset 4px 4px 15px rgba(255,255,255,0.1)'
            }}
          >
            <div className="absolute top-1.5 left-2.5 w-3 h-1.5 rounded-full bg-white/15 blur-sm" />
          </div>

          {/* Extra Small Black Ball - Top Center */}
          <div 
            className="absolute top-16 left-1/3 w-10 h-10 md:w-12 md:h-12 rounded-full opacity-0 animate-fade-in animate-float"
            style={{ 
              animationDelay: '0.9s',
              background: 'radial-gradient(circle at 30% 30%, #525252, #262626 50%, #0f0f0f 90%)',
              boxShadow: '8px 8px 25px rgba(0,0,0,0.35), inset -3px -3px 12px rgba(0,0,0,0.25), inset 3px 3px 12px rgba(255,255,255,0.05)'
            }}
          >
            <div className="absolute top-1 left-2 w-2 h-1 rounded-full bg-white/10 blur-sm" />
          </div>

          {/* Extra Small Red Ball - Bottom Center */}
          <div 
            className="absolute bottom-28 right-1/3 w-8 h-8 md:w-10 md:h-10 rounded-full opacity-0 animate-fade-in animate-float-delayed"
            style={{ 
              animationDelay: '1s',
              background: 'radial-gradient(circle at 30% 30%, #dc2626, #b91c1c 50%, #991b1b 90%)',
              boxShadow: '6px 6px 20px rgba(0,0,0,0.3), inset -2px -2px 10px rgba(0,0,0,0.2), inset 2px 2px 10px rgba(255,255,255,0.1)'
            }}
          >
            <div className="absolute top-1 left-1.5 w-1.5 h-0.5 rounded-full bg-white/15 blur-sm" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 px-6 py-10 md:py-14 flex flex-col items-center text-center">
            {/* Logo */}
            <img 
              src={logoHero} 
              alt="Pure Pilates - Muito mais que um studio de pilates" 
              className="w-[280px] md:w-[400px] lg:w-[480px] h-auto mb-6 opacity-0 animate-fade-in drop-shadow-lg"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </section>

        {/* Floating Card Section - Full Width */}
        <section 
          className="relative mb-12 opacity-0 animate-fade-in"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="flex flex-col md:flex-row items-stretch bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden border border-primary/10">
            {/* Text Side */}
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-1 bg-primary rounded-full" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Bem-vindo</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                <span className="text-primary">Hub Pure Pilates</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                sua plataforma de comunicação interna
              </p>
            </div>
            
            {/* Image Side */}
            <div className="relative flex-shrink-0 md:w-[45%] bg-muted/20">
              {/* Decorative Circle */}
              <div 
                className="absolute -bottom-10 -right-10 w-32 h-32 md:w-48 md:h-48 rounded-full opacity-30"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #dc2626, #991b1b 80%)',
                }}
              />
              <img 
                src={pilatesHero}
                alt="Pure Pilates"
                className="w-full h-48 md:h-full object-cover relative z-10"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-12">
          <h2 
            className="text-xl md:text-2xl font-heading font-bold text-center mb-8 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            O que você encontra aqui
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-in-up border-0 bg-card/50 backdrop-blur-sm"
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="mb-12 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 md:p-10 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '1s' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-heading font-bold mb-3">
              Queremos saber o que tem a dizer!
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Menos ruído, mais clareza. Informação organizada e fácil de acessar, sempre atualizada.
            </p>
          </div>
        </section>

        {/* Quick Links Section */}
        <section 
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: '1.1s' }}
        >
          <h2 className="text-lg font-heading font-semibold mb-4 text-muted-foreground">
            Acesso rápido
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Card 
                key={link.href} 
                className="cursor-pointer group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => navigate(link.href)}
              >
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium text-sm mb-1 flex items-center justify-between">
                    {link.title}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;

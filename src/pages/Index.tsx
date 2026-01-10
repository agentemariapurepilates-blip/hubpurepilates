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
import logo from '@/assets/logo-pure-pilates.png';

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
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl mb-12">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background pointer-events-none" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 px-6 py-12 md:py-16">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Left: Text content */}
              <div className="flex-1 text-center lg:text-left">
                {/* Logo */}
                <img 
                  src={logo} 
                  alt="Pure Pilates" 
                  className="h-14 md:h-16 mx-auto lg:mx-0 mb-6 opacity-0 animate-fade-in"
                  style={{ animationDelay: '0.1s' }}
                />
                
                {/* Title */}
                <h1 
                  className="text-4xl md:text-5xl font-heading font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent opacity-0 animate-fade-in-up"
                  style={{ animationDelay: '0.2s' }}
                >
                  Hub Pure Pilates
                </h1>
                
                {/* Subtitle */}
                <p 
                  className="text-lg md:text-xl text-muted-foreground mt-3 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: '0.3s' }}
                >
                  Sua plataforma de comunicação interna.
                </p>
                
                {/* Description */}
                <p 
                  className="text-muted-foreground mt-5 max-w-lg mx-auto lg:mx-0 leading-relaxed opacity-0 animate-fade-in-up"
                  style={{ animationDelay: '0.4s' }}
                >
                  Um espaço mais dinâmico, simples e fácil de usar, criado para centralizar informações, acessar links rápidos e acompanhar nossas redes.
                </p>

                {/* CTA Button */}
                <Button 
                  onClick={() => navigate('/novidades')}
                  className="mt-8 gap-2 opacity-0 animate-fade-in-up group"
                  style={{ animationDelay: '0.5s' }}
                  size="lg"
                >
                  Explorar plataforma
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

              {/* Right: Floating Mockups */}
              <div className="flex-1 relative hidden md:flex justify-center items-center min-h-[300px]">
                {/* Mockup 1 - Calendar */}
                <div 
                  className="absolute top-0 left-8 w-44 bg-card rounded-xl shadow-xl border p-4 animate-float opacity-0 animate-fade-in"
                  style={{ animationDelay: '0.6s' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-sector-academy/20 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-sector-academy" />
                    </div>
                    <span className="text-xs font-medium">Calendário</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                      <div key={i} className="text-[9px] text-muted-foreground text-center">{d}</div>
                    ))}
                    {[...Array(31)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`text-[9px] text-center py-0.5 rounded ${
                          i === 14 ? 'bg-primary text-primary-foreground font-bold' : 
                          i === 20 ? 'bg-sector-academy/30 text-sector-academy font-medium' : ''
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mockup 2 - Post Card */}
                <div 
                  className="absolute top-16 right-4 w-48 bg-card rounded-xl shadow-xl border overflow-hidden animate-float-delayed opacity-0 animate-fade-in"
                  style={{ animationDelay: '0.7s' }}
                >
                  <div className="h-20 bg-gradient-to-br from-primary/20 to-primary/5" />
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] text-primary font-medium">Marketing</span>
                    </div>
                    <div className="text-xs font-semibold mb-1">Campanha de Verão</div>
                    <div className="text-[10px] text-muted-foreground">Novos materiais disponíveis...</div>
                  </div>
                </div>

                {/* Mockup 3 - Media */}
                <div 
                  className="absolute bottom-4 left-16 w-40 bg-card rounded-xl shadow-xl border p-3 animate-float-slow opacity-0 animate-fade-in"
                  style={{ animationDelay: '0.8s' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-sector-franchising/20 flex items-center justify-center">
                      <Video className="h-4 w-4 text-sector-franchising" />
                    </div>
                    <div>
                      <span className="text-[10px] font-medium block">Mídias Sociais</span>
                      <span className="text-[9px] text-muted-foreground">3 novos conteúdos</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-12 rounded bg-muted animate-pulse" />
                    <div className="flex-1 h-12 rounded bg-muted animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="flex-1 h-12 rounded bg-muted animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>

                {/* Decorative dots */}
                <div className="absolute top-8 right-32 w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                <div className="absolute bottom-20 right-8 w-3 h-3 rounded-full bg-sector-academy/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-32 left-4 w-2 h-2 rounded-full bg-sector-franchising/40 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
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

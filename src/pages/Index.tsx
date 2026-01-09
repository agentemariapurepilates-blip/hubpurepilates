import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, ArrowRight, CalendarDays, Video, User, Sparkles } from 'lucide-react';

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
    { title: 'Feed da Sede', description: 'Acompanhe as novidades da sede', icon: Newspaper, href: '/feed', color: 'bg-primary/10 text-primary' },
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold">Bem-vindo à Central Pure Pilates</h1>
          <p className="text-muted-foreground mt-2">
            {isColaborador 
              ? 'Sua plataforma de comunicação interna' 
              : 'Portal do Franqueado Pure Pilates'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Card key={link.href} className="card-pure cursor-pointer group" onClick={() => navigate(link.href)}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${link.color} flex items-center justify-center mb-2`}>
                  <link.icon className="h-6 w-6" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {link.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{link.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;

import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, GraduationCap, BarChart3, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { title: 'Feed', description: 'Acompanhe as novidades', icon: Newspaper, href: '/feed', color: 'bg-primary/10 text-primary' },
    { title: 'Onboarding', description: 'Trilhas de integração', icon: GraduationCap, href: '/onboarding', color: 'bg-sector-academy/10 text-sector-academy' },
    { title: 'Métricas', description: 'Indicadores gerais', icon: BarChart3, href: '/metricas', color: 'bg-sector-franchising/10 text-sector-franchising' },
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold">Bem-vindo à Central Pure Pilates</h1>
          <p className="text-muted-foreground mt-2">Sua plataforma de comunicação interna</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

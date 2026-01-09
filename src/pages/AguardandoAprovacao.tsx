import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, Mail } from 'lucide-react';
import logo from '@/assets/logo-pure-pilates.png';
import { useEffect } from 'react';

const AguardandoAprovacao = () => {
  const navigate = useNavigate();
  const { user, signOut, isApproved, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && isApproved) {
      navigate('/');
    }
  }, [user, isApproved, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="Pure Pilates" 
            className="h-20 mx-auto mb-4"
          />
        </div>

        <Card className="card-pure">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Aguardando Aprovação</CardTitle>
            <CardDescription>
              Seu cadastro está em análise pelo administrador
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email cadastrado</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Você receberá acesso assim que o administrador aprovar sua solicitação. 
              Tente fazer login novamente mais tarde.
            </p>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sair e Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AguardandoAprovacao;
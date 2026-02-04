import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertCircle, UserCheck, Building2, HelpCircle, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo-pure-pilates.png';
import { z } from 'zod';
import { toast } from 'sonner';

const emailSchema = z.string().email('Email inválido').refine(
  (email) => email.toLowerCase().endsWith('@purepilates.com.br'),
  'Somente emails @purepilates.com.br são permitidos'
);

const passwordSchema = z.string().min(6, 'A senha deve ter pelo menos 6 caracteres');

type UserType = 'colaborador' | 'franqueado';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isApproved, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordName, setForgotPasswordName] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetRequestSent, setResetRequestSent] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<UserType>('colaborador');

  // Redirect if already logged in and approved
  useEffect(() => {
    if (!authLoading && user) {
      if (isApproved) {
        navigate('/');
      } else {
        navigate('/aguardando-aprovacao');
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    
    if (error) {
      setError(error.message);
    }
    // Navigation is handled by useEffect based on approval status
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }
    
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors[0].message);
        return;
      }
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, fullName, selectedUserType);
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      setSignupSuccess(true);
    }
  };

  if (signupSuccess) {
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
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Cadastro Realizado!</CardTitle>
              <CardDescription>
                Seu cadastro foi enviado para aprovação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                O administrador irá analisar sua solicitação. 
                Você receberá acesso assim que seu cadastro for aprovado.
              </p>
              <Button
                className="w-full btn-pure"
                onClick={() => {
                  setSignupSuccess(false);
                  setSignupEmail('');
                  setSignupPassword('');
                  setSignupConfirmPassword('');
                  setFullName('');
                }}
              >
                Voltar para Login
              </Button>
            </CardContent>
          </Card>
        </div>
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
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Central de Comunicação
          </h1>
          <p className="text-muted-foreground mt-2">
            Plataforma interna Pure Pilates
          </p>
        </div>

        <Card className="card-pure">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu.nome@purepilates.com.br"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full btn-pure"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    <HelpCircle className="h-3 w-3" />
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <Label>Eu sou:</Label>
                    <RadioGroup
                      value={selectedUserType}
                      onValueChange={(value) => setSelectedUserType(value as UserType)}
                      className="grid grid-cols-1 gap-3"
                    >
                      <Label
                        htmlFor="colaborador"
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedUserType === 'colaborador'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="colaborador" id="colaborador" />
                        <UserCheck className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Colaborador Pure Pilates</p>
                          <p className="text-xs text-muted-foreground">Equipe interna da empresa</p>
                        </div>
                      </Label>
                      <Label
                        htmlFor="franqueado"
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedUserType === 'franqueado'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="franqueado" id="franqueado" />
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Franqueado Pure Pilates</p>
                          <p className="text-xs text-muted-foreground">Proprietário de unidade franqueada</p>
                        </div>
                      </Label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Corporativo</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu.nome@purepilates.com.br"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full btn-pure"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Solicitar Acesso'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Acesso exclusivo para colaboradores e franqueados Pure Pilates
        </p>

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPassword} onOpenChange={(open) => {
          setShowForgotPassword(open);
          if (!open) {
            setForgotPasswordEmail('');
            setForgotPasswordName('');
            setResetRequestSent(false);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {resetRequestSent ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <HelpCircle className="h-5 w-5" />
                )}
                {resetRequestSent ? 'Solicitação Enviada!' : 'Esqueceu sua senha?'}
              </DialogTitle>
              <DialogDescription>
                {resetRequestSent 
                  ? 'O administrador foi notificado'
                  : 'Solicite uma senha temporária ao administrador'
                }
              </DialogDescription>
            </DialogHeader>
            
            {resetRequestSent ? (
              <div className="space-y-4 py-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                    ✅ Sua solicitação foi registrada!
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                    Aguarde o administrador definir uma senha temporária para você. 
                    Quando isso acontecer, você poderá fazer login e alterar sua senha no perfil.
                  </p>
                </div>
                <Button onClick={() => setShowForgotPassword(false)} className="w-full">
                  Entendi
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-name">Seu nome</Label>
                  <Input
                    id="forgot-name"
                    type="text"
                    value={forgotPasswordName}
                    onChange={(e) => setForgotPasswordName(e.target.value)}
                    placeholder="Digite seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Seu e-mail</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="seu.nome@purepilates.com.br"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!forgotPasswordEmail || !forgotPasswordName) {
                        toast.error('Preencha todos os campos');
                        return;
                      }
                      if (!forgotPasswordEmail.toLowerCase().endsWith('@purepilates.com.br')) {
                        toast.error('Use seu e-mail @purepilates.com.br');
                        return;
                      }
                      
                      setSubmittingReset(true);
                      try {
                        const { error } = await supabase
                          .from('password_reset_requests')
                          .insert({
                            email: forgotPasswordEmail.toLowerCase(),
                            full_name: forgotPasswordName,
                            status: 'pending'
                          });
                        
                        if (error) throw error;
                        setResetRequestSent(true);
                        toast.success('Solicitação enviada!');
                      } catch (err: any) {
                        toast.error('Erro ao enviar solicitação');
                        console.error(err);
                      } finally {
                        setSubmittingReset(false);
                      }
                    }}
                    disabled={submittingReset}
                    className="flex-1"
                  >
                    {submittingReset ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Solicitar Senha'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Auth;

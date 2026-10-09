// Entrar no Hub com o usuário e a senha do PureSystem.
//
// A senha NÃO vai para o Supabase nem para lugar nenhum do navegador além
// desta requisição: ela segue para a Edge Function `puresystem-login`, que é
// quem fala com o PureSystem (o guia de integração proíbe a chamada sair do
// navegador). A function devolve só um código de uso único, que aqui vira a
// sessão do Hub — a mesma sessão de quem entra por e-mail, então as permissões
// de sempre continuam valendo.

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export function LoginPureSystem() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const entrar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErro(null);
    setEntrando(true);

    try {
      const { data, error } = await supabase.functions.invoke('puresystem-login', {
        body: { usuario: usuario.trim(), senha },
      });

      // A senha já cumpriu o papel; não fica no estado da tela.
      setSenha('');

      if (error || !data?.codigo) {
        // A function devolve a mensagem pronta e genérica; sem ela, uma padrão.
        const resposta = await error?.context?.json?.().catch(() => null);
        setErro(resposta?.mensagem ?? data?.mensagem ?? 'Não foi possível entrar. Tente de novo.');
        return;
      }

      // Troca o código pela sessão do Hub.
      const { error: erroSessao } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.codigo,
        type: 'magiclink',
      });
      if (erroSessao) {
        setErro('Não foi possível abrir a sessão. Tente de novo.');
        return;
      }
      // Com a sessão aberta, o AuthContext redireciona sozinho.
    } catch {
      setErro('PureSystem indisponível, tente em instantes.');
    } finally {
      setEntrando(false);
    }
  };

  return (
    <form onSubmit={entrar} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use o seu <strong>login</strong> do PureSystem (não o e-mail) e a mesma senha de lá.
      </p>

      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="puresystem-usuario">Usuário do PureSystem</Label>
        <Input
          id="puresystem-usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="maria.silva"
          autoComplete="username"
          required
          disabled={entrando}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="puresystem-senha">Senha</Label>
        <Input
          id="puresystem-senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={entrando}
        />
      </div>

      <Button type="submit" className="w-full btn-pure" disabled={entrando}>
        {entrando ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <KeyRound className="mr-2 h-4 w-4" />
            Entrar com o PureSystem
          </>
        )}
      </Button>
    </form>
  );
}

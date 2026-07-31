import { KeyRound, PlugZap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ehChaveNaoConfigurada, mensagemDoErro } from '../../lib/indicadoresProxy';

// O que aparece nas abas Relatório e Integração quando o dado não veio.
//
// Existem dois motivos bem diferentes e eles NÃO podem virar a mesma tela
// cinza de "nada aqui":
//
// 1. Falta a chave de serviço (HTTP 503). Não é defeito — é configuração, e
//    quem abriu a aba consegue resolver em um minuto se souber o que colar e
//    onde. Por isso a instrução vem por extenso.
// 2. Qualquer outra falha (rede, banco fora, proxy ausente no build). Aí não
//    há o que a pessoa faça na hora; o que ajuda é ver a mensagem crua.
//
// "Sem dados" é um terceiro caso e não passa por aqui: tabela lida com zero
// linhas é estado normal, tratado dentro de cada aba.

interface AvisoDaFonteProps {
  /** O erro que a consulta lançou. */
  erro: unknown;
}

export function AvisoDaFonte({ erro }: AvisoDaFonteProps) {
  if (ehChaveNaoConfigurada(erro)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            Chave de serviço não configurada
          </CardTitle>
          <CardDescription>
            Esta aba lê tabelas protegidas do Painel de Indicadores, e para isso o servidor precisa
            da chave de serviço daquele projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Cole a chave <code className="font-mono">service_role</code> do projeto de indicadores
            em <code className="font-mono">INDICADORES_SERVICE_KEY</code>, no arquivo{' '}
            <code className="font-mono">.env.local</code>, e reinicie o{' '}
            <code className="font-mono">npm run dev</code>.
          </p>
          <p className="text-muted-foreground">
            A chave fica só no processo do servidor de desenvolvimento — ela nunca é enviada ao
            navegador. Sem o prefixo <code className="font-mono">VITE_</code>, o Vite não a injeta
            no código do navegador.
          </p>
          <p className="text-xs text-muted-foreground">
            Resposta do servidor: {mensagemDoErro(erro)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-muted-foreground" />
          Não foi possível ler os dados
        </CardTitle>
        <CardDescription>
          A consulta ao banco do Painel de Indicadores falhou. Nada foi alterado — esta área é
          somente consulta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{mensagemDoErro(erro)}</p>
      </CardContent>
    </Card>
  );
}

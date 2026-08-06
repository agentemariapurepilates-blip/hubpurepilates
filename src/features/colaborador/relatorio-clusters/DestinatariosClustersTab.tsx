import { Info } from 'lucide-react';
import { PainelDestinatarios } from '@/components/destinatarios/PainelDestinatarios';
import {
  useAlternarDestinatarioClusters,
  useCriarDestinatarioClusters,
  useDestinatariosClusters,
  useExcluirDestinatarioClusters,
} from './hooks/useDestinatariosClusters';

/**
 * Quem recebe o relatório mensal de clusters — todo dia 1, às 3h.
 *
 * POR QUE ESTE ARQUIVO NÃO VIVE EM features/colaborador/indicadores:
 * aquela pasta é varrida por sem-escrita.test.ts, que proíbe qualquer chamada
 * de escrita para garantir que a área de Dashboard só lê o banco do painel.
 * Cadastrar destinatário é escrita — no banco do HUB, não no de indicadores,
 * mas a varredura não tem como distinguir os dois. Manter a lista aqui fora
 * preserva a garantia inteira em vez de abrir uma exceção nela.
 *
 * Só admin vê: a tela de clusters esconde esta seção para os demais, e a RLS
 * da tabela recusa acesso direto.
 */
export function DestinatariosClustersTab() {
  return (
    <PainelDestinatarios
      hooks={{
        usarLista: useDestinatariosClusters,
        usarCriar: useCriarDestinatarioClusters,
        usarAlternar: useAlternarDestinatarioClusters,
        usarExcluir: useExcluirDestinatarioClusters,
      }}
      textos={{
        tituloCadastro: 'Novo destinatário do relatório de clusters',
        descricaoCadastro:
          'Quem estiver aqui e ativo recebe, todo dia 1 às 3h, o resumo de como as unidades se distribuíram pelos clusters no mês que fechou.',
        exemploEmail: 'diretoria@purepilates.com.br',
        nomeDoEnvio: 'o relatório de clusters',
        idPrefixo: 'clusters',
        avisoDeTopo: (
          <div className="metric-card flex items-start gap-3 border-info/40 bg-info/5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" />
            <p className="text-sm text-muted-foreground">
              <strong>O envio ainda não está ativo.</strong> A lista já pode ser montada, mas o
              relatório só começa a sair quando o disparo automático for publicado. Nada é enviado
              até lá.
            </p>
          </div>
        ),
      }}
    />
  );
}

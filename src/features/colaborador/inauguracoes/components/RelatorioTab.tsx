import { Info } from 'lucide-react';
import {
  useAlternarDestinatarioRelatorio,
  useCriarDestinatarioRelatorio,
  useDestinatariosRelatorio,
  useExcluirDestinatarioRelatorio,
} from '../hooks/useDestinatarios';
import { PainelDestinatarios } from '@/components/destinatarios/PainelDestinatarios';

/**
 * "Relatório semanal" de /inauguracoes — quem recebe, toda segunda às 7h, o
 * resumo com as inaugurações da semana que passou e as da próxima.
 *
 * Só admin chega aqui, igual à lista do aviso diário: o item some do menu para
 * colaborador e a RLS da tabela bloqueia o acesso direto.
 *
 * A lista é SEPARADA da do aviso diário de propósito — o aviso é operacional
 * (quem precisa agir naquele dia) e o relatório é panorâmico (quem acompanha o
 * conjunto). Cadastrar alguém aqui não o inscreve no aviso diário.
 */
export function RelatorioTab() {
  return (
    <PainelDestinatarios
      hooks={{
        usarLista: useDestinatariosRelatorio,
        usarCriar: useCriarDestinatarioRelatorio,
        usarAlternar: useAlternarDestinatarioRelatorio,
        usarExcluir: useExcluirDestinatarioRelatorio,
      }}
      textos={{
        tituloCadastro: 'Novo destinatário do relatório',
        descricaoCadastro:
          'Quem estiver aqui e ativo recebe, toda segunda-feira às 7h, um resumo com as inaugurações da semana que passou e as da próxima.',
        exemploEmail: 'diretoria@purepilates.com.br',
        nomeDoEnvio: 'o relatório semanal',
        idPrefixo: 'relatorio',
        // Enquanto o envio não for publicado, a tela precisa dizer isso. Uma
        // lista que parece configurada mas não dispara nada é pior do que uma
        // lista vazia: ninguém vai procurar o problema.
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
